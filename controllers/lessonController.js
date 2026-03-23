const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Get lesson details
exports.getLesson = async (req, res) => {
  try {
    const { lessonId } = req.params;
    
    const { data, error } = await supabase
      .from('lessons')
      .select('*')
      .eq('id', lessonId)
      .single();
    
    if (error) throw error;
    
    res.json({
      success: true,
      lesson: data
    });
    
  } catch (error) {
    console.error('Get lesson error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Add lesson
exports.addLesson = async (req, res) => {
  try {
    const { moduleId } = req.params;
    const { title, description, video_url, duration, order_index, is_free } = req.body;
    
    const { data, error } = await supabase
      .from('lessons')
      .insert({
        module_id: moduleId,
        title,
        description,
        video_url,
        duration,
        order_index,
        is_free: is_free || false
      })
      .select()
      .single();
    
    if (error) throw error;
    
    res.json({
      success: true,
      lesson: data
    });
    
  } catch (error) {
    console.error('Add lesson error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Update lesson
exports.updateLesson = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const { title, description, video_url, duration, order_index, is_free } = req.body;
    
    const { data, error } = await supabase
      .from('lessons')
      .update({
        title,
        description,
        video_url,
        duration,
        order_index,
        is_free
      })
      .eq('id', lessonId)
      .select()
      .single();
    
    if (error) throw error;
    
    res.json({
      success: true,
      lesson: data
    });
    
  } catch (error) {
    console.error('Update lesson error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Delete lesson
exports.deleteLesson = async (req, res) => {
  try {
    const { lessonId } = req.params;
    
    const { error } = await supabase
      .from('lessons')
      .delete()
      .eq('id', lessonId);
    
    if (error) throw error;
    
    res.json({
      success: true,
      message: 'Lesson deleted'
    });
    
  } catch (error) {
    console.error('Delete lesson error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
