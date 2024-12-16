const express = require('express');
const router = express.Router();
const upload = require('../Config/Multer');
const CoursesController = require('../Controllers/CoursesController')

router.post('/addCourse',
  upload.fields([
    { name: 'img', maxCount: 1 },
    { name: 'defaultvideo', maxCount: 1 },
    { name: 'url', maxCount: 10 },
    { name: 'file_book', maxCount: 1 }
  ]), CoursesController.addCourse);

router.get('/', CoursesController.getcourses);
router.get('/:id', CoursesController.getCourseById);
router.delete('/delete/:id', CoursesController.deleteCourse);
router.get('/videos/:id', CoursesController.getCourseVideos);
router.delete('/videos/:id', CoursesController.deleteVideoById);
router.get('/filter/:department_id/:teacher_email', CoursesController.getByDepartmentAndTeacher);
router.put('/:id',
  upload.fields([
    { name: 'img', maxCount: 10 },
    { name: 'defaultvideo', maxCount: 10 },
    { name: 'videoFiles', maxCount: 20 },
    { name: 'file_book', maxCount: 1 }
  ]), CoursesController.updateCourse);

module.exports = router;
