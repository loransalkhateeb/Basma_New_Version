const AboutTeacher = require("../Models/AboutTeacher");
const multer = require("../Config/Multer");
const { validateInput, ErrorResponse } = require("../Utils/validateInput");
const { client } = require('../Utils/redisClient'); 

exports.createAboutTeacher = async (req, res) => {
  try {
    const { title, descr, para } = req.body || {};
    
   
    if (!title || !descr || !para) {
      return res
        .status(400)
        .json(new ErrorResponse("Validation failed", ["Title, description, and para are required"]));
    }

    const img = req.file ? req.file.filename : null;

   
    const validationErrors = validateInput({ title, descr, para });
    if (validationErrors.length > 0) {
      return res.status(400).json(new ErrorResponse("Validation failed", validationErrors));
    }

    const newHero = await AboutTeacher.create({ title, descr, para, img });

    
    await client.set(`aboutTeacher:${newHero.id}`, JSON.stringify(newHero), { EX: 3600 });

    res.status(201).json({
      message: "About Teacher created successfully",
      hero: newHero
    });
  } catch (error) {
    console.error(error);
    res.status(500).json(ErrorResponse("Failed to create About Teacher", ["An error occurred while creating the About Teacher. Please try again"]));
  }
};

exports.getAboutTeacher = async (req, res) => {
  try {
   
    const cachedData = await client.get("aboutTeachers:all");
    if (cachedData) {
      return res.status(200).json(JSON.parse(cachedData));
    }

    const aboutTeachers = await AboutTeacher.findAll();
    if (aboutTeachers.length === 0) {
      return res.status(404).json(new ErrorResponse("No AboutTeacher found"));
    }

    
    await client.setEx("aboutTeachers:all", 3600, JSON.stringify(aboutTeachers));

    res.status(200).json({
      message: "AboutTeachers retrieved successfully",
      aboutTeachers
    });
  } catch (error) {
    console.error(error);
    res.status(500).json(new ErrorResponse("Failed to retrieve AboutTeacher"));
  }
};

exports.getAboutTeacherById = async (req, res) => {
  try {
    const { id } = req.params;

    
    const cachedData = await client.get(`aboutTeacher:${id}`);
    if (cachedData) {
      return res.status(200).json(JSON.parse(cachedData));
    }

    const aboutTeacher = await AboutTeacher.findByPk(id);
    if (!aboutTeacher) {
      return res.status(404).json(ErrorResponse("AboutTeacher not found"));
    }

    
    await client.setEx(`aboutTeacher:${id}`, 3600, JSON.stringify(aboutTeacher));

    res.status(200).json({
      message: "AboutTeacher retrieved successfully",
      aboutTeacher: [aboutTeacher],  });
  } catch (error) {
    console.error(error);
    res.status(500).json(ErrorResponse("Failed to retrieve AboutTeacher"));
  }
};

exports.updateAboutTeacher = async (req, res) => {
  const { id } = req.params;
  const { title, descr, para } = req.body;
  
  try {
    if (!title || !descr || !para) {
      return res.status(400).json(new ErrorResponse("Validation failed", ["Title, description, and para are required"]));
    }

    const img = req.file ? req.file.filename : null;
    const validationErrors = validateInput({ title, descr, para });
    if (validationErrors.length > 0) {
      return res.status(400).json(new ErrorResponse("Validation failed", validationErrors));
    }

    const aboutTeacher = await AboutTeacher.findByPk(id);
    if (!aboutTeacher) {
      return res.status(404).json(ErrorResponse("Not Found", ["No AboutTeacher entry found with the given id"]));
    }

    aboutTeacher.title = title || aboutTeacher.title;
    aboutTeacher.descr = descr || aboutTeacher.descr;
    aboutTeacher.para = para || aboutTeacher.para;
    if (img) aboutTeacher.img = img;

    await aboutTeacher.save();

    
    await client.setEx(`aboutTeacher:${id}`, 3600, JSON.stringify(aboutTeacher));

    res.status(200).json({
      message: "About Teacher entry updated successfully",
      aboutTeacher
    });
  } catch (error) {
    console.error(error);
    res.status(500).json(ErrorResponse("Failed to update About Teacher", ["An error occurred while updating the About Teacher entry. Please try again"]));
  }
};

exports.deleteAboutTeacher = async (req, res) => {
  try {
    const { id } = req.params;
    const aboutTeacher = await AboutTeacher.findByPk(id);
    if (!aboutTeacher) {
      return res.status(404).json(ErrorResponse("AboutTeacher not found"));
    }

    await aboutTeacher.destroy();

    
    await client.del(`aboutTeacher:${id}`);

    res.status(200).json({
      message: "AboutTeacher deleted successfully"
    });
  } catch (error) {
    console.error(error);
    res.status(500).json(ErrorResponse("Failed to delete AboutTeacher", ["An error occurred while deleting the AboutTeacher entry. Please try again"]));
  }
};
