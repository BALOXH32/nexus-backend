const supabase = require("../config/supabase");

exports.getCourses = async (req, res) => {
  const { data, error } = await supabase.from("courses").select("*").order("title");
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};

exports.createCourse = async (req, res) => {
  const { title, description, price } = req.body;
  const { data, error } = await supabase.from("courses").insert([{ title, description, price }]).select();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: "Course created successfully", data });
};