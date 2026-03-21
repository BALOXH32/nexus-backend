const express = require("express");
const router = express.Router();

const {
  createEnrollment,
  getEnrollments,
  updatePaymentStatus,
  generateCertificate,
  verifyCertificate
} = require("../controllers/enrollmentController");

router.post("/", createEnrollment);
router.get("/", getEnrollments);

// UPDATE PAYMENT STATUS
router.patch("/:id/payment", updatePaymentStatus);

// GENERATE CERTIFICATE
router.patch("/:id/certificate", generateCertificate);

// VERIFY CERTIFICATE
router.get("/verify/:certificateId", verifyCertificate);

module.exports = router;