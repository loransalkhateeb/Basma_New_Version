const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const upload = require('../Config/Multer.js')
const ProfileController = require('../Controllers/ProfileController.js')


router.get('/getAllUsersProfile',rateLimit,ProfileController.getAllUsers)

router.put('/updateProfile',rateLimit,upload.single('img'),ProfileController.updateProfile)

router.get('/getProfileUsers',rateLimit,ProfileController.getProfile)

module.exports = router;