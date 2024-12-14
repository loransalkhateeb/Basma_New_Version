const express = require('express');
const router = express.Router();
const multer = require('../Config/Multer'); 
const AboutController = require('../Controllers/AboutController'); 
const authMiddleware = require('../MiddleWares/authMiddleware');  
const rateLimiter = require('../MiddleWares/rateLimiter');  


router.post('/createabout', multer.single('img'), AboutController.createAbout);

router.put('/updateabout/:id', rateLimiter, multer.single('img'), AboutController.updateAbout);

router.get('/getabout', AboutController.getAbout);


router.get('/getaboutById/:id', AboutController.getAboutById);


router.delete('/deleteabout/:id', AboutController.deleteAbout);

module.exports = router;
