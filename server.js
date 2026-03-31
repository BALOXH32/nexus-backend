console.log("🔥 SERVER STARTING 🔥");

const express = require("express");
const cors = require("cors");
require("dotenv").config();

const enrollmentRoutes = require('./routes/enrollmentRoutes');
const authRoutes = require("./routes/authRoutes");
const courseRoutes = require("./routes/courseRoutes");
const studentRoutes = require('./routes/studentRoutes');
const adminRoutes = require("./routes/adminRoutes");
const paymentRoutes = require('./routes/paymentRoutes');
const courseContentRoutes = require('./routes/courseContentRoutes');
const lessonRoutes = require('./routes/lessonRoutes');
const accessRoutes = require('./routes/accessRoutes');
const contactRoutes = require('./routes/contactRoutes');
const progressRoutes = require('./routes/progressRoutes');

const app = express();

// ── Middleware ───────────────────────────────────────────────
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Routes ───────────────────────────────────────────────────
app.use('/api/enrollments', enrollmentRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/courses", courseRoutes);
app.use('/api/students', studentRoutes);
app.use("/api/admin", adminRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/course-content', courseContentRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/access', accessRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/progress', progressRoutes);
// ── Root ─────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({
    message: "Nexus Skill Academy Backend 🚀",
    status: "OK",
    timestamp: new Date().toISOString(),
    endpoints: [
      "POST /api/auth/student/signup",
      "POST /api/auth/student/login",
      "POST /api/auth/admin/login",
      "GET  /api/courses",
      "POST /api/payments/submit",
      "GET  /api/admin/dashboard",
      "GET  /api/students",
      "GET  /api/enrollments"
    ]
  });
});

app.get("/health", (req, res) => {
  res.json({ status: "healthy", uptime: process.uptime() });
});

// ── Start ─────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
});