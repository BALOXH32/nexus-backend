const express = require("express");
const router = express.Router();

const {
  getCourses,
  getCourseById,
  getCourseLessons,
  createCourse
} = require("../controllers/courseController");

// GET all courses
router.get("/", getCourses);

// GET single course by ID  ← NEW
router.get("/:id", getCourseById);

// GET lessons for a course  ← NEW
router.get("/:id/lessons", getCourseLessons);

// CREATE course
router.post("/", createCourse);

module.exports = router;