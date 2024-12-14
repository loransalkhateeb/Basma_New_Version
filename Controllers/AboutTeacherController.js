const AboutTeacher = require("../Models/AboutTeacher");
const multer = require("../Config/Multer");
const { validateInput, ErrorResponse } = require("../Utils/validateInput");

exports.createAboutTeacher = async (req, res) => {
  try {
    const { title, descr, para } = req.body || {};
    console.log("Title:", title);
    console.log("Description:", descr);
    console.log("Para", para);

    if (!title || !descr || !para) {
      return res
        .status(400)
        .json(
          new ErrorResponse("Validation failed", [
            "Title and description and para are required"
          ])
        );
    }

    const img = req.file ? req.file.filename : null;

    const validationErrors = validateInput({ title, descr, para });
    if (validationErrors.length > 0) {
      return res
        .status(400)
        .json(new ErrorResponse("Validation failed", validationErrors));
    }
    const newHero = await AboutTeacher.create({
      title,
      descr,
      para,
      img
    });

    res.status(201).json({
      message: "About Teacher created successfully",
      hero: newHero
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json(
        ErrorResponse("Failed to create About Teacher", [
          "An error occurred while creating the About Teahcer Please try again"
        ])
      );
  }
};

exports.getAboutTeacher = async (req, res) => {
  try {
    const aboutTeachers = await AboutTeacher.findAll();

    if (aboutTeachers.length === 0) {
      return res.status(404).json(new ErrorResponse("No AboutTeacher found"));
    }

    res.status(200).json({
      message: "AboutTeacher retrieved successfully",
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

    const aboutTeacher = await AboutTeacher.findByPk(id);
    if (!aboutTeacher) {
      return res.status(404).json(ErrorResponse("AboutTeacher not found"));
    }

    res.status(200).json({
      message: "AboutTeacher retrieved successfully",
      aboutTeacher
    });
  } catch (error) {
    console.error(error);
    res.status(500).json(ErrorResponse("Failed to retrieve AboutTeacher"));
  }
};



exports.updateAboutTeacher = async (req, res) => {
  try {
    const { id } = req.params; 
    const { title, descr, para } = req.body; 
    console.log("Title:", title);
    console.log("Description:", descr);
    console.log("Para:", para);

 
    if (!title || !descr || !para) {
      return res
        .status(400)
        .json(
          ErrorResponse("Validation failed", [
            "Title, description, and para are required"
          ]) 
        );
    }


    const img = req.file ? req.file.filename : null;

   
    const validationErrors = validateInput({ title, descr, para });
    if (validationErrors.length > 0) {
      return res
        .status(400)
        .json(ErrorResponse("Validation failed", validationErrors)); 
    }

   
    const aboutEntry = await AboutTeacher.findByPk(id);
    if (!aboutEntry) {
      return res
        .status(404)
        .json(
          ErrorResponse("Not Found", [
            "No About Teacher entry found with the given id"
          ]) 
        );
    }


    aboutEntry.title = title || aboutEntry.title;
    aboutEntry.descr = descr || aboutEntry.descr;
    aboutEntry.para = para || aboutEntry.para;


    if (img) {
      aboutEntry.img = img;
    }

    await aboutEntry.save();

   
    res.status(200).json({
      message: "About Teacher entry updated successfully",
      aboutEntry
    });
  } catch (error) {
    console.error(error);

    res
      .status(500)
      .json(
        ErrorResponse("Failed to update About entry", [
          "An error occurred while updating the entry"
        ]) 
      );
  }
};

exports.deleteAboutTeacher = async (req, res) => {
  try {
    const { id } = req.params;

   
    const aboutTeacher = await AboutTeacher.findByPk(id);
    if (!aboutTeacher) {
      return res.status(404).json( ErrorResponse("AboutTeacher not found"));
    }


    await aboutTeacher.destroy();

    res.status(200).json({
      message: "AboutTeacher deleted successfully"
    });
  } catch (error) {
    console.error(error);
    res.status(500).json( ErrorResponse("Failed to delete AboutTeacher"));
  }
};
