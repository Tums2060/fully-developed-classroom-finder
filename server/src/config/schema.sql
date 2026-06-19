CREATE DATABASE IF NOT EXISTS classroom_finder;
USE classroom_finder;

-- Drop existing tables if they exist to start fresh (in order of reverse dependency)
DROP TABLE IF EXISTS timetables;
DROP TABLE IF EXISTS units;
DROP TABLE IF EXISTS classrooms;
DROP TABLE IF EXISTS buildings;
DROP TABLE IF EXISTS lecturers;
DROP TABLE IF EXISTS student_groups;
DROP TABLE IF EXISTS courses;
DROP TABLE IF EXISTS schools;
DROP TABLE IF EXISTS administrators;

-- Administrators table
CREATE TABLE administrators (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    is_super_admin TINYINT(1) DEFAULT 0 NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Schools table
CREATE TABLE schools (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL UNIQUE
);

-- Courses table
CREATE TABLE courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    school_id INT NOT NULL,
    name VARCHAR(150) NOT NULL,
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE RESTRICT
);

-- Units table
CREATE TABLE units (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    year INT NOT NULL,
    semester INT NOT NULL,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE RESTRICT
);

-- Student Groups table
CREATE TABLE student_groups (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    name VARCHAR(50) NOT NULL,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE RESTRICT
);

-- Lecturers table
CREATE TABLE lecturers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE
);

-- Buildings table
CREATE TABLE buildings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);

-- Classrooms table
CREATE TABLE classrooms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    building_id INT NOT NULL,
    name VARCHAR(50) NOT NULL,
    capacity INT NOT NULL,
    room_type VARCHAR(50) NOT NULL,
    FOREIGN KEY (building_id) REFERENCES buildings(id) ON DELETE RESTRICT
);

-- Timetables table
CREATE TABLE timetables (
    id INT AUTO_INCREMENT PRIMARY KEY,
    admin_id INT NOT NULL,
    classroom_id INT NOT NULL,
    group_id INT NOT NULL,
    lecturer_id INT NOT NULL,
    course_id INT NOT NULL,
    unit_id INT NOT NULL,
    day_of_week VARCHAR(15) NOT NULL, -- e.g., 'Monday', 'Tuesday'
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    FOREIGN KEY (admin_id) REFERENCES administrators(id) ON DELETE RESTRICT,
    FOREIGN KEY (classroom_id) REFERENCES classrooms(id) ON DELETE RESTRICT,
    FOREIGN KEY (group_id) REFERENCES student_groups(id) ON DELETE RESTRICT,
    FOREIGN KEY (lecturer_id) REFERENCES lecturers(id) ON DELETE RESTRICT,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE RESTRICT,
    FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE RESTRICT
);

-- Performance and Conflict checking indexes
CREATE INDEX idx_timetable_lookup ON timetables(day_of_week, start_time, end_time, classroom_id);
CREATE INDEX idx_timetable_group ON timetables(day_of_week, start_time, end_time, group_id);
CREATE INDEX idx_timetable_lecturer ON timetables(day_of_week, start_time, end_time, lecturer_id);