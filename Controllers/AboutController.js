const About = require("../Models/AboutModel");
const { validateInput, ErrorResponse } = require("../Utils/validateInput");

exports.createAbout = async (req, res) => {
  try {
    const { title, descr } = req.body || {};
    console.log("Title:", title);
    console.log("Description:", descr);

    if (!title || !descr) {
      return res
        .status(400)
        .json(
          new ErrorResponse("Validation failed", [
            "Title and description are required"
          ])
        );
    }

    const img = req.file ? req.file.filename : null;

    const validationErrors = validateInput({ title, descr });
    if (validationErrors.length > 0) {
      return res
        .status(400)
        .json(new ErrorResponse("Validation failed", validationErrors));
    }
    const newHero = await About.create({
      title,
      descr,
      img
    });

    res.status(201).json({
      message: "Hero created successfully",
      hero: newHero
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json(
        ErrorResponse("Failed to create Hero", [
          "An error occurred while creating the hero"
        ])
      );
  }
};

exports.getAbout = async (req, res) => {
  try {
    const aboutEntries = await About.findAll();
    res.status(200).json(aboutEntries);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json(
        ErrorResponse("Failed to fetch About entries", [
          "An error occurred while fetching the entries"
        ])
      );
  }
};

exports.getAboutById = async (req, res) => {
  try {
    const { id } = req.params;
    const aboutEntry = await About.findByPk(id);

    if (!aboutEntry) {
      return res
        .status(404)
        .json(
          ErrorResponse("About entry not found", [
            "No About entry found with the given id"
          ])
        );
    }

    res.status(200).json(aboutEntry);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json(
        ErrorResponse("Failed to fetch About entry", [
          "An error occurred while fetching the entry"
        ])
      );
  }
};

exports.updateAbout = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, descr } = req.body;
    const image = req.file ? req.file.filename : null;

    const validationErrors = validateInput({ title, descr });
    if (validationErrors.length > 0) {
      return res
        .status(400)
        .json(new ErrorResponse("Validation failed", validationErrors));
    }

    const aboutEntry = await About.findByPk(id);

    if (!aboutEntry) {
      return res
        .status(404)
        .json(
          ErrorResponse("About entry not found", [
            "No About entry found with the given id"
          ])
        );
    }

    aboutEntry.title = title || aboutEntry.title;
    aboutEntry.descr = descr || aboutEntry.descr;
    aboutEntry.img = image || aboutEntry.img;

    await aboutEntry.save();

    res.status(200).json({
      message: "About entry updated successfully",
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

exports.deleteAbout = async (req, res) => {
  try {
    const { id } = req.params;

    const aboutEntry = await About.findByPk(id);

    if (!aboutEntry) {
      return res
        .status(404)
        .json(
          ErrorResponse("About entry not found", [
            "No About entry found with the given id"
          ])
        );
    }

    await aboutEntry.destroy();

    res.status(200).json({ message: "About entry deleted successfully" });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json(
        ErrorResponse("Failed to delete About entry", [
          "An error occurred while deleting the entry"
        ])
      );
  }
};
