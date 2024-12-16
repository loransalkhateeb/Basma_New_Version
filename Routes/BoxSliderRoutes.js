const express = require('express');
const boxSliderController = require('../Controllers/BoxSliderController'); 

const router = express.Router();


router.post('/createboxsliders', boxSliderController.createBoxSlider);


router.get('/boxsliders', boxSliderController.getAllBoxSliders);


router.get('/boxslidersById/:id', boxSliderController.getBoxSliderById);


router.put('/updateboxslider/:id', boxSliderController.updateBoxSlider);


router.delete('/DeleteBoxSliders/:id', boxSliderController.deleteBoxSlider);

module.exports = router;
