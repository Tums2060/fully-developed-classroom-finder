CREATE DATABASE IF NOT EXISTS classroom_finder;
USE classroom_finder;

CREATE TABLE administrators (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE schools (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL UNIQUE
);

CREATE TABLE courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    school_id INT NOT NULL,
    name VARCHAR(150) NOT NULL,
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE RESTRICT
);

CREATE TABLE student_groups (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    name VARCHAR(50) NOT NULL,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE RESTRICT
);

CREATE TABLE buildings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE classrooms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    building_id INT NOT NULL,
    name VARCHAR(50) NOT NULL,
    capacity INT NOT NULL,
    room_type VARCHAR(50) NOT NULL, -- e.g., 'lecture hall', 'lab'
    floor_number INT,
    accessibility_info VARCHAR(255),
    FOREIGN KEY (building_id) REFERENCES buildings(id) ON DELETE RESTRICT
);

CREATE TABLE timetables (
    id INT AUTO_INCREMENT PRIMARY KEY,
    school_id INT NOT NULL,
    course_id INT NOT NULL,
    group_id INT NOT NULL,
    unit_name VARCHAR(100) NOT NULL,
    lecturer_name VARCHAR(100) NOT NULL,
    building_id INT NOT NULL,
    classroom_id INT NOT NULL,
    day_of_week VARCHAR(15) NOT NULL, -- e.g., 'Monday'
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    semester VARCHAR(50) NOT NULL,
    academic_year VARCHAR(50) NOT NULL,
    admin_id INT NOT NULL,
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE RESTRICT,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE RESTRICT,
    FOREIGN KEY (group_id) REFERENCES student_groups(id) ON DELETE RESTRICT,
    FOREIGN KEY (building_id) REFERENCES buildings(id) ON DELETE RESTRICT,
    FOREIGN KEY (classroom_id) REFERENCES classrooms(id) ON DELETE RESTRICT,
    FOREIGN KEY (admin_id) REFERENCES administrators(id) ON DELETE RESTRICT
);

-- Crucial Indexes for Performance and Conflict Checks
CREATE INDEX idx_search_avail ON timetables(day_of_week, start_time, end_time, classroom_id);
CREATE INDEX idx_conflict_group ON timetables(day_of_week, start_time, end_time, group_id);
CREATE INDEX idx_conflict_lecturer ON timetables(day_of_week, start_time, end_time, lecturer_name);