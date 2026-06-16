const bcrypt = require('bcryptjs');
const db = require('../config/db');

// List all administrators (Super Admin only)
async function listAdmins(req, res) {
    try {
        const [rows] = await db.query('SELECT id, username, is_super_admin, created_at FROM administrators ORDER BY is_super_admin DESC, username ASC');
        return res.json(rows);
    } catch (err) {
        console.error('List admins error:', err);
        return res.status(500).json({ error: 'Internal server error listing admins' });
    }
}

// Create standard admin (Super Admin only)
async function createAdmin(req, res) {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    try {
        // Check if username already exists
        const [existing] = await db.query('SELECT * FROM administrators WHERE username = ?', [username]);
        if (existing.length > 0) {
            return res.status(400).json({ error: 'Username is already taken' });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        await db.query(
            'INSERT INTO administrators (username, password_hash, is_super_admin) VALUES (?, ?, ?)',
            [username, passwordHash, 0] // Always standard admin
        );

        return res.json({ success: true, message: 'Administrator created successfully' });
    } catch (err) {
        console.error('Create admin error:', err);
        return res.status(500).json({ error: 'Internal server error creating admin' });
    }
}

// Revoke admin access (Super Admin only)
async function revokeAdmin(req, res) {
    const adminId = parseInt(req.params.id, 10);
    const superAdminId = req.admin.id;

    if (isNaN(adminId)) {
        return res.status(400).json({ error: 'Invalid administrator ID' });
    }

    if (adminId === superAdminId) {
        return res.status(400).json({ error: 'Super Admin cannot revoke their own access' });
    }

    try {
        // Verify target admin exists and is not a Super Admin
        const [rows] = await db.query('SELECT * FROM administrators WHERE id = ?', [adminId]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Administrator not found' });
        }

        const targetAdmin = rows[0];
        if (targetAdmin.is_super_admin === 1 || targetAdmin.is_super_admin === true) {
            return res.status(400).json({ error: 'Cannot revoke access for another Super Admin' });
        }

        // Delete the admin
        await db.query('DELETE FROM administrators WHERE id = ?', [adminId]);

        return res.json({ success: true, message: 'Administrator access revoked successfully' });
    } catch (err) {
        console.error('Revoke admin error:', err);
        // Handle foreign key constraint if it exists (though administrators table has ON DELETE RESTRICT on timetables)
        if (err.code === 'ER_ROW_IS_REFERENCED_2' || err.code === 'ER_ROW_IS_REFERENCED') {
            return res.status(400).json({ error: 'Cannot revoke admin who has associated timetable logs. Delete their timetables first.' });
        }
        return res.status(500).json({ error: 'Internal server error revoking admin' });
    }
}

module.exports = {
    listAdmins,
    createAdmin,
    revokeAdmin
};
