const express = require('express');
const router = express.Router();
const PyamntPyamntCourseController = require('../Controllers/PaymentCourseController')



router.post('/courses', PyamntPyamntCourseController.buyCourse);
router.post('/validate', PyamntPyamntCourseController.validateCouponCode);
router.get('/getApprovedCoursesForUser/:user_id',PyamntPyamntCourseController.getApprovedCoursesForUser);


module.exports = router;