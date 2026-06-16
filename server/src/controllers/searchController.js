const db = require('../config/db');

// Main availability search
async function searchAvailable(req, res) {
    const { day_of_week, start_time, end_time, capacity, room_type } = req.query;

    if (!day_of_week || !start_time || !end_time) {
        return res.status(400).json({ error: 'day_of_week, start_time, and end_time are required parameters' });
    }

    // Time validation (start_time < end_time)
    if (start_time >= end_time) {
        return res.status(400).json({ error: 'Start time must be strictly before end time' });
    }

    try {
        let sql = `
            SELECT c.id, c.name AS room_name, c.capacity, c.room_type, b.name AS building_name
            FROM classrooms c
            JOIN buildings b ON c.building_id = b.id
            WHERE c.id NOT IN (
                SELECT classroom_id 
                FROM timetables
                WHERE day_of_week = ? 
                  AND start_time < ? 
                  AND end_time > ?
            )
        `;
        const params = [day_of_week, end_time, start_time];

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
        return res.json(rows);
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
