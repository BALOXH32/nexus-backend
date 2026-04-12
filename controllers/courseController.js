const supabase = require("../config/supabase");

// GET ALL COURSES
exports.getCourses = async (req, res) => {
  const { data, error } = await supabase
    .from("courses")
    .select("*")
    .order("title");
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};

// GET SINGLE COURSE BY ID
exports.getCourseById = async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from("courses")
      .select("*")
      .eq("id", id)
      .single();
    if (error) return res.status(404).json({ error: "Course not found" });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET LESSONS FOR A COURSE
// lessons table has NO course_id — lessons link via module_id → modules.course_id
exports.getCourseLessons = async (req, res) => {
  try {
    const { id } = req.params; // course_id

    // Step 1: get all modules for this course
    const { data: modules, error: modulesError } = await supabase
      .from("modules")
      .select("id, title, description, order_index")
      .eq("course_id", id)
      .order("order_index", { ascending: true });

    if (modulesError) return res.status(500).json({ error: modulesError.message });

    if (!modules || modules.length === 0) {
      return res.json({ lessons: [], modules: [] });
    }

    // Step 2: get all lessons for those modules
    const moduleIds = modules.map(m => m.id);

    const { data: lessons, error: lessonsError } = await supabase
      .from("lessons")
      .select("id, module_id, title, description, video_url, duration, order_index, is_free")
      .in("module_id", moduleIds)
      .order("order_index", { ascending: true });

    if (lessonsError) return res.status(500).json({ error: lessonsError.message });

    // Step 3: group lessons under their module
    const groupedModules = modules.map(mod => ({
      ...mod,
      lessons: (lessons || []).filter(l => l.module_id === mod.id)
    }));

    res.json({
      lessons: lessons || [],
      modules: groupedModules
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// CREATE COURSE
exports.createCourse = async (req, res) => {
  const { title, description, price } = req.body;
  const { data, error } = await supabase
    .from("courses")
    .insert([{ title, description, price }])
    .select();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: "Course created successfully", data });
};