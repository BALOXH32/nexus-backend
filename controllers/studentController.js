const supabase = require("../config/supabase");


// CREATE STUDENT
exports.createStudent = async (req, res) => {
  try {

    const { name, email, password, phone } = req.body;

    // DEBUG: check what frontend sends
    console.log("Signup Data:", req.body);

    // VALIDATION
    if (!name || !email || !password) {
      return res.status(400).json({
        error: "Name, email and password are required"
      });
    }

    const { data, error } = await supabase
      .from("students")
      .insert([
        {
          name: name,
          email: email,
          password: password,
          phone: phone
        }
      ])
      .select();

    if (error) {
      return res.status(500).json({
        error: error.message
      });
    }

    res.json({
      message: "Student created successfully",
      student: data
    });

  } catch (err) {

    res.status(500).json({
      error: err.message
    });

  }
};



// GET ALL STUDENTS
exports.getStudents = async (req, res) => {
  try {

    const { data, error } = await supabase
      .from("students")
      .select("*");

    if (error) {
      return res.status(500).json({
        error: error.message
      });
    }

    res.json(data);

  } catch (err) {

    res.status(500).json({
      error: err.message
    });

  }
};



// GET STUDENT ENROLLMENTS
exports.getStudentEnrollments = async (req, res) => {
  try {

    const { id } = req.params;

    const { data, error } = await supabase
      .from("enrollments")
      .select(`
        id,
        payment_status,
        courses (
          title,
          price
        )
      `)
      .eq("student_id", id);

    if (error) {
      return res.status(500).json({
        error: error.message
      });
    }

    res.json(data);

  } catch (err) {

    res.status(500).json({
      error: err.message
    });

  }
};