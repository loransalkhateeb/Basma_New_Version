
const { client } = require('../Utils/redisClient');
const { ErrorResponse, validateInput } = require("../Utils/ValidateInput");
const asyncHandler = require('../MiddleWares/asyncHandler')
const User = require('../Models/UserModel')

const TeacherStudent = require('../Models/Teacher_StudentModel')

const { Op } = require("sequelize");
const course_users = require('../Models/course_users');
const teachers = require('../Models/TeacherModel');
const Payment = require('../Models/PaymentsModel');

exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const img = req.file.path; 
    
    const validationErrors = validateInput({ name, email, password, role });
    if (validationErrors.length > 0) {
      return res.status(400).json({
        error: "Invalid input data",
        details: validationErrors,
      });
    }

    
    const existingUser = await User.findOne({
      where: { email },
      attributes: ["id"], 
    });

    if (existingUser) {
      return res.status(400).json({
        error: "User already exists",
        message: "A user with this email already exists in the database.",
      });
    }

   
    const newUser = await User.create({
      name: name || null,
      email: email || null,
      password: password || null,
      role: role || null,
      img: img || null,
    });

   
    const cacheKey = `user:${email}`;
    client.setEx(cacheKey, 3600, JSON.stringify({
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      img: newUser.img,
    }));

   
    res.status(201).json({
      message: "User created successfully",
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        img: newUser.img,
      },
    });
  } catch (err) {
    console.error("Error creating user:", err);
    res.status(500).json({
      error: "Server error",
      message: err.message,
    });
  }
};






exports.findByEmail = async (email) => {
    try {
      
      const cacheKey = `user:email:${email}`;
  
      
      const cachedUser = await new Promise((resolve) => {
        client.get(cacheKey, (err, data) => {
          if (err) {
            console.error("Error fetching from Redis:", err);
            return resolve(null);
          }
          resolve(data ? JSON.parse(data) : null);
        });
      });
  
      if (cachedUser) {
        return cachedUser;
      }
  
      
      const user = await User.findOne({
        where: { email },
        attributes: ["id", "name", "email", "role", "img"], 
      });
  
      if (!user) {
        throw new Error("User not found");
      }
  
      
      client.setEx(cacheKey, 3600, JSON.stringify(user));
  
      return user;
    } catch (err) {
      console.error("Error in findByEmail:", err);
      throw new Error(err.message || "Server error");
    }
  };



exports.findById = async (id) => {
    try {
      const cacheKey = `user:${id}`;
  
      
      const cachedUser = await new Promise((resolve, reject) => {
        client.get(cacheKey, (err, data) => {
          if (err) return reject(err);
          resolve(data ? JSON.parse(data) : null);
        });
      });
  
      if (cachedUser) {
        return cachedUser; 
      }
  
      
      const user = await User.findOne({
        where: { id }, 
        attributes: ['id', 'name', 'email', 'role', 'img'] 
          });
  
      if (!user) {
        throw new ErrorResponse("User not found", 404);
      }
  
      
      client.setEx(cacheKey, 3600, JSON.stringify(user)); 
  
      return user;
    } catch (error) {
      console.error("Error in findById:", error);
      throw new ErrorResponse("Failed to fetch user data", 500);
    }
  };

  exports.deleteStudent = async (req, res) => {
    try {
      const { id } = req.params;
  
     
      const student = await User.findOne({ where: { id, role: 'Student' } });
      if (!student) {
        return res.status(404).json( ErrorResponse("Student not found", ["No student found with the given id"]));
      }
  
      
      const cacheKey = `student:${id}`;
      await client.del(cacheKey);
  
     
      await Promise.all([
        course_users.destroy({ where: { user_id: id } }),
        teachers.destroy({ where: { id: id } }),
        Payment.destroy({ where: { user_id: id } }),
        student.destroy() 
      ]);
  
      
      await client.del(cacheKey);
  
      res.status(200).json({ message: "The Student and related records deleted successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json( ErrorResponse("Failed to delete Student", ["An error occurred while deleting the student and related records"]));
    }
  };


  exports.deleteAdmin = async (req, res) => {
    try {
      const { id } = req.params;
  
     
      const admin = await User.findOne({ where: { id, role: 'admin' } });
      if (!admin) {
        return res.status(404).json( ErrorResponse("Admin not found", ["No admin found with the given id"]));
      }
  
      
      const cacheKey = `admin:${id}`;
      await client.del(cacheKey);
  
     
      await Promise.all([
        course_users.destroy({ where: { user_id: id } }),
        teachers.destroy({ where: { id: id } }),
        Payment.destroy({ where: { user_id: id } }),
        admin.destroy() 
      ]);
  
      
      await client.del(cacheKey);
  
      res.status(200).json({ message: "Admin and related records deleted successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json( ErrorResponse("Failed to delete admin", ["An error occurred while deleting the admin and related records"]));
    }
  };





exports.getUsers = asyncHandler(async (req, res) => {
    try {
      
      const users = await User.findAll();
      res.status(200).json(users);
    } catch (err) {
      console.error('Error selecting data:', err.message);
      
      res.status(500).json({ message: "Error fetching users", error: err.message });
    }
  });


exports.getUserById = asyncHandler(async (req, res) => {
    const userId = req.params.id;
  
    try {
      const user = await User.findByPk(userId, {
        attributes: ['id', 'name', 'email', 'role', 'img'], 
      });
  
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      
      res.status(200).json(user);
    } catch (err) {
      console.error('Error fetching user:', err.message);
     
      res.status(500).json({ message: 'Error fetching user', error: err.message });
    }
  });

  exports.getUserByRole = asyncHandler(async (req, res) => {
    const userRole = req.params.role;
  
    try {
      const users = await User.findAll({
        where: { role: userRole }, // Specify the condition for filtering users by role
        attributes: ['id', 'name', 'email', 'role', 'img'], // Specify the attributes to include in the response
      });
  
      if (!users || users.length === 0) {
        return res.status(404).json({ message: 'No users found for the specified role' });
      }
  
      res.status(200).json(users);
    } catch (err) {
      console.error('Error fetching user:', err.message);
      res.status(500).json({ message: 'Error fetching user', error: err.message });
    }
  });
  



  







