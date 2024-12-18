const express = require('express');
const router = express.Router();
const ContactController = require('../Controllers/ContactController');
const rateLimiter = require('../MiddleWares/rateLimiter');
const authMiddleware = require('../MiddleWares/authMiddleware'); 


router.post('/add', rateLimiter,ContactController.addContact);
router.get('/', rateLimiter,ContactController.getcontactus);
router.put('/update/:id', rateLimiter,ContactController.updatecontactus);
router.get('/contactbyid/:id', rateLimiter,ContactController.getContactById);
module.exports = router;