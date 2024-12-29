const { client } = require("../Utils/redisClient");
const asyncHandler = require("../MiddleWares/asyncHandler");
const Coupon = require("../Models/CouponsModel");
const Department = require("../Models/DepartmentModel");
const Course = require("../Models/Courses");

exports.addCoupon = asyncHandler(async (req, res) => {
  const {
    coupon_code,
    coupon_type,
    expiration_date,
    department_id,
    course_id,
    used,
  } = req.body;

  if (!["course", "department"].includes(coupon_type)) {
    return res.status(400).json({ message: "Invalid coupon type" });
  }

  if (!expiration_date) {
    return res.status(400).json({ message: "Expiration date is required" });
  }

  if (coupon_type === "department" && !department_id) {
    return res
      .status(400)
      .json({ message: "Department ID is required for department type" });
  }
  if (coupon_type === "course" && !course_id) {
    return res
      .status(400)
      .json({ message: "Course ID is required for course type" });
  }

  const departmentExists =
    coupon_type === "department" && (await Department.findByPk(department_id));
  const courseExists =
    coupon_type === "course" && (await Course.findByPk(course_id));

  if (coupon_type === "department" && !departmentExists) {
    return res.status(400).json({ message: "Invalid department ID" });
  }
  if (coupon_type === "course" && !courseExists) {
    return res.status(400).json({ message: "Invalid course ID" });
  }

  const newCoupon = await Coupon.create({
    coupon_code,
    coupon_type,
    expiration_date,
    department_id: department_id || null,
    course_id: course_id || null,
    used,
  });

  await client.set(`coupon:${coupon_code}`, JSON.stringify(newCoupon), {
    EX: 3600,
  });

  res.status(201).json({ message: "Coupon added successfully", newCoupon });
});

// exports.addCoupon = asyncHandler(async (req, res) => {
//   const { coupon_code, coupon_type, expiration_date, department_id, course_id, used } = req.body;

//   if (!['course', 'department'].includes(coupon_type)) {
//       return res.status(400).json({ message: "Invalid coupon type" });
//   }

//   if (!expiration_date) {
//       return res.status(400).json({ message: "Expiration date is required" });
//   }

//   if (coupon_type === 'department' && !department_id) {
//       return res.status(400).json({ message: "Department ID is required for department type" });
//   }
//   if (coupon_type === 'course' && !course_id) {
//       return res.status(400).json({ message: "Course ID is required for course type" });
//   }

//   const cachedCoupon = await client.get(`coupon:${coupon_code}`);
//   if (cachedCoupon) {
//       return res.status(400).json({ message: "Coupon already exists in cache" });
//   }

//   const departmentExists = coupon_type === 'department' && await Department.findByPk(department_id);
//   const courseExists = coupon_type === 'course' && await Course.findByPk(course_id);

//   if (coupon_type === 'department' && !departmentExists) {
//       return res.status(400).json({ message: "Invalid department ID" });
//   }
//   if (coupon_type === 'course' && !courseExists) {
//       return res.status(400).json({ message: "Invalid course ID" });
//   }

//   const newCoupon = await Coupon.create({
//       coupon_code,
//       coupon_type,
//       expiration_date,
//       department_id: department_id,
//       course_id: course_id,
//       used,
//   });

//   await client.set(
//       `coupon:${coupon_code}`,
//       JSON.stringify(newCoupon),
//       { EX: 3600 }
//   );

//   res.status(201).json({ message: "Coupon added successfully", newCoupon });
// });

exports.getCoupon = asyncHandler(async (req, res) => {
  await client.del("coupons");
  const cachedCoupons = await client.get("coupons");

  if (cachedCoupons) {
    return res.status(200).json(JSON.parse(cachedCoupons));
  }

  const coupons = await Coupon.findAll();

  await client.set("coupons", JSON.stringify(coupons), "EX", 3600);

  res.status(200).json(coupons);
});
exports.getCouponById = async (req, res) => {
  try {
    const { id } = req.params;

    const coupoun = await Coupon.findByPk(id);
    if (!coupoun) {
      return res
        .status(404)
        .json(
          ErrorResponse("Coupoun not found", [`No Coupoun with ID: ${id}`])
        );
    }

    res.status(200).json([coupoun]);
  } catch (error) {
    console.error("Error fetching Coupoun by ID:", error.message);
    res
      .status(500)
      .json(ErrorResponse("Error fetching Coupoun by ID", [error.message]));
  }
};

exports.updateCoupon = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    coupon_code,
    coupon_type,
    expiration_date,
    course_id,
    department_id,
    used,
  } = req.body;

  const coupon = await Coupon.findByPk(id);
  if (!coupon) {
    return res.status(404).json({ message: "Coupon not found" });
  }

  coupon.coupon_code = coupon_code;
  coupon.coupon_type = coupon_type;
  coupon.expiration_date = expiration_date;
  coupon.course_id = course_id || null;
  coupon.department_id = department_id || null;
  coupon.used = used !== null ? used : 0;
  await coupon.save();

  const redisKey = `coupon:${coupon_code}`;
  await client.set(redisKey, JSON.stringify(coupon), { EX: 3600 });

  res.status(200).json({ message: "Coupon updated successfully", coupon });
});

exports.deleteCoupon = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const coupon = await Coupon.findByPk(id);
  if (!coupon) {
    return res.status(404).json({ message: "Coupon not found" });
  }

  await coupon.destroy();

  await client.del("coupons");

  res.status(200).json({ message: "Coupon deleted successfully" });
});

exports.getCouponByCode = asyncHandler(async (req, res) => {
  const { coupon_code } = req.params;

  const cachedCoupon = await client.get(`coupon:${coupon_code}`);
  if (cachedCoupon) {
    return res.status(200).json(JSON.parse(cachedCoupon));
  }

  const coupon = await Coupon.findOne({ where: { coupon_code } });
  if (!coupon) {
    return res.status(404).json({ message: "Coupon not found" });
  }

  await client.set(`coupon:${coupon_code}`, JSON.stringify(coupon), "EX", 3600);

  res.status(200).json(coupon);
});

exports.deleteAllCoupons = asyncHandler(async (req, res) => {
  await Coupon.destroy({ where: {} });

  await client.del("coupons");

  res.status(200).json({ message: "All coupons deleted successfully" });
});
