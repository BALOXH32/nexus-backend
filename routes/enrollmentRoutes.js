const express = require("express");
const router = express.Router();

const {
  createEnrollment,
  getEnrollments,
  updateEnrollmentStatus,
  updatePaymentStatus,
  generateCertificate,
  verifyCertificate
} = require("../controllers/enrollmentController");

// GET all enrollments (admin) OR filtered by ?student_id=xxx&status=approved (student dashboard)
router.get("/", getEnrollments);

// CREATE enrollment
router.post("/", createEnrollment);

// APPROVE or REJECT enrollment (admin)
// PATCH /api/enrollments/:id/status  body: { status: "approved" | "rejected", admin_notes: "..." }
router.patch("/:id/status", updateEnrollmentStatus);

// UPDATE payment status (kept for backward compatibility)
router.patch("/:id/payment", updatePaymentStatus);

// GENERATE certificate
router.patch("/:id/certificate", generateCertificate);

// VERIFY certificate
router.get("/verify/:certificateId", verifyCertificate);

module.exports = router;