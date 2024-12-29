const { client } = require('../Utils/redisClient');
const { validateInput, ErrorResponse } = require("../Utils/ValidateInput");
const BoxSlider = require("../Models/BoxUnderSliderModel");

exports.addBoxSlider = async (req, res) => {
  try {
    const { title, descr } = req.body;

   
    if (!title || !descr) {
      return res.status(400).json(ErrorResponse("Validation failed", ["Title and description are required"]));
    }

    const validationErrors = validateInput({ title, descr });
    if (validationErrors.length > 0) {
      return res.status(400).json(new ErrorResponse("Validation failed", validationErrors));
    }

 
    const newBoxSlider = await BoxSlider.create({ title, descr });

   
    await client.set(`boxslider:${newBoxSlider.id}`, JSON.stringify(newBoxSlider), { EX: 3600 });

    res.status(201).json({
      message: "BoxSlider added successfully",
      boxSlider: newBoxSlider,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json(ErrorResponse("Failed to create BoxSlider", ["An error occurred while creating the BoxSlider"]));
  }
};

exports.getBoxSliders = async (req, res) => {
  try {
    
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    client.del(`BoxSlider:page:${page}:limit:${limit}`);

    const cacheKey = `BoxSlider:page:${page}:limit:${limit}`;

    const cachedData = await client.get(cacheKey);
    if (cachedData) {
      return res.status(200).json(JSON.parse(cachedData));
    }

 
    const boxSliders = await BoxSlider.findAll({
      attributes: ['id', 'title', 'descr'], 
      order: [['id', 'DESC']],            
      limit: parseInt(limit),              
      offset: parseInt(offset),          
    });

    
    await client.setEx(cacheKey, 3600, JSON.stringify(boxSliders));

  
    return res.status(200).json(boxSliders);
  } catch (error) {
    console.error("Error fetching BoxSliders:", error.message);
    return res.status(500).json(
      ErrorResponse("Failed to fetch BoxSliders", [
        "An error occurred while fetching the BoxSliders",
      ])
    );
  }
};


exports.getBoxSliderById = async (req, res) => {
  try {
    const { id } = req.params;

    await client.del("boxslider:all");
  
    const data = await client.get(`boxslider:${id}`);

    if (data) {
      return res.status(200).json([JSON.parse(data)]); 
    } else {
      
      const boxSlider = await BoxSlider.findOne({
        attributes: ['id', 'title', 'descr'],
        where: { id },
      });

      if (!boxSlider) {
        return res.status(404).json(new ErrorResponse("BoxSlider not found", ["No BoxSlider found with the given id"]));
      }

      
      await client.set(`boxslider:${id}`, JSON.stringify(boxSlider), { EX: 3600 });

      res.status(200).json(boxSlider);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json(new ErrorResponse("Failed to fetch BoxSlider", ["An error occurred while fetching the BoxSlider"]));
  }
};

exports.updateBoxSlider = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, descr } = req.body;

   
    const validationErrors = validateInput({ title, descr });
    if (validationErrors.length > 0) {
      return res.status(400).json(ErrorResponse("Validation failed", validationErrors));
    }

    const boxSlider = await BoxSlider.findByPk(id);

    if (!boxSlider) {
      return res.status(404).json(ErrorResponse("BoxSlider not found", ["No BoxSlider found with the given id"]));
    }

    
    boxSlider.title = title || boxSlider.title;
    boxSlider.descr = descr || boxSlider.descr;

    await boxSlider.save();

    
    await client.setEx(`boxslider:${id}`, 3600, JSON.stringify(boxSlider));

    res.status(200).json({
      message: "BoxSlider updated successfully",
      boxSlider,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json(new ErrorResponse("Failed to update BoxSlider", ["An error occurred while updating the BoxSlider"]));
  }
};

exports.deleteBoxSlider = async (req, res) => {
  try {
    const { id } = req.params;

    const boxSlider = await BoxSlider.findByPk(id);

    if (!boxSlider) {
      return res.status(404).json(new ErrorResponse("BoxSlider not found", ["No BoxSlider found with the given id"]));
    }

    await boxSlider.destroy();

   
    await client.del(`boxslider:${id}`);

    res.status(200).json({ message: "BoxSlider deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json(ErrorResponse("Failed to delete BoxSlider", ["An error occurred while deleting the BoxSlider"]));
  }
};
