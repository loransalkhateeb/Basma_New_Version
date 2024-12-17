const About = require("../Models/AboutModel");
const { client } = require('../Utils/redisClient'); 

const { validateInput, ErrorResponse } = require("../Utils/validateInput");

exports.createAbout = async (req, res) => {
  try {
    const { title, descr } = req.body || {};

    if (!title || !descr) {
      return res
        .status(400)
        .json(ErrorResponse("Validation failed", ["Title and description are required"]));
    }

    const img = req.file ? req.file.filename : null;

    const validationErrors = validateInput({ title, descr });
    if (validationErrors.length > 0) {
      return res.status(400).json(new ErrorResponse("Validation failed", validationErrors));
    }

    const newHero = await About.create({ title, descr, img });


    await client.set(`about:${newHero.id}`, JSON.stringify(newHero), {
      EX: 3600,
    });

    res.status(201).json({
      message: "Hero created successfully",
      hero: newHero,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json(ErrorResponse("Failed to create Hero", ["An error occurred while creating the hero"]));
  }
};



exports.getAbout = async (req, res) => {
  try {
  
    await client.del("about:all");

    const data = await client.get("about:all");

    if (data) {
      return res.status(200).json(JSON.parse(data)); 
    } else {
     
      const aboutEntries = await About.findAll({
        attributes: ['id', 'title', 'descr', 'img'], 
        order: [['id', 'DESC']], 
      });

  
      await client.setEx("about:all", 3600, JSON.stringify(aboutEntries));

      res.status(200).json(aboutEntries);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json(ErrorResponse("Failed to fetch About entries", ["An error occurred while fetching the entries"]));
  }
};



exports.getAboutById = async (req, res) => {
  try {
    const { id } = req.params;

 
    const data = await client.get(`about:${id}`);

    if (data) {
  
      return res.status(200).json(JSON.parse(data));
    } else {
    
      const aboutEntry = await About.findOne({
        attributes: ['id', 'title', 'descr', 'img'],
        where: { id },
      });

      if (!aboutEntry) {
        return res.status(404).json(new ErrorResponse("About entry not found", ["No About entry found with the given id"]));
      }

    
      await client.set(`about:${id}`, JSON.stringify(aboutEntry), {
        EX: 3600, 
      });

     
      res.status(200).json(aboutEntry);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json(new ErrorResponse("Failed to fetch About entry", ["An error occurred while fetching the entry"]));
  }
};



exports.updateAbout = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, descr } = req.body;
    const image = req.file ? req.file.filename : null;

    const validationErrors = validateInput({ title, descr });
    if (validationErrors.length > 0) {
      return res.status(400).json(ErrorResponse("Validation failed", validationErrors));
    }

    const aboutEntry = await About.findByPk(id, {
      attributes: ['id', 'title', 'descr', 'img'],
    });

    if (!aboutEntry) {
      return res.status(404).json(ErrorResponse("About entry not found", ["No About entry found with the given id"]));
    }

    aboutEntry.title = title || aboutEntry.title;
    aboutEntry.descr = descr || aboutEntry.descr;
    aboutEntry.img = image || aboutEntry.img;

    await aboutEntry.save();

    client.setex(`about:${id}`, 3600, JSON.stringify(aboutEntry));

    res.status(200).json({
      message: "About entry updated successfully",
      aboutEntry,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json(new ErrorResponse("Failed to update About entry", ["An error occurred while updating the entry"]));
  }
};

exports.deleteAbout = async (req, res) => {
  try {
    const { id } = req.params;

    const aboutEntry = await About.findByPk(id, {
      attributes: ['id', 'title', 'descr', 'img'],
    });

    if (!aboutEntry) {
      return res.status(404).json(new ErrorResponse("About entry not found", ["No About entry found with the given id"]));
    }

    await aboutEntry.destroy();

    client.del(`about:${id}`);  

    res.status(200).json({ message: "About entry deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json(ErrorResponse("Failed to delete About entry", ["An error occurred while deleting the entry"]));
  }
};