const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_classroom_finder_key_2026';

// Admin Login
async function login(req, res) {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    try {
        const [rows] = await db.query('SELECT * FROM administrators WHERE username = ?', [username]);
        if (rows.length === 0) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        const admin = rows[0];
        const isMatch = await bcrypt.compare(password, admin.password_hash);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        const token = jwt.sign(
            { id: admin.id, username: admin.username, is_super_admin: admin.is_super_admin },
            JWT_SECRET,
            { expiresIn: '12h' }
        );

        return res.json({
            token,
            admin: {
                id: admin.id,
                username: admin.username,
                is_super_admin: admin.is_super_admin
            }
        });
    } catch (err) {
        console.error('Login error:', err);
        return res.status(500).json({ error: 'Internal server error during login' });
    }
}

// Verify Token Status
async function verify(req, res) {
    // Re-verify from token payload (set by authenticateToken middleware)
    if (!req.admin) {
        return res.status(401).json({ valid: false, error: 'Unauthenticated' });
    }
    return res.json({
        valid: true,
        admin: {
            id: req.admin.id,
            username: req.admin.username,
            is_super_admin: req.admin.is_super_admin
        }
    });
}

// Update own password
async function changePassword(req, res) {
    const { currentPassword, newPassword } = req.body;
    const adminId = req.admin.id;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Current password and new password are required' });
    }

    try {
        const [rows] = await db.query('SELECT * FROM administrators WHERE id = ?', [adminId]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Administrator not found' });
        }

        const admin = rows[0];
        const isMatch = await bcrypt.compare(currentPassword, admin.password_hash);
        if (!isMatch) {
            return res.status(400).json({ error: 'Incorrect current password' });
        }

        const salt = await bcrypt.genSalt(10);
        const newPasswordHash = await bcrypt.hash(newPassword, salt);

        await db.query('UPDATE administrators SET password_hash = ? WHERE id = ?', [newPasswordHash, adminId]);

        return res.json({ success: true, message: 'Password updated successfully' });
    } catch (err) {
        console.error('Change password error:', err);
        return res.status(500).json({ error: 'Internal server error updating password' });
    }
}

module.exports = {
    login,
    verify,
    changePassword
};
