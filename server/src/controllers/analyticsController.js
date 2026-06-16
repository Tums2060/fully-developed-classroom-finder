const db = require('../config/db');

async function getStats(req, res) {
    try {
        // 1. Basic counts
        const [[{ count: totalBuildings }]] = await db.query('SELECT COUNT(*) AS count FROM buildings');
        const [[{ count: totalClassrooms }]] = await db.query('SELECT COUNT(*) AS count FROM classrooms');
        const [[{ count: totalTimetables }]] = await db.query('SELECT COUNT(*) AS count FROM timetables');
        const [[{ count: totalLecturers }]] = await db.query('SELECT COUNT(*) AS count FROM lecturers');

        // 2. Compute utilization rate (assuming 60 standard operational hours per classroom per week)
        let utilizationRate = 0;
        if (totalClassrooms > 0) {
            const [[{ total_seconds }]] = await db.query('SELECT SUM(TIME_TO_SEC(TIMEDIFF(end_time, start_time))) AS total_seconds FROM timetables');
            const totalHours = total_seconds ? (total_seconds / 3600) : 0;
            const totalCapacityHours = totalClassrooms * 60; // 60 hours per classroom per week
            utilizationRate = Math.min(100, Math.round((totalHours / totalCapacityHours) * 100 * 10) / 10);
        }

        // 3. Most Booked Classrooms (Top 5)
        const [mostBookedRooms] = await db.query(`
            SELECT c.name AS room_name, b.name AS building_name, COUNT(t.id) AS bookings
            FROM timetables t
            JOIN classrooms c ON t.classroom_id = c.id
            JOIN buildings b ON c.building_id = b.id
            GROUP BY c.id, c.name, b.name
            ORDER BY bookings DESC
            LIMIT 5
        `);

        // 4. Busy hours of the day
        const [busyHoursRows] = await db.query(`
            SELECT HOUR(start_time) AS hour_val, COUNT(id) AS active_bookings
            FROM timetables
            GROUP BY HOUR(start_time)
            ORDER BY hour_val ASC
        `);
        const busyHours = busyHoursRows.map(row => {
            const formattedHour = `${String(row.hour_val).padStart(2, '0')}:00`;
            return {
                hour: formattedHour,
                active_bookings: row.active_bookings
            };
        });

        // 5. Room utilization breakdown by room type
        const [roomTypesRows] = await db.query(`
            SELECT c.room_type, 
                   COUNT(t.id) AS bookings, 
                   COUNT(DISTINCT c.id) AS room_count,
                   SUM(TIME_TO_SEC(TIMEDIFF(t.end_time, t.start_time))) AS type_seconds
            FROM classrooms c
            LEFT JOIN timetables t ON t.classroom_id = c.id
            GROUP BY c.room_type
        `);
        const utilizationByRoomType = roomTypesRows.map(row => {
            const typeHours = row.type_seconds ? (row.type_seconds / 3600) : 0;
            const typeCapacityHours = row.room_count * 60;
            const rate = typeCapacityHours > 0 ? Math.min(100, Math.round((typeHours / typeCapacityHours) * 100 * 10) / 10) : 0;
            return {
                room_type: row.room_type,
                bookings: row.bookings,
                room_count: row.room_count,
                rate: rate
            };
        });

        return res.json({
            totalBuildings,
            totalClassrooms,
            totalTimetables,
            totalLecturers,
            utilizationRate,
            mostBookedRooms,
            busyHours,
            utilizationByRoomType
        });
    } catch (err) {
        console.error('Get analytics stats error:', err);
        return res.status(500).json({ error: 'Internal server error computing analytics stats' });
    }
}

module.exports = {
    getStats
};
