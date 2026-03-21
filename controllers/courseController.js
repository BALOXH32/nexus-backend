const supabase = require("../config/supabase");

// GET all courses
exports.getCourses = async (req, res) => {
  const { data, error } = await supabase
    .from("courses")
    .select("*");

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json(data);
};

// CREATE course
exports.createCourse = async (req, res) => {
  const { title, description, price } = req.body;

  const { data, error } = await supabase
    .from("courses")
    .insert([{ title, description, price }]);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json({
    message: "Course created successfully",
    data
  });
};