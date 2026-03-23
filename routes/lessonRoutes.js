const express = require('express');
const router = express.Router();
const lessonController = require('../controllers/lessonController');

// Get lesson details
router.get('/:lessonId', lessonController.getLesson);

// Lesson management (admin only)
router.post('/modules/:moduleId/lessons', lessonController.addLesson);
router.put('/:lessonId', lessonController.updateLesson);
router.delete('/:lessonId', lessonController.deleteLesson);

module.exports = router;
