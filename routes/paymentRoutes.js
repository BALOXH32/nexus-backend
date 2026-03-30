const express = require("express");
const router = express.Router();
const multer = require("multer");
const { submitPayment, getAllPayments, approvePayment } = require("../controllers/paymentController");

// Store file in memory so we can upload to Supabase Storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Only JPG, PNG, WEBP, and PDF files are allowed"));
  }
});

// Student submits payment screenshot
router.post("/submit", upload.single("screenshot"), submitPayment);

// Admin: get all payments
router.get("/", getAllPayments);

// Admin: approve or reject
router.put("/:id/approve", approvePayment);

module.exports = router;