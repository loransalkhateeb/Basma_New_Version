const nodemailer = require('nodemailer');
const { validateInput, ErrorResponse } = require('../Utils/validateInput');
const Department = require('../Models/DepartmentModel');


exports.createDepartment = async (req, res) => {
  try {
    const { title, price } = req.body || {};

    if (!title || !price) {
      return res
        .status(400)
        .json(
          ErrorResponse("Validation failed", [
            "The All Fields are required. Please fill all fields."
          ])
        );
    }

   
    const validationErrors = validateInput({ title, price });
    if (validationErrors.length > 0) {
      return res
        .status(400)
        .json(ErrorResponse("Validation failed", validationErrors));
    }

   
    const newDepartment = await Department.create({
      title,
      price
    });

    
    sendEmailNotification('New Department Created', `A new department titled "${title}" has been created.`);

    
    res.status(201).json({
      message: "Department created successfully",
      department: newDepartment
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json(
        ErrorResponse("Failed to create department, please try again", [
          "An error occurred while creating the new department. Please try again later."
        ])
      );
  }
};


exports.getAllDepartments = async (req, res) => {
  try {
    const departments = await Department.findAll();
    res.status(200).json(departments);
  } catch (error) {
    console.error(error);
    res.status(500).json(
      ErrorResponse("Failed to fetch departments", [
        "An error occurred while fetching the departments."
      ])
    );
  }
};


exports.getDepartmentById = async (req, res) => {
  try {
    const { id } = req.params;

    const department = await Department.findByPk(id);
    if (!department) {
      return res.status(404).json(
        ErrorResponse("Department not found", [
          `No department found with the given ID: ${id}`
        ])
      );
    }

    res.status(200).json(department);
  } catch (error) {
    console.error(error);
    res.status(500).json(
      ErrorResponse("Failed to fetch department", [
        "An error occurred while fetching the department."
      ])
    );
  }
};


exports.updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, price } = req.body;

    if (!title || !price) {
      return res
        .status(400)
        .json(
          ErrorResponse("Validation failed", [
            "The All Fields are required. Please fill all fields."
          ])
        );
    }

    const department = await Department.findByPk(id);
    if (!department) {
      return res.status(404).json(
        ErrorResponse("Department not found", [
          `No department found with the given ID: ${id}`
        ])
      );
    }

    department.title = title || department.title;
    department.price = price || department.price;

    await department.save();

    res.status(200).json({
      message: "Department updated successfully",
      department
    });
  } catch (error) {
    console.error(error);
    res.status(500).json(
      ErrorResponse("Failed to update department", [
        "An error occurred while updating the department."
      ])
    );
  }
};


exports.deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;

    const department = await Department.findByPk(id);
    if (!department) {
      return res.status(404).json(
        ErrorResponse("Department not found", [
          `No department found with the given ID: ${id}`
        ])
      );
    }

    await department.destroy();

    res.status(200).json({
      message: "Department deleted successfully"
    });
  } catch (error) {
    console.error(error);
    res.status(500).json(
      ErrorResponse("Failed to delete department", [
        "An error occurred while deleting the department."
      ])
    );
  }
};
