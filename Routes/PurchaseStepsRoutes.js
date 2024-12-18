const express = require('express');
const router = express.Router();
const multer = require('../Config/Multer'); 
const PurchaseStepsController = require('../Controllers/PurchaseStepsController.js'); 
const authMiddleware = require('../MiddleWares/authMiddleware');  
const rateLimiter = require('../MiddleWares/rateLimiter');  


router.post('/add', multer.single('img'), PurchaseStepsController.createPurchasesteps);

router.put('/update/:id', rateLimiter, multer.single('img'), PurchaseStepsController.updatepurchasesteps);

router.get('/', PurchaseStepsController.getpurchasesteps);


router.get('/PurchaseStepsbyid/:id', PurchaseStepsController.getpurchasestepsById);


router.delete('/delete/:id', PurchaseStepsController.deletepurchasesteps);

module.exports = router;
