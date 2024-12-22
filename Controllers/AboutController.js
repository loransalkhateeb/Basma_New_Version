const About = require("../Models/AboutModel");
const { client } = require('../Utils/redisClient');
const { validateInput, ErrorResponse } = require("../Utils/ValidateInput");

exports.createAbout = async (req, res) => {
  try {
    const { title, descr } = req.body || {};

    if (!title || !descr) {
      return res
        .status(400)
        .json(ErrorResponse("Validation failed", ["Title and description are required"]));
    }

    const img = req.file?.filename || null;

    const validationErrors = validateInput({ title, descr });
    if (validationErrors.length > 0) {
      return res.status(400).json(ErrorResponse("Validation failed", validationErrors));
    }

    const newHero = await About.create({ title, descr, img });

    await client.set(`about:${newHero.id}`, JSON.stringify(newHero), { EX: 3600 });

    res.status(201).json({
      message: "About Us created successfully",
      hero: newHero,
    });
  } catch (error) {
    console.error("Error in createAbout:", error.message);
    res.status(500).json(ErrorResponse("Failed to create Hero", ["An internal server error occurred."]));
  }
};

exports.getAbout = async (req, res) => {
  try {
    const cachedData = await client.get("about:all");

    if (cachedData) {
      return res.status(200).json(JSON.parse(cachedData));
    }

    const aboutEntries = await About.findAll({
      attributes: ['id', 'title', 'descr', 'img'],
      order: [['id', 'DESC']],
    });

    await client.setEx("about:all", 3600, JSON.stringify(aboutEntries));

    res.status(200).json(aboutEntries);
  } catch (error) {
    console.error("Error in getAbout:", error.message);
    res.status(500).json(ErrorResponse("Failed to fetch About entries", ["An internal server error occurred."]));
  }
};

exports.getAboutById = async (req, res) => {
  try {
    const { id } = req.params;

    const cachedData = await client.get(`about:${id}`);
    if (cachedData) {
      return res.status(200).json(JSON.parse(cachedData));
    }

    const aboutEntry = await About.findOne({
      attributes: ['id', 'title', 'descr', 'img'],
      where: { id },
    });

    if (!aboutEntry) {
      return res.status(404).json(ErrorResponse("About entry not found", ["No About entry found with the given id"]));
    }

    await client.set(`about:${id}`, JSON.stringify(aboutEntry), { EX: 3600 });

    res.status(200).json(aboutEntry);
  } catch (error) {
    console.error("Error in getAboutById:", error.message);
    res.status(500).json(ErrorResponse("Failed to fetch About entry", ["An internal server error occurred."]));
  }
};

exports.updateAbout = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, descr } = req.body;
    const image = req.file?.filename || null;

    const validationErrors = validateInput({ title, descr });
    if (validationErrors.length > 0) {
      return res.status(400).json(ErrorResponse("Validation failed", validationErrors));
    }

    const aboutEntry = await About.findByPk(id);
    if (!aboutEntry) {
      return res.status(404).json(ErrorResponse("About entry not found", ["No About entry found with the given id"]));
    }

    aboutEntry.title = title || aboutEntry.title;
    aboutEntry.descr = descr || aboutEntry.descr;
    aboutEntry.img = image || aboutEntry.img;

    await aboutEntry.save();

    await client.setEx(`about:${id}`, 3600, JSON.stringify(aboutEntry));


    client.setEx(`about:${id}`, 3600, JSON.stringify(aboutEntry));

    res.status(200).json({
      message: "About entry updated successfully",
      aboutEntry,
    });
  } catch (error) {
    console.error("Error in updateAbout:", error.message);
    res.status(500).json(ErrorResponse("Failed to update About entry", ["An internal server error occurred."]));
  }
};

exports.deleteAbout = async (req, res) => {
  try {
    const { id } = req.params;

    const aboutEntry = await About.findByPk(id);
    if (!aboutEntry) {
      return res.status(404).json(ErrorResponse("About entry not found", ["No About entry found with the given id"]));
    }

    await aboutEntry.destroy();
    await client.del(`about:${id}`);

    res.status(200).json({ message: "About entry deleted successfully" });
  } catch (error) {
    console.error("Error in deleteAbout:", error.message);
    res.status(500).json(ErrorResponse("Failed to delete About entry", ["An internal server error occurred."]));
  }
};
