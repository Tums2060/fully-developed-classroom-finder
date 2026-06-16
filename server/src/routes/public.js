const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchController');
const campusController = require('../controllers/campusController');

// Public Classroom availability search
router.get('/search/available', searchController.searchAvailable);

// Public buildings list (to populate dropdowns)
router.get('/buildings', campusController.listBuildings);

// Public room types list (to populate dropdowns)
router.get('/room-types', searchController.getRoomTypes);

module.exports = router;
