const express = require("express");
const router = express.Router();
const CommentCourseController = require("../Controllers/CommentCourseController");


router.post("/addCommentCourse", CommentCourseController.addCommentCourse);
router.get("/getAllCommentCourses", CommentCourseController.getCommentCourse);
// router.get("/getCommentCourseById/:id", CommentCourseController.getCommentById); 
router.put("/updateActionCommentCourses/:id", CommentCourseController.updateActionCommentCourses); 
router.delete("/deleteCommentCourse/:id", CommentCourseController.deleteCommentCourse); 

module.exports = router;
