const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'super_secret_classroom_finder_key_2026', (err, admin) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.admin = admin;
        next();
    });
}

function requireSuperAdmin(req, res, next) {
    if (!req.admin) {
        return res.status(401).json({ error: 'Access token required' });
    }
    if (req.admin.is_super_admin !== 1 && req.admin.is_super_admin !== true) {
        return res.status(403).json({ error: 'Forbidden: Super Admin access required' });
    }
    next();
}

module.exports = {
    authenticateToken,
    requireSuperAdmin
};
