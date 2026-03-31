const supabase = require("../config/supabase");

// Get course curriculum (modules + lessons)
exports.getCurriculum = async (req, res) => {
  try {
    const { courseId } = req.params;

    // Get modules
    const { data: modules, error: moduleError } = await supabase
      .from('modules')
      .select('*')
      .eq('course_id', courseId)
      .order('order_index', { ascending: true });

    if (moduleError) throw moduleError;

    // Get lessons for each module
    const modulesWithLessons = await Promise.all(
      modules.map(async (module) => {
        const { data: lessons, error: lessonError } = await supabase
          .from('lessons')
          .select('*')
          .eq('module_id', module.id)
          .order('order_index', { ascending: true });

        if (lessonError) throw lessonError;

        return {
          ...module,
          lessons: lessons || []
        };
      })
    );

    res.json({
      success: true,
      modules: modulesWithLessons
    });

  } catch (error) {
    console.error('Get curriculum error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Add module (admin only)
exports.addModule = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { title, description, order_index } = req.body;

    const { data, error } = await supabase
      .from('modules')
      .insert({
        course_id: courseId,
        title,
        description,
        order_index
      })
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      module: data
    });

  } catch (error) {
    console.error('Add module error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Update module
exports.updateModule = async (req, res) => {
  try {
    const { moduleId } = req.params;
    const { title, description, order_index } = req.body;

    const { data, error } = await supabase
      .from('modules')
      .update({ title, description, order_index })
      .eq('id', moduleId)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      module: data
    });

  } catch (error) {
    console.error('Update module error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Delete module
exports.deleteModule = async (req, res) => {
  try {
    const { moduleId } = req.params;

    const { error } = await supabase
      .from('modules')
      .delete()
      .eq('id', moduleId);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Module deleted'
    });

  } catch (error) {
    console.error('Delete module error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
