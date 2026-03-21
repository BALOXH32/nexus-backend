const express = require("express");
const router = express.Router();

const {
  studentLogin,
  studentSignup,
  adminLogin,
  verifyToken
} = require("../controllers/authController");

// Test route
router.get("/", (req, res) => {
  res.json({
    message: "Auth API Working ✅"
  });
});

// STUDENT ROUTES
router.post("/student/login", studentLogin);
router.post("/student/signup", studentSignup);

// ADMIN ROUTES
router.post("/admin/login", adminLogin);

// VERIFY TOKEN
router.get("/verify", verifyToken, (req, res) => {
  res.json({
    message: "Token is valid",
    user: req.user
  });
});

module.exports = router;
