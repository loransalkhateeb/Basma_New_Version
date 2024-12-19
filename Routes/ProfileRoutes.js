const express = require('express');
const router = express.Router();
const rateLimit = require('../MiddleWares/rateLimiter.js');
const upload = require('../Config/Multer.js')
const ProfileController = require('../Controllers/ProfileController.js')


router.get('/getAllUsersProfile',rateLimit,ProfileController.getAllUsers)

router.put('/updateProfile/:id',rateLimit,upload.single('img'),ProfileController.updateProfile)

router.get('/getProfileUsers/:id',rateLimit,ProfileController.getProfile)

module.exports = router;