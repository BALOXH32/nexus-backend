const supabase = require("../config/supabase");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// STUDENT LOGIN
exports.studentLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('=== LOGIN ATTEMPT ===');
    console.log('Email received:', email);
    console.log('Password received:', password);

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required"
      });
    }

    // Find student by email
    const { data: student, error } = await supabase
      .from("students")
      .select("*")
      .eq("email", email)
      .single();

    console.log('Database query error:', error);
    console.log('Student found:', student);

    if (error || !student) {
      console.log('Student not found in database');
      return res.status(401).json({
        error: "Invalid email or password"
      });
    }

    console.log('Student password from DB:', student.password);
    console.log('Passwords match?', password === student.password);

    // Check password
    if (password !== student.password) {
      console.log('Password mismatch!');
      return res.status(401).json({
        error: "Invalid email or password"
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: student.id, 
        email: student.email,
        role: 'student'
      },
      process.env.JWT_SECRET || "nexus-secret-key",
      { expiresIn: "7d" }
    );

    console.log('Login successful!');

    // Return success
    res.json({
      message: "Login successful",
      token: token,
      student: {
        id: student.id,
        name: student.name,
        email: student.email,
        phone: student.phone,
        course: student.course
      }
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({
      error: err.message
    });
  }
};

// STUDENT SIGNUP (uses existing createStudent in studentController)
exports.studentSignup = async (req, res) => {
  try {
    const { name, email, password, phone, course } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        error: "Name, email and password are required"
      });
    }

    // Check if email already exists
    const { data: existingStudent } = await supabase
      .from("students")
      .select("email")
      .eq("email", email)
      .single();

    if (existingStudent) {
      return res.status(400).json({
        error: "Email already registered"
      });
    }

    // Create student
    const { data, error } = await supabase
      .from("students")
      .insert([
        {
          name: name,
          email: email,
          password: password, // Should hash with bcrypt in production
          phone: phone || "",
          course: course || ""
        }
      ])
      .select();

    if (error) {
      return res.status(500).json({
        error: error.message
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: data[0].id, 
        email: data[0].email,
        role: 'student'
      },
      process.env.JWT_SECRET || "nexus-secret-key",
      { expiresIn: "7d" }
    );

    res.json({
      message: "Account created successfully",
      token: token,
      student: {
        id: data[0].id,
        name: data[0].name,
        email: data[0].email,
        phone: data[0].phone
      }
    });

  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
};

// ADMIN LOGIN
exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required"
      });
    }

    // Hardcoded admin credentials (you can change these or move to database)
    const ADMIN_EMAIL = "admin@nexusskillacademy.com";
    const ADMIN_PASSWORD = "admin123";

    if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
      return res.status(401).json({
        error: "Invalid admin credentials"
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        email: email,
        role: 'admin'
      },
      process.env.JWT_SECRET || "nexus-secret-key",
      { expiresIn: "7d" }
    );

    res.json({
      message: "Admin login successful",
      token: token,
      admin: {
        email: email,
        role: 'admin'
      }
    });

  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
};

// VERIFY TOKEN (middleware)
exports.verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      error: "No token provided"
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "nexus-secret-key");
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      error: "Invalid token"
    });
  }
};
