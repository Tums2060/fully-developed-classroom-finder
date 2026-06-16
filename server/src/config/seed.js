const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const db = require('./db');

async function seed() {
    console.log('Starting database seeding...');
    try {
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        // Strip SQL comments (-- comment) and join lines
        const lines = schemaSql.split('\n');
        const cleanLines = lines.map(line => {
            const commentIndex = line.indexOf('--');
            if (commentIndex !== -1) {
                return line.substring(0, commentIndex);
            }
            return line;
        });
        const cleanSql = cleanLines.join('\n');

        // Split SQL statements by semicolon and filter empty ones
        const statements = cleanSql
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0);

        console.log(`Executing ${statements.length} SQL schema statements...`);
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            console.log(`Executing statement [${i + 1}/${statements.length}]: ${statement.substring(0, 100)}...`);
            await db.query(statement);
        }
        console.log('Database schema successfully initialized.');

        // Hash Super Admin password
        const username = 'admin';
        const rawPassword = 'admin123';
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(rawPassword, salt);

        // Check if admin already exists
        const [rows] = await db.query('SELECT * FROM administrators WHERE username = ?', [username]);
        if (rows.length === 0) {
            await db.query(
                'INSERT INTO administrators (username, password_hash, is_super_admin) VALUES (?, ?, ?)',
                [username, passwordHash, 1]
            );
            console.log('--------------------------------------------------');
            console.log('Super Admin successfully seeded!');
            console.log(`Username: ${username}`);
            console.log(`Password: ${rawPassword}`);
            console.log('--------------------------------------------------');
        } else {
            console.log('Super Admin user already exists.');
        }

        console.log('Database seeding completed successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Error during database seeding:', err);
        process.exit(1);
    }
}

seed();
