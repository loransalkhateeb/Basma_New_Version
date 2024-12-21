const express = require('express');
const multer = require('multer'); 
const router = express.Router();
const TeacherController = require('../Controllers/TeacherController');
const rateLimiter = require('../MiddleWares/rateLimiter');
const authMiddleware = require('../MiddleWares/authMiddleware');
const upload = require('../Config/Multer');


const handleMulterErrors = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        error: "File size exceeds the limit",
        message: "Please upload a file smaller than 1 GB.",
      });
    }
  }
 
  next(err);
};


router.post('/add', 
  upload.single('img'), 
  rateLimiter, 
  TeacherController.addTeacherAndCourses
);

router.post('/addcourseteacher', 
  upload.fields([
    { name: 'img', maxCount: 1 },
    { name: 'defaultvideo', maxCount: 1 },
    { name: 'url', maxCount: 30 },
    { name: 'file_book', maxCount: 10 }
  ]), 
  handleMulterErrors, 
  rateLimiter, 
  
  TeacherController.teacherAddCourse
);

router.put('/updatecourseteacher/:courseId', 
  upload.fields([
    { name: 'img', maxCount: 1 },
    { name: 'defaultvideo', maxCount: 1 },
    { name: 'file_book', maxCount: 10 },
    { name: 'videoFiles', maxCount: 20 }
  ]), 
  rateLimiter, 
 
  TeacherController.updateTeacherCourse
);

router.delete('/deletecourseteacher/:id', 
  rateLimiter, 
  
  TeacherController.deleteTeacherCourse
);

router.get('/', rateLimiter, TeacherController.getTeacher);

router.get('/student-counts/:id', 
  rateLimiter, 
  TeacherController.getStudentCountForTeacher
);

router.get('/getTeacherById/:id', 
  rateLimiter, 
  TeacherController.getTeacherById
);

router.get('/teachercourse/:teacherEmail', 
  rateLimiter, 
  TeacherController.getTeacherCoursesByEmail
);

router.get('/teacher-course/:teacherEmail', 
  rateLimiter, 
  TeacherController.getTeacheridandCourseById
);

router.put('/updateTeacher/:id', 
  upload.fields([{ name: 'img', maxCount: 1 }]), 
  rateLimiter, 

  TeacherController.updateTeacher
);

router.delete('/delete/:id', 
  rateLimiter, 
 
  TeacherController.deleteTeacher
);

module.exports = router;
