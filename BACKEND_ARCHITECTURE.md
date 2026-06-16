# BACKEND_ARCHITECTURE.md - Free Classroom Finder

This specification outlines the backend architecture, database schema, conflict validation queries, and REST API endpoints for the Node.js / Express backend.

---

## 1. N-Tier Architecture Layout

The backend is structured as an N-Tier architecture to decouple concerns and ensure clean, maintainable, and testable code:

```
[Client App]
    │ (HTTP / JSON)
    ▼
[Routing Layer] (src/routes/*)
    │
    ▼
[Middleware Layer] (src/middleware/*) ◄── (Authentication, Validation)
    │
    ▼
[Controllers Layer] (src/controllers/*) ◄── (Request handling, response formatting)
    │
    ▼
[Services Layer] (src/services/* or DB Helper functions) ◄── (Business rules, Transaction management)
    │
    ▼
[Data Access Layer] (src/config/db.js) ◄── (MySQL2 connection pool & execution)
    │
    ▼
[MariaDB/MySQL Database]
```

- **Routing Layer**: Maps HTTP methods and paths to controller actions.
- **Middleware**: Intercepts requests for authentication (JWT checking), error handling, or schema validations.
- **Controllers**: Validates input formatting, calls appropriate services/DB queries, and formats standard JSON responses.
- **Services/DB execution**: Runs queries, enforces constraint rules, and manages transactions.
- **DB Connection**: Reuses a single `mysql2/promise` connection pool.

---

## 2. Entity Relationship Diagram & Schema Mapping

The database schema is fully normalized. All tables use strict foreign key constraints with `ON DELETE RESTRICT` to preserve data integrity and prevent orphaned records.

```
       ┌───────────┐
       │  schools  │
       └─────┬─────┘
             │ 1
             │
             │ *
       ┌─────▼─────┐             ┌────────────────────┐
       │  courses  ├────────────►│   student_groups   │
       └─────┬─────┘ 1         * └─────────┬──────────┘
             │                             │
             │                             │ 1
             │ 1                           │
             │                             │ *
             │                       ┌─────▼──────┐
             └──────────────────────►│ timetables │
                                     └─────▲──────┘
                                           │ *
             ┌───────────┐                 │
             │ lecturers ├─────────────────┤
             └───────────┘ 1               │
                                           │
             ┌────────────┐                │
             │classrooms  ├────────────────┤
             └─────▲──────┘ 1              │
                   │                       │
                   │ *                     │
             ┌─────┴──────┐                │
             │ buildings  ├────────────────┤
             └────────────┘ 1              │
                                           │
             ┌───────────────┐             │
             │administrators ├─────────────┘
             └───────────────┘ 1
```

### 2.1 Table Schema Details

#### `administrators`
- `id` INT AUTO_INCREMENT PRIMARY KEY
- `username` VARCHAR(50) NOT NULL UNIQUE
- `password_hash` VARCHAR(255) NOT NULL
- `is_super_admin` TINYINT(1) DEFAULT 0 NOT NULL

#### `schools`
- `id` INT AUTO_INCREMENT PRIMARY KEY
- `name` VARCHAR(150) NOT NULL UNIQUE

#### `courses`
- `id` INT AUTO_INCREMENT PRIMARY KEY
- `school_id` INT NOT NULL
- `name` VARCHAR(150) NOT NULL
- FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON DELETE RESTRICT

#### `student_groups`
- `id` INT AUTO_INCREMENT PRIMARY KEY
- `course_id` INT NOT NULL
- `name` VARCHAR(50) NOT NULL
- FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON DELETE RESTRICT

#### `lecturers`
- `id` INT AUTO_INCREMENT PRIMARY KEY
- `name` VARCHAR(100) NOT NULL
- `email` VARCHAR(100) NOT NULL UNIQUE

#### `buildings`
- `id` INT AUTO_INCREMENT PRIMARY KEY
- `name` VARCHAR(100) NOT NULL UNIQUE

#### `classrooms`
- `id` INT AUTO_INCREMENT PRIMARY KEY
- `building_id` INT NOT NULL
- `name` VARCHAR(50) NOT NULL
- `capacity` INT NOT NULL
- `room_type` VARCHAR(50) NOT NULL
- FOREIGN KEY (`building_id`) REFERENCES `buildings`(`id`) ON DELETE RESTRICT

#### `timetables`
- `id` INT AUTO_INCREMENT PRIMARY KEY
- `admin_id` INT NOT NULL
- `classroom_id` INT NOT NULL
- `group_id` INT NOT NULL
- `lecturer_id` INT NOT NULL
- `course_id` INT NOT NULL
- `day_of_week` VARCHAR(15) NOT NULL (e.g. 'Monday', 'Tuesday', ...)
- `start_time` TIME NOT NULL
- `end_time` TIME NOT NULL
- `unit_name` VARCHAR(100) NOT NULL
- FOREIGN KEY (`admin_id`) REFERENCES `administrators`(`id`) ON DELETE RESTRICT
- FOREIGN KEY (`classroom_id`) REFERENCES `classrooms`(`id`) ON DELETE RESTRICT
- FOREIGN KEY (`group_id`) REFERENCES `student_groups`(`id`) ON DELETE RESTRICT
- FOREIGN KEY (`lecturer_id`) REFERENCES `lecturers`(`id`) ON DELETE RESTRICT
- FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON DELETE RESTRICT

---

## 3. Mathematical & Logical Queries

### 3.1 Availability Search Algorithm
A classroom is **Available** if it is not booked during the requested slot. A booking overlaps if the booking starts before the requested end time, AND the booking ends after the requested start time.

**SQL Query**:
```sql
SELECT c.id, c.name AS room_name, c.capacity, c.room_type, b.name AS building_name
FROM classrooms c
JOIN buildings b ON c.building_id = b.id
WHERE c.id NOT IN (
    SELECT classroom_id 
    FROM timetables
    WHERE day_of_week = ? 
      AND start_time < ? 
      AND end_time > ?
)
-- Optional Capacity Filter
AND (? IS NULL OR c.capacity >= ?)
-- Optional Room Type Filter
AND (? IS NULL OR c.room_type = ?);
```

### 3.2 Conflict Prevention Rules
Before a new entry is added or updated, the backend runs queries to verify that there are no overlapping schedules. A conflict exists if there is an existing booking matching the same day and overlapping time.

Overlapping time condition: `(existing_start_time < :new_end_time) AND (existing_end_time > :new_start_time)`.

#### Rule 1: Classroom already booked
```sql
SELECT COUNT(*) AS count FROM timetables
WHERE classroom_id = ? 
  AND day_of_week = ? 
  AND start_time < ? 
  AND end_time > ?
  -- If updating, exclude current ID
  AND (? IS NULL OR id != ?);
```

#### Rule 2: Student group busy
```sql
SELECT COUNT(*) AS count FROM timetables
WHERE group_id = ? 
  AND day_of_week = ? 
  AND start_time < ? 
  AND end_time > ?
  -- If updating, exclude current ID
  AND (? IS NULL OR id != ?);
```

#### Rule 3: Lecturer busy
```sql
SELECT COUNT(*) AS count FROM timetables
WHERE lecturer_id = ? 
  AND day_of_week = ? 
  AND start_time < ? 
  AND end_time > ?
  -- If updating, exclude current ID
  AND (? IS NULL OR id != ?);
```

#### Rule 4: Start time is greater than or equal to End time
- Validated in JavaScript: `new Date("1970-01-01T" + start_time) >= new Date("1970-01-01T" + end_time)` or lexical comparison of `TIME` string representation.

---

## 4. REST API Endpoint Catalog

All requests/responses are JSON-formatted. Admin endpoints require a valid JWT passed in the `Authorization: Bearer <token>` header.

### 4.1 Public Endpoints
- **GET** `/api/search/available`
  - *Query Params*: `day_of_week` (required), `start_time` (required), `end_time` (required), `capacity` (optional), `room_type` (optional)
  - *Response*: Array of available classrooms with building details.
- **GET** `/api/public/buildings`
  - *Response*: Array of buildings.
- **GET** `/api/public/room-types`
  - *Response*: Array of unique room types (string list).

### 4.2 Admin Authentication Endpoints
- **POST** `/api/admin/auth/login`
  - *Body*: `{ username, password }`
  - *Response*: `{ token, admin: { id, username, is_super_admin } }`
- **GET** `/api/admin/auth/verify`
  - *Headers*: `Authorization: Bearer <token>`
  - *Response*: `{ valid: true, admin: { id, username, is_super_admin } }`

### 4.3 Super Admin Settings Endpoints
- **POST** `/api/admin/settings/create-admin`
  - *Role Required*: Super Admin
  - *Body*: `{ username, password }`
  - *Response*: `{ success: true, message: "Admin created" }`
- **GET** `/api/admin/settings/admins`
  - *Role Required*: Super Admin
  - *Response*: Array of administrators `{ id, username, is_super_admin }`
- **DELETE** `/api/admin/settings/revoke-admin/:id`
  - *Role Required*: Super Admin
  - *Response*: `{ success: true, message: "Admin access revoked" }`
- **PUT** `/api/admin/settings/change-password`
  - *Role Required*: Admin/Super Admin
  - *Body*: `{ currentPassword, newPassword }`
  - *Response*: `{ success: true, message: "Password updated successfully" }`

### 4.4 Campus Infrastructure CRUD (Admin)
- **GET/POST** `/api/admin/buildings`
- **PUT/DELETE** `/api/admin/buildings/:id`
- **GET/POST** `/api/admin/classrooms`
- **PUT/DELETE** `/api/admin/classrooms/:id`

### 4.5 Academic Records CRUD (Admin)
- **GET/POST** `/api/admin/schools`
- **PUT/DELETE** `/api/admin/schools/:id`
- **GET/POST** `/api/admin/courses`
- **PUT/DELETE** `/api/admin/courses/:id`
- **GET/POST** `/api/admin/student-groups`
- **PUT/DELETE** `/api/admin/student-groups/:id`
- **GET/POST** `/api/admin/lecturers`
- **PUT/DELETE** `/api/admin/lecturers/:id`

### 4.6 Timetable Management & Overlaps (Admin)
- **GET/POST** `/api/admin/timetables`
  - *POST Body*: `{ classroom_id, group_id, lecturer_id, course_id, day_of_week, start_time, end_time, unit_name }`
- **PUT/DELETE** `/api/admin/timetables/:id`
- **POST** `/api/admin/timetables/check-conflicts`
  - *Body*: `{ id, classroom_id, group_id, lecturer_id, day_of_week, start_time, end_time }` (id is optional, used for updates)
  - *Response*: `{ hasConflict: boolean, conflicts: { roomConflict: boolean, groupConflict: boolean, lecturerConflict: boolean } }`

### 4.7 Analytics Dashboard (Admin)
- **GET** `/api/admin/analytics/stats`
  - *Response*:
    ```json
    {
      "totalBuildings": 5,
      "totalClassrooms": 20,
      "totalTimetables": 85,
      "totalLecturers": 12,
      "utilizationRate": 42.5,
      "mostBookedRooms": [
        { "room_name": "Lab 1", "building_name": "Science Block", "bookings": 24 }
      ],
      "busyHours": [
        { "hour": "10:00", "active_bookings": 15 }
      ],
      "utilizationByRoomType": [
        { "room_type": "lab", "rate": 55.2 }
      ]
    }
    ```
