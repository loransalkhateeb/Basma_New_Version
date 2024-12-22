const BoxSlider = require('../Models/BoxSlider');
const { validateInput, ErrorResponse } = require('../Utils/ValidateInput');
const { client } = require('../Utils/redisClient');

exports.createBoxSlider = async (req, res) => {
  try {
    const { title, descr } = req.body || {};

    if (!title || !descr) {
      return res.status(400).json(ErrorResponse("Validation failed", ["All fields are required"]));
    }

    const validationErrors = validateInput({ title, descr });
    if (validationErrors.length > 0) {
      return res.status(400).json(ErrorResponse("Validation failed", validationErrors));
    }

    const newBoxSlider = await BoxSlider.create({ title, descr });

    // Cache the new BoxSlider for 1 hour
    await client.set(`boxSlider:${newBoxSlider.id}`, JSON.stringify(newBoxSlider), { EX: 3600 });

    res.status(201).json({
      message: "BoxSlider created successfully",
      boxSlider: newBoxSlider
    });
  } catch (error) {
    console.error(error);
    res.status(500).json(ErrorResponse("Failed to create BoxSlider", ["An error occurred while creating the BoxSlider. Please try again later."]));
  }
};

exports.getAllBoxSliders = async (req, res) => {
  try {
    const cachedData = await client.get('boxSliders:all');
    if (cachedData) {
      return res.status(200).json(JSON.parse(cachedData));
    }

    const boxSliders = await BoxSlider.findAll();

    if (boxSliders.length === 0) {
      return res.status(404).json(ErrorResponse("No BoxSlider records found"));
    }

    // Cache the BoxSliders list for 1 hour
    await client.setEx('boxSliders:all', 3600, JSON.stringify(boxSliders));

    res.status(200).json({
      message: "BoxSlider records retrieved successfully",
      boxSliders
    });
  } catch (error) {
    console.error(error);
    res.status(500).json(ErrorResponse("Failed to retrieve BoxSlider records", ["An error occurred while retrieving the records. Please try again later."]));
  }
};

exports.getBoxSliderById = async (req, res) => {
  try {
    const { id } = req.params;

    const cachedData = await client.get(`boxSlider:${id}`);
    if (cachedData) {
      return res.status(200).json(JSON.parse(cachedData));
    }

    const boxSlider = await BoxSlider.findByPk(id);

    if (!boxSlider) {
      return res.status(404).json(ErrorResponse("BoxSlider not found"));
    }

    // Cache the BoxSlider for 1 hour
    await client.setEx(`boxSlider:${id}`, 3600, JSON.stringify(boxSlider));

    res.status(200).json({
      message: "BoxSlider retrieved successfully",
      boxSlider
    });
  } catch (error) {
    console.error(error);
    res.status(500).json(ErrorResponse("Failed to retrieve BoxSlider", ["An error occurred while retrieving the BoxSlider. Please try again later."]));
  }
};

exports.updateBoxSlider = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, descr } = req.body;

    if (!title || !descr) {
      return res.status(400).json(ErrorResponse("Validation failed", ["All fields are required"]));
    }

    const validationErrors = validateInput({ title, descr });
    if (validationErrors.length > 0) {
      return res.status(400).json(ErrorResponse("Validation failed", validationErrors));
    }

    const boxSlider = await BoxSlider.findByPk(id);
    if (!boxSlider) {
      return res.status(404).json(ErrorResponse("BoxSlider not found"));
    }

    boxSlider.title = title || boxSlider.title;
    boxSlider.descr = descr || boxSlider.descr;

    await boxSlider.save();

    // Cache the updated BoxSlider for 1 hour
    await client.setEx(`boxSlider:${id}`, 3600, JSON.stringify(boxSlider));

    res.status(200).json({
      message: "BoxSlider updated successfully",
      boxSlider
    });
  } catch (error) {
    console.error(error);
    res.status(500).json(ErrorResponse("Failed to update BoxSlider", ["An error occurred while updating the BoxSlider. Please try again later."]));
  }
};

exports.deleteBoxSlider = async (req, res) => {
  try {
    const { id } = req.params;

    const boxSlider = await BoxSlider.findByPk(id);
    if (!boxSlider) {
      return res.status(404).json(ErrorResponse("BoxSlider not found"));
    }

    await boxSlider.destroy();

    // Remove from cache
    await client.del(`boxSlider:${id}`);

    res.status(200).json({
      message: "BoxSlider deleted successfully"
    });
  } catch (error) {
    console.error(error);
    res.status(500).json(ErrorResponse("Failed to delete BoxSlider", ["An error occurred while deleting the BoxSlider. Please try again later."]));
  }
};
