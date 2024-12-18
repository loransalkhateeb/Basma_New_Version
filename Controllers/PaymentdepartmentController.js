const { client } = require('../Utils/redisClient');
const Department = require('../Models/DepartmentModel')
const Payment = require('../Models/PaymentsModel')
const CourseUser = require('../Models/course_users')
const Course = require('../Models/Courses')
const asyncHandler = require("../MiddleWares/asyncHandler");



exports.getDepartments = asyncHandler(async (req, res) => {
  
  const cachedDepartments = await client.get('departments');
  if (cachedDepartments) {
    return res.json(JSON.parse(cachedDepartments)); 
  }

  
  const departments = await Department.findAll({
    attributes: ['id', 'title', 'price'], 
    raw: true 
  });

  
  await client.set('departments', JSON.stringify(departments), 'EX', 3600);

  res.json(departments);
});


exports.getPayments = asyncHandler(async (req, res) => {
  const cachedPayments = await client.get('payments');
  if (cachedPayments) {
    return res.json(JSON.parse(cachedPayments)); 
  }

  const payments = await Payment.findAll({
    attributes: ['id', 'student_name', 'email', 'address', 'phone', 'department_id', 'user_id'],
    include: [
      {
        model: Coupon,
        attributes: ['coupon_code'],
      },
      {
        model: Department,
        attributes: ['title'],
      },
      {
        model: CourseUser,
        attributes: ['payment_status'],
        required: false,
      },
    ],
    group: ['payments.id', 'coupons.coupon_code', 'department.title'],
    raw: true 
  });

  
  await client.set('payments', JSON.stringify(payments), 'EX', 3600);

  res.json(payments);
});



exports.updateStatusPayments = asyncHandler(async (req, res) => {
  const { payment_status } = req.body;
  const paymentId = req.params.id;

  if (!payment_status) {
    return res.status(400).json({ error: "Payment status is required" });
  }

  const payment = await Payment.findByPk(paymentId);
  if (!payment) {
    return res.status(404).json({ error: "Payment not found" });
  }

  
  await CourseUser.update({ payment_status }, { where: { payment_id: payment.id } });

  
  await client.del('payments');
  res.json({ message: "Payment status updated successfully" });
});


exports.buyDepartment = asyncHandler(async (req, res) => {
  const { student_name, email, address, phone, coupon_code, department_id, user_id } = req.body;

  if (!student_name || !email || !address || !phone || !coupon_code || !department_id || !user_id) {
    return res.status(400).json({ error: "All fields are required" });
  }

  const currentDateTime = new Date();

  
  const coupon = await Coupon.findOne({
    where: {
      coupon_code,
      expiration_date: { [Sequelize.Op.gt]: currentDateTime },
      used: false,
    },
  });

  if (!coupon || coupon.coupon_type !== 'department') {
    return res.status(400).json({ error: "Invalid or already used coupon" });
  }

  
  const payment = await Payment.create({
    student_name,
    email,
    address,
    phone,
    coupon_id: coupon.id,
    department_id,
    user_id,
  });

  
  const courses = await Course.findAll({
    attributes: ['id'],
    where: { department_id },
    raw: true,
  });

  if (courses.length === 0) {
    return res.status(400).json({ error: "No courses found for this department" });
  }

  
  await coupon.update({ used: true });

  
  const courseUserPromises = courses.map(course =>
    CourseUser.create({
      user_id,
      course_id: course.id,
      payment_id: payment.id,
    })
  );

  await Promise.all(courseUserPromises);

  
  await client.del('payments');
  await client.del('departments');

  res.json({ message: "Department purchased successfully and courses unlocked" });
});


exports.getCourseUsers = asyncHandler(async (req, res) => {
  const cachedCourseUsers = await client.get('courseUsers');
  if (cachedCourseUsers) {
    return res.json(JSON.parse(cachedCourseUsers));
  }

  const courseUsers = await CourseUser.findAll({
    include: [
      { model: Payment, attributes: ['student_name', 'email', 'coupon_id', 'address', 'phone'] },
      { model: Department, attributes: ['title'] },
      { model: Course, attributes: ['subject_name'] },
      { model: Coupon, attributes: ['coupon_code'] },
    ],
    raw: true,
  });

  
  await client.set('courseUsers', JSON.stringify(courseUsers), 'EX', 3600);

  res.json(courseUsers);
});


exports.deleteCourseUsers = asyncHandler(async (req, res) => {
  const { payment_id } = req.params;

  if (!payment_id) {
    return res.status(400).json({ error: "payment_id is required" });
  }

  
  await CourseUser.destroy({ where: { payment_id } });

  
  await Payment.destroy({ where: { id: payment_id } });

  
  await client.del('courseUsers');
  await client.del('payments');

  res.json({ message: "Course_users and payments deleted successfully" });
});

