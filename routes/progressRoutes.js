const express = require('express');
const router = express.Router();
const progressController = require('../controllers/progressController');

// Get progress
router.get('/students/:studentId/courses/:courseId', progressController.getCourseProgress);

// Save progress
router.post('/save', progressController.saveProgress);

// Mark complete
router.post('/complete', progressController.markComplete);

module.exports = router;
