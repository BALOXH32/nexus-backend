const supabase = require("../config/supabase");

exports.getDashboardStats = async (req, res) => {
  try {
    const [
      { count: studentCount },
      { count: courseCount },
      { count: enrollmentCount },
      { count: pendingCount },
      { data: revenueData }
    ] = await Promise.all([
      supabase.from("students").select("*", { count: "exact", head: true }),
      supabase.from("courses").select("*", { count: "exact", head: true }),
      supabase.from("enrollments").select("*", { count: "exact", head: true }),
      supabase.from("payment_requests").select("*", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("enrollments").select("courses(price)")
    ]);

    const revenue = (revenueData || []).reduce((sum, e) => sum + (e.courses?.price || 0), 0);

    res.json({
      total_students:    studentCount  || 0,
      total_courses:     courseCount   || 0,
      total_enrollments: enrollmentCount || 0,
      pending_payments:  pendingCount  || 0,
      total_revenue:     revenue
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};