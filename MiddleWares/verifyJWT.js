const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../Models/UserModel.js');
const transporter = require("../Config/Mailer.js");
const dotenv=require('dotenv')
const asyncHandler = require('../MiddleWares/asyncHandler.js')
const { client } = require('../Utils/redisClient');
const { ErrorResponse, validateInput } = require("../Utils/validateInput");



dotenv.config();




exports.register = asyncHandler(async (req, res) => {
    const { name, email, password, confirmPassword, role } = req.body;
    const img = req.file ? req.file.path : 'acc_icon.png';
  
    
    const validationErrors = validateInput({ name, email, password, confirmPassword, role });
    if (validationErrors.length > 0) {
      return res.status(400).json({ errors: validationErrors });
    }
  
    
    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }
  
    try {
      
      const existingUser = await User.findOne({ where: { email } });
  
      if (existingUser) {
        return res.status(400).json({ message: 'Email already in use' });
      }
  
      
      const hashedPassword = await bcrypt.hash(password, 10);
  
      
      const newUser = await User.create({
        name,
        email,
        password: hashedPassword,
        role,
        img,
      });
  
      
      client.set(`user:${newUser.id}`, JSON.stringify(newUser));
  
      
      res.status(201).json({ message: 'User registered', id: newUser.id, img: newUser.img });
    } catch (err) {
      console.error('Registration error:', err);
     
      return res.status(500).json( ErrorResponse('Server error', err.message));
    }
  });





const MAX_DEVICES = 2;
const SECRET_KEY = process.env.JWT_SECRET;

exports.login = async (req, res) => {
  const { email, password, deviceInfo } = req.body;

  if (!deviceInfo) {
    return res.status(400).json(ErrorResponse('Device information is required'));
  }

  try {
   
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json(ErrorResponse('User not found'));
    }

    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        error: "Invalid password",
        details: ["The password provided does not match the stored password."]
      });
    }

    
    const storedDeviceInfo = await client.get(`user:${user.id}:deviceInfo`);

    if (!storedDeviceInfo) {
      
      if (user.role === 'student') {
        
        await client.set(`user:${user.id}:deviceInfo`, JSON.stringify(deviceInfo));
        return res.status(200).json({
          message: 'تم حفظ معلومات جهازك. سوف تكون قادر على تسجيل الدخول فقط من هذا الجهاز',
          token: jwt.sign(
            { id: user.id, role: user.role, name: user.name, img: user.img },
            SECRET_KEY,
            { expiresIn: '1h' }
          ),
          name: user.name,
          role: user.role,
          id: user.id,
          img: user.img
        });
      } else {
        return res.status(200).json({
          message: 'تم تسجيل الدخول بنجاح.',
          token: jwt.sign(
            { id: user.id, role: user.role, name: user.name, img: user.img },
            SECRET_KEY,
            { expiresIn: '1h' }
          ),
          name: user.name,
          role: user.role,
          id: user.id,
          img: user.img
        });
      }
    } else {
      
      if (JSON.stringify(storedDeviceInfo) !== JSON.stringify(deviceInfo)) {
        return res.status(403).json({
          message: 'Login not allowed from this device'
        });
      }

      
      const token = jwt.sign(
        { id: user.id, role: user.role, name: user.name, img: user.img },
        SECRET_KEY,
        { expiresIn: '1h' }
      );

      return res.status(200).json({
        token,
        name: user.name,
        role: user.role,
        id: user.id,
        img: user.img
      });
    }
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json(ErrorResponse('Server error', err.message));
  }
};


exports.logout = async (req, res) => {
    const { token } = req.body; 
    
    if (!token) return res.status(400).json(new ErrorResponse('Token is required'));
  
    try {
      
      const decoded = jwt.verify(token, process.env.SECRET_KEY);
  
      
      await client.del(`user:${decoded.id}:session`);
  
      
      res.status(200).json({ message: 'Logged out successfully' });
    } catch (error) {
      console.error('JWT Error:', error);
  
      
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json(new ErrorResponse('Invalid token'));
      } else if (error.name === 'TokenExpiredError') {
        return res.status(401).json(new ErrorResponse('Token has expired'));
      } else {
        return res.status(500).json(new ErrorResponse('Server error', error.message));
      }
    }
  };





  exports.requestPasswordReset = async (req, res) => {
    const { email } = req.body;
  
    if (!email) {
      return res.status(400).json(new ErrorResponse('Email is required'));
    }
  
    try {
      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(200).json({ message: 'The email does not exist. Please enter the correct email.' });
      }
  
      
      const resetToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  
      
      await User.saveResetToken(user.id, resetToken);
  
      
      const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
      const resetUrl = `${baseUrl}/resetPassword/${resetToken}`;
  
      
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Password Reset',
        html: `
          <p>You requested a password reset. If you did not make this request, please ignore this email.</p>
          <p>Click the link below to reset your password. This link is valid for 1 hour:</p>
          <p><a href="${resetUrl}">Reset Password</a></p>
        `
      };
  
      
      await transporter.sendMail(mailOptions);
  
      
      res.status(200).json({ message: 'Password reset link sent to email' });
    } catch (err) {
      console.error('Request password reset error:', err);
      
      res.status(500).json(new ErrorResponse('Server error', err.message));
    }
  };



  exports.resetPassword = async (req, res) => {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;
  
    if (password !== confirmPassword) {
      return res.status(400).json(new ErrorResponse('Passwords do not match'));
    }
  
    try {
      
      const decoded = jwt.verify(token, process.env.SECRET_KEY);
      const userId = decoded.id;
  
      
      const redisToken = await client.get(`reset_token_${userId}`);
      if (redisToken !== token) {
        return res.status(400).json(new ErrorResponse('Invalid or expired reset token'));
      }
  
      
      const hashedPassword = await bcrypt.hash(password, 10);
  
      
      await User.updatePassword(userId, hashedPassword);
  
      
      await User.clearResetToken(userId);
  
      
      await client.del(`reset_token_${userId}`);
  
      res.status(200).json({ message: 'Password reset successful' });
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(400).json(new ErrorResponse('Reset token has expired'));
      } else if (err.name === 'JsonWebTokenError') {
        return res.status(400).json(new ErrorResponse('Invalid reset token'));
      }
  
      console.error('Reset password error:', err);
      res.status(500).json(new ErrorResponse('Server error', err.message));
    }
  };