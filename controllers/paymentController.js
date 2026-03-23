const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Upload payment request
exports.uploadPayment = async (req, res) => {
  try {
    const { student_id, course_id, amount, payment_method, transaction_id, screenshot_url } = req.body;
    
    const { data, error } = await supabase
      .from('payment_requests')
      .insert({
        student_id,
        course_id,
        amount,
        payment_method,
        transaction_id,
        screenshot_url,
        status: 'pending'
      })
      .select()
      .single();
    
    if (error) throw error;
    
    // Create course access record (pending)
    await supabase
      .from('course_access')
      .upsert({
        student_id,
        course_id,
        status: 'pending',
        payment_status: 'pending'
      });
    
    res.json({
      success: true,
      payment: data,
      message: 'Payment submitted successfully. Waiting for admin approval.'
    });
    
  } catch (error) {
    console.error('Upload payment error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get pending payments (admin)
exports.getPendingPayments = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('payment_requests')
      .select(`
        *,
        students!payment_requests_student_id_fkey (
          id,
          name,
          email
        ),
        courses!payment_requests_course_id_fkey (
          id,
          title
        )
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    res.json({
      success: true,
      payments: data || []
    });
    
  } catch (error) {
    console.error('Get pending payments error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Approve payment (admin)
exports.approvePayment = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { admin_notes } = req.body;
    
    // Get payment details
    const { data: payment } = await supabase
      .from('payment_requests')
      .select('*')
      .eq('id', paymentId)
      .single();
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found'
      });
    }
    
    // Update payment request
    const { error: updateError } = await supabase
      .from('payment_requests')
      .update({
        status: 'approved',
        admin_notes,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', paymentId);
    
    if (updateError) throw updateError;
    
    // Grant course access
    const { error: accessError } = await supabase
      .from('course_access')
      .upsert({
        student_id: payment.student_id,
        course_id: payment.course_id,
        status: 'active',
        payment_status: 'approved',
        granted_at: new Date().toISOString()
      });
    
    if (accessError) throw accessError;
    
    res.json({
      success: true,
      message: 'Payment approved and access granted'
    });
    
  } catch (error) {
    console.error('Approve payment error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Reject payment (admin)
exports.rejectPayment = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { admin_notes } = req.body;
    
    const { error } = await supabase
      .from('payment_requests')
      .update({
        status: 'rejected',
        admin_notes,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', paymentId);
    
    if (error) throw error;
    
    res.json({
      success: true,
      message: 'Payment rejected'
    });
    
  } catch (error) {
    console.error('Reject payment error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get student's payment history
exports.getStudentPayments = async (req, res) => {
  try {
    const { studentId } = req.params;
    
    const { data, error } = await supabase
      .from('payment_requests')
      .select(`
        *,
        courses!payment_requests_course_id_fkey (
          id,
          title
        )
      `)
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    res.json({
      success: true,
      payments: data || []
    });
    
  } catch (error) {
    console.error('Get student payments error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
