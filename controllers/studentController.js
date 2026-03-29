const supabase = require("../config/supabase");

// CREATE STUDENT
exports.createStudent = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email and password are required" });
    }
    const { data, error } = await supabase
      .from("students")
      .insert([{ name, email, password, phone: phone || "" }])
      .select();
    if (error) return res.status(500).json({ error: error.message });
    res.json({ message: "Student created successfully", student: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET ALL STUDENTS
exports.getStudents = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("students")
      .select("id, name, email, phone, course, created_at")
      .order("created_at", { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET STUDENT ENROLLMENTS
exports.getStudentEnrollments = async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from("enrollments")
      .select(`id, payment_status, payment_method, approved_at, courses(title, price)`)
      .eq("student_id", id);
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};