const db = require('../config/db');

// --- BUILDINGS ---

// List all buildings
async function listBuildings(req, res) {
    try {
        const [rows] = await db.query('SELECT * FROM buildings ORDER BY name ASC');
        return res.json(rows);
    } catch (err) {
        console.error('List buildings error:', err);
        return res.status(500).json({ error: 'Internal server error listing buildings' });
    }
}

// Create building
async function createBuilding(req, res) {
    const { name } = req.body;
    if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Building name is required' });
    }

    try {
        const [existing] = await db.query('SELECT * FROM buildings WHERE name = ?', [name.trim()]);
        if (existing.length > 0) {
            return res.status(400).json({ error: 'Building name already exists' });
        }

        const [result] = await db.query('INSERT INTO buildings (name) VALUES (?)', [name.trim()]);
        return res.json({ id: result.insertId, name: name.trim() });
    } catch (err) {
        console.error('Create building error:', err);
        return res.status(500).json({ error: 'Internal server error creating building' });
    }
}

// Update building
async function updateBuilding(req, res) {
    const id = parseInt(req.params.id, 10);
    const { name } = req.body;

    if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid building ID' });
    }
    if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Building name is required' });
    }

    try {
        // Check uniqueness excluding current ID
        const [existing] = await db.query('SELECT * FROM buildings WHERE name = ? AND id != ?', [name.trim(), id]);
        if (existing.length > 0) {
            return res.status(400).json({ error: 'Building name already exists' });
        }

        const [result] = await db.query('UPDATE buildings SET name = ? WHERE id = ?', [name.trim(), id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Building not found' });
        }

        return res.json({ id, name: name.trim() });
    } catch (err) {
        console.error('Update building error:', err);
        return res.status(500).json({ error: 'Internal server error updating building' });
    }
}

// Delete building (ON DELETE RESTRICT enforced)
async function deleteBuilding(req, res) {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid building ID' });
    }

    try {
        const [result] = await db.query('DELETE FROM buildings WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Building not found' });
        }
        return res.json({ success: true, message: 'Building deleted successfully' });
    } catch (err) {
        console.error('Delete building error:', err);
        if (err.code === 'ER_ROW_IS_REFERENCED_2' || err.code === 'ER_ROW_IS_REFERENCED') {
            return res.status(400).json({ error: 'Cannot delete building: It contains rooms. Delete the rooms first.' });
        }
        return res.status(500).json({ error: 'Internal server error deleting building' });
    }
}

// --- CLASSROOMS ---

// List all classrooms
async function listClassrooms(req, res) {
    try {
        const query = `
            SELECT c.*, b.name AS building_name 
            FROM classrooms c
            JOIN buildings b ON c.building_id = b.id
            ORDER BY b.name ASC, c.name ASC
        `;
        const [rows] = await db.query(query);
        return res.json(rows);
    } catch (err) {
        console.error('List classrooms error:', err);
        return res.status(500).json({ error: 'Internal server error listing classrooms' });
    }
}

// Create classroom
async function createClassroom(req, res) {
    const { building_id, name, capacity, room_type } = req.body;

    if (!building_id || !name || !name.trim() || !capacity || !room_type) {
        return res.status(400).json({ error: 'All fields (building_id, name, capacity, room_type) are required' });
    }

    const roomCapacity = parseInt(capacity, 10);
    if (isNaN(roomCapacity) || roomCapacity <= 0) {
        return res.status(400).json({ error: 'Capacity must be a positive integer' });
    }

    try {
        // Verify building exists
        const [building] = await db.query('SELECT * FROM buildings WHERE id = ?', [building_id]);
        if (building.length === 0) {
            return res.status(400).json({ error: 'Selected building does not exist' });
        }

        // Check duplicate name inside the same building
        const [existing] = await db.query('SELECT * FROM classrooms WHERE name = ? AND building_id = ?', [name.trim(), building_id]);
        if (existing.length > 0) {
            return res.status(400).json({ error: 'A classroom with this name already exists in this building' });
        }

        const [result] = await db.query(
            'INSERT INTO classrooms (building_id, name, capacity, room_type) VALUES (?, ?, ?, ?)',
            [building_id, name.trim(), roomCapacity, room_type.trim()]
        );

        return res.json({
            id: result.insertId,
            building_id,
            name: name.trim(),
            capacity: roomCapacity,
            room_type: room_type.trim()
        });
    } catch (err) {
        console.error('Create classroom error:', err);
        return res.status(500).json({ error: 'Internal server error creating classroom' });
    }
}

// Update classroom
async function updateClassroom(req, res) {
    const id = parseInt(req.params.id, 10);
    const { building_id, name, capacity, room_type } = req.body;

    if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid classroom ID' });
    }
    if (!building_id || !name || !name.trim() || !capacity || !room_type) {
        return res.status(400).json({ error: 'All fields (building_id, name, capacity, room_type) are required' });
    }

    const roomCapacity = parseInt(capacity, 10);
    if (isNaN(roomCapacity) || roomCapacity <= 0) {
        return res.status(400).json({ error: 'Capacity must be a positive integer' });
    }

    try {
        // Verify building exists
        const [building] = await db.query('SELECT * FROM buildings WHERE id = ?', [building_id]);
        if (building.length === 0) {
            return res.status(400).json({ error: 'Selected building does not exist' });
        }

        // Check duplicate name in building excluding current ID
        const [existing] = await db.query('SELECT * FROM classrooms WHERE name = ? AND building_id = ? AND id != ?', [name.trim(), building_id, id]);
        if (existing.length > 0) {
            return res.status(400).json({ error: 'A classroom with this name already exists in this building' });
        }

        const [result] = await db.query(
            'UPDATE classrooms SET building_id = ?, name = ?, capacity = ?, room_type = ? WHERE id = ?',
            [building_id, name.trim(), roomCapacity, room_type.trim(), id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Classroom not found' });
        }

        return res.json({
            id,
            building_id,
            name: name.trim(),
            capacity: roomCapacity,
            room_type: room_type.trim()
        });
    } catch (err) {
        console.error('Update classroom error:', err);
        return res.status(500).json({ error: 'Internal server error updating classroom' });
    }
}

// Delete classroom
async function deleteClassroom(req, res) {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid classroom ID' });
    }

    try {
        const [result] = await db.query('DELETE FROM classrooms WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Classroom not found' });
        }
        return res.json({ success: true, message: 'Classroom deleted successfully' });
    } catch (err) {
        console.error('Delete classroom error:', err);
        if (err.code === 'ER_ROW_IS_REFERENCED_2' || err.code === 'ER_ROW_IS_REFERENCED') {
            return res.status(400).json({ error: 'Cannot delete classroom: It has scheduled classes. Delete the timetables first.' });
        }
        return res.status(500).json({ error: 'Internal server error deleting classroom' });
    }
}

module.exports = {
    listBuildings,
    createBuilding,
    updateBuilding,
    deleteBuilding,
    listClassrooms,
    createClassroom,
    updateClassroom,
    deleteClassroom
};
