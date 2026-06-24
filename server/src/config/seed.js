const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const db = require('./db');

async function seed() {
    console.log('Starting database seeding from JSON...');
    try {
        // 1. Temporarily disable foreign key checks
        await db.query('SET FOREIGN_KEY_CHECKS = 0');
        console.log('✓ Foreign key checks disabled.');

        // 2. Sequentially truncate existing tables
        console.log('Truncating existing tables...');
        await db.query('TRUNCATE TABLE timetables');
        await db.query('TRUNCATE TABLE room_claims');
        await db.query('TRUNCATE TABLE units');
        await db.query('TRUNCATE TABLE classrooms');
        await db.query('TRUNCATE TABLE buildings');
        await db.query('TRUNCATE TABLE lecturers');
        await db.query('TRUNCATE TABLE student_groups');
        await db.query('TRUNCATE TABLE courses');
        await db.query('TRUNCATE TABLE schools');
        console.log('✓ All target tables truncated successfully.');

        // 3. Re-enable foreign key checks
        await db.query('SET FOREIGN_KEY_CHECKS = 1');
        console.log('✓ Foreign key checks re-enabled.');

        // 4. Load seedData.json
        const seedDataPath = path.join(__dirname, 'seedData.json');
        const seedDataRaw = fs.readFileSync(seedDataPath, 'utf8');
        const seedData = JSON.parse(seedDataRaw);

        // 5. Populate Schools, Courses, and Student Groups
        console.log('\nPopulating academic structures...');
        for (const school of seedData.schools) {
            const [schoolResult] = await db.query(
                'INSERT INTO schools (name) VALUES (?)',
                [school.name]
            );
            const schoolId = schoolResult.insertId;
            console.log(`✓ Seeded School: ${school.name} (ID: ${schoolId})`);

            for (const course of school.courses) {
                const [courseResult] = await db.query(
                    'INSERT INTO courses (school_id, name) VALUES (?, ?)',
                    [schoolId, course.name]
                );
                const courseId = courseResult.insertId;
                console.log(`  ✓ Seeded Course: ${course.name} (ID: ${courseId})`);

                for (const group of course.student_groups) {
                    await db.query(
                        'INSERT INTO student_groups (course_id, name) VALUES (?, ?)',
                        [courseId, group.name]
                    );
                }
                console.log(`    ✓ Seeded ${course.student_groups.length} student groups for ${course.short_name}`);
            }
        }

        // 6. Populate Buildings and Classrooms
        console.log('\nPopulating campus structures...');
        for (const building of seedData.buildings) {
            const [buildingResult] = await db.query(
                'INSERT INTO buildings (name) VALUES (?)',
                [building.name]
            );
            const buildingId = buildingResult.insertId;
            console.log(`✓ Seeded Building: ${building.name} (ID: ${buildingId})`);

            for (const classroom of building.classrooms) {
                await db.query(
                    'INSERT INTO classrooms (building_id, name, capacity, room_type) VALUES (?, ?, ?, ?)',
                    [buildingId, classroom.name, classroom.capacity, classroom.room_type]
                );
            }
            console.log(`  ✓ Seeded ${building.classrooms.length} classrooms for ${building.name}`);
        }

        // 7. Hash Super Admin password & Seed Admin User (kept as is)
        console.log('\nChecking admin credentials...');
        const username = 'admin';
        const rawPassword = 'admin123';
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(rawPassword, salt);

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

        console.log('\nDatabase seeding from JSON completed successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Error during database seeding:', err);
        process.exit(1);
    }
}

seed();
