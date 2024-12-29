const { client } = require("../Utils/redisClient");
const Department = require("../Models/DepartmentModel");
const Payment = require("../Models/PaymentsModel");
const CourseUser = require("../Models/course_users");
const Course = require("../Models/Courses");
const asyncHandler = require("../MiddleWares/asyncHandler");
const Coupon = require("../Models/CouponsModel");
const Sequelize = require("../Config/dbConnect");
const { Op } = require("sequelize");

exports.getDepartments = asyncHandler(async (req, res) => {
  const cachedDepartments = await client.get("departments");
  if (cachedDepartments) {
    return res.json(JSON.parse(cachedDepartments));
  }

  const departments = await Department.findAll({
    attributes: ["id", "title", "price"],
    raw: true,
  });

  await client.set("departments", JSON.stringify(departments), "EX", 3600);

  res.json(departments);
});

exports.getPayments = asyncHandler(async (req, res) => {
  const cachedPayments = await client.get("payments");
  if (cachedPayments) {
    return res.json(JSON.parse(cachedPayments));
  }

  const payments = await Payment.findAll({
    attributes: [
      "id",
      "student_name",
      "email",
      "address",
      "phone",
      "department_id",
      "user_id",
    ],
    include: [
      {
        model: Coupon,
        attributes: ["coupon_code"],
      },
      {
        model: Department,
        attributes: ["title"],
      },
      {
        model: CourseUser,
        attributes: ["payment_status"],
        required: false,
      },
    ],
    group: ["payments.id", "coupons.coupon_code", "department.title"],
    raw: true,
  });

  await client.set("payments", JSON.stringify(payments), "EX", 3600);

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

  await CourseUser.update(
    { payment_status },
    { where: { payment_id: payment.id } }
  );

  await client.del("payments");
  res.json({ message: "Payment status updated successfully" });
});

exports.buyDepartment = asyncHandler(async (req, res) => {
  const {
    student_name,
    email,
    address,
    phone,
    coupon_code,
    department_id,
    user_id,
  } = req.body;

  if (
    !student_name ||
    !email ||
    !address ||
    !phone ||
    !coupon_code ||
    !department_id ||
    !user_id
  ) {
    return res.status(400).json({ error: "All fields are required" });
  }

  const currentDateTime = new Date();

  try {
    const coupon = await Coupon.findOne({
      where: {
        coupon_code,
        expiration_date: { [Op.gt]: currentDateTime },
        used: false,
        coupon_type: "department",
      },
    });

    if (!coupon) {
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
      attributes: ["id"],
      where: { department_id },
      raw: true,
    });

    if (courses.length === 0) {
      return res
        .status(400)
        .json({ error: "No courses found for this department" });
    }

    await coupon.update({ used: true });

    const courseUserRecords = courses.map((course) => ({
      user_id: user_id,
      course_id: course.id,
      payment_id: payment.id,
      payment_status: "approved",
    }));
    const result = await CourseUser.bulkCreate(courseUserRecords, {
      returning: true,
    });

    await client.del("payments");
    await client.del("departments");

    res
      .status(200)
      .json({
        message: "Department purchased successfully and courses unlocked",
      });
  } catch (error) {
    console.error("Error during department purchase:", error);
    res.status(500).json({ error: "Database error. Please try again later." });
  }
});

exports.getCourseUsers = asyncHandler(async (req, res) => {
  try {
    // Fetch course users from the database
    const result = await Sequelize.query("SELECT * FROM course_users");

    if (result.length == 0) {
      return res.status(404).json({ message: "No course users found." });
    }

    // Flatten the array of arrays into a single array of objects
    const flattenedResult = result.flat();

    // Return the flattened result
    return res.json(flattenedResult);
  } catch (err) {
    console.error("Error fetching course user data:", err.message);
    return res.status(500).json({
      error: "Failed to fetch course users",
      message: err.message,
    });
  }
});

exports.getPaymentData = async (req, res) => {
  try {
    const payment = await Payment.findAll({
      include: [
        {
          model: Department,
          attributes: ["title"],
        },
        {
          model: Coupon,
          attributes: ["coupon_code"],
        },
        {
          model: Course,
          attributes: [
            "id",
            "subject_name",
            "before_offer",
            "after_offer",
            "descr",
          ],
        },
      ],
    });

    res.status(200).json(payment);
  } catch (error) {
    console.error("Error fetching payment:", error.message);
    res.status(500).json({
      error: "Error fetching payment",
      details: error.message,
    });
  }
};

exports.deleteCourseUsers = asyncHandler(async (req, res) => {
  const { payment_id } = req.params;

  if (!payment_id) {
    return res.status(400).json({ error: "payment_id is required" });
  }
  const usersToDelete = await CourseUser.findAll({ where: { payment_id } });
  
  await CourseUser.destroy({ where: { payment_id } });

  await Payment.destroy({ where: { id: payment_id } });

  await client.del("courseUsers");
  await client.del("payments");

  res.json({ message: "Course_users and payments deleted successfully" });
});
