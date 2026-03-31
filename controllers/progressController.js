const supabase = require("../config/supabase");

// Get student progress for a course
exports.getCourseProgress = async (req, res) => {
  try {
    const { studentId, courseId } = req.params;

    // Get all lessons for this course
    const { data: modules } = await supabase
      .from('modules')
      .select(`
        id,
        lessons (
          id,
          title,
          duration
        )
      `)
      .eq('course_id', courseId);

    const lessonIds = modules.flatMap(m => m.lessons.map(l => l.id));

    // Get progress for these lessons
    const { data: progress, error } = await supabase
      .from('student_progress')
      .select('*')
      .eq('student_id', studentId)
      .in('lesson_id', lessonIds);

    if (error) throw error;

    res.json({
      success: true,
      progress: progress || []
    });

  } catch (error) {
    console.error('Get progress error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Save watch progress
exports.saveProgress = async (req, res) => {
  try {
    const { student_id, lesson_id, watch_time } = req.body;

    const { data, error } = await supabase
      .from('student_progress')
      .upsert({
        student_id,
        lesson_id,
        watch_time,
        last_watched_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      progress: data
    });

  } catch (error) {
    console.error('Save progress error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Mark lesson as complete
exports.markComplete = async (req, res) => {
  try {
    const { student_id, lesson_id } = req.body;

    const { data, error } = await supabase
      .from('student_progress')
      .upsert({
        student_id,
        lesson_id,
        completed: true,
        last_watched_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      progress: data
    });

  } catch (error) {
    console.error('Mark complete error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
