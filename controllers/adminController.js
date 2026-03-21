const supabase = require("../config/supabase");

exports.getDashboardStats = async (req, res) => {
  try {

    const { count: studentCount } = await supabase
      .from("students")
      .select("*", { count: "exact", head: true });

    const { count: courseCount } = await supabase
      .from("courses")
      .select("*", { count: "exact", head: true });

    const { count: enrollmentCount } = await supabase
      .from("enrollments")
      .select("*", { count: "exact", head: true });

    const { data: revenueData } = await supabase
      .from("courses")
      .select("price");

    let revenue = 0;

    if (revenueData) {
      revenue = revenueData.reduce((sum, course) => sum + (course.price || 0), 0);
    }

    res.json({
      total_students: studentCount,
      total_courses: courseCount,
      total_enrollments: enrollmentCount,
      total_revenue: revenue
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};