const supabase = require("../config/supabase");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "nexus-secret-key-2026";

// ── STUDENT LOGIN ────────────────────────────────────────────
exports.studentLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Find student by email
    const { data: student, error } = await supabase
      .from("students")
      .select("*")
      .eq("email", email.toLowerCase().trim())
      .single();

    if (error || !student) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Plain text password check (matching your current DB storage)
    if (password !== student.password) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Get student enrollment info
    const { data: enrollments } = await supabase
      .from("enrollments")
      .select("id, course_id, payment_status, courses(title)")
      .eq("student_id", student.id);

    // Generate JWT
    const token = jwt.sign(
      { id: student.id, email: student.email, role: "student" },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token,
      student: {
        id:          student.id,
        name:        student.name,
        email:       student.email,
        phone:       student.phone,
        course:      student.course,
        enrollments: enrollments || []
      }
    });

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: err.message });
  }
};

// ── STUDENT SIGNUP ───────────────────────────────────────────
exports.studentSignup = async (req, res) => {
  try {
    const { name, email, password, phone, course, course_id } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email and password are required" });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check if already exists
    const { data: existing } = await supabase
      .from("students")
      .select("id")
      .eq("email", cleanEmail)
      .single();

    if (existing) {
      return res.status(400).json({ error: "Email already registered" });
    }

    // Insert student
    const { data: newStudent, error: insertErr } = await supabase
      .from("students")
      .insert([{
        name:     name.trim(),
        email:    cleanEmail,
        password: password,        // stored as plain text matching your existing DB
        phone:    phone || "",
        course:   course || ""
      }])
      .select()
      .single();

    if (insertErr) {
      return res.status(500).json({ error: insertErr.message });
    }

    // Create enrollment record if course provided
    if (course_id || course) {
      const enrollRow = {
        student_id:     newStudent.id,
        payment_status: "pending"
      };
      if (course_id) enrollRow.course_id = course_id;

      await supabase.from("enrollments").insert([enrollRow]);
    }

    // Generate JWT
    const token = jwt.sign(
      { id: newStudent.id, email: newStudent.email, role: "student" },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Account created successfully",
      token,
      student: {
        id:    newStudent.id,
        name:  newStudent.name,
        email: newStudent.email,
        phone: newStudent.phone
      }
    });

  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ error: err.message });
  }
};

// ── ADMIN LOGIN ──────────────────────────────────────────────
exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const ADMIN_EMAIL    = process.env.ADMIN_EMAIL    || "admin@nexusskillacademy.com";
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

    if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
      return res.status(401).json({ error: "Invalid admin credentials" });
    }

    const token = jwt.sign(
      { email, role: "admin" },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Admin login successful",
      token,
      admin: { email, role: "admin" }
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── VERIFY TOKEN middleware ──────────────────────────────────
exports.verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token provided" });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
};