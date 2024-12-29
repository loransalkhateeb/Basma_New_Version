const BasmaTraining = require('../Models/BasmaTraining');
const { validateInput, ErrorResponse } = require('../Utils/ValidateInput');
const { client } = require('../Utils/redisClient');

exports.createBasmaTraining = async (req, res) => {
  try {
    const { title, descr } = req.body || {};

    if (!title || !descr) {
      return res.status(400).json(ErrorResponse("Validation failed", ["All fields are required"]));
    }

    const validationErrors = validateInput({ title, descr });
    if (validationErrors.length > 0) {
      return res.status(400).json(ErrorResponse("Validation failed", validationErrors));
    }

    const newBasmaTraining = await BasmaTraining.create({ title, descr });

    await client.set(`basmaTraining:${newBasmaTraining.id}`, JSON.stringify(newBasmaTraining), { EX: 3600 });

    res.status(201).json({
      message: "BasmaTraining created successfully",
      basmaTraining: newBasmaTraining
    });
  } catch (error) {
    console.error(error);
    res.status(500).json(ErrorResponse("Failed to create BasmaTraining", ["An error occurred while creating the BasmaTraining. Please try again later."]));
  }
};


exports.getAllBasmaTraining = async (req, res) => {
  try {
    client.del('basmaTrainings:all');

    const cachedData = await client.get('basmaTrainings:all');
    if (cachedData) {
      return res.status(200).json(JSON.parse(cachedData));
    }

    const basmaTrainings = await BasmaTraining.findAll();

    if (basmaTrainings.length === 0) {
      return res.status(404).json(ErrorResponse("No BasmaTraining records found"));
    }

    await client.setEx('basmaTrainings:all', 3600, JSON.stringify(basmaTrainings));

    res.status(200).json(
      basmaTrainings
    );
  } catch (error) {
    console.error(error);
    res.status(500).json(ErrorResponse("Failed to retrieve BasmaTraining records", ["An error occurred while retrieving the records. Please try again later."]));
  }
};

exports.getBasmaTrainingById = async (req, res) => {
  try {
    const { id } = req.params;

    const cachedData = await client.get(`basmaTraining:${id}`);
    if (cachedData) {
      return res.status(200).json([JSON.parse(cachedData)]);
    }

    const basmaTraining = await BasmaTraining.findByPk(id);

    if (!basmaTraining) {
      return res.status(404).json(ErrorResponse("BasmaTraining not found"));
    }

    await client.setEx(`basmaTraining:${id}`, 3600, JSON.stringify(basmaTraining));

    res.status(200).json({
      message: "BasmaTraining retrieved successfully",
      basmaTraining
    });
  } catch (error) {
    console.error(error);
    res.status(500).json(ErrorResponse("Failed to retrieve BasmaTraining", ["An error occurred while retrieving the BasmaTraining. Please try again later."]));
  }
};

exports.updateBasmaTraining = async (req, res) => {
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

    const basmaTraining = await BasmaTraining.findByPk(id);
    if (!basmaTraining) {
      return res.status(404).json(ErrorResponse("BasmaTraining not found"));
    }

    basmaTraining.title = title || basmaTraining.title;
    basmaTraining.descr = descr || basmaTraining.descr;

    await basmaTraining.save();

    await client.setEx(`basmaTraining:${id}`, 3600, JSON.stringify(basmaTraining));

    res.status(200).json({
      message: "BasmaTraining updated successfully",
      basmaTraining
    });
  } catch (error) {
    console.error(error);
    res.status(500).json(ErrorResponse("Failed to update BasmaTraining", ["An error occurred while updating the BasmaTraining. Please try again later."]));
  }
};

exports.deleteBasmaTraining = async (req, res) => {
  try {
    const { id } = req.params;

    const basmaTraining = await BasmaTraining.findByPk(id);
    if (!basmaTraining) {
      return res.status(404).json(ErrorResponse("BasmaTraining not found"));
    }

    await basmaTraining.destroy();

    await client.del(`basmaTraining:${id}`);

    res.status(200).json({
      message: "BasmaTraining deleted successfully"
    });
  } catch (error) {
    console.error(error);
    res.status(500).json(ErrorResponse("Failed to delete BasmaTraining", ["An error occurred while deleting the BasmaTraining. Please try again later."]));
  }
};
