const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// MIDDLEWARE -----------------
app.use(cors({origin: 'http://localhost:3000'}));
app.use(express.json());
app.use(express.urlencoded({extended:true}));

// ROUTES ----------------------
// app.use('/api/classrooms', require('./routes/classrooms'));
// app.use('/api/users', require('./routes/users'));

// HEALTH CHECK ----------------
app.get('/', (req, res) => {
    res.json({message:'Classroom Finder API is running'});
})



// ERROR HANDLER
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({error: 'Something went wrong'});
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
})