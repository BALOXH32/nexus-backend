console.log("🔥 SERVER STARTING 🔥");

const express = require("express");
const cors = require("cors");
require("dotenv").config();

const enrollmentRoutes = require('./routes/enrollmentRoutes');
const authRoutes = require("./routes/authRoutes");
const courseRoutes = require("./routes/courseRoutes");
const studentRoutes = require('./routes/studentRoutes');
const adminRoutes = require("./routes/adminRoutes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/enrollments', enrollmentRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/courses", courseRoutes);
app.use('/api/students', studentRoutes);
app.use("/api/admin", adminRoutes);

// Root route
app.get("/", (req, res) => {
  res.json({ 
    message: "Nexus Backend Running 🚀",
    status: "OK",
    timestamp: new Date().toISOString()
  });
});

// Health check route
app.get("/health", (req, res) => {
  res.json({ 
    status: "healthy",
    uptime: process.uptime()
  });
});

// Port configuration for Railway
const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
});