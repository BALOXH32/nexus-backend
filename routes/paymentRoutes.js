const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

// Upload payment
router.post('/upload', paymentController.uploadPayment);

// Get pending payments (admin)
router.get('/pending', paymentController.getPendingPayments);

// Approve/reject payment (admin)
router.post('/:paymentId/approve', paymentController.approvePayment);
router.post('/:paymentId/reject', paymentController.rejectPayment);

// Get student payments
router.get('/students/:studentId', paymentController.getStudentPayments);

module.exports = router;
