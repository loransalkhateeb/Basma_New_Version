const AboutTeacher = require("../Models/AboutTeacher");
const multer = require("../Config/Multer");
const { validateInput, ErrorResponse } = require("../Utils/ValidateInput");
const { client } = require('../Utils/redisClient'); 

exports.createAboutTeacher = async (req, res) => {
  const { title, descr, para } = req.body || {};

  try {
    if (!title || !descr || !para) {
      return res.status(400).json(ErrorResponse("Validation failed", ["Title, description, and para are required"]));
    }

    const img = req.file ? req.file.filename : null;

    const validationErrors = validateInput({ title, descr, para });
    if (validationErrors.length > 0) {
      return res.status(400).json( ErrorResponse("Validation failed", validationErrors));
    }

    
    const newAboutTeacherPromise = AboutTeacher.create({ title, descr, para, img });
    const { page = 1, limit = 20 } = req.query;
    const cacheKey = `aboutTeacher:page:${page}:limit:${limit}`;
    const cacheDeletionPromise = client.del(cacheKey);

    
    const [newAboutTeacher] = await Promise.all([newAboutTeacherPromise, cacheDeletionPromise]);

    
    await client.setEx(`aboutTeacher:${newAboutTeacher.id}`, 3600, JSON.stringify(newAboutTeacher));

    res.status(201).json({
      message: "About Teacher created successfully",
      hero: newAboutTeacher
    });

  } catch (error) {
    console.error(error);
    res.status(500).json(ErrorResponse("Failed to create About Teacher", ["An error occurred while creating the About Teacher. Please try again"]));
  }
};


exports.getAboutTeacher = async (req, res) => {
  console.time('getAboutTeacher');

  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    client.del(`aboutTeacher:page:${page}:limit:${limit}`);

    const cacheKey = `aboutTeacher:page:${page}:limit:${limit}`;
    const cachedDataPromise = client.get(cacheKey);

    const aboutTeachersPromise = AboutTeacher.findAll({
      attributes: ["id", "title", "descr", "img","para"],
      order: [["id", "DESC"]],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    
    const [cachedData, aboutTeachers] = await Promise.all([cachedDataPromise, aboutTeachersPromise]);

    if (cachedData) {
      console.timeEnd('getAboutTeacher');
      return res.status(200).json(JSON.parse(cachedData));
    }

    await client.setEx(cacheKey, 3600, JSON.stringify(aboutTeachers));

    console.timeEnd('getAboutTeacher');
    res.status(200).json(aboutTeachers);
  } catch (error) {
    console.error("Error in getAboutTeacher:", error.message);
    res.status(500).json(
      ErrorResponse("Failed to fetch About Teacher entries", [
        "An internal server error occurred.",
      ])
    );
  }
};


exports.getAboutTeacherById = async (req, res) => {
  try {
    const { id } = req.params;

    const cacheKey = `aboutTeacher:${id}`;
    const cachedDataPromise = client.get(cacheKey);
    const aboutTeacherPromise = AboutTeacher.findByPk(id);

    const [cachedData, aboutTeacher] = await Promise.all([cachedDataPromise, aboutTeacherPromise]);

    if (cachedData) {
      return res.status(200).json(JSON.parse(cachedData));
    }

    if (!aboutTeacher) {
      return res.status(404).json(ErrorResponse("AboutTeacher not found"));
    }

    await client.setEx(cacheKey, 3600, JSON.stringify(aboutTeacher));

    res.status(200).json({
      aboutTeacher: [aboutTeacher], 
    });
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
      return res.status(400).json( ErrorResponse("Validation failed", ["Title, description, and para are required"]));
    }

    const img = req.file ? req.file.filename : null;
    const validationErrors = validateInput({ title, descr, para });
    if (validationErrors.length > 0) {
      return res.status(400).json(ErrorResponse("Validation failed", validationErrors));
    }

  
    const aboutTeacherPromise = AboutTeacher.findByPk(id);
    const cacheKey = `aboutTeacher:${id}`;
    const cacheDeletionPromise = client.del(cacheKey);

    const [aboutTeacher, _] = await Promise.all([aboutTeacherPromise, cacheDeletionPromise]);

    if (!aboutTeacher) {
      return res.status(404).json(ErrorResponse("Not Found", ["No AboutTeacher entry found with the given id"]));
    }

    aboutTeacher.title = title || aboutTeacher.title;
    aboutTeacher.descr = descr || aboutTeacher.descr;
    aboutTeacher.para = para || aboutTeacher.para;
    if (img) aboutTeacher.img = img;

    await aboutTeacher.save();

  
    await client.setEx(cacheKey, 3600, JSON.stringify(aboutTeacher));

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

    
    const aboutTeacherPromise = AboutTeacher.findByPk(id);
    const cacheKey = `aboutTeacher:${id}`;
    const cacheDeletionPromise = client.del(cacheKey);

    const [aboutTeacher, _] = await Promise.all([aboutTeacherPromise, cacheDeletionPromise]);

    if (!aboutTeacher) {
      return res.status(404).json(ErrorResponse("AboutTeacher not found"));
    }

    await aboutTeacher.destroy();

    const { page = 1, limit = 20 } = req.query;
    const cachePageKey = `aboutTeacher:page:${page}:limit:${limit}`;
    const cachedDataPromise = client.get(cachePageKey);

    const [cachedData] = await Promise.all([cachedDataPromise]);

    if (cachedData) {
      let aboutTeachers = JSON.parse(cachedData);
      aboutTeachers = aboutTeachers.filter(item => item.id !== id);

      await client.setEx(cachePageKey, 3600, JSON.stringify(aboutTeachers));
    }

    res.status(200).json({
      message: "AboutTeacher deleted successfully"
    });
  } catch (error) {
    console.error(error);
    res.status(500).json(ErrorResponse("Failed to delete AboutTeacher", ["An error occurred while deleting the AboutTeacher entry. Please try again"]));
  }
};
