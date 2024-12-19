const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../Models/UserModel.js');
const dotenv=require('dotenv')
const asyncHandler = require('../MiddleWares/asyncHandler.js')
const { client } = require('../Utils/redisClient');
const { ErrorResponse, validateInput } = require("../Utils/validateInput");
const qr = require('qrcode');
const speakeasy = require('speakeasy')

dotenv.config();




const nodemailer = require("nodemailer");



const sendMFAEmail = async (userEmail, mfaCode, userId) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: userEmail,
    subject: 'Your MFA Code',
    text: `Your MFA code is: ${mfaCode}`,
  };

  await transporter.sendMail(mailOptions);


  await client.set(`user:${userId}:mfa_token`, mfaCode, 'EX', 300); 
};

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

   
    const mfaSecret = speakeasy.generateSecret({ name: "YourAppName" });
    const mfaToken = speakeasy.totp({
      secret: mfaSecret.base32,
      encoding: 'base32',
    });

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      img,
      mfa_secret: mfaSecret.base32,
    });

    client.set(`user:${newUser.id}`, JSON.stringify(newUser));

    
    await sendMFAEmail(email, mfaToken, newUser.id);

    res.status(201).json({
      message: 'User registered. MFA token sent to email.',
      id: newUser.id,
      img: newUser.img,
    });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});





const MAX_DEVICES = 2;
const SECRET_KEY = process.env.JWT_SECRET;

exports.login = asyncHandler(async (req, res) => {
  const { email, password, mfa_token } = req.body;


  const user = await User.findOne({ where: { email } });
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }


  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) {
    return res.status(400).json({ message: 'Invalid password' });
  }

  
  if (user.mfa_secret) {
    
    const storedToken = await client.get(`user:${user.id}:mfa_token`);

   
    if (mfa_token !== storedToken) {
      return res.status(400).json({ message: 'Invalid MFA token' });
    }
  }

 
  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, SECRET_KEY, { expiresIn: '1h' });

  res.status(200).json({
    message: 'Login successful',
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      img: user.img,
    },
  });
});






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
      const user = await User.findOne(email);
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