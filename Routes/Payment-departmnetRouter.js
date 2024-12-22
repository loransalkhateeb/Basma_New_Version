const express = require('express');
const router = express.Router();
const departmentController = require('../Controllers/PaymentdepartmentController');

router.get('/departments', departmentController.getDepartments);
router.post('/buy', departmentController.buyDepartment);
router.get('/get', departmentController.getPayments);
router.get('/getpaymentdata', departmentController.getPaymentData);
router.get('/getallcourseusers', departmentController.getCourseUsers);
router.put('/payments/:id/approve', departmentController.updateStatusPayments);
router.delete('/delete/payments/:payment_id', departmentController.deleteCourseUsers);
module.exports = router;