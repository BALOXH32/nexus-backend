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
    res.json({ message: "Student created successfully", student: data[0] });
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

// GET STUDENT ENROLLMENTS — used by student dashboard
// GET /api/students/:id/enrollments?status=approved
exports.getStudentEnrollments = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.query;

    if (!id) {
      return res.status(400).json({ error: "Student ID is required" });
    }

    let query = supabase
      .from("enrollments")
      .select(`
        id,
        status,
        payment_status,
        approved_at,
        created_at,
        course_id,
        courses(id, title, description, price)
      `)
      .eq("student_id", id)
      .order("created_at", { ascending: false });

    // If status filter passed (e.g. ?status=approved), apply it
    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) return res.status(500).json({ error: error.message });

    // Shape the response so frontend gets clean data
    const enrollments = (data || []).map(e => ({
      id: e.id,
      course_id: e.course_id,
      status: e.status,
      payment_status: e.payment_status,
      approved_at: e.approved_at,
      created_at: e.created_at,
      course: e.courses || null
    }));

    res.json({ enrollments });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};