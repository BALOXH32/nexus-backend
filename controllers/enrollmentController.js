const supabase = require("../config/supabase");

// CREATE ENROLLMENT
exports.createEnrollment = async (req, res) => {
  try {
    const { student_id, course_id } = req.body;

    const { data, error } = await supabase
      .from("enrollments")
      .insert([{ student_id, course_id }])
      .select();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({
      message: "Student enrolled successfully",
      enrollment: data
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET ALL ENROLLMENTS
exports.getEnrollments = async (req, res) => {
  try {

    const { data, error } = await supabase
      .from("enrollments")
      .select(`
        id,
        students(name,email),
        courses(title,price)
      `);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json(data);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// UPDATE PAYMENT STATUS
exports.updatePaymentStatus = async (req, res) => {
  try {

    const { id } = req.params;
    const { payment_status } = req.body;

    const { data, error } = await supabase
      .from("enrollments")
      .update({ payment_status })
      .eq("id", id)
      .select();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({
      message: "Payment status updated",
      enrollment: data
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GENERATE CERTIFICATE
exports.generateCertificate = async (req, res) => {
  try {

    const { id } = req.params;

    const certificateId =
      "NSA-" +
      new Date().getFullYear() +
      "-" +
      Math.floor(1000 + Math.random() * 9000);

    const { data, error } = await supabase
      .from("enrollments")
      .update({ certificate_id: certificateId })
      .eq("id", id)
      .select();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({
      message: "Certificate generated",
      certificate_id: certificateId,
      enrollment: data
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// VERIFY CERTIFICATE
exports.verifyCertificate = async (req, res) => {
  try {

    const { certificateId } = req.params;

    const { data, error } = await supabase
      .from("enrollments")
      .select(`
        certificate_id,
        students(name,email),
        courses(title)
      `)
      .eq("certificate_id", certificateId)
      .single();

    if (error) {
      return res.status(404).json({ message: "Certificate not found" });
    }

    res.json(data);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};