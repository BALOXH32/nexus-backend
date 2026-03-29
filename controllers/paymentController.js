const supabase = require("../config/supabase");

// ── SUBMIT PAYMENT WITH SCREENSHOT ──────────────────────────
// Called from payment.html with multipart/form-data
exports.submitPayment = async (req, res) => {
  try {
    const {
      student_id,
      student_name,
      student_email,
      course_id,
      course_title,
      payment_method,
      amount
    } = req.body;

    if (!student_id || !payment_method) {
      return res.status(400).json({ error: "student_id and payment_method are required" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "Payment screenshot is required" });
    }

    // ── Upload screenshot to Supabase Storage ─────────────────
    const fileExt   = req.file.originalname.split('.').pop();
    const fileName  = `payment_${student_id}_${Date.now()}.${fileExt}`;
    const filePath  = `payment-proofs/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("payment-proofs")
      .upload(filePath, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false
      });

    if (uploadError) {
      return res.status(500).json({ error: "Screenshot upload failed: " + uploadError.message });
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("payment-proofs")
      .getPublicUrl(filePath);

    const screenshotUrl = urlData.publicUrl;

    // ── Save to payment_requests table ────────────────────────
    // Columns: student_id, course_id, amount, payment_method,
    //          transaction_id, screenshot_url, status, admin_notes, reviewed_by
    const prRow = {
      student_id:     student_id,
      amount:         parseInt(amount) || 999,
      payment_method: payment_method,
      screenshot_url: screenshotUrl,
      status:         "pending"
    };
    if (course_id) prRow.course_id = course_id;

    const { error: prError } = await supabase
      .from("payment_requests")
      .insert([prRow]);

    if (prError) console.warn("payment_requests insert warn:", prError.message);

    // ── Log to payments table ─────────────────────────────────
    // Columns: student_name, email, course, method, screenshot, status, created_at
    await supabase.from("payments").insert([{
      student_name: student_name || "",
      email:        student_email || "",
      course:       course_title || "",
      method:       payment_method,
      screenshot:   screenshotUrl,
      status:       "pending",
      created_at:   new Date().toISOString()
    }]);

    // ── Update enrollment payment_status ──────────────────────
    const updateRow = {
      payment_status:    "under_review",
      payment_screenshot: screenshotUrl,
      payment_method:    payment_method
    };
    let enrollQuery = supabase.from("enrollments").update(updateRow).eq("student_id", student_id);
    if (course_id) enrollQuery = enrollQuery.eq("course_id", course_id);
    await enrollQuery;

    res.json({
      message: "Payment submitted successfully. Admin will verify within 24 hours.",
      screenshot_url: screenshotUrl
    });

  } catch (err) {
    console.error("Payment submit error:", err);
    res.status(500).json({ error: err.message });
  }
};

// ── GET ALL PAYMENTS (admin) ──────────────────────────────────
exports.getAllPayments = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("payment_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── APPROVE PAYMENT (admin) ───────────────────────────────────
exports.approvePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, admin_notes } = req.body; // status: 'approved' or 'rejected'

    // Update payment_request
    const { data: pr, error: prErr } = await supabase
      .from("payment_requests")
      .update({ status, admin_notes, reviewed_by: "admin" })
      .eq("id", id)
      .select()
      .single();

    if (prErr) return res.status(500).json({ error: prErr.message });

    // If approved, update enrollment to active
    if (status === "approved" && pr.student_id) {
      await supabase
        .from("enrollments")
        .update({
          payment_status:    "approved",
          enrollment_status: "active",
          approved_at:       new Date().toISOString(),
          approved_by:       "admin"
        })
        .eq("student_id", pr.student_id);

      // Also update payments table
      await supabase
        .from("payments")
        .update({ status: "approved" })
        .eq("screenshot", pr.screenshot_url);
    }

    res.json({ message: `Payment ${status}`, data: pr });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};