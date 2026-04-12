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
// Lessons belong to modules, modules belong to courses
// We fetch all modules for this course, then all lessons for those modules
exports.getCourseLessons = async (req, res) => {
  try {
    const { id } = req.params; // course_id

    // First try: lessons have a direct course_id column
    let { data: directLessons, error: directError } = await supabase
      .from("lessons")
      .select("*")
      .eq("course_id", id)
      .order("order_index", { ascending: true });

    if (!directError && directLessons && directLessons.length > 0) {
      return res.json({ lessons: directLessons });
    }

    // Second try: lessons linked via modules table
    const { data: modules, error: modulesError } = await supabase
      .from("modules")
      .select("id, title, order_index")
      .eq("course_id", id)
      .order("order_index", { ascending: true });

    if (modulesError || !modules || modules.length === 0) {
      // No modules found either — return empty
      return res.json({ lessons: [], modules: [] });
    }

    const moduleIds = modules.map(m => m.id);

    const { data: lessons, error: lessonsError } = await supabase
      .from("lessons")
      .select("*")
      .in("module_id", moduleIds)
      .order("order_index", { ascending: true });

    if (lessonsError) return res.status(500).json({ error: lessonsError.message });

    // Attach module info to each lesson and group by module
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