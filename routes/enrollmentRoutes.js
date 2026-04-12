const express = require("express");
const router = express.Router();

const {
  createEnrollment,
  getEnrollments,
  getEnrollmentById,
  updateEnrollmentStatus,
  updatePaymentStatus,
  generateCertificate,
  verifyCertificate
} = require("../controllers/enrollmentController");

// GET all enrollments (admin) or ?student_id=&status= filter
router.get("/", getEnrollments);

// GET single enrollment by ID — used by course player  ← NEW
router.get("/:id", getEnrollmentById);

// CREATE enrollment
router.post("/", createEnrollment);

// APPROVE / REJECT enrollment (admin)
router.patch("/:id/status", updateEnrollmentStatus);

// UPDATE payment status (backward compat)
router.patch("/:id/payment", updatePaymentStatus);

// GENERATE certificate
router.patch("/:id/certificate", generateCertificate);

// VERIFY certificate
router.get("/verify/:certificateId", verifyCertificate);

module.exports = router;