const supabase = require("../config/supabase");

// Submit payment proof
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
    
    const file = req.file;

    // Validate
    if (!student_id || !student_name || !student_email || !course_title || !payment_method || !file) {
      return res.status(400).json({ 
        error: "Missing required fields. Please provide all payment details and screenshot." 
      });
    }

    // Upload to Supabase Storage
    const fileExt = file.originalname.split(".").pop();
    const fileName = `${student_id}_${Date.now()}.${fileExt}`;
    const filePath = `payment-proofs/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("payment-proofs")
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return res.status(500).json({ error: "Failed to upload screenshot" });
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from("payment-proofs")
      .getPublicUrl(filePath);

    // Insert into payment_requests table
    const { error: prError } = await supabase
      .from("payment_requests")
      .insert({
        student_id,
        course_id: course_id || null,
        amount: parseInt(amount) || 999,
        payment_method,
        screenshot_url: publicUrl,
        status: "pending"
      });

    if (prError) console.error("payment_requests insert error:", prError);

    // Insert into payments table (legacy)
    const { error: paymentsError } = await supabase
      .from("payments")
      .insert({
        student_name,
        email: student_email,
        course: course_title,
        method: payment_method,
        screenshot: publicUrl,
        status: "pending",
        created_at: new Date().toISOString()
      });

    if (paymentsError) console.error("payments insert error:", paymentsError);

    // Update enrollment status
    await supabase
      .from("enrollments")
      .update({
        payment_status: "under_review",
        payment_screenshot: publicUrl,
        payment_method
      })
      .eq("student_id", student_id);

    res.json({
      success: true,
      message: "Payment submitted successfully. Admin will verify within 24 hours.",
      screenshot_url: publicUrl
    });

  } catch (error) {
    console.error("Payment submission error:", error);
    res.status(500).json({ 
      error: "Failed to process payment submission. Please try again." 
    });
  }
};

// Get all payments (admin)
exports.getAllPayments = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("payment_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error("Get payments error:", error);
    res.status(500).json({ error: "Failed to fetch payments" });
  }
};

// Approve/reject payment (admin)
exports.approvePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, admin_notes } = req.body; // status: "approved" or "rejected"

    const { error } = await supabase
      .from("payment_requests")
      .update({ status, admin_notes, reviewed_at: new Date().toISOString() })
      .eq("id", id);

    if (error) throw error;

    // If approved, update enrollment
    if (status === "approved") {
      const { data: payment } = await supabase
        .from("payment_requests")
        .select("student_id")
        .eq("id", id)
        .single();

      if (payment) {
        await supabase
          .from("enrollments")
          .update({ payment_status: "paid" })
          .eq("student_id", payment.student_id);
      }
    }
 
    res.json({ message: "Payment updated successfully" });
  } catch (error) {
    console.error("Approve payment error:", error);
    res.status(500).json({ error: "Failed to update payment" });
  }
};