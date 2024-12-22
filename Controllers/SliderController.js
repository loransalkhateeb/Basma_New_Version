const { Op } = require("sequelize");
const Slider = require("../Models/Slider");
const { ErrorResponse, validateInput } = require("../Utils/ValidateInput");
const fs = require("fs");
const path = require("path");

exports.addSliders = async (req, res) => {
  try {
    const { title, descr, btn_name, page } = req.body;

  
    const img = req.files && req.files["img"] ? req.files["img"][0].filename : null;
    const slider_img =
      req.files && req.files["slider_img"] ? req.files["slider_img"][0].filename : null;

   
    const validationErrors = validateInput({ page, slider_img });
    if (validationErrors.length > 0) {
      return res.status(400).json(ErrorResponse("Validation failed", validationErrors));
    }

    const newSlider = await Slider.create({
      title,
      descr,
      btn_name,
      img,
      slider_img,
      page,
    });

    res.status(201).json({
      message: "Slider added successfully",
      data: newSlider,
    });
  } catch (error) {
    console.error("Error adding slider:", error.message);
    res.status(500).json(ErrorResponse("Error adding slider", [error.message]));
  }
};

exports.getSliders = async (req, res) => {
  try {
    const sliders = await Slider.findAll();
    res.status(200).json(sliders);
  } catch (error) {
    console.error("Error fetching sliders:", error.message);
    res.status(500).json(ErrorResponse("Error fetching sliders", [error.message]));
  }
};

exports.getSliderByPage = async (req, res) => {
  try {
    const { page } = req.params;

    const sliders = await Slider.findAll({
      where: { page },
      attributes: ["img", "slider_img", "title", "descr", "btn_name", "page"],
    });

    if (!sliders.length) {
      return res.status(404).json(ErrorResponse("No sliders found for the specified page", []));
    }

    res.status(200).json(sliders);
  } catch (error) {
    console.error("Error fetching sliders by page:", error.message);
    res.status(500).json(ErrorResponse("Error fetching sliders by page", [error.message]));
  }
};

exports.updateSlider = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, descr, btn_name } = req.body;

    const slider = await Slider.findByPk(id);
    if (!slider) {
      return res.status(404).json(ErrorResponse("Slider not found", [`No slider with ID: ${id}`]));
    }

   
    let img = slider.img;
    let slider_img = slider.slider_img;

    if (req.files) {
      if (req.files["img"] && req.files["img"][0]) {
        img = req.files["img"][0].filename;
      }
      if (req.files["slider_img"] && req.files["slider_img"][0]) {
        slider_img = req.files["slider_img"][0].filename;
      }
    }

    
    await slider.update({ title, descr, btn_name, img, slider_img });

    res.status(200).json({
      message: "Slider updated successfully",
      data: slider,
    });
  } catch (error) {
    console.error("Error updating slider:", error.message);
    res.status(500).json(ErrorResponse("Error updating slider", [error.message]));
  }
};

exports.deleteSlide = async (req, res) => {
  try {
    const { id } = req.params;

    const slider = await Slider.findByPk(id);
    if (!slider) {
      return res.status(404).json(ErrorResponse("Slider not found", [`No slider with ID: ${id}`]));
    }

    await slider.destroy();

    res.status(200).json({
      message: "Slider deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting slider:", error.message);
    res.status(500).json(ErrorResponse("Error deleting slider", [error.message]));
  }
};

exports.getSliderById = async (req, res) => {
  try {
    const { id } = req.params;

    const slider = await Slider.findByPk(id);
    if (!slider) {
      return res.status(404).json(ErrorResponse("Slider not found", [`No slider with ID: ${id}`]));
    }

    res.status(200).json([slider]);
  } catch (error) {
    console.error("Error fetching slider by ID:", error.message);
    res.status(500).json(ErrorResponse("Error fetching slider by ID", [error.message]));
  }
};

exports.deleteImgSlide = async (req, res) => {
  try {
    const { id } = req.params;

    const slider = await Slider.findByPk(id);
    if (!slider) {
      return res.status(404).json(ErrorResponse("Slider not found", [`No slider with ID: ${id}`]));
    }

    const imgPath = slider.img ? path.join(__dirname, "../images", slider.img) : null;

    if (imgPath && fs.existsSync(imgPath)) {
      fs.unlinkSync(imgPath); 
    }

    await slider.update({ img: null }); 

    res.status(200).json({ message: "Image deleted successfully" });
  } catch (error) {
    console.error("Error deleting slider image:", error.message);
    res.status(500).json(ErrorResponse("Error deleting slider image", [error.message]));
  }
};
