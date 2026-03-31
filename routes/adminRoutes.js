const express = require("express");
const router = express.Router();
const { getDashboardStats } = require("../controllers/adminController");
const { getAllPayments, approvePayment } = require("../controllers/paymentController");

// Dashboard stats
router.get("/dashboard", getDashboardStats);

// Payment routes
router.get("/payments", getAllPayments);
router.put("/payments/:id/approve", approvePayment);

module.exports = router;
