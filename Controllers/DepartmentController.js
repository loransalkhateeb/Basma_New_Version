const asyncHandler = require("../MiddleWares/asyncHandler");
const Department = require("../Models/DepartmentModel");
const Payment = require("../Models/PaymentsModel");
const { client } = require('../Utils/redisClient');
const { validateInput, ErrorResponse } = require("../Utils/ValidateInput");

exports.createDepartment = async (req, res) => {
  try {
    const { title, price } = req.body || {};

    if (!title || !price) {
      return res
        .status(400)
        .json(ErrorResponse("Validation failed", ["Title and price are required"]));
    }

    const validationErrors = validateInput({ title, price });
    if (validationErrors.length > 0) {
      return res.status(400).json(new ErrorResponse("Validation failed", validationErrors));
    }

    const newDepartment = await Department.create({ title, price });

    
    await client.set(`department:${newDepartment.id}`, JSON.stringify(newDepartment), { EX: 3600 });

    res.status(201).json({
      message: "Department created successfully",
      department: newDepartment,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json(ErrorResponse("Failed to create department", ["An error occurred while creating the department"]));
  }
};

exports.getDepartments = async (req, res) => {
  try {
    await client.del("department:all");
  
    const data = await client.get("department:all");

    if (data) {
      return res.status(200).json(JSON.parse(data)); 
    } else {
      const departments = await Department.findAll({
        attributes: ['id', 'title', 'price'],
        order: [['id', 'DESC']], 
      });

    
      await client.setEx("department:all", 3600, JSON.stringify(departments));

      res.status(200).json(departments);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json(ErrorResponse("Failed to fetch departments", ["An error occurred while fetching the departments"]));
  }
};

exports.getDepartmentById = async (req, res) => {
  try {
    const { id } = req.params;

   
    const data = await client.get(`department:${id}`);

    if (data) {
      return res.status(200).json(JSON.parse(data)); 
    } else {
      const department = await Department.findOne({
        attributes: ['id', 'title', 'price'],
        where: { id },
      });

      if (!department) {
        return res.status(404).json(new ErrorResponse("Department not found", ["No department found with the given id"]));
      }

      
      await client.set(`department:${id}`, JSON.stringify(department), { EX: 3600 });

      res.status(200).json(department);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json(new ErrorResponse("Failed to fetch department", ["An error occurred while fetching the department"]));
  }
};

exports.updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, price } = req.body;

    const validationErrors = validateInput({ title, price });
    if (validationErrors.length > 0) {
      return res.status(400).json(ErrorResponse("Validation failed", validationErrors));
    }

    const department = await Department.findByPk(id);

    if (!department) {
      return res.status(404).json(ErrorResponse("Department not found", ["No department found with the given id"]));
    }

    department.title = title || department.title;
    department.price = price || department.price;

    await department.save();

  
    await client.setEx(`department:${id}`, 3600, JSON.stringify(department));

    res.status(200).json({
      message: "Department updated successfully",
      department,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json(new ErrorResponse("Failed to update department", ["An error occurred while updating the department"]));
  }
};

exports.deleteDepartment = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ message: "ID is required" });
  }

  try {
    // Step 1: Check if there are payments associated with the department
    const payments = await Payment.findAll({
      where: { department_id: id },
      attributes: ['user_id'],
    });

    const userIds = payments.map(payment => payment.user_id);

    if (req.query.confirm === 'true') {
      // Step 2: Proceed with deletion if confirmation is provided
      await Department.destroy({ where: { id } });
      return res.status(200).json({ message: "Department deleted successfully" });
    } else {
      // Step 3: Return payment-related info if no confirmation is provided
      return res.status(200).json({
        message: userIds.length > 0 
          ? "يوجد عمليات شراء على هذا القسم يرجى تأكيد الحذف" 
          : "هل انت متأكد من حذف هذا القسم",
        userIds,
      });
    }
  } catch (error) {
    console.error("Error deleting department:", error);
    res.status(500).json({ error: "An error occurred" });
  }
});

