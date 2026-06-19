const http = require('http');

const API_PORT = 5000;
const BASE_OPTIONS = {
    hostname: 'localhost',
    port: API_PORT,
    headers: {
        'Content-Type': 'application/json'
    }
};

// Helper to wrap http.request in a Promise
function request(path, method, body = null, token = null) {
    return new Promise((resolve, reject) => {
        const options = {
            ...BASE_OPTIONS,
            path,
            method,
            headers: {
                ...BASE_OPTIONS.headers
            }
        };

        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                let parsed = data;
                try {
                    parsed = JSON.parse(data);
                } catch (e) {}
                resolve({ status: res.statusCode, body: parsed });
            });
        });

        req.on('error', (err) => {
            reject(err);
        });

        if (body) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
}

async function runTests() {
    console.log('--- STARTING PROGRAMMATIC API TESTS ---');
    let token = null;

    try {
        // 1. Test Admin Login
        console.log('\nTesting Login...');
        const loginRes = await request('/api/admin/auth/login', 'POST', {
            username: 'admin',
            password: 'admin123'
        });

        if (loginRes.status !== 200 || !loginRes.body.token) {
            throw new Error(`Login failed with status ${loginRes.status}: ${JSON.stringify(loginRes.body)}`);
        }
        token = loginRes.body.token;
        console.log('✓ Login successful! Token received.');

        // 2. Test Super Admin settings list
        console.log('\nTesting Super Admin endpoint (list admins)...');
        const listAdminsRes = await request('/api/admin/settings/admins', 'GET', null, token);
        if (listAdminsRes.status !== 200) {
            throw new Error(`Failed to list admins: ${JSON.stringify(listAdminsRes.body)}`);
        }
        console.log(`✓ Super Admin endpoint successful! Found ${listAdminsRes.body.length} admins.`);

        // 3. Populate entities
        console.log('\nCreating testing building...');
        const buildingRes = await request('/api/admin/buildings', 'POST', { name: 'Test Hall' }, token);
        const buildingId = buildingRes.body.id;
        console.log(`✓ Building created: ID ${buildingId}`);

        console.log('Creating testing classroom...');
        const classroomRes = await request('/api/admin/classrooms', 'POST', {
            building_id: buildingId,
            name: 'Room 101',
            capacity: 50,
            room_type: 'Lecture Hall'
        }, token);
        const classroomId = classroomRes.body.id;
        console.log(`✓ Classroom created: ID ${classroomId}`);

        console.log('Creating testing school...');
        const schoolRes = await request('/api/admin/schools', 'POST', { name: 'School of Science' }, token);
        const schoolId = schoolRes.body.id;
        console.log(`✓ School created: ID ${schoolId}`);

        console.log('Creating testing course...');
        const courseRes = await request('/api/admin/courses', 'POST', {
            school_id: schoolId,
            name: 'Computer Science'
        }, token);
        const courseId = courseRes.body.id;
        console.log(`✓ Course created: ID ${courseId}`);

        console.log('Creating testing unit...');
        const unitRes = await request('/api/admin/units', 'POST', {
            course_id: courseId,
            code: 'CS-TEST-101',
            name: 'Algorithms',
            year: 1,
            semester: 1
        }, token);
        const unitId = unitRes.body.id;
        console.log(`✓ Unit created: ID ${unitId}`);

        console.log('Creating testing student group...');
        const groupRes = await request('/api/admin/student-groups', 'POST', {
            course_id: courseId,
            name: 'CS-Group-A'
        }, token);
        const groupId = groupRes.body.id;
        console.log(`✓ Student group created: ID ${groupId}`);

        console.log('Creating testing lecturer...');
        const lecturerRes = await request('/api/admin/lecturers', 'POST', {
            name: 'Professor Turing',
            email: 'turing@science.edu'
        }, token);
        const lecturerId = lecturerRes.body.id;
        console.log(`✓ Lecturer created: ID ${lecturerId}`);

        // 4. Test schedule creation
        console.log('\nScheduling first class: Monday 10:00 - 12:00...');
        const scheduleRes1 = await request('/api/admin/timetables', 'POST', {
            classroom_id: classroomId,
            group_id: groupId,
            lecturer_id: lecturerId,
            course_id: courseId,
            day_of_week: 'Monday',
            start_time: '10:00:00',
            end_time: '12:00:00',
            unit_id: unitId
        }, token);

        if (scheduleRes1.status !== 200) {
            throw new Error(`Failed to schedule class: ${JSON.stringify(scheduleRes1.body)}`);
        }
        const timetableId = scheduleRes1.body.id;
        console.log(`✓ First class scheduled successfully: ID ${timetableId}`);

        // 5. Test conflicts prevention
        console.log('\nTesting conflict prevention rules (double-booking Room 101 on Monday 11:00 - 13:00)...');
        const scheduleResConflict = await request('/api/admin/timetables', 'POST', {
            classroom_id: classroomId, // Same room
            group_id: groupId,
            lecturer_id: lecturerId,
            course_id: courseId,
            day_of_week: 'Monday',
            start_time: '11:00:00',
            end_time: '13:00:00', // Overlaps
            unit_id: unitId
        }, token);

        if (scheduleResConflict.status === 400) {
            console.log('✓ Success! Backend successfully blocked conflict insertion.');
            console.log(`Message received: ${scheduleResConflict.body.error}`);
            console.log(`Details: ${JSON.stringify(scheduleResConflict.body.conflicts)}`);
        } else {
            throw new Error(`Double booking was incorrectly allowed! Status: ${scheduleResConflict.status}`);
        }

        // 6. Test search available rooms (overlapping time)
        console.log('\nSearching available classrooms for Monday 11:00 - 12:00 (overlaps with scheduled)...');
        const searchRes1 = await request('/api/public/search/available?day_of_week=Monday&start_time=11:00:00&end_time=12:00:00', 'GET');
        const hasRoom101InSearch1 = searchRes1.body.some(room => room.id === classroomId);
        if (!hasRoom101InSearch1) {
            console.log('✓ Success! Room 101 is correctly excluded from search results due to overlap.');
        } else {
            throw new Error('Room 101 was incorrectly returned as available during an overlapping time!');
        }

        // 7. Test search available rooms (non-overlapping time)
        console.log('Searching available classrooms for Monday 13:00 - 15:00 (non-overlapping)...');
        const searchRes2 = await request('/api/public/search/available?day_of_week=Monday&start_time=13:00:00&end_time=15:00:00', 'GET');
        const hasRoom101InSearch2 = searchRes2.body.some(room => room.id === classroomId);
        if (hasRoom101InSearch2) {
            console.log('✓ Success! Room 101 is correctly returned as available.');
        } else {
            throw new Error('Room 101 was not returned as available during a free slot!');
        }

        // 8. Clean up test records (timetables must be deleted first due to RESTRICT)
        console.log('\nCleaning up database records...');
        await request(`/api/admin/timetables/${timetableId}`, 'DELETE', null, token);
        await request(`/api/admin/units/${unitId}`, 'DELETE', null, token);
        await request(`/api/admin/lecturers/${lecturerId}`, 'DELETE', null, token);
        await request(`/api/admin/student-groups/${groupId}`, 'DELETE', null, token);
        await request(`/api/admin/courses/${courseId}`, 'DELETE', null, token);
        await request(`/api/admin/schools/${schoolId}`, 'DELETE', null, token);
        await request(`/api/admin/classrooms/${classroomId}`, 'DELETE', null, token);
        await request(`/api/admin/buildings/${buildingId}`, 'DELETE', null, token);
        console.log('✓ Cleanup complete.');

        console.log('\n--- ALL PROGRAMMATIC TESTS COMPLETED SUCCESSFULLY! ---');

    } catch (err) {
        console.error('❌ Test execution failed:', err);
        process.exit(1);
    }
}

runTests();
