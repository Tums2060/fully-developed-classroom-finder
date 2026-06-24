const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
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

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});