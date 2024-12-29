const About = require("../Models/AboutModel");
const { client } = require("../Utils/redisClient");
const { validateInput, ErrorResponse } = require("../Utils/ValidateInput");

exports.createAbout = async (req, res) => {
  try {
    const { title, descr } = req.body || {};

    if (!title || !descr) {
      return res
        .status(400)
        .json(
          ErrorResponse("Validation failed", [
            "Title and description are required",
          ])
        );
    }

    const img = req.file?.filename || null;

    const validationErrors = validateInput({ title, descr });
    if (validationErrors.length > 0) {
      return res
        .status(400)
        .json(ErrorResponse("Validation failed", validationErrors));
    }

    const newHeroPromise = About.create({ title, descr, img });

    const cacheDeletePromises = [client.del(`about:page:1:limit:20`)];

    const [newHero] = await Promise.all([
      newHeroPromise,
      ...cacheDeletePromises,
    ]);

    await client.set(`about:${newHero.id}`, JSON.stringify(newHero), {
      EX: 3600,
    });

    res.status(201).json({
      message: "About Us created successfully",
      hero: newHero,
    });
  } catch (error) {
    console.error("Error in createAbout:", error.message);
    res
      .status(500)
      .json(
        ErrorResponse("Failed to create Hero", [
          "An internal server error occurred.",
        ])
      );
  }
};

exports.getAbout = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    client.del(`about:page:${page}:limit:${limit}`);

    const cacheKey = `about:page:${page}:limit:${limit}`;
    const cachedData = await client.get(cacheKey);

    if (cachedData) {
      return res.status(200).json(JSON.parse(cachedData));
    }

    const aboutEntries = await About.findAll({
      attributes: ["id", "title", "descr", "img"],
      order: [["id", "DESC"]],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    await client.setEx(cacheKey, 3600, JSON.stringify(aboutEntries));

    res.status(200).json(aboutEntries);
  } catch (error) {
    console.error("Error in getAbout:", error.message);
    res
      .status(500)
      .json(
        ErrorResponse("Failed to fetch About entries", [
          "An internal server error occurred.",
        ])
      );
  }
};

exports.getAboutById = async (req, res) => {
  try {
    const { id } = req.params;

    const cacheKey = `about:${id}`;

   
    const cachedData = await client.get(cacheKey);
    if (cachedData) {
      return res.status(200).json(JSON.parse(cachedData));
    }

    const aboutEntry = await About.findOne({
      attributes: ["id", "title", "descr", "img"], 
      where: { id },
    });

    
    if (!aboutEntry) {
      return res
        .status(404)
        .json(
          ErrorResponse("About entry not found", [
            "No About entry found with the given ID.",
          ])
        );
    }

   
    await client.setEx(cacheKey, 3600, JSON.stringify(aboutEntry));

    
    return res.status(200).json(aboutEntry);
  } catch (error) {
    console.error("Error in getAboutById:", error);

    
    return res
      .status(500)
      .json(
        ErrorResponse("Failed to fetch About entry", [
          "An internal server error occurred. Please try again later.",
        ])
      );
  }
};


exports.updateAbout = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, descr } = req.body;
    const image = req.file?.filename || null;

   
    const validationErrors = validateInput({ title, descr });
    if (validationErrors.length > 0) {
      return res
        .status(400)
        .json(ErrorResponse("Validation failed", validationErrors));
    }

    
    const aboutEntry = await About.findByPk(id);
    if (!aboutEntry) {
      return res
        .status(404)
        .json(
          ErrorResponse("About entry not found", [
            "No About entry found with the given ID.",
          ])
        );
    }

    
    const updatedFields = {};
    if (title && title !== aboutEntry.title) updatedFields.title = title;
    if (descr && descr !== aboutEntry.descr) updatedFields.descr = descr;
    if (image) updatedFields.img = image;

    
    if (Object.keys(updatedFields).length > 0) {
      await aboutEntry.update(updatedFields);
    }

   
    const updatedData = aboutEntry.toJSON();
    const cacheKey = `about:${id}`;
    await client.setEx(cacheKey, 3600, JSON.stringify(updatedData));

   
    return res.status(200).json({
      message: "About entry updated successfully",
      aboutEntry: updatedData,
    });
  } catch (error) {
    console.error("Error in updateAbout:", error);

    return res
      .status(500)
      .json(
        ErrorResponse("Failed to update About entry", [
          "An internal server error occurred. Please try again later.",
        ])
      );
  }
};






exports.deleteAbout = async (req, res) => {
  try {
    const { id } = req.params;

    const [aboutEntry, _] = await Promise.all([
      About.findByPk(id),
      client.del(`about:${id}`), 
    ]);

    if (!aboutEntry) {
      return res.status(404).json(
        ErrorResponse("About entry not found", [
          "No About entry found with the given ID.",
        ])
      );
    }

    
    await aboutEntry.destroy();

    
    return res.status(200).json({ message: "About entry deleted successfully" });
  } catch (error) {
    console.error("Error in deleteAbout:", error);

    return res.status(500).json(
      ErrorResponse("Failed to delete About entry", [
        "An internal server error occurred. Please try again later.",
      ])
    );
  }
};


