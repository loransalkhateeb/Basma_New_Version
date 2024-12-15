const express = require("express");
const router = express.Router();
const BasmaTrainingController = require("../Controllers/BasmaTrainningController");

const authMiddleWare = require('../MiddleWares/authMiddleware')
const rateLimiter = require('../MiddleWares/rateLimiter')

router.post('/create-basma-training',rateLimiter, BasmaTrainingController.createBasmaTraining);


router.get('/basma-trainings',rateLimiter, BasmaTrainingController.getAllBasmaTraining);


router.get('/basma-trainings/:id',rateLimiter, BasmaTrainingController.getBasmaTrainingById);


router.put('/update-basma-trainings/:id',rateLimiter, BasmaTrainingController.updateBasmaTraining);


router.delete('/delete-basma-trainings/:id',rateLimiter, BasmaTrainingController.deleteBasmaTraining);

module.exports = router;
