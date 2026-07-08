const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const db = require('./db');

function generateUnitsForCourse(courseName, shortName) {
    let domainTopics = [];
    const nameLower = courseName.toLowerCase();
    
    if (nameLower.includes('computer') || nameLower.includes('informatics') || nameLower.includes('information technology') || nameLower.includes('cyber')) {
        domainTopics = [
            'Programming', 'Databases', 'Networking', 'Security', 
            'Software Design', 'Operating Systems', 'Web Tech', 'AI & ML',
            'Algorithms', 'System Analysis', 'Cloud Computing', 'HCI',
            'IT Governance', 'Hardware Systems', 'Mobile Apps', 'Data Science'
        ];
    } else if (nameLower.includes('engineering') || nameLower.includes('electrical')) {
        domainTopics = [
            'Circuits', 'Electronics', 'Electromagnetics', 'Control Systems',
            'Signal Processing', 'Microprocessors', 'Power Systems', 'Renewable Energy',
            'Embedded Systems', 'Instrumentation', 'Circuit Theory', 'Solid State Devices',
            'Power Electronics', 'Telecommunication', 'Engineering Design', 'Robotics'
        ];
    } else if (nameLower.includes('law') || nameLower.includes('llb')) {
        domainTopics = [
            'Contract Law', 'Torts', 'Criminal Law', 'Constitutional Law',
            'Property Law', 'Family Law', 'Commercial Law', 'International Law',
            'Jurisprudence', 'Civil Procedure', 'Human Rights', 'Evidence Law',
            'Tax Law', 'Administrative Law', 'Intellectual Property', 'Legal Ethics'
        ];
    } else if (nameLower.includes('tourism') || nameLower.includes('hospitality') || nameLower.includes('hotel')) {
        domainTopics = [
            'Tourism Operations', 'Hotel Administration', 'Food & Beverage', 'Customer Care',
            'Tourism Marketing', 'Event Management', 'Sustainable Tourism', 'Front Office',
            'Housekeeping', 'Leisure & Recreation', 'Destination Branding', 'Eco-Tourism',
            'Hospitality Law', 'Facility Operations', 'Catering Management', 'Culinary Arts'
        ];
    } else if (nameLower.includes('commerce') || nameLower.includes('business') || nameLower.includes('entrepreneurship') || nameLower.includes('financial services') || nameLower.includes('supply chain')) {
        domainTopics = [
            'Accounting', 'Marketing', 'Finance', 'Human Resources',
            'Operations', 'Microeconomics', 'Macroeconomics', 'Business Law',
            'Entrepreneurship', 'Strategic Management', 'Corporate Finance', 'Supply Chain',
            'Retail Management', 'Auditing', 'Risk Management', 'International Business'
        ];
    } else if (nameLower.includes('actuarial') || nameLower.includes('economics') || nameLower.includes('statistics') || nameLower.includes('mathematical') || nameLower.includes('data science')) {
        domainTopics = [
            'Calculus', 'Probability', 'Linear Algebra', 'Financial Math',
            'Mathematical Statistics', 'Actuarial Math', 'Econometrics', 'Time Series',
            'Data Analysis', 'Machine Learning', 'Survival Analysis', 'Microeconomics',
            'Macroeconomics', 'Portfolio Theory', 'Stochastic Processes', 'Demography'
        ];
    } else { // Humanities, BAC, BDP, BIS, DIR, etc.
        domainTopics = [
            'Sociology', 'Development Studies', 'International Relations', 'Media Studies',
            'Public Relations', 'Political Science', 'Ethics & Philosophy', 'Diplomacy',
            'Conflict Resolution', 'Communication Skills', 'Global Governance', 'Research Methods',
            'Foreign Policy', 'Cultural Studies', 'Social Psychology', 'Gender Studies'
        ];
    }

    const prefixes = [
        // Year 1
        ['Introduction to', 'Foundations of', 'Basic', 'Principles of', 'Elementary', 'Understanding', 'Core', 'Concepts in'], // Sem 1
        ['Introduction to', 'Foundations of', 'Basic', 'Principles of', 'Elementary', 'Understanding', 'Core', 'Concepts in'], // Sem 2
        // Year 2
        ['Applied', 'Intermediate', 'Methods in', 'Theory of', 'Systems of', 'Dynamics of', 'Structures of', 'Practice of'], // Sem 1
        ['Applied', 'Intermediate', 'Methods in', 'Theory of', 'Systems of', 'Dynamics of', 'Structures of', 'Practice of'], // Sem 2
        // Year 3
        ['Advanced', 'Modern', 'Analytical', 'Integrated', 'Comparative', 'Strategic', 'Issues in', 'Contemporary'], // Sem 1
        ['Advanced', 'Modern', 'Analytical', 'Integrated', 'Comparative', 'Strategic', 'Issues in', 'Contemporary'], // Sem 2
        // Year 4
        ['Special Topics in', 'Professional Seminar in', 'Global Perspective on', 'Research in', 'Policy and Practice in', 'Ethics in', 'Current Trends in', 'Capstone Project on'], // Sem 1
        ['Special Topics in', 'Professional Seminar in', 'Global Perspective on', 'Research in', 'Policy and Practice in', 'Ethics in', 'Current Trends in', 'Capstone Project on']  // Sem 2
    ];

    const units = [];
    let codeIndex = 100;
    
    // Generate exactly 8 semesters (4 years * 2 semesters)
    for (let year = 1; year <= 4; year++) {
        for (let sem = 1; sem <= 2; sem++) {
            const semIndex = (year - 1) * 2 + (sem - 1);
            const semPrefixes = prefixes[semIndex];
            
            for (let slot = 0; slot < 8; slot++) {
                const prefix = semPrefixes[slot];
                const topic = domainTopics[slot % domainTopics.length];
                
                // Add distinguishing suffix/level to avoid collisions 
                const levelSuffix = year > 1 ? ` Level ${year}` : '';
                const name = `${prefix} ${topic}${levelSuffix}`;
                
                // Generate a unique unit code like CNS 1101, BTM 2205, etc.
                const code = `${shortName} ${year}${sem}${String(codeIndex++).substring(1)}`;
                
                units.push({ name, code, year, semester: sem });
            }
        }
    }
    return units;
}

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

        // 5. Populate Schools, Courses, Student Groups, and Units
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

                // A. Seed Student Groups
                for (const group of course.student_groups) {
                    await db.query(
                        'INSERT INTO student_groups (course_id, name) VALUES (?, ?)',
                        [courseId, group.name]
                    );
                }
                console.log(`    ✓ Seeded ${course.student_groups.length} student groups for ${course.short_name}`);

                // B. Seed exactly 64 units for this course
                const unitsList = generateUnitsForCourse(course.name, course.short_name);
                for (const unit of unitsList) {
                    await db.query(
                        'INSERT INTO units (course_id, code, name, year, semester) VALUES (?, ?, ?, ?, ?)',
                        [courseId, unit.code, unit.name, unit.year, unit.semester]
                    );
                }
                console.log(`    ✓ Seeded 64 units for ${course.short_name}`);
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

        // 7. Populate 30 Lecturers (English first name, Kenyan last name)
        console.log('\nPopulating lecturers...');
        const firstNames = [
            'John', 'Mary', 'David', 'Sarah', 'Michael', 'Jane', 'James', 'Patricia', 'Robert', 'Linda',
            'William', 'Barbara', 'Richard', 'Elizabeth', 'Thomas', 'Jennifer', 'Charles', 'Maria', 'Matthew', 'Susan',
            'Joseph', 'Margaret', 'Daniel', 'Dorothy', 'Mark', 'Lisa', 'Donald', 'Nancy', 'Anthony', 'Betty'
        ];
        const lastNames = [
            'Wekesa', 'Ochieng', 'Mwangi', 'Kamau', 'Otieno', 'Onyango', 'Ndwiga', 'Maina', 'Kiptoo', 'Kipruto',
            'Kiprop', 'Nyambura', 'Wambui', 'Wanjiku', 'Wanjala', 'Okoth', 'Juma', 'Muli', 'Mutua', 'Musembi',
            'Mwakio', 'Mwasambo', 'Mwamburi', 'Mbeyu', 'Kahindi', 'Dzame', 'Kadzo', 'Mambo', 'Mwache', 'Chome'
        ];

        for (let i = 0; i < 30; i++) {
            const firstName = firstNames[i];
            const lastName = lastNames[i];
            const name = `${firstName} ${lastName}`;
            const email = `${firstName[0].toLowerCase()}${lastName.toLowerCase()}@strathmore.edu`;
            await db.query(
                'INSERT INTO lecturers (name, email) VALUES (?, ?)',
                [name, email]
            );
        }
        console.log('✓ Seeded 30 lecturers.');

        // 8. Hash Super Admin password & Seed Admin User (kept as is)
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
