const db = require('../config/db');

// Helper to convert day of week and time to datetime for conflict checking in the current week 
function getDatetimeForDayAndTime(dayOfWeek, timeStr) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const targetDayIndex = days.findIndex(d => d.toLowerCase() === dayOfWeek.toLowerCase());
    if (targetDayIndex === -1) return null;

    const now = new Date();
    const currentDayIndex = now.getDay();
    const diff = targetDayIndex - currentDayIndex;

    const targetDate = new Date(now);
    targetDate.setDate(now.getDate() + diff);

    const [hours, minutes] = timeStr.split(':');
    targetDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);

    const year = targetDate.getFullYear();
    const month = String(targetDate.getMonth() + 1).padStart(2, '0');
    const date = String(targetDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${date} ${hours}:${minutes}:00`;
}


// Main availability search
async function searchAvailable(req, res) {
    const { day_of_week, start_time, end_time, capacity, room_type } = req.query;

    if (!day_of_week || !start_time || !end_time) {
        return res.status(400).json({ error: 'day_of_week, start_time, and end_time are required parameters' });
    }

    if (day_of_week.toLowerCase() === 'sunday') {
        return res.status(400).json({ error: 'Searches on Sunday are not supported' });
    }

    // Time validation (start_time < end_time)
    if (start_time >= end_time) {
        return res.status(400).json({ error: 'Start time must be strictly before end time' });
    }
    try {
        const searchStartDT = getDatetimeForDayAndTime(day_of_week, start_time);
        const searchEndDT = getDatetimeForDayAndTime(day_of_week, end_time);

        let sql = `
            SELECT c.id, c.name AS room_name, c.capacity, c.room_type, b.name AS building_name,
                   (SELECT MIN(t.start_time) FROM timetables t WHERE t.classroom_id = c.id AND t.day_of_week = ? AND t.start_time >= ?) AS next_class_start 
            FROM classrooms c
            JOIN buildings b ON c.building_id = b.id
            WHERE c.id NOT IN (
                SELECT classroom_id 
                FROM timetables
                WHERE day_of_week = ? 
                  AND start_time < ? 
                  AND end_time > ? 
            )
            AND c.id NOT IN (
                SELECT classroom_id 
                FROM room_claims 
                WHERE start_time < ? 
                  AND end_time > ? 
            ) 
        `;
        const params = [
            day_of_week, 
            start_time, 
            day_of_week, 
            end_time, 
            start_time, 
            searchEndDT, 
            searchStartDT
        ];

        if (capacity) {
            const minCapacity = parseInt(capacity, 10);
            if (!isNaN(minCapacity)) {
                sql += ' AND c.capacity >= ?';
                params.push(minCapacity);
            }
        }

        if (room_type && room_type.trim() && room_type !== 'All') {
            sql += ' AND c.room_type = ?';
            params.push(room_type.trim());
        }

        sql += ' ORDER BY b.name ASC, c.name ASC';

        const [rows] = await db.query(sql, params);
        
        // Convert next_class_start (which is a TIME string or null) into a full DATETIME string
        const processedRows = rows.map(row => {
            if (row.next_class_start) {
                row.next_class_start = getDatetimeForDayAndTime(day_of_week, row.next_class_start);
            }
            return row;
        });

        return res.json(processedRows);
    } catch (err) {
        console.error('Search available rooms error:', err);
        return res.status(500).json({ error: 'Internal server error performing classroom search' });
    }
}

// Get all unique room types currently in classrooms
async function getRoomTypes(req, res) {
    try {
        const [rows] = await db.query('SELECT DISTINCT room_type FROM classrooms ORDER BY room_type ASC');
        const types = rows.map(r => r.room_type);
        return res.json(types);
    } catch (err) {
        console.error('Get room types error:', err);
        return res.status(500).json({ error: 'Internal server error fetching room types' });
    }
}

module.exports = {
    searchAvailable,
    getRoomTypes
};
