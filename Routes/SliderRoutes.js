const express = require("express");
const router = express.Router();
const upload = require("../Config/Multer");
const CarouselController = require("../Controllers/SliderController");

router.post(
  "/addSlider",
  upload.fields([{ name: "img", maxCount: 1 }, { name: "slider_img", maxCount: 1 }]),
  CarouselController.addSliders
);
router.get("/getSliderByPage/:page", CarouselController.getSliderByPage);
router.get("/getAllSliders", CarouselController.getSliders);
router.put(
  "/updateSlider/:id",
  upload.fields([{ name: "img", maxCount: 1 }, { name: "slider_img", maxCount: 1 }]),
  CarouselController.updateSlider
);
router.delete("/deleteSlider/:id", CarouselController.deleteSlide);
router.get("/getsliderbyid/:id", CarouselController.getSliderById);
router.delete("/deleteimgSlider/:id", CarouselController.deleteImgSlide);

module.exports = router;
