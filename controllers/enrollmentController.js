const supabase = require("../config/supabase");

// CREATE ENROLLMENT
exports.createEnrollment = async (req, res) => {
  try {
    const { student_id, course_id } = req.body;

    const { data, error } = await supabase
      .from("enrollments")
      .insert([{ student_id, course_id, payment_status: "pending" }])
      .select();

    if (error) return res.status(500).json({ error: error.message });

    res.json({ message: "Student enrolled successfully", enrollment: data });
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
        id, payment_status, payment_screenshot, payment_method,
        approved_at, approved_by, created_at,
        students(name, email, phone),
        courses(title, price)
      `)
      .order("created_at", { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
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

    const updateData = { payment_status };
    if (payment_status === "approved") {
      updateData.approved_at = new Date().toISOString();
      updateData.approved_by = "admin";
    }

    const { data, error } = await supabase
      .from("enrollments")
      .update(updateData)
      .eq("id", id)
      .select();

    if (error) return res.status(500).json({ error: error.message });
    res.json({ message: "Payment status updated", enrollment: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GENERATE CERTIFICATE
exports.generateCertificate = async (req, res) => {
  try {
    const { id } = req.params;
    const certificateId = "NSA-" + new Date().getFullYear() + "-" + Math.floor(1000 + Math.random() * 9000);

    const { data, error } = await supabase
      .from("enrollments")
      .update({ certificate_id: certificateId })
      .eq("id", id)
      .select();

    if (error) return res.status(500).json({ error: error.message });
    res.json({ message: "Certificate generated", certificate_id: certificateId, enrollment: data });
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
      .select(`certificate_id, students(name, email), courses(title)`)
      .eq("certificate_id", certificateId)
      .single();

    if (error) return res.status(404).json({ message: "Certificate not found" });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};