const express = require("express");
const router = express.Router();

const courseController = require("../controllers/courseController");
const courseContentController = require("../controllers/courseContentController");

router.get("/", courseController.getCourses);
router.post("/", courseController.createCourse);

// Course curriculum (modules + lessons)
router.get("/:courseId/curriculum", courseContentController.getCurriculum);

// Module management (admin only)
router.post("/:courseId/modules", courseContentController.addModule);
router.put("/modules/:moduleId", courseContentController.updateModule);
router.delete("/modules/:moduleId", courseContentController.deleteModule);

module.exports = router;