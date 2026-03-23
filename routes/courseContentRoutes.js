const express = require('express');
const router = express.Router();
const courseContentController = require('../controllers/courseContentController');

// Get course curriculum
router.get('/:courseId/curriculum', courseContentController.getCurriculum);

// Module management (admin only)
router.post('/:courseId/modules', courseContentController.addModule);
router.put('/modules/:moduleId', courseContentController.updateModule);
router.delete('/modules/:moduleId', courseContentController.deleteModule);

module.exports = router;
