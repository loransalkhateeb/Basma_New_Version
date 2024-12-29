const { Op } = require("sequelize");
const { client } = require("../Utils/redisClient");
const asyncHandler = require("../MiddleWares/asyncHandler");

const Sequelize = require("../Config/dbConnect");

const Course = require("../Models/Courses");
const Coupon = require("../Models/CouponsModel");
const Payment = require("../Models/PaymentsModel");
const CourseUser = require("../Models/course_users");
const Department = require("../Models/DepartmentModel");
const Teacher = require("../Models/TeacherModel");
const courses = require("../Models/Courses");

exports.validateCouponCode = asyncHandler(async (req, res, next) => {
  const { coupon_code, course_id } = req.body;

  if (!coupon_code || !course_id) {
    return res
      .status(400)
      .json({ error: "Coupon code and course ID are required" });
  }

  try {
    const currentDateTime = new Date();

    const coupon = await Coupon.findOne({
      attributes: ["id", "coupon_type", "course_id"],
      where: {
        coupon_code,
        expiration_date: {
          [Op.gt]: currentDateTime,
        },
        used: false,
      },
    });

    if (!coupon) {
      return res.status(400).json({ error: "Invalid or expired coupon code" });
    }

    if (coupon.coupon_type === "course" && coupon.course_id !== course_id) {
      return res
        .status(400)
        .json({ error: "Coupon is not valid for this course" });
    }

    res.status(200).json({
      message: "Coupon code is valid",
      couponId: coupon.id,
      couponType: coupon.coupon_type,
    });
  } catch (error) {
    console.error("Error validating coupon code:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});


exports.buyCourse = asyncHandler(async (req, res) => {
  const { student_name, email, address, phone, course_id, coupon_code, user_id } = req.body;


  if (!student_name || !email || !address || !phone || !course_id || !user_id) {
    return res.status(400).json({ error: "All fields are required" });
  }

  const currentDateTime = new Date();

  try {
   
    const coupon = await Coupon.findOne({
      where: {
        coupon_code,
        expiration_date: { [Op.or]: [{ [Op.is]: null }, { [Op.gt]: currentDateTime }] }, 
        used: false, 
        coupon_type: 'course', 
      },
    });

    if (!coupon) {
      return res.status(400).json({ error: "Invalid or expired coupon code" });
    }

   
    const course = await Course.findByPk(course_id, { attributes: ['id'] });
    if (!course) {
      return res.status(400).json({ error: "Course not found" });
    }

    
    if (coupon.coupon_type === 'course' && coupon.course_id !== course_id) {
      return res.status(400).json({ error: "Coupon is not valid for this course" });
    }

   
    const payment = await Payment.create({
      student_name,
      email,
      address,
      phone,
      course_id, 
      coupon_id: coupon.id,
      user_id,
    });
   
    await coupon.update({ used: true });

    
    const paymentStatus = "approved";  
    await CourseUser.create({
      user_id,
      course_id,
      payment_id: payment.id,
      payment_status: paymentStatus,  
    });

    
    await client.del('courses');
    await client.setEx('courses', 3600, JSON.stringify(await Course.findAll()));

  
    res.status(200).json({ message: "Course purchased successfully" });

  } catch (error) {
    console.error("Error processing course purchase:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});



exports.getApprovedCoursesForUser = asyncHandler(async (req, res, next) => {
  const { user_id } = req.params;

  try {
    await client.del(`approved_courses_${user_id}`);

    const cachedCourses = await client.get(`approved_courses_${user_id}`);
    if (cachedCourses) {
      return res.status(200).json(JSON.parse(cachedCourses));
    }

    const courses = await CourseUser.findAll({
      where: {
        user_id,
        payment_status: "approved",
      },
      include: [
        {
          model: Payment,
          attributes: ["id", "coupon_id"],
          include: [
            {
              model: Coupon,
              where: { expiration_date: { [Op.gte]: new Date() } },
            },
           
          ],
        },
        {
          model: Course,
          include: [
            {
              model: Teacher,
              attributes: ["id", "teacher_name", "descr", "email"],
            },
            {
              model: Department,
              attributes: ["id", "title", "price"],
            },
          ],
        },
      ],
    });

    await client.setEx(
      `approved_courses_${user_id}`,
      3600,
      JSON.stringify(courses)
    );

    res.status(200).json(courses);
  } catch (error) {
    console.error("Error fetching approved courses:", error);
    return res.status(500).json({ error: "Database error" });
  }
});
