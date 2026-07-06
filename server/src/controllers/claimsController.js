const db = require('../config/db');

// Helper to convert day of week and time to datetime for conflict checking in the current week 
function getDatetimeForDayAndTime(dayOfWeek, timeStr, baseDateStr = null) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const targetDayIndex = days.findIndex(d => d.toLowerCase() === dayOfWeek.toLowerCase());
    if (targetDayIndex === -1) return null;

    const now = new Date();
    const [hours, minutes] = timeStr.split(':');

    let targetDate;
    if (baseDateStr) {
        // Use the same date (year, month, day) as the baseDateStr
        const [datePart] = baseDateStr.split(' ');
        const [year, month, date] = datePart.split('-').map(Number);
        targetDate = new Date(year, month - 1, date);
    } else {
        const currentDayIndex = now.getDay();
        const diff = targetDayIndex - currentDayIndex;

        targetDate = new Date(now);
        targetDate.setDate(now.getDate() + diff);
    }

    targetDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);

    // Only roll over if we are calculating the start time (no baseDateStr)
    if (!baseDateStr && targetDate < now) {
        targetDate.setDate(targetDate.getDate() + 7);
    }

    const year = targetDate.getFullYear();
    const month = String(targetDate.getMonth() + 1).padStart(2, '0');
    const date = String(targetDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${date} ${hours}:${minutes}:00`;
}

// POST /api/claims
async function createClaim(req, res) {
    const { classroom_id, device_token, group_size, day_of_week, start_time, end_time } = req.body;

    if (!classroom_id || !device_token || !group_size || !day_of_week || !start_time || !end_time) {
        return res.status(400).json({ error: 'All fields (classroom_id, device_token, group_size, day_of_week, start_time, end_time) are required.' });
    }

    if (day_of_week.toLowerCase() === 'sunday') {
        return res.status(400).json({ error: 'Room claiming is not supported on Sunday.' });
    }

    const minTime = '08:15';
    const maxTime = '17:15';
    if (start_time < minTime || start_time > maxTime || end_time < minTime || end_time > maxTime) {
        return res.status(400).json({ error: 'Classroom claiming is only allowed between 08:15 and 17:15.' });
    }

    if (start_time >= end_time) {
        return res.status(400).json({ error: 'Start time must be strictly before end time.' });
    }

    // Verify max duration of 90 minutes
    const startTimePart = start_time.split(':').map(Number);
    const endTimePart = end_time.split(':').map(Number);
    const durationMinutes = (endTimePart[0] * 60 + endTimePart[1]) - (startTimePart[0] * 60 + startTimePart[1]);
    if (durationMinutes <= 0) {
        return res.status(400).json({ error: 'Invalid start/end times.' });
    }
    if (durationMinutes > 90) {
        return res.status(400).json({ error: 'Maximum claim duration is 90 minutes.' });
    }

    try {
        const startTimeStr = getDatetimeForDayAndTime(day_of_week, start_time);
        const endTimeStr = getDatetimeForDayAndTime(day_of_week, end_time, startTimeStr);

        // Check 1: does the device already have an active claim overlapping with this period?
        const [existingClaims] = await db.query(
            'SELECT COUNT(*) AS count FROM room_claims WHERE device_token = ? AND start_time < ? AND end_time > ?',
            [device_token, endTimeStr, startTimeStr]
        );
        if (existingClaims[0].count > 0) {
            return res.status(429).json({ error: 'Device already has an active claim during this period. Please release it before making a new claim.' });
        }

        // Fetching classroom details
        const [rooms] = await db.query('SELECT capacity FROM classrooms WHERE id = ?', [classroom_id]);
        if (rooms.length === 0) {
            return res.status(404).json({ error: 'Classroom not found.' });
        }

        const roomCapacity = rooms[0].capacity;

        // Check 2: is the room capacity > 25, giving 403 error
        if (roomCapacity > 25) {
            return res.status(403).json({ error: 'Only classrooms with capacity less than 25 can be booked.' });
        }

        // Check 3 if group_size > capacity
        if (parseInt(group_size, 10) > roomCapacity) {
            return res.status(400).json({ error: `Group size exceeds room capacity of ${roomCapacity}.` });
        }

        // Check 3.5: does this classroom already have an overlapping active claim?
        const [overlappingClaims] = await db.query(
            'SELECT COUNT(*) AS count FROM room_claims WHERE classroom_id = ? AND start_time < ? AND end_time > ?',
            [classroom_id, endTimeStr, startTimeStr]
        );
        if (overlappingClaims[0].count > 0) {
            return res.status(409).json({ error: 'This room has already been claimed by another user for this period.' });
        }

        // Format time into MariaDB TIME format
        const formatMySQLTime = (timeStr) => {
            const parts = timeStr.split(':');
            const hours = String(parts[0]).padStart(2, '0');
            const minutes = String(parts[1] || 0).padStart(2, '0');
            return `${hours}:${minutes}:00`;
        };

        const claimStartTimeStr = formatMySQLTime(start_time);
        const claimEndTimeStr = formatMySQLTime(end_time);

        // Check 4, does requested time overlap with a timetable entry
        const [timetableConflicts] = await db.query(
            `SELECT COUNT(*) AS count 
             FROM timetables 
             WHERE classroom_id = ? 
               AND day_of_week = ? 
               AND start_time < ? 
               AND end_time > ?`,
            [classroom_id, day_of_week, claimEndTimeStr, claimStartTimeStr]
        );
        if (timetableConflicts[0].count > 0) {
            return res.status(409).json({ error: 'The requested period overlaps with an official timetable entry.' });
        }

        // Generating 4 digit PIN
        const cancelPin = Math.floor(1000 + Math.random() * 9000).toString();

        // Retrieve client IP
        const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip;

        // All checks have passed, now insert
        await db.query(
            `INSERT INTO room_claims (classroom_id, device_token, ip_address, group_size, start_time, end_time, cancel_pin) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [classroom_id, device_token, clientIp, group_size, startTimeStr, endTimeStr, cancelPin]
        );

        return res.json({
            message: 'Room claimed successfully.',
            cancel_pin: cancelPin
        });

    } catch (err) {
        console.error('Error creating claim:', err);
        return res.status(500).json({ error: 'Internal server error processing the claim.' });
    }
}

// POST /api/claims/cancel
async function cancelClaim(req, res) {
    const { cancel_pin } = req.body;

    if (!cancel_pin) {
        return res.status(400).json({ error: 'Cancellation PIN is required.' });
    }

    try {
        // Find the active claim with this PIN that hasn't ended yet
        const [claims] = await db.query(
            'SELECT claim_id FROM room_claims WHERE cancel_pin = ? AND end_time > NOW()',
            [cancel_pin]
        );

        if (claims.length === 0) {
            return res.status(404).json({ error: 'No active claim found matching the provided PIN.' });
        }

        const claimId = claims[0].claim_id;

        // Delete the active claim
        await db.query('DELETE FROM room_claims WHERE claim_id = ?', [claimId]);

        return res.json({ message: 'Claim successfully cancelled.' });
    } catch (err) {
        console.error('Error cancelling claim:', err);
        return res.status(500).json({ error: 'Internal server error processing cancellation' });
    }
}

// GET /api/claims/my-claims
async function getMyClaims(req, res) {
    const { device_token } = req.query;
    const ip_address = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip;
    try {
        const [claims] = await db.query(
            `SELECT rc.claim_id, rc.classroom_id, rc.group_size, rc.start_time, rc.end_time, rc.cancel_pin, rc.ip_address,
                    c.name AS room_name, c.capacity, b.name AS building_name
             FROM room_claims rc
             JOIN classrooms c ON rc.classroom_id = c.id
             JOIN buildings b ON c.building_id = b.id
             WHERE rc.end_time > NOW() AND (rc.ip_address = ? OR rc.device_token = ?)
             ORDER BY rc.start_time ASC`,
            [ip_address, device_token || '']
        );
        return res.json(claims);
    } catch (err) {
        console.error('Error fetching my claims:', err);
        return res.status(500).json({ error: 'Internal server error fetching your claims.' });
    }
}

// GET /api/admin/claims (admin endpoint)
async function listAllClaims(req, res) {
    try {
        const [claims] = await db.query(
            `SELECT rc.claim_id, rc.classroom_id, rc.group_size, rc.start_time, rc.end_time, rc.cancel_pin, rc.device_token, rc.ip_address,
                    c.name AS room_name, c.capacity, b.name AS building_name
             FROM room_claims rc
             JOIN classrooms c ON rc.classroom_id = c.id
             JOIN buildings b ON c.building_id = b.id
             ORDER BY rc.start_time DESC`
        );
        return res.json(claims);
    } catch (err) {
        console.error('Error listing all claims for admin:', err);
        return res.status(500).json({ error: 'Internal server error listing claims.' });
    }
}

// DELETE /api/admin/claims/:id (admin endpoint)
async function deleteClaimAdmin(req, res) {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM room_claims WHERE claim_id = ?', [id]);
        return res.json({ message: 'Claim deleted successfully.' });
    } catch (err) {
        console.error('Error deleting claim by admin:', err);
        return res.status(500).json({ error: 'Internal server error deleting claim.' });
    }
}

module.exports = { 
    createClaim,
    cancelClaim,
    getMyClaims,
    listAllClaims,
    deleteClaimAdmin
};