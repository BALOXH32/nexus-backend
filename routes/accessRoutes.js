const express = require('express');
const router = express.Router();
const accessController = require('../controllers/accessController');

// Check access
router.get('/students/:studentId/courses/:courseId', accessController.checkAccess);

// Grant access (admin only)
router.post('/grant', accessController.grantAccess);

module.exports = router;
