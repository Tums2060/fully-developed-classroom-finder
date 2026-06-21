const mysql = require('mysql2');
require('dotenv').config();

async function createDatabase() {
    console.log('Ensuring database exists...');
    const connection = mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD
    }).promise();

    try {
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\``);
        console.log('Database classroom_finder is ready or has been created.');
        await connection.end();
        process.exit(0);
    } catch (err) {
        console.error('Error creating database:', err);
        process.exit(1);
    }
}

createDatabase();
