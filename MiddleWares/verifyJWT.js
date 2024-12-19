const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../Models/UserModel.js');
const transporter = require("../Config/Mailer.js");
const dotenv=require('dotenv')
const asyncHandler = require('../MiddleWares/asyncHandler.js')
const { client } = require('../Utils/redisClient');
const { Sequelize } = require('sequelize');
const { ErrorResponse, validateInput } = require("../Utils/validateInput");
const qr = require('qrcode');
const speakeasy = require('speakeasy');
dotenv.config();




exports.register = asyncHandler(async (req, res) => {
  const { name, email, password, confirmPassword, role } = req.body;
  const img = req.file ? req.file.path : 'Basma_Academy/lmtsuynf4f1ifrs96qyi';

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

   
    const mfaSecret = speakeasy.generateSecret({ name: "YourAppName" });
    console.log("New MFA Secret: ", mfaSecret.base32); 

    
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      img,
      mfa_secret: mfaSecret.base32, 
    });

    client.set(`user:${newUser.id}`, JSON.stringify(newUser));

    res.status(201).json({
      message: 'User registered. Set up MFA.',
      id: newUser.id,
      img: newUser.img,
      mfa_secret: mfaSecret.otpauth_url, 
    });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json(ErrorResponse('Server error', err.message));
  }
});

    
const SECRET_KEY = process.env.JWT_SECRET;
User.getDeviceInfo = async (userId) => {
  try {
    const user = await User.findOne({ where: { id: userId }, attributes: ['device_id'] });
    return user?.device_id ? JSON.parse(user.device_id) : null;
  } catch (error) {
    throw new Error(error);
  }
};

User.updateDeviceInfo = async (userId, deviceInfo) => {
  try {
    const result = await User.update(
      { device_id: deviceInfo }, // Pass deviceInfo as-is without stringifying
      { where: { id: userId } }
    );
    return result;
  } catch (error) {
    throw new Error(error);
  }
};


exports.login = async (req, res) => {
  const { email, password, deviceInfo } = req.body;

  if (!deviceInfo) return res.status(400).send('Device information is required');

  try {
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(400).send('User not found');

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).send('Invalid password');

    // Retrieve stored device info
    const storedDeviceInfo = await User.getDeviceInfo(user.id);

    if (!storedDeviceInfo) {
      // If no device info is stored
      if (user.role === 'student') {
        // For students, store the device info
        await User.updateDeviceInfo(user.id, deviceInfo);
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
        // For non-students, do not store device info
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
      // Compare stored device info with incoming device info
      if (JSON.stringify(storedDeviceInfo) !== JSON.stringify(deviceInfo)) {
        return res.status(403).json({
          message: 'Login not allowed from this device'
        });
      }

      // Generate JWT token for matching device info
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
    res.status(500).send(err.message);
  }
};


exports.logout = async (req, res) => {
    const { token } = req.body; 
    
    if (!token) return res.status(400).json(new ErrorResponse('Token is required'));
  
    try {
      
      // const decoded = jwt.verify(token, process.env.SECRET_KEY);
      // await client.del(`user:${decoded.id}:session`);
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




  const saveResetToken = async (userId, resetToken) => {
    try {
      if (!userId || !resetToken) {
        return Promise.reject(new Error('Invalid parameters'));
      }
  
          
      const result = await User.update(
        {
          reset_token: resetToken,
          reset_token_expiration: Sequelize.fn('DATE_ADD', Sequelize.fn('NOW'), Sequelize.literal('INTERVAL 1 HOUR'))
        },
        {
          where: { id: userId },
          
          limit: 1
        }
      );
  
      if (result[0] === 0) {
        throw new Error('User not found or no update performed');
      }
  
      
      return { message: 'Reset token saved successfully' };
    } catch (err) {
      console.error('Error saving reset token:', err);
      
      return { error: err.message || 'Error saving reset token' };
    }
  };

  exports.requestPasswordReset = async (req, res) => {
    const { email } = req.body;
  
    if (!email) {
      return res.status(400).json(new ErrorResponse('Email is required'));
    }
  
    try {
      const user = await User.findOne({email: email});
      if (!user) {
        return res.status(200).json({ message: 'The email does not exist. Please enter the correct email.' });
      }
  
      
      const resetToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  
      
      await saveResetToken(user.id, resetToken);
  
      
      const baseUrl = `process.env.BASE_URL || ${req.protocol}://${req.get('host')}`;
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
  
    console.log('Password:', password); // Debugging
    console.log('Confirm Password:', confirmPassword); // Debugging
  
    if (password !== confirmPassword) {
      return res.status(400).send('Passwords do not match');
    }
  
    try {
      const decoded = jwt.verify(token, SECRET_KEY);
      const userId = decoded.id;
  
      const hashedPassword = await bcrypt.hash(password, 10);
  
      // Update password using Sequelize
      await User.update({ password: hashedPassword }, { where: { id: userId } });
  
      // Clear the reset token from the database using Sequelize
      await User.update(
        { reset_token: null, reset_token_expiration: null },
        { where: { id: userId } }
      );
  
      res.status(200).json({ message: 'Password reset successful' });
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(400).send('Reset token has expired');
      } else if (err.name === 'JsonWebTokenError') {
        return res.status(400).send('Invalid reset token');
      }
      console.error('Reset password error:', err);
      res.status(500).send('Server error');
    }
  };
  
