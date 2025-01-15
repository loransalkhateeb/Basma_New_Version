const  User  = require('../Models/UserModel'); 
const asyncHandler = require('../MiddleWares/asyncHandler'); 
const { client } = require('../Utils/redisClient'); 
const { ErrorResponse, validateInput } = require("../Utils/ValidateInput"); 
const bcrypt = require('bcrypt'); 


exports.getProfile = asyncHandler(async (req, res) => {
  const userId = req.params.id;

 
  const validationErrors = validateInput(req.params, 'id');
  if (validationErrors.length > 0) {
    return res.status(400).json({ errors: validationErrors });
  }

  try {
    
    const cachedUser = await client.get(`user:${userId}`);
    if (cachedUser) {
      return res.json(JSON.parse(cachedUser)); 
    }

   
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).send( ErrorResponse('User not found', 404));
    }

    
    await client.setEx(`user:${userId}`, 3600, JSON.stringify(user));

    
    res.json(user);
  } catch (err) {
    return res.status(500).send( ErrorResponse(err.message, 500)); 
  }
});


exports.updateProfile = asyncHandler(async (req, res) => {
  const userId = req.params.id;
  const { name, email, password, confirmPassword } = req.body;
  let img = req.file ? req.file.filename : null; 

  
  const validationErrors = validateInput(req.body, 'update');
  if (validationErrors.length > 0) {
    return res.status(400).json({ errors: validationErrors });
  }

  
  if (password && password !== confirmPassword) {
    return res.status(400).send('Passwords do not match');
  }

  let hashedPassword;
  if (password) {
    try {
      hashedPassword = await bcrypt.hash(password, 10); 
    } catch (err) {
      return res.status(500).send('Error hashing password');
    }
  }

  try {
    
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).send( ErrorResponse('User not found', 404));
    }

    
    img = img || user.img;

    
    await user.update({
      name,
      email,
      password: hashedPassword || user.password, 
      img
    });

    
    await client.setEx(`user:${userId}`, 3600, JSON.stringify(user));

    
    res.status(200).json({
      id: user.id,
      name: user.name,
      email: user.email,
      img: user.img
    });
  } catch (err) {
    return res.status(500).send(err.message); 
  }
});


exports.getAllUsers = asyncHandler(async (req, res) => {
  try {
    
    const validationErrors = validateInput(req.query, 'list');
    if (validationErrors.length > 0) {
      return res.status(400).json({ errors: validationErrors });
    }


    const cachedUsers = await client.get('users:all');
    if (cachedUsers) {
      return res.json(JSON.parse(cachedUsers)); 
    }

    
    const users = await User.findAll({
      attributes: ['id', 'name', 'email', 'img'], 
      order: [['name', 'ASC']], 
    });

    if (!users || users.length === 0) {
      return res.status(404).send( ErrorResponse('No users found', 404));
    }

    
    await client.setEx('users:all', 3600, JSON.stringify(users));

    
    res.json(users);
  } catch (err) {
    return res.status(500).send( ErrorResponse(err.message, 500)); 
  }
});
