const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Check if student has access to course
exports.checkAccess = async (req, res) => {
  try {
    const { studentId, courseId } = req.params;
    
    const { data, error } = await supabase
      .from('course_access')
      .select('*')
      .eq('student_id', studentId)
      .eq('course_id', courseId)
      .single();
    
    if (error || !data) {
      return res.json({
        has_access: false,
        status: 'not_enrolled',
        message: 'Please enroll in this course first'
      });
    }
    
    // Check if payment is approved
    if (data.payment_status !== 'approved') {
      return res.json({
        has_access: false,
        status: 'payment_pending',
        message: 'Please complete payment to access this course'
      });
    }
    
    // Check if active
    if (data.status !== 'active') {
      return res.json({
        has_access: false,
        status: data.status,
        message: 'Your access to this course is ' + data.status
      });
    }
    
    // Check expiry
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      return res.json({
        has_access: false,
        status: 'expired',
        message: 'Your access to this course has expired'
      });
    }
    
    res.json({
      has_access: true,
      status: 'active',
      access_data: data
    });
    
  } catch (error) {
    console.error('Check access error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Grant access (admin only)
exports.grantAccess = async (req, res) => {
  try {
    const { student_id, course_id, expires_at } = req.body;
    
    const { data, error } = await supabase
      .from('course_access')
      .upsert({
        student_id,
        course_id,
        status: 'active',
        payment_status: 'approved',
        granted_at: new Date().toISOString(),
        expires_at: expires_at || null
      })
      .select()
      .single();
    
    if (error) throw error;
    
    res.json({
      success: true,
      access: data
    });
    
  } catch (error) {
    console.error('Grant access error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
