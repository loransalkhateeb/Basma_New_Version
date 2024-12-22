const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../Models/UserModel.js");
const transporter = require("../Config/Mailer.js");
const dotenv = require("dotenv");
const asyncHandler = require("../MiddleWares/asyncHandler.js");
const { client } = require("../Utils/redisClient");
const { Sequelize } = require("sequelize");
const { ErrorResponse, validateInput } = require("../Utils/ValidateInput.js");
const speakeasy = require("speakeasy");
dotenv.config();
const nodemailer = require("nodemailer");
const AuditLog = require("../Models/AuditLog.js");
const geoip = require("geoip-lite");
const crypto = require("crypto");
const argon2 = require("argon2");


let currentPassword = generatePassword();

function generatePassword() {
  return crypto.randomBytes(6).toString("hex");
}



function sendPasswordEmail(password) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: "lwrnsalkhtyb9@gmail.com", 
    subject: "Dashboard Password Update",
    text: `The new dashboard password is: ${password}\nExpires in 20 minutes.`,
  };

  transporter.sendMail(mailOptions, (err, info) => {
    if (err) {
      console.error("Error sending email:", err);
    } else {
      console.log("Password email sent:", info.response);
    }
  });
}

setInterval(() => {
  currentPassword = generatePassword();
  passwordExpiryTime = Date.now() + 20 * 60 * 1000;
  sendPasswordEmail(currentPassword);
  console.log(`New password generated: ${currentPassword}`);
}, 20 * 60 * 1000);





exports.register = asyncHandler(async (req, res) => {
  const { name, email, password, confirmPassword, role } = req.body;
  const img = req.file ? req.file.path : "Basma_Academy/lmtsuynf4f1ifrs96qyi";

  const validationErrors = validateInput({
    name,
    email,
    password,
    confirmPassword,
    role
  });
  if (validationErrors.length > 0) {
    return res.status(400).json({ errors: validationErrors });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ message: "Passwords do not match" });
  }

  try {
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "Email already in use" });
    }

    const hashedPassword = await argon2.hash(password);

    const mfaSecret = speakeasy.generateSecret({ name: "YourAppName" });
    console.log("New MFA Secret: ", mfaSecret.base32);

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      img,
      mfa_secret: mfaSecret.base32
    });

    client.set(`user:${newUser.id}`, JSON.stringify(newUser));

    res.status(201).json({
      message: "User registered. Set up MFA.",
      id: newUser.id,
      img: newUser.img,
      mfa_secret: mfaSecret.otpauth_url
    });
  } catch (err) {
    console.error("Registration error:", err);
    return res.status(500).json(ErrorResponse("Server error", err.message));
  }
});

const SECRET_KEY = process.env.JWT_SECRET;
User.getDeviceInfo = async (userId) => {
  try {
    const user = await User.findOne({
      where: { id: userId },
      attributes: ["device_id"]
    });
    return user?.device_id ? JSON.parse(user.device_id) : null;
  } catch (error) {
    throw new Error(error);
  }
};

User.updateDeviceInfo = async (userId, deviceInfo) => {
  try {
    const result = await User.update(
      { device_id: deviceInfo },
      { where: { id: userId } }
    );
    return result;
  } catch (error) {
    throw new Error(error);
  }
};

const sendVerificationCode = async (email, mfaCode) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const mailOptions = {
    from: "your-email@gmail.com",
    to: email,
    subject: "Your MFA Code",
    text: `Your MFA code is: ${mfaCode}`
  };

  await transporter.sendMail(mailOptions);
};


const blockedIps = new Set();
const failedAttempts = {};

exports.login = async (req, res) => {
  const { email, password, mfaCode, ip } = req.body;
  const clientIp = ip || req.ip || req.headers["x-forwarded-for"] || req.connection.remoteAddress;

  console.log(`Attempted login from IP: ${clientIp}`);

  if (blockedIps.has(clientIp)) {
    console.log(`Blocked IP: ${clientIp}. Access denied.`);
    return res.status(403).send("Your IP is blocked due to too many failed login attempts.");
  }

  const geo = geoip.lookup(clientIp);
  console.log(`GeoIP Lookup for IP: ${clientIp}`, geo);

  if (!geo || geo.country !== "JO") {
    console.log(`Access denied for non-Jordan IP: ${clientIp}`);
    return res.status(403).send("Access is restricted to Jordan IPs only.");
  }

  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      failedAttempts[clientIp] = (failedAttempts[clientIp] || 0) + 1;
      console.log(`Failed attempts for ${clientIp}: ${failedAttempts[clientIp]}`);

      if (failedAttempts[clientIp] >= 5) {
        blockedIps.add(clientIp);
        console.log(`IP ${clientIp} has been blocked due to too many failed attempts.`);
      }

      await AuditLog.create({
        action: "Failed Login",
        details: `Failed login attempt with email: ${email} (User not found)`,
      });
      return res.status(400).send("User not found");
    }

    const isMatch = await argon2.verify(user.password, password); 
    
    if (!isMatch) {
      failedAttempts[clientIp] = (failedAttempts[clientIp] || 0) + 1;
      console.log(`Failed attempts for ${clientIp}: ${failedAttempts[clientIp]}`);

      if (failedAttempts[clientIp] >= 5) {
        blockedIps.add(clientIp);
        console.log(`IP ${clientIp} has been blocked due to too many failed attempts.`);
      }

      await AuditLog.create({
        action: "Failed Login",
        details: `Failed login attempt for user: ${email} (Invalid password)`,
      });
      return res.status(400).send("Invalid password");
    }

    if (!mfaCode) {
      mfaCodeMemory = Math.floor(100000 + Math.random() * 900000);
      mfaCodeExpiration = Date.now() + 5 * 60 * 1000;

      await sendVerificationCode(email, mfaCodeMemory);

      return res.status(200).send(
        "MFA code has been sent to your email. Please enter the code to complete login."
      );
    }

    if (Date.now() > mfaCodeExpiration) {
      return res.status(400).send("MFA code has expired");
    }

    if (String(mfaCode) !== String(mfaCodeMemory)) {
      await AuditLog.create({
        action: "Failed MFA Verification",
        details: `Failed MFA verification for user: ${email} from IP: ${clientIp}`,
      });
      return res.status(400).send("Invalid MFA code");
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, name: user.name, img: user.img },
      SECRET_KEY,
      { expiresIn: "20m" }
    );

    await AuditLog.create({
      action: "Successful Login",
      details: `Login successful for user: ${email} from IP: ${clientIp}`,
    });

    delete failedAttempts[clientIp];

    return res.status(200).json({
      message: "Login successful",
      token,
      name: user.name,
      role: user.role,
      id: user.id,
      img: user.img,
    });
  } catch (err) {
    console.error("Error during login process:", err);
    await AuditLog.create({
      action: "Login Error",
      details: `Error during login for email: ${email} from IP: ${clientIp}. Error: ${err.message}`,
    });
    res.status(500).send({ message: "Internal Server Error", error: err.message });
  }
};







exports.logout = async (req, res) => {
  const { token } = req.body;

  if (!token)
    return res.status(400).json(new ErrorResponse("Token is required"));

  try {
    // const decoded = jwt.verify(token, process.env.SECRET_KEY);
    // await client.del(`user:${decoded.id}:session`);
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("JWT Error:", error);

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json(new ErrorResponse("Invalid token"));
    } else if (error.name === "TokenExpiredError") {
      return res.status(401).json(new ErrorResponse("Token has expired"));
    } else {
      return res
        .status(500)
        .json(new ErrorResponse("Server error", error.message));
    }
  }
};

const saveResetToken = async (userId, resetToken) => {
  try {
    if (!userId || !resetToken) {
      return Promise.reject(new Error("Invalid parameters"));
    }

    const result = await User.update(
      {
        reset_token: resetToken,
        reset_token_expiration: Sequelize.fn(
          "DATE_ADD",
          Sequelize.fn("NOW"),
          Sequelize.literal("INTERVAL 1 HOUR")
        )
      },
      {
        where: { id: userId },

        limit: 1
      }
    );

    if (result[0] === 0) {
      throw new Error("User not found or no update performed");
    }

    return { message: "Reset token saved successfully" };
  } catch (err) {
    console.error("Error saving reset token:", err);

    return { error: err.message || "Error saving reset token" };
  }
};

exports.requestPasswordReset = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json(new ErrorResponse("Email is required"));
  }

  try {
    const user = await User.findOne({ email: email });
    if (!user) {
      return res.status(200).json({
        message: "The email does not exist. Please enter the correct email."
      });
    }

    const resetToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: "1h"
    });

    await saveResetToken(user.id, resetToken);

    const baseUrl = `process.env.BASE_URL || ${req.protocol}://${req.get(
      "host"
    )}`;
    const resetUrl = `${baseUrl}/resetPassword/${resetToken}`;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Password Reset",
      html: `
          <p>You requested a password reset. If you did not make this request, please ignore this email.</p>
          <p>Click the link below to reset your password. This link is valid for 1 hour:</p>
          <p><a href="${resetUrl}">Reset Password</a></p>
        `
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: "Password reset link sent to email" });
  } catch (err) {
    console.error("Request password reset error:", err);

    res.status(500).json(new ErrorResponse("Server error", err.message));
  }
};

exports.resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password, confirmPassword } = req.body;

  console.log("Password:", password); 
  console.log("Confirm Password:", confirmPassword); 

  if (password !== confirmPassword) {
    return res.status(400).send("Passwords do not match");
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    const userId = decoded.id;

    const hashedPassword = await bcrypt.hash(password, 10);

    
    await User.update({ password: hashedPassword }, { where: { id: userId } });

    
    await User.update(
      { reset_token: null, reset_token_expiration: null },
      { where: { id: userId } }
    );

    res.status(200).json({ message: "Password reset successful" });
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(400).send("Reset token has expired");
    } else if (err.name === "JsonWebTokenError") {
      return res.status(400).send("Invalid reset token");
    }
    console.error("Reset password error:", err);
    res.status(500).send("Server error");
  }
};
