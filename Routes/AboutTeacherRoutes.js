const express = require("express");
const router = express.Router();
const multer = require("../Config/Multer");
const AboutTeacherController = require("../Controllers/AboutTeacherController");
const authMiddleware = require("../MiddleWares/authMiddleware");
const rateLimiter = require("../MiddleWares/rateLimiter");


router.get("/getaboutteacher", AboutTeacherController.getAboutTeacher);


router.get("/getaboutteacher/:id", AboutTeacherController.getAboutTeacherById);

router.put(
  "/updateaboutTeacher/:id",
  rateLimiter,
  multer.single("img"), 
  AboutTeacherController.updateAboutTeacher
);


router.post(
  "/createaboutteacher",
  multer.single("img"),
  AboutTeacherController.createAboutTeacher
);


router.delete(
  "/deleteaboutteacher/:id",
  AboutTeacherController.deleteAboutTeacher
);

module.exports = router;
