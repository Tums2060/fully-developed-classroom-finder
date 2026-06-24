const db = require('../config/db');

// POST /api/claims
async function createClaim(req, res) {
    const { classroom_id, device_token, group_size, duration } = req.body;

    if (!classroom_id || !device_token || !group_size || !duration) {
        return res.status(400).json({ error: 'All fields (classroom_id, device_token, group_size, duration) are required.' })
    }
    try {
        // Check 1: does the device already have an active claim?
        const [existingClaims] = await db.query(
            'SELECT COUNT(*) AS count FROM room_claims WHERE device_token = ? AND NOW() BETWEEN start_time AND end_time',
            [device_token]
        );
        if (existingClaims[0].count > 0) {
            return res.status(429).json({ error: 'Device already has an active claim. Please release it before making a new claim.' });
        }

        // Fetching classroom details
        const [rooms] = await db.query('SELECT capacity FROM classrooms WHERE id = ?', [classroom_id]);
        if (rooms.length === 0) {
            return res.status(404).json({ error: 'Classroom not found.' });
        }

        const roomCapacity = rooms[0].capacity;

        // Check 2: is the room capacity > 25, giving 403 error
        if (roomCapacity > 25) {
            return res.status(403).json({ error: 'Only classrooms with capacity less than 25 can be booked' });
        }

        // Check 3 if group_size > capacity
        if (parseInt(group_size, 10) > roomCapacity) {
            return res.status(400).json({ error: `Group size exceeds room capacity of ${roomCapacity}.` });
        }

        const startTime = new Date();
        // Set maximum claim duration of 90 minutes
        let durationMinutes = parseInt(duration, 10);
        if (isNaN(durationMinutes) || durationMinutes <= 0) {
            return res.status(400).json({ error: 'Invalid duration provided. ' });

        }
        if (durationMinutes > 90) {
            durationMinutes = 90;
        }

        const endTime = new Date(startTime.getTime() + durationMinutes * 60000);

        // Format Date into MariaDB format with local time
        const formatMySQLDate = (d) => {
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            const hours = String(d.getHours()).padStart(2, '0');
            const minutes = String(d.getMinutes()).padStart(2, '0');
            const seconds = String(d.getSeconds()).padStart(2, '0');
            return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
        };

        const startTimeStr = formatMySQLDate(startTime);
        const endTimeStr = formatMySQLDate(endTime);

        // Format time into MariaDB TIME format
        const formatMySQLTime = (d) => {
            const hours = String(d.getHours()).padStart(2, '0');
            const minutes = String(d.getMinutes()).padStart(2, '0');
            const seconds = String(d.getSeconds()).padStart(2, '0');
            return `${hours}:${minutes}:${seconds}`;
        };

        const claimStartTimeStr = formatMySQLTime(startTime);
        const claimEndTimeStr = formatMySQLTime(endTime);

        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const currentDayOfWeek = days[startTime.getDay()];

        if (currentDayOfWeek === 'Sunday') {
            return res.status(400).json({ error: 'Room claiming is not supported on Sunday.' });
        }

        // Check 4, does requested time overlap with a timetable entry
        const [timetableConflicts] = await db.query(
            `SELECT COUNT(*) AS count 
             FROM timetables 
             WHERE classroom_id = ? 
               AND day_of_week = ? 
               AND start_time < ? 
               AND end_time > ?`,
            [classroom_id, currentDayOfWeek, claimEndTimeStr, claimStartTimeStr]
        );
        if (timetableConflicts[0].count > 0) {
            return res.status(409).json({ error: 'The requested period overlaps with an official timetable entry' });
        }

        // Generating 4 digit PIN
        const cancelPin = Math.floor(1000 + Math.random() * 9000).toString();

        // All checks have passed, now insert
        await db.query(
            `INSERT INTO room_claims (classroom_id, device_token, group_size, start_time, end_time, cancel_pin) VALUES (?, ?, ?, ?, ?, ?)`,
            [classroom_id, device_token, group_size, startTimeStr, endTimeStr, cancelPin]
        );

        return res.json({
            message: 'Room claimed successfully.',
            cancel_pin: cancelPin
        });

    } catch (err) {
        console.error('Error creating claim:', err);
        return res.status(500).json({ error: 'Internal server error processing the claim' });
    }
}

// POST /api/claims/cancel
async function cancelClaim(req, res) {
    const { cancel_pin } = req.body;

    if (!cancel_pin) {
        return res.status(400).json({ error: 'Cancellation PIN is required.' });
    }

    try {
        // Find the active claim with this PIN
        const [claims] = await db.query(
            'SELECT claim_id FROM room_claims WHERE cancel_pin = ? AND NOW() BETWEEN start_time AND end_time',
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

module.exports = { 
    createClaim,
    cancelClaim
};