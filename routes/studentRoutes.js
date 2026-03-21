const express = require("express");
const router = express.Router();

const {
  createStudent,
  getStudents,
  getStudentEnrollments
} = require("../controllers/studentController");

// CREATE STUDENT
router.post("/", createStudent);

// GET ALL STUDENTS
router.get("/", getStudents);

// GET STUDENT ENROLLMENTS
router.get("/:id/enrollments", getStudentEnrollments);

module.exports = router;