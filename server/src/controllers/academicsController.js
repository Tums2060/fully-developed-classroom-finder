const db = require('../config/db');

// --- SCHOOLS ---
async function listSchools(req, res) {
    try {
        const [rows] = await db.query('SELECT * FROM schools ORDER BY name ASC');
        return res.json(rows);
    } catch (err) {
        console.error('List schools error:', err);
        return res.status(500).json({ error: 'Internal server error listing schools' });
    }
}

async function createSchool(req, res) {
    const { name } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'School name is required' });

    try {
        const [existing] = await db.query('SELECT * FROM schools WHERE name = ?', [name.trim()]);
        if (existing.length > 0) return res.status(400).json({ error: 'School name already exists' });

        const [result] = await db.query('INSERT INTO schools (name) VALUES (?)', [name.trim()]);
        return res.json({ id: result.insertId, name: name.trim() });
    } catch (err) {
        console.error('Create school error:', err);
        return res.status(500).json({ error: 'Internal server error creating school' });
    }
}

async function updateSchool(req, res) {
    const id = parseInt(req.params.id, 10);
    const { name } = req.body;

    if (isNaN(id)) return res.status(400).json({ error: 'Invalid school ID' });
    if (!name || !name.trim()) return res.status(400).json({ error: 'School name is required' });

    try {
        const [existing] = await db.query('SELECT * FROM schools WHERE name = ? AND id != ?', [name.trim(), id]);
        if (existing.length > 0) return res.status(400).json({ error: 'School name already exists' });

        const [result] = await db.query('UPDATE schools SET name = ? WHERE id = ?', [name.trim(), id]);
        if (result.affectedRows === 0) return res.status(404).json({ error: 'School not found' });

        return res.json({ id, name: name.trim() });
    } catch (err) {
        console.error('Update school error:', err);
        return res.status(500).json({ error: 'Internal server error updating school' });
    }
}

async function deleteSchool(req, res) {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid school ID' });

    try {
        const [result] = await db.query('DELETE FROM schools WHERE id = ?', [id]);
        if (result.affectedRows === 0) return res.status(404).json({ error: 'School not found' });
        return res.json({ success: true, message: 'School deleted successfully' });
    } catch (err) {
        console.error('Delete school error:', err);
        if (err.code === 'ER_ROW_IS_REFERENCED_2' || err.code === 'ER_ROW_IS_REFERENCED') {
            return res.status(400).json({ error: 'Cannot delete school: It has associated courses. Delete the courses first.' });
        }
        return res.status(500).json({ error: 'Internal server error deleting school' });
    }
}

// --- COURSES ---
async function listCourses(req, res) {
    try {
        const query = `
            SELECT c.*, s.name AS school_name 
            FROM courses c
            JOIN schools s ON c.school_id = s.id
            ORDER BY s.name ASC, c.name ASC
        `;
        const [rows] = await db.query(query);
        return res.json(rows);
    } catch (err) {
        console.error('List courses error:', err);
        return res.status(500).json({ error: 'Internal server error listing courses' });
    }
}

async function createCourse(req, res) {
    const { school_id, name } = req.body;
    if (!school_id || !name || !name.trim()) {
        return res.status(400).json({ error: 'School ID and course name are required' });
    }

    try {
        // Verify school exists
        const [school] = await db.query('SELECT * FROM schools WHERE id = ?', [school_id]);
        if (school.length === 0) return res.status(400).json({ error: 'Selected school does not exist' });

        const [result] = await db.query('INSERT INTO courses (school_id, name) VALUES (?, ?)', [school_id, name.trim()]);
        return res.json({ id: result.insertId, school_id, name: name.trim() });
    } catch (err) {
        console.error('Create course error:', err);
        return res.status(500).json({ error: 'Internal server error creating course' });
    }
}

async function updateCourse(req, res) {
    const id = parseInt(req.params.id, 10);
    const { school_id, name } = req.body;

    if (isNaN(id)) return res.status(400).json({ error: 'Invalid course ID' });
    if (!school_id || !name || !name.trim()) {
        return res.status(400).json({ error: 'School ID and course name are required' });
    }

    try {
        const [school] = await db.query('SELECT * FROM schools WHERE id = ?', [school_id]);
        if (school.length === 0) return res.status(400).json({ error: 'Selected school does not exist' });

        const [result] = await db.query('UPDATE courses SET school_id = ?, name = ? WHERE id = ?', [school_id, name.trim(), id]);
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Course not found' });

        return res.json({ id, school_id, name: name.trim() });
    } catch (err) {
        console.error('Update course error:', err);
        return res.status(500).json({ error: 'Internal server error updating course' });
    }
}

async function deleteCourse(req, res) {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid course ID' });

    try {
        const [result] = await db.query('DELETE FROM courses WHERE id = ?', [id]);
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Course not found' });
        return res.json({ success: true, message: 'Course deleted successfully' });
    } catch (err) {
        console.error('Delete course error:', err);
        if (err.code === 'ER_ROW_IS_REFERENCED_2' || err.code === 'ER_ROW_IS_REFERENCED') {
            return res.status(400).json({ error: 'Cannot delete course: It has associated student groups. Delete the student groups first.' });
        }
        return res.status(500).json({ error: 'Internal server error deleting course' });
    }
}

// --- STUDENT GROUPS ---
async function listGroups(req, res) {
    try {
        const query = `
            SELECT sg.*, c.name AS course_name, s.name AS school_name, c.school_id 
            FROM student_groups sg
            JOIN courses c ON sg.course_id = c.id
            JOIN schools s ON c.school_id = s.id
            ORDER BY sg.name ASC
        `;
        const [rows] = await db.query(query);
        return res.json(rows);
    } catch (err) {
        console.error('List groups error:', err);
        return res.status(500).json({ error: 'Internal server error listing groups' });
    }
}

async function createGroup(req, res) {
    const { course_id, name } = req.body;
    if (!course_id || !name || !name.trim()) {
        return res.status(400).json({ error: 'Course ID and group name are required' });
    }

    try {
        // Verify course exists
        const [course] = await db.query('SELECT * FROM courses WHERE id = ?', [course_id]);
        if (course.length === 0) return res.status(400).json({ error: 'Selected course does not exist' });

        // Check duplicate name inside the same course
        const [existing] = await db.query('SELECT * FROM student_groups WHERE name = ? AND course_id = ?', [name.trim(), course_id]);
        if (existing.length > 0) {
            return res.status(400).json({ error: 'Group name already exists in this course' });
        }

        const [result] = await db.query('INSERT INTO student_groups (course_id, name) VALUES (?, ?)', [course_id, name.trim()]);
        return res.json({ id: result.insertId, course_id, name: name.trim() });
    } catch (err) {
        console.error('Create group error:', err);
        return res.status(500).json({ error: 'Internal server error creating group' });
    }
}

async function updateGroup(req, res) {
    const id = parseInt(req.params.id, 10);
    const { course_id, name } = req.body;

    if (isNaN(id)) return res.status(400).json({ error: 'Invalid group ID' });
    if (!course_id || !name || !name.trim()) {
        return res.status(400).json({ error: 'Course ID and group name are required' });
    }

    try {
        const [course] = await db.query('SELECT * FROM courses WHERE id = ?', [course_id]);
        if (course.length === 0) return res.status(400).json({ error: 'Selected course does not exist' });

        const [existing] = await db.query('SELECT * FROM student_groups WHERE name = ? AND course_id = ? AND id != ?', [name.trim(), course_id, id]);
        if (existing.length > 0) {
            return res.status(400).json({ error: 'Group name already exists in this course' });
        }

        const [result] = await db.query('UPDATE student_groups SET course_id = ?, name = ? WHERE id = ?', [course_id, name.trim(), id]);
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Group not found' });

        return res.json({ id, course_id, name: name.trim() });
    } catch (err) {
        console.error('Update group error:', err);
        return res.status(500).json({ error: 'Internal server error updating group' });
    }
}

async function deleteGroup(req, res) {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid group ID' });

    try {
        const [result] = await db.query('DELETE FROM student_groups WHERE id = ?', [id]);
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Group not found' });
        return res.json({ success: true, message: 'Student group deleted successfully' });
    } catch (err) {
        console.error('Delete group error:', err);
        if (err.code === 'ER_ROW_IS_REFERENCED_2' || err.code === 'ER_ROW_IS_REFERENCED') {
            return res.status(400).json({ error: 'Cannot delete student group: It has active classes scheduled in the timetable. Delete the timetable entries first.' });
        }
        return res.status(500).json({ error: 'Internal server error deleting group' });
    }
}

// --- LECTURERS ---
async function listLecturers(req, res) {
    try {
        const [rows] = await db.query('SELECT * FROM lecturers ORDER BY name ASC');
        return res.json(rows);
    } catch (err) {
        console.error('List lecturers error:', err);
        return res.status(500).json({ error: 'Internal server error listing lecturers' });
    }
}

async function createLecturer(req, res) {
    const { name, email } = req.body;
    if (!name || !name.trim() || !email || !email.trim()) {
        return res.status(400).json({ error: 'Name and email are required' });
    }

    try {
        const [existing] = await db.query('SELECT * FROM lecturers WHERE email = ?', [email.trim()]);
        if (existing.length > 0) return res.status(400).json({ error: 'Lecturer email already registered' });

        const [result] = await db.query('INSERT INTO lecturers (name, email) VALUES (?, ?)', [name.trim(), email.trim()]);
        return res.json({ id: result.insertId, name: name.trim(), email: email.trim() });
    } catch (err) {
        console.error('Create lecturer error:', err);
        return res.status(500).json({ error: 'Internal server error creating lecturer' });
    }
}

async function updateLecturer(req, res) {
    const id = parseInt(req.params.id, 10);
    const { name, email } = req.body;

    if (isNaN(id)) return res.status(400).json({ error: 'Invalid lecturer ID' });
    if (!name || !name.trim() || !email || !email.trim()) {
        return res.status(400).json({ error: 'Name and email are required' });
    }

    try {
        const [existing] = await db.query('SELECT * FROM lecturers WHERE email = ? AND id != ?', [email.trim(), id]);
        if (existing.length > 0) return res.status(400).json({ error: 'Lecturer email already registered' });

        const [result] = await db.query('UPDATE lecturers SET name = ?, email = ? WHERE id = ?', [name.trim(), email.trim(), id]);
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Lecturer not found' });

        return res.json({ id, name: name.trim(), email: email.trim() });
    } catch (err) {
        console.error('Update lecturer error:', err);
        return res.status(500).json({ error: 'Internal server error updating lecturer' });
    }
}

async function deleteLecturer(req, res) {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid lecturer ID' });

    try {
        const [result] = await db.query('DELETE FROM lecturers WHERE id = ?', [id]);
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Lecturer not found' });
        return res.json({ success: true, message: 'Lecturer deleted successfully' });
    } catch (err) {
        console.error('Delete lecturer error:', err);
        if (err.code === 'ER_ROW_IS_REFERENCED_2' || err.code === 'ER_ROW_IS_REFERENCED') {
            return res.status(400).json({ error: 'Cannot delete lecturer: They have classes scheduled in the timetable. Delete the timetable entries first.' });
        }
        return res.status(500).json({ error: 'Internal server error deleting lecturer' });
    }
}

// --- UNITS ---
async function listUnits(req, res) {
    try {
        const query = `
            SELECT u.*, c.name AS course_name, s.name AS school_name, c.school_id 
            FROM units u
            JOIN courses c ON u.course_id = c.id
            JOIN schools s ON c.school_id = s.id
            ORDER BY s.name ASC, c.name ASC, u.year ASC, u.semester ASC, u.name ASC
        `;
        const [rows] = await db.query(query);
        return res.json(rows);
    } catch (err) {
        console.error('List units error:', err);
        return res.status(500).json({ error: 'Internal server error listing units' });
    }
}

async function createUnit(req, res) {
    const { course_id, code, name, year, semester } = req.body;
    if (!course_id || !code || !code.trim() || !name || !name.trim() || !year || !semester) {
        return res.status(400).json({ error: 'Course, code, name, year, and semester are required' });
    }

    const unitYear = parseInt(year, 10);
    const unitSemester = parseInt(semester, 10);

    if (isNaN(unitYear) || unitYear < 1 || unitYear > 4) {
        return res.status(400).json({ error: 'Year must be an integer between 1 and 4' });
    }
    if (isNaN(unitSemester) || unitSemester < 1 || unitSemester > 2) {
        return res.status(400).json({ error: 'Semester must be 1 or 2' });
    }

    try {
        // Verify course exists
        const [course] = await db.query('SELECT * FROM courses WHERE id = ?', [course_id]);
        if (course.length === 0) return res.status(400).json({ error: 'Selected course does not exist' });

        // Check duplicate code
        const [existing] = await db.query('SELECT * FROM units WHERE code = ?', [code.trim()]);
        if (existing.length > 0) {
            return res.status(400).json({ error: `Unit code '${code.trim()}' already exists` });
        }

        const [result] = await db.query(
            'INSERT INTO units (course_id, code, name, year, semester) VALUES (?, ?, ?, ?, ?)',
            [course_id, code.trim(), name.trim(), unitYear, unitSemester]
        );
        return res.json({
            id: result.insertId,
            course_id,
            code: code.trim(),
            name: name.trim(),
            year: unitYear,
            semester: unitSemester
        });
    } catch (err) {
        console.error('Create unit error:', err);
        return res.status(500).json({ error: 'Internal server error creating unit' });
    }
}

async function updateUnit(req, res) {
    const id = parseInt(req.params.id, 10);
    const { course_id, code, name, year, semester } = req.body;

    if (isNaN(id)) return res.status(400).json({ error: 'Invalid unit ID' });
    if (!course_id || !code || !code.trim() || !name || !name.trim() || !year || !semester) {
        return res.status(400).json({ error: 'Course, code, name, year, and semester are required' });
    }

    const unitYear = parseInt(year, 10);
    const unitSemester = parseInt(semester, 10);

    if (isNaN(unitYear) || unitYear < 1 || unitYear > 4) {
        return res.status(400).json({ error: 'Year must be an integer between 1 and 4' });
    }
    if (isNaN(unitSemester) || unitSemester < 1 || unitSemester > 2) {
        return res.status(400).json({ error: 'Semester must be 1 or 2' });
    }

    try {
        const [course] = await db.query('SELECT * FROM courses WHERE id = ?', [course_id]);
        if (course.length === 0) return res.status(400).json({ error: 'Selected course does not exist' });

        // Check duplicate code excluding current ID
        const [existing] = await db.query('SELECT * FROM units WHERE code = ? AND id != ?', [code.trim(), id]);
        if (existing.length > 0) {
            return res.status(400).json({ error: `Unit code '${code.trim()}' already exists` });
        }

        const [result] = await db.query(
            'UPDATE units SET course_id = ?, code = ?, name = ?, year = ?, semester = ? WHERE id = ?',
            [course_id, code.trim(), name.trim(), unitYear, unitSemester, id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Unit not found' });

        return res.json({
            id,
            course_id,
            code: code.trim(),
            name: name.trim(),
            year: unitYear,
            semester: unitSemester
        });
    } catch (err) {
        console.error('Update unit error:', err);
        return res.status(500).json({ error: 'Internal server error updating unit' });
    }
}

async function deleteUnit(req, res) {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid unit ID' });

    try {
        const [result] = await db.query('DELETE FROM units WHERE id = ?', [id]);
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Unit not found' });
        return res.json({ success: true, message: 'Unit deleted successfully' });
    } catch (err) {
        console.error('Delete unit error:', err);
        if (err.code === 'ER_ROW_IS_REFERENCED_2' || err.code === 'ER_ROW_IS_REFERENCED') {
            return res.status(400).json({ error: 'Cannot delete unit: It is referenced by classes in the timetable. Delete the timetable entries first.' });
        }
        return res.status(500).json({ error: 'Internal server error deleting unit' });
    }
}

module.exports = {
    listSchools,
    createSchool,
    updateSchool,
    deleteSchool,
    listCourses,
    createCourse,
    updateCourse,
    deleteCourse,
    listGroups,
    createGroup,
    updateGroup,
    deleteGroup,
    listLecturers,
    createLecturer,
    updateLecturer,
    deleteLecturer,
    listUnits,
    createUnit,
    updateUnit,
    deleteUnit
};
