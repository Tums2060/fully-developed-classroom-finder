const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: (origin, callback) => {
        // Dynamically allow any origin (e.g. your phone's IP address) in development
        callback(null, true);
    },
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routing
app.use('/api/public', require('./routes/public'));
app.use('/api/claims', require('./routes/claims'));
app.use('/api/admin/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));

// Root Health Check
app.get('/', (req, res) => {
    res.json({ message: 'Free Classroom Finder API is active' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled server error:', err.stack);
    res.status(500).json({ error: err.message || 'Something went wrong on the server' });
});

const db = require('./config/db');

// Ensure ip_address column exists in room_claims table
db.query(`
    SELECT COLUMN_NAME 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'room_claims' AND COLUMN_NAME = 'ip_address'
`, [process.env.DB_NAME || 'classroom_finder2'])
.then(([rows]) => {
    if (rows.length === 0) {
        console.log("Adding ip_address column to room_claims...");
        return db.query('ALTER TABLE room_claims ADD COLUMN ip_address VARCHAR(45) NULL');
    }
})
.then(() => {
    console.log("Database schema check: ip_address column verified.");
})
.catch(err => {
    console.error("Failed to verify/alter room_claims table schema:", err);
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});