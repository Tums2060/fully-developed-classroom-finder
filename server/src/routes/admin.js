const express = require('express');
const router = express.Router();

// Middleware
const { authenticateToken, requireSuperAdmin } = require('../middleware/auth');

// Controllers
const campusController = require('../controllers/campusController');
const academicsController = require('../controllers/academicsController');
const timetableController = require('../controllers/timetableController');
const analyticsController = require('../controllers/analyticsController');
const settingsController = require('../controllers/settingsController');

// All routes in this router require authentication
router.use(authenticateToken);

// --- CAMPUS CRUD ---
router.get('/buildings', campusController.listBuildings);
router.post('/buildings', campusController.createBuilding);
router.put('/buildings/:id', campusController.updateBuilding);
router.delete('/buildings/:id', campusController.deleteBuilding);

router.get('/classrooms', campusController.listClassrooms);
router.post('/classrooms', campusController.createClassroom);
router.put('/classrooms/:id', campusController.updateClassroom);
router.delete('/classrooms/:id', campusController.deleteClassroom);

// --- ACADEMICS CRUD ---
router.get('/schools', academicsController.listSchools);
router.post('/schools', academicsController.createSchool);
router.put('/schools/:id', academicsController.updateSchool);
router.delete('/schools/:id', academicsController.deleteSchool);

router.get('/courses', academicsController.listCourses);
router.post('/courses', academicsController.createCourse);
router.put('/courses/:id', academicsController.updateCourse);
router.delete('/courses/:id', academicsController.deleteCourse);

router.get('/student-groups', academicsController.listGroups);
router.post('/student-groups', academicsController.createGroup);
router.put('/student-groups/:id', academicsController.updateGroup);
router.delete('/student-groups/:id', academicsController.deleteGroup);

router.get('/lecturers', academicsController.listLecturers);
router.post('/lecturers', academicsController.createLecturer);
router.put('/lecturers/:id', academicsController.updateLecturer);
router.delete('/lecturers/:id', academicsController.deleteLecturer);

// --- UNITS CRUD ---
router.get('/units', academicsController.listUnits);
router.post('/units', academicsController.createUnit);
router.put('/units/:id', academicsController.updateUnit);
router.delete('/units/:id', academicsController.deleteUnit);

// --- TIMETABLES CRUD & CONFLICTS ---
router.get('/timetables', timetableController.listTimetables);
router.post('/timetables', timetableController.createTimetable);
router.put('/timetables/:id', timetableController.updateTimetable);
router.delete('/timetables/:id', timetableController.deleteTimetable);
router.post('/timetables/check-conflicts', timetableController.verifyConflicts);

// --- ANALYTICS DASHBOARD ---
router.get('/analytics/stats', analyticsController.getStats);

// --- SUPER ADMIN SETTINGS (Additional requireSuperAdmin check) ---
router.get('/settings/admins', requireSuperAdmin, settingsController.listAdmins);
router.post('/settings/create-admin', requireSuperAdmin, settingsController.createAdmin);
router.delete('/settings/revoke-admin/:id', requireSuperAdmin, settingsController.revokeAdmin);

module.exports = router;
