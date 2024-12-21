const { register, login, logout, resetPassword ,requestPasswordReset } = require('../MiddleWares/verifyJWT.js');
const express = require('express');
const UserController = require('../Controllers/UserController.js'); 
const rateLimit = require('express-rate-limit');
const router = express.Router();
const upload = require('../Config/Multer.js')

const passwordResetLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 requests per window
    message: 'Too many password reset requests from this IP, please try again after 15 minutes.',
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  });

router.post('/register',upload.single('img'), register);

router.post('/CreateUser',upload.single('img'), UserController.createUser);
router.post('/login', login);
router.post('/logout',logout);
router.delete('/delete/:id',UserController.deleteStudent);
router.delete('/deleteadmin/:id', UserController.deleteAdmin);



router.post('/forgot-password', passwordResetLimiter,requestPasswordReset);
router.post('/reset-password/:token',resetPassword);



router.get('/getUserById',rateLimit,UserController.getUserById)
router.get('/getUserByRole/:role',UserController.getUserByRole)



module.exports = router;
