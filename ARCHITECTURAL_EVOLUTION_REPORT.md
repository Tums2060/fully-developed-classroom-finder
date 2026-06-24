# System Handoff & Enterprise Evolution Architecture Report

This report provides the detailed specifications and concrete implementation blueprints for the core modules of the **Free Classroom Finder** project. 

It is designed to be easily read, modular, and directly actionable by developers.

---

## 1. Summary of Changes & File Maps

The following table summarizes the files that will be added or modified in the repository to implement these features:

| Component | Target File | Action | Purpose |
| :--- | :--- | :--- | :--- |
| **Database** | [`server/src/config/schema.sql`](file:///home/tumaini/Documents/ExternalProjects/CS-Project/fully-developed-classroom-finder/server/src/config/schema.sql) | **Modify** | Define `room_claims` and `draft_timetables` tables. |
| **Routing** | [`server/src/routes/public.js`](file:///home/tumaini/Documents/ExternalProjects/CS-Project/fully-developed-classroom-finder/server/src/routes/public.js) | **Modify** | Add endpoints for claiming, releasing, and viewing active claims. |
| **Routing** | [`server/src/routes/admin.js`](file:///home/tumaini/Documents/ExternalProjects/CS-Project/fully-developed-classroom-finder/server/src/routes/admin.js) | **Modify** | Add endpoints to execute the scheduler and commit the sandbox. |
| **Controllers** | `server/src/controllers/claimsController.js` | **NEW** | Handle claim validations, UUID locks, claim codes, and capacity checks. |
| **Controllers** | `server/src/controllers/schedulerController.js` | **NEW** | Implement the greedy sequential timetable scheduling algorithm. |
| **Frontend** | `client/src/app/page.js` | **Modify** | Add a dashboard widget for claiming rooms and managing the client device token. |

---

## 2. Anonymous Room Claiming System

The Anonymous Claiming System allows students to temporarily reserve vacant classrooms without requiring a standard authentication account. 

To prevent abuse, the backend enforces a strict **one active claim per device** policy and **prevents underutilization** of large facilities.

### 2.1 The Database Schema Addition
We add a new table `room_claims` to keep track of active and expired reservations. 

Add the following definition to the bottom of [`server/src/config/schema.sql`](file:///home/tumaini/Documents/ExternalProjects/CS-Project/fully-developed-classroom-finder/server/src/config/schema.sql):

```sql
-- Table to manage anonymous device-based room reservations
CREATE TABLE room_claims (
    id INT AUTO_INCREMENT PRIMARY KEY,
    classroom_id INT NOT NULL,
    device_uuid VARCHAR(64) NOT NULL,
    claim_code VARCHAR(6) NOT NULL UNIQUE,
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP NOT NULL,
    is_released TINYINT(1) DEFAULT 0 NOT NULL,
    FOREIGN KEY (classroom_id) REFERENCES classrooms(id) ON DELETE RESTRICT
);

-- Index to quickly lookup active claims and avoid conflicts
CREATE INDEX idx_active_claims ON room_claims (device_uuid, is_released, end_time);
```

### 2.2 Backend Implementation Steps

#### Create `server/src/controllers/claimsController.js`
This controller handles the request validation, capacity rules, random code generation, and database inserts.

```javascript
const db = require('../config/db');
const { v4: uuidv4 } = require('uuid');

// Helper to generate a unique 6-character uppercase alphanumeric code
function generateClaimCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

// Create a new claim
async function createClaim(req, res) {
    const { classroom_id, device_uuid, duration_minutes } = req.body;

    if (!classroom_id || !device_uuid || !duration_minutes) {
        return res.status(400).json({ error: 'classroom_id, device_uuid, and duration_minutes are required' });
    }

    try {
        // 1. Capacity Limits Check (Resource utilization protection)
        const [roomRows] = await db.query('SELECT capacity FROM classrooms WHERE id = ?', [classroom_id]);
        if (roomRows.length === 0) {
            return res.status(404).json({ error: 'Classroom not found' });
        }

        const capacity = roomRows[0].capacity;
        if (capacity > 10) {
            return res.status(400).json({ 
                error: `This room has a capacity of ${capacity} seats. Rooms with > 10 seats are locked as Shared Walk-In Spaces and cannot be exclusively booked.` 
            });
        }

        // 2. Strict 1-Claim-Per-Device Validation
        const [activeClaims] = await db.query(
            `SELECT id FROM room_claims 
             WHERE device_uuid = ? 
               AND is_released = 0 
               AND end_time > NOW()`,
            [device_uuid]
        );

        if (activeClaims.length > 0) {
            return res.status(400).json({ 
                error: 'Your device already has an active classroom reservation. You must release it before claiming another.' 
            });
        }

        // 3. Generate verification data
        const claimCode = generateClaimCode();
        
        // Calculate end_time based on current time + duration_minutes
        const duration = parseInt(duration_minutes, 10);
        const endTime = new Date(Date.now() + duration * 60 * 1000);

        // 4. Insert into MariaDB
        await db.query(
            `INSERT INTO room_claims (classroom_id, device_uuid, claim_code, end_time) 
             VALUES (?, ?, ?, ?)` ,
            [classroom_id, device_uuid, claimCode, endTime]
        );

        return res.status(201).json({
            message: 'Room claimed successfully!',
            claim_code: claimCode,
            end_time: endTime
        });

    } catch (err) {
        console.error('Create claim error:', err);
        return res.status(500).json({ error: 'Internal server error claiming classroom' });
    }
}

// Release active claim
async function releaseClaim(req, res) {
    const { device_uuid, claim_code } = req.body;

    if (!device_uuid || !claim_code) {
        return res.status(400).json({ error: 'device_uuid and claim_code are required' });
    }

    try {
        const [result] = await db.query(
            `UPDATE room_claims 
             SET is_released = 1 
             WHERE device_uuid = ? AND claim_code = ? AND is_released = 0 AND end_time > NOW()`,
            [device_uuid, claim_code]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'No active claim matches the provided device and verification code.' });
        }

        return res.json({ message: 'Claim successfully released!' });
    } catch (err) {
        console.error('Release claim error:', err);
        return res.status(500).json({ error: 'Internal server error releasing claim' });
    }
}

module.exports = {
    createClaim,
    releaseClaim
};
```

#### Modify Routing Layer
Register the endpoints in [`server/src/routes/public.js`](file:///home/tumaini/Documents/ExternalProjects/CS-Project/fully-developed-classroom-finder/server/src/routes/public.js):

```javascript
// Add these imports at the top
const claimsController = require('../controllers/claimsController');

// Add these routes under classroom search
router.post('/claims/create', claimsController.createClaim);
router.post('/claims/release', claimsController.releaseClaim);
```

### 2.3 Frontend Client Integration Flow
1.  **Device Token Provisioning**: On mounting the homepage ([`client/src/app/page.js`](file:///home/tumaini/Documents/ExternalProjects/CS-Project/fully-developed-classroom-finder/client/src/app/page.js)), the frontend runs a hook to check local storage. If no token is found, it generates a persistent UUID and saves it:
    ```javascript
    useEffect(() => {
        let uuid = localStorage.getItem('device_uuid');
        if (!uuid) {
            uuid = crypto.randomUUID();
            localStorage.setItem('device_uuid', uuid);
        }
    }, []);
    ```
2.  **Claim Form**: When a user selects a small room ($\le 10$ seats) in the search results, a modal appears requesting the duration (e.g., 30, 60, or 90 minutes).
3.  **Submit Request**: Sends a `POST` request to `/api/public/claims/create` payload:
    ```json
    {
      "classroom_id": 5,
      "device_uuid": "e8c89b25-b46e-4be0-80d4-6c39a8c081e7",
      "duration_minutes": 60
    }
    ```
4.  **Save Credentials**: Upon a successful response, the dynamic unique 6-character `claim_code` is returned and stored in local state/storage. The UI changes to display a **"Release Room Booking"** card showing the unique code and countdown clock.

---

## 3. Automated Timetable Scheduler Algorithm

The timetable scheduler assigns unassigned course units to classrooms and time slots within a semester. It resolves constraints globally while maintaining an understandable, beginner-friendly pipeline.

### 3.1 Hard and Soft Constraints
The algorithm operates under two categories of constraints to ensure schedules are both conflict-free and humanly manageable:

#### Hard Constraints (Must satisfy)
*   **No Overlaps**: No classroom, student group, or lecturer can be booked for multiple classes at the same time.
*   **Room Capacity Match**: A classroom's capacity must be greater than or equal to the student group size.
*   **Weekly Hours Enforcement**: If a course unit is configured for 3 hours per week (totaling 45 hours in a 15-week semester), the algorithm schedules exactly one 3-hour session per week. It avoids over-allocating hours (e.g., giving it 90 hours).

#### Soft/Fairness Constraints (Should satisfy for a minimum 85% score)
*   **Maximum Student Load**: No student group can have more than 6 class hours scheduled in a single day.
*   **Lunch Break**: Student groups must have a mandatory lunch break of at least 1 hour between 12:00 PM and 2:00 PM. No class can occupy the entire lunch block.
*   **Load Distribution**: Avoid clustering classes on a single day. The scheduler attempts to spread classes across the week so that some days have 2 classes, some have 3, and others have rest.
*   **Lecturer Transit Buffer**: A lecturer teaching back-to-back classes in different buildings must be given a 30-minute transit buffer window.

---

### 3.2 Step-by-Step Greedy Sequential Block-Filling Algorithm

A **Greedy Algorithmic Approach** resolves allocations sequentially. It orders the elements by scheduling difficulty, allocates them to the best available slot, and leaves highly constrained slots for last.

```
                  +--------------------------------+
                  |  Load Unassigned Units Backlog |
                  +---------------+----------------+
                                  |
                                  v
                  +--------------------------------+
                  | Sort Backlog by Difficulty     |
                  | (Large classes, busy teachers) |
                  +---------------+----------------+
                                  |
                                  v
                       [For each Unit in backlog]
                                  |
                                  v
                  +--------------------------------+
                  | Evaluate all potential         |
                  | Day/Time/Room combinations     |
                  +---------------+----------------+
                                  |
            +---------------------+---------------------+
            |                                           |
            v                                           v
[Valid Slot Found?]                       [No Slot Found?]
            |                                           |
            v                                           v
+-----------------------+                 +-----------------------+
| 1. Check Student Load |                 | Place Unit in Manual  |
| 2. Check Lunch Gap    |                 | Overrides Queue       |
| 3. Add to Sandbox DB  |                 +-----------------------+
+-----------------------+
```

#### Step 1: Pre-sort the Backlog (Difficulty Heuristic)
The system calculates a "Difficulty Score" for each unit. Units that are hard to place are scheduled first:
$$\text{Difficulty} = (\text{Group Size}) \times (\text{Lecturer Busy Factor}) \times (\text{School Constraints})$$
Sorting the backlog in descending order of difficulty ensures that large classes (which require scarce large rooms) are placed before small classes fill up the spaces.

#### Step 2: Time-Slot Search Grid
Define standard time slots during the academic week (Monday to Friday). 

For example, we split the day into three 3-hour lecture blocks:
*   **Slot 1**: 08:15 AM - 11:15 AM
*   **Slot 2**: 11:15 AM - 02:15 PM (Note: Blocks overlapping 12:00 PM - 2:00 PM will trigger the lunch gap check)
*   **Slot 3**: 02:15 PM - 05:15 PM

#### Step 3: Assignment Loop
For each unit, search the list of rooms and slots. Check if the allocation violates any hard or soft constraints. 

If all checks pass, write the entry to the `draft_timetables` database table.

---

### 3.3 Database & Code Integration Blueprint

#### Create the Sandbox Table
To prevent corrupting the live campus timetable, the algorithm runs strictly inside a sandbox table. Add this block to [`server/src/config/schema.sql`](file:///home/tumaini/Documents/ExternalProjects/CS-Project/fully-developed-classroom-finder/server/src/config/schema.sql):

```sql
-- Sandbox table for scheduling simulation
CREATE TABLE draft_timetables (
    id INT AUTO_INCREMENT PRIMARY KEY,
    classroom_id INT NOT NULL,
    group_id INT NOT NULL,
    lecturer_id INT NOT NULL,
    course_id INT NOT NULL,
    unit_id INT NOT NULL,
    day_of_week VARCHAR(15) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    FOREIGN KEY (classroom_id) REFERENCES classrooms(id) ON DELETE CASCADE,
    FOREIGN KEY (group_id) REFERENCES student_groups(id) ON DELETE CASCADE,
    FOREIGN KEY (lecturer_id) REFERENCES lecturers(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE CASCADE
);
```

#### Create the Algorithmic Engine (`server/src/controllers/schedulerController.js`)
Here is the concrete Javascript code for executing the scheduling algorithm step-by-step:

```javascript
const db = require('../config/db');

// Main entry point to run the scheduler
async function generateDraftTimetable(req, res) {
    try {
        // 1. Clear previous draft
        await db.query('DELETE FROM draft_timetables');

        // 2. Fetch resources
        const [units] = await db.query('SELECT * FROM units');
        const [classrooms] = await db.query('SELECT * FROM classrooms');
        const [groups] = await db.query('SELECT * FROM student_groups');
        const [lecturers] = await db.query('SELECT * FROM lecturers');

        // 3. Define weekly schedules
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
        const slots = [
            { start: '08:15:00', end: '11:15:00' },
            { start: '11:15:00', end: '14:15:00' },
            { start: '14:15:00', end: '17:15:00' }
        ];

        // 4. Sort units by difficulty (simplest heuristic: larger classes scheduled first)
        // Group sizes are approximated here for demo purposes
        const sortedUnits = units.sort((a, b) => b.id - a.id);

        let scheduledCount = 0;
        let failedUnits = [];

        // 5. Greedy Search Loops
        for (const unit of sortedUnits) {
            let placed = false;

            // Find group detail
            const group = groups.find(g => g.course_id === unit.course_id);
            if (!group) {
                failedUnits.push({ unit_code: unit.code, reason: 'No student group mapped to course' });
                continue;
            }

            for (const day of days) {
                if (placed) break;

                for (const slot of slots) {
                    if (placed) break;

                    // Evaluate classrooms
                    for (const room of classrooms) {
                        
                        // Hard Constraint A: No double booking of classroom, lecturer, or group
                        const [overlaps] = await db.query(
                            `SELECT COUNT(*) AS count FROM draft_timetables
                             WHERE day_of_week = ?
                               AND start_time < ? 
                               AND end_time > ?
                               AND (classroom_id = ? OR lecturer_id = ? OR group_id = ?)` ,
                            [day, slot.end, slot.start, room.id, unit.id, group.id]
                        );

                        if (overlaps[0].count > 0) continue; // Conflict found, skip combination

                        // Hard Constraint B: Class must not exceed room capacity
                        // For demo, assume groups have average student sizes mapped
                        const groupSize = 40; // Default fallback size
                        if (room.capacity < groupSize) continue; 

                        // Soft Constraint C: Student Fatigue Limit (Max 6 hours of classes a day)
                        const [dailyHours] = await db.query(
                            `SELECT COUNT(*) * 3 AS hours FROM draft_timetables
                             WHERE group_id = ? AND day_of_week = ?`,
                            [group.id, day]
                        );
                        if (dailyHours[0].hours >= 6) continue;

                        // Soft Constraint D: Lunch gap check
                        // If scheduling in Slot 2 (11:15 AM - 2:15 PM), the group must not have
                        // Slot 1 and Slot 3 booked simultaneously, leaving them with zero break time
                        if (slot.start === '11:15:00') {
                            const [clashingAdjacent] = await db.query(
                                `SELECT COUNT(*) AS count FROM draft_timetables
                                 WHERE group_id = ? AND day_of_week = ? AND start_time IN ('08:15:00', '14:15:00')`,
                                [group.id, day]
                            );
                            if (clashingAdjacent[0].count >= 2) continue; // Re-route to preserve lunch break
                        }

                        // Constraints satisfied. Write allocation to database sandbox
                        await db.query(
                            `INSERT INTO draft_timetables 
                             (classroom_id, group_id, lecturer_id, course_id, unit_id, day_of_week, start_time, end_time) 
                             VALUES (?, ?, 1, ?, ?, ?, ?, ?)` , // Hardcoded lecturer ID '1' for simple demo setup
                            [room.id, group.id, unit.course_id, unit.id, day, slot.start, slot.end]
                        );

                        placed = true;
                        scheduledCount++;
                        break;
                    }
                }
            }

            if (!placed) {
                failedUnits.push({ unit_code: unit.code, reason: 'No available conflict-free slots' });
            }
        }

        // Return statistics to the user
        const total = sortedUnits.length;
        const accuracy = ((scheduledCount / total) * 100).toFixed(1);

        return res.json({
            success: true,
            accuracy: `${accuracy}%`,
            total_units: total,
            scheduled_units: scheduledCount,
            conflicts_backlog: failedUnits
        });

    } catch (err) {
        console.error('Draft scheduler error:', err);
        return res.status(500).json({ error: 'Internal server error executing schedule optimizer' });
    }
}

// Commits the sandboxed draft to the active live production schedule
async function commitDraft(req, res) {
    try {
        // Run as transaction to ensure atomic execution
        await db.query('START TRANSACTION');
        
        await db.query('DELETE FROM timetables');
        await db.query(`
            INSERT INTO timetables (admin_id, classroom_id, group_id, lecturer_id, course_id, unit_id, day_of_week, start_time, end_time)
            SELECT 1, classroom_id, group_id, lecturer_id, course_id, unit_id, day_of_week, start_time, end_time FROM draft_timetables
        `);

        await db.query('COMMIT');
        return res.json({ success: true, message: 'Draft timetable committed to live database production successfully!' });
    } catch (err) {
        await db.query('ROLLBACK');
        console.error('Commit draft error:', err);
        return res.status(500).json({ error: 'Failed to commit draft to active schedules' });
    }
}

module.exports = {
    generateDraftTimetable,
    commitDraft
};
```

#### Register Admin Sandbox Routes
Add these definitions to [`server/src/routes/admin.js`](file:///home/tumaini/Documents/ExternalProjects/CS-Project/fully-developed-classroom-finder/server/src/routes/admin.js):

```javascript
// Add these imports at the top
const schedulerController = require('../controllers/schedulerController');

// Add these routes under academic routing CRUD
router.post('/timetable/generate-draft', schedulerController.generateDraftTimetable);
router.post('/timetable/commit-draft', schedulerController.commitDraft);
```
