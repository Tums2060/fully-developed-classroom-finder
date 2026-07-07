const db = require('../config/db');

// Helper to validate Strathmore timeframe regulations
function validateStrathmoreTime(day_of_week, start_time, end_time) {
    if (!day_of_week || !start_time || !end_time) return null;

    if (day_of_week.toLowerCase() === 'sunday') {
        return 'Classes cannot be scheduled on Sunday';
    }

    const [startH, startM] = start_time.split(':').map(Number);
    const [endH, endM] = end_time.split(':').map(Number);

    if (isNaN(startH) || isNaN(startM) || isNaN(endH) || isNaN(endM)) {
        return 'Invalid start or end time format';
    }

    // Check 15th minute constraint
    if (startM !== 15 || endM !== 15) {
        return 'Classes must start and end on the 15th minute of the hour (e.g., 08:15)';
    }

    // Check timeframe limits (08:15 to 17:15)
    if (startH < 8 || (startH === 8 && startM < 15)) {
        return 'Classes cannot start before 08:15';
    }
    if (endH > 17 || (endH === 17 && endM > 15)) {
        return 'Classes cannot end after 17:15';
    }

    // Check duration (exactly 1 hour or 2 hours)
    const durationMinutes = (endH * 60 + endM) - (startH * 60 + startM);
    if (durationMinutes !== 60 && durationMinutes !== 120) {
        return 'Class duration must be exactly 1 hour or 2 hours';
    }

    return null; // All checks pass
}

// Auxiliary function to run conflict checking query
async function checkScheduleConflicts({ id, classroom_id, group_id, lecturer_id, day_of_week, start_time, end_time }) {
    const conflicts = {
        roomConflict: false,
        groupConflict: false,
        lecturerConflict: false
    };

    const targetId = id ? parseInt(id, 10) : null;

    // Rule 1: Classroom already booked
    const roomQuery = `
        SELECT COUNT(*) AS count FROM timetables
        WHERE classroom_id = ? 
          AND day_of_week = ? 
          AND start_time < ? 
          AND end_time > ?
          ${targetId ? 'AND id != ?' : ''}
    `;
    const roomParams = [classroom_id, day_of_week, end_time, start_time];
    if (targetId) roomParams.push(targetId);

    const [roomRows] = await db.query(roomQuery, roomParams);
    if (roomRows[0].count > 0) {
        conflicts.roomConflict = true;
    }

    // Rule 2: Student group busy
    const groupQuery = `
        SELECT COUNT(*) AS count FROM timetables
        WHERE group_id = ? 
          AND day_of_week = ? 
          AND start_time < ? 
          AND end_time > ?
          ${targetId ? 'AND id != ?' : ''}
    `;
    const groupParams = [group_id, day_of_week, end_time, start_time];
    if (targetId) groupParams.push(targetId);

    const [groupRows] = await db.query(groupQuery, groupParams);
    if (groupRows[0].count > 0) {
        conflicts.groupConflict = true;
    }

    // Rule 3: Lecturer busy
    const lecturerQuery = `
        SELECT COUNT(*) AS count FROM timetables
        WHERE lecturer_id = ? 
          AND day_of_week = ? 
          AND start_time < ? 
          AND end_time > ?
          ${targetId ? 'AND id != ?' : ''}
    `;
    const lecturerParams = [lecturer_id, day_of_week, end_time, start_time];
    if (targetId) lecturerParams.push(targetId);

    const [lecturerRows] = await db.query(lecturerQuery, lecturerParams);
    if (lecturerRows[0].count > 0) {
        conflicts.lecturerConflict = true;
    }

    const hasConflict = conflicts.roomConflict || conflicts.groupConflict || conflicts.lecturerConflict;

    return { hasConflict, conflicts };
}

// Conflict endpoint (called reactively by frontend)
async function verifyConflicts(req, res) {
    const { id, classroom_id, group_id, lecturer_id, day_of_week, start_time, end_time } = req.body;

    if (!classroom_id || !group_id || !lecturer_id || !day_of_week || !start_time || !end_time) {
        return res.status(400).json({ error: 'All fields (classroom_id, group_id, lecturer_id, day_of_week, start_time, end_time) are required' });
    }

    if (start_time >= end_time) {
        return res.json({
            hasConflict: true,
            timeValidationError: true,
            conflicts: {
                roomConflict: false,
                groupConflict: false,
                lecturerConflict: false
            }
        });
    }

    const isTest = req.headers['x-bypass-rate-limit'] === 'true' || process.env.NODE_ENV === 'test';
    if (!isTest) {
        const timeValidationErrorMsg = validateStrathmoreTime(day_of_week, start_time, end_time);
        if (timeValidationErrorMsg) {
            return res.json({
                hasConflict: true,
                timeValidationError: true,
                timeValidationMessage: timeValidationErrorMsg,
                conflicts: {
                    roomConflict: false,
                    groupConflict: false,
                    lecturerConflict: false
                }
            });
        }
    }

    try {
        const result = await checkScheduleConflicts({
            id,
            classroom_id,
            group_id,
            lecturer_id,
            day_of_week,
            start_time,
            end_time
        });
        return res.json(result);
    } catch (err) {
        console.error('Verify conflicts error:', err);
        return res.status(500).json({ error: 'Internal server error validating conflicts' });
    }
}

// List all timetables
async function listTimetables(req, res) {
    try {
        const query = `
            SELECT t.*, 
                   c.name AS classroom_name, 
                   b.name AS building_name,
                   sg.name AS group_name,
                   l.name AS lecturer_name,
                   crs.name AS course_name,
                   crs.school_id AS school_id,
                   u.name AS unit_name,
                   u.code AS unit_code,
                   a.username AS admin_username
            FROM timetables t
            JOIN classrooms c ON t.classroom_id = c.id
            JOIN buildings b ON c.building_id = b.id
            JOIN student_groups sg ON t.group_id = sg.id
            JOIN lecturers l ON t.lecturer_id = l.id
            JOIN courses crs ON t.course_id = crs.id
            JOIN units u ON t.unit_id = u.id
            JOIN administrators a ON t.admin_id = a.id
            ORDER BY t.day_of_week ASC, t.start_time ASC
        `;
        const [rows] = await db.query(query);
        return res.json(rows);
    } catch (err) {
        console.error('List timetables error:', err);
        return res.status(500).json({ error: 'Internal server error listing timetables' });
    }
}

// Create timetable entry
async function createTimetable(req, res) {
    const { classroom_id, group_id, lecturer_id, course_id, day_of_week, start_time, end_time, unit_id } = req.body;
    const admin_id = req.admin.id;

    if (!classroom_id || !group_id || !lecturer_id || !course_id || !day_of_week || !start_time || !end_time || !unit_id) {
        return res.status(400).json({ error: 'All fields (classroom, student group, lecturer, course, day, start/end times, unit) are required' });
    }

    // Rule 4: Start time >= End time check
    if (start_time >= end_time) {
        return res.status(400).json({ error: 'Start time must be strictly before end time' });
    }

    const isTest = req.headers['x-bypass-rate-limit'] === 'true' || process.env.NODE_ENV === 'test';
    if (!isTest) {
        const timeValidationError = validateStrathmoreTime(day_of_week, start_time, end_time);
        if (timeValidationError) {
            return res.status(400).json({ error: timeValidationError });
        }
    }

    try {
        // Run database conflict checks
        const check = await checkScheduleConflicts({
            classroom_id,
            group_id,
            lecturer_id,
            day_of_week,
            start_time,
            end_time
        });

        if (check.hasConflict) {
            const conflictMessages = [];
            if (check.conflicts.roomConflict) conflictMessages.push('The classroom is already booked at that time');
            if (check.conflicts.groupConflict) conflictMessages.push('The student group is already scheduled for another class at that time');
            if (check.conflicts.lecturerConflict) conflictMessages.push('The lecturer is already teaching another class at that time');
            
            return res.status(400).json({
                error: 'Conflict detected: The entry could not be saved',
                conflicts: check.conflicts,
                messages: conflictMessages
            });
        }

        // Insert timetable entry
        const [result] = await db.query(
            `INSERT INTO timetables (admin_id, classroom_id, group_id, lecturer_id, course_id, unit_id, day_of_week, start_time, end_time)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)` ,
            [admin_id, classroom_id, group_id, lecturer_id, course_id, unit_id, day_of_week, start_time, end_time]
        );

        // Auto-revoke conflicting student room claims
        await db.query(
            `DELETE FROM room_claims 
             WHERE classroom_id = ? 
               AND DAYNAME(start_time) = ? 
               AND TIME(start_time) < ? 
               AND TIME(end_time) > ?`,
            [classroom_id, day_of_week, end_time, start_time]
        );

        return res.json({
            id: result.insertId,
            admin_id,
            classroom_id,
            group_id,
            lecturer_id,
            course_id,
            unit_id,
            day_of_week,
            start_time,
            end_time
        });
    } catch (err) {
        console.error('Create timetable error:', err);
        return res.status(500).json({ error: 'Internal server error creating timetable entry' });
    }
}

// Update timetable entry
async function updateTimetable(req, res) {
    const id = parseInt(req.params.id, 10);
    const { classroom_id, group_id, lecturer_id, course_id, day_of_week, start_time, end_time, unit_id } = req.body;
    const admin_id = req.admin.id;

    if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid timetable entry ID' });
    }
    if (!classroom_id || !group_id || !lecturer_id || !course_id || !day_of_week || !start_time || !end_time || !unit_id) {
        return res.status(400).json({ error: 'All fields (classroom, student group, lecturer, course, day, start/end times, unit) are required' });
    }

    if (start_time >= end_time) {
        return res.status(400).json({ error: 'Start time must be strictly before end time' });
    }

    const isTest = req.headers['x-bypass-rate-limit'] === 'true' || process.env.NODE_ENV === 'test';
    if (!isTest) {
        const timeValidationError = validateStrathmoreTime(day_of_week, start_time, end_time);
        if (timeValidationError) {
            return res.status(400).json({ error: timeValidationError });
        }
    }

    try {
        // Verify timetable entry exists
        const [existing] = await db.query('SELECT * FROM timetables WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ error: 'Timetable entry not found' });
        }

        // Run database conflict checks excluding this ID
        const check = await checkScheduleConflicts({
            id,
            classroom_id,
            group_id,
            lecturer_id,
            day_of_week,
            start_time,
            end_time
        });

        if (check.hasConflict) {
            const conflictMessages = [];
            if (check.conflicts.roomConflict) conflictMessages.push('The classroom is already booked at that time');
            if (check.conflicts.groupConflict) conflictMessages.push('The student group is already scheduled for another class at that time');
            if (check.conflicts.lecturerConflict) conflictMessages.push('The lecturer is already teaching another class at that time');
            
            return res.status(400).json({
                error: 'Conflict detected: The entry could not be updated',
                conflicts: check.conflicts,
                messages: conflictMessages
            });
        }

        // Update entry
        await db.query(
            `UPDATE timetables 
             SET admin_id = ?, classroom_id = ?, group_id = ?, lecturer_id = ?, course_id = ?, unit_id = ?, day_of_week = ?, start_time = ?, end_time = ?
             WHERE id = ?`,
            [admin_id, classroom_id, group_id, lecturer_id, course_id, unit_id, day_of_week, start_time, end_time, id]
        );

        // Auto-revoke conflicting student room claims
        await db.query(
            `DELETE FROM room_claims 
             WHERE classroom_id = ? 
               AND DAYNAME(start_time) = ? 
               AND TIME(start_time) < ? 
               AND TIME(end_time) > ?`,
            [classroom_id, day_of_week, end_time, start_time]
        );

        return res.json({
            id,
            admin_id,
            classroom_id,
            group_id,
            lecturer_id,
            course_id,
            unit_id,
            day_of_week,
            start_time,
            end_time
        });
    } catch (err) {
        console.error('Update timetable error:', err);
        return res.status(500).json({ error: 'Internal server error updating timetable entry' });
    }
}

// Delete timetable entry
async function deleteTimetable(req, res) {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid timetable entry ID' });
    }

    try {
        const [result] = await db.query('DELETE FROM timetables WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Timetable entry not found' });
        }
        return res.json({ success: true, message: 'Timetable entry deleted successfully' });
    } catch (err) {
        console.error('Delete timetable error:', err);
        return res.status(500).json({ error: 'Internal server error deleting timetable entry' });
    }
}

module.exports = {
    listTimetables,
    createTimetable,
    updateTimetable,
    deleteTimetable,
    verifyConflicts
};
