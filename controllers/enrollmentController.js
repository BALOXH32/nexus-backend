const supabase = require("../config/supabase");

// CREATE ENROLLMENT
exports.createEnrollment = async (req, res) => {
  try {
    const { student_id, course_id } = req.body;

    if (!student_id || !course_id) {
      return res.status(400).json({ error: "student_id and course_id are required" });
    }

    // Check if enrollment already exists
    const { data: existing } = await supabase
      .from("enrollments")
      .select("id, status")
      .eq("student_id", student_id)
      .eq("course_id", course_id)
      .single();

    if (existing) {
      return res.status(409).json({
        error: "Already enrolled",
        status: existing.status
      });
    }

    const { data, error } = await supabase
      .from("enrollments")
      .insert([{
        student_id,
        course_id,
        payment_status: "pending",
        status: "pending"
      }])
      .select();

    if (error) return res.status(500).json({ error: error.message });

    res.json({ message: "Enrollment request submitted", enrollment: data[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET ALL ENROLLMENTS (admin use — returns everything with student + course info)
exports.getEnrollments = async (req, res) => {
  try {
    const { student_id, status } = req.query;

    let query = supabase
      .from("enrollments")
      .select(`
        id, status, payment_status, payment_screenshot, payment_method,
        approved_at, approved_by, created_at, course_id, student_id,
        students(name, email, phone),
        courses(id, title, price, description)
      `)
      .order("created_at", { ascending: false });

    // Filter by student if student_id is provided
    if (student_id) {
      query = query.eq("student_id", student_id);
    }

    // Filter by status if provided
    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) return res.status(500).json({ error: error.message });

    res.json({ enrollments: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// APPROVE OR REJECT ENROLLMENT (admin only)
exports.updateEnrollmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, admin_notes } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ error: "Status must be 'approved' or 'rejected'" });
    }

    const updateData = {
      status,
      admin_notes: admin_notes || null
    };

    if (status === "approved") {
      updateData.approved_at = new Date().toISOString();
      updateData.approved_by = "admin";
      updateData.payment_status = "approved";
    }

    if (status === "rejected") {
      updateData.payment_status = "rejected";
    }

    const { data, error } = await supabase
      .from("enrollments")
      .update(updateData)
      .eq("id", id)
      .select(`
        id, status, payment_status, approved_at,
        students(name, email),
        courses(title)
      `);

    if (error) return res.status(500).json({ error: error.message });
    if (!data || data.length === 0) {
      return res.status(404).json({ error: "Enrollment not found" });
    }

    res.json({ message: `Enrollment ${status}`, enrollment: data[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// UPDATE PAYMENT STATUS (kept for backward compatibility)
exports.updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { payment_status } = req.body;

    const updateData = { payment_status };

    // If payment approved, also approve enrollment
    if (payment_status === "approved") {
      updateData.status = "approved";
      updateData.approved_at = new Date().toISOString();
      updateData.approved_by = "admin";
    }

    if (payment_status === "rejected") {
      updateData.status = "rejected";
    }

    const { data, error } = await supabase
      .from("enrollments")
      .update(updateData)
      .eq("id", id)
      .select();

    if (error) return res.status(500).json({ error: error.message });
    res.json({ message: "Payment status updated", enrollment: data[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GENERATE CERTIFICATE
exports.generateCertificate = async (req, res) => {
  try {
    const { id } = req.params;

    // Only generate for approved enrollments
    const { data: enrollment } = await supabase
      .from("enrollments")
      .select("status")
      .eq("id", id)
      .single();

    if (!enrollment || enrollment.status !== "approved") {
      return res.status(403).json({ error: "Enrollment must be approved before generating certificate" });
    }

    const certificateId = "NSA-" + new Date().getFullYear() + "-" + Math.floor(1000 + Math.random() * 9000);

    const { data, error } = await supabase
      .from("enrollments")
      .update({ certificate_id: certificateId })
      .eq("id", id)
      .select();

    if (error) return res.status(500).json({ error: error.message });
    res.json({ message: "Certificate generated", certificate_id: certificateId, enrollment: data[0] });
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