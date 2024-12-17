// Controllers/BasmaTrainingController.js
const BasmaTraining = require('../Models/BasmaTraining');
const { ErrorResponse } = require('../Utils/validateInput');


exports.createBasmaTraining = async (req, res) => {
  try {
    const { title, descr } = req.body;

    
    if (!title || !descr) {
      return res.status(400).json(new ErrorResponse('Validation failed', ['Please enter all the required fields.']));
    }

    const newBasmaTraining = await BasmaTraining.create({ title, descr });

    res.status(201).json({
      message: 'BasmaTraining added successfully',
      basmaTraining: newBasmaTraining,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json(new ErrorResponse('Failed to add BasmaTraining', ['An error occurred while adding the BasmaTraining. Please try again later.']));
  }
};


exports.getAllBasmaTraining = async (req, res) => {
  try {
    const basmaTrainings = await BasmaTraining.findAll();
    res.status(200).json(basmaTrainings);
  } catch (error) {
    console.error(error);
    res.status(500).json(new ErrorResponse('Failed to retrieve BasmaTraining records', ['An error occurred while retrieving the BasmaTraining records.']));
  }
};


exports.getBasmaTrainingById = async (req, res) => {
  try {
    const { id } = req.params;
    const basmaTraining = await BasmaTraining.findByPk(id);

    if (!basmaTraining) {
      return res.status(404).json(new ErrorResponse('BasmaTraining not found', ['No BasmaTraining found with the given ID']));
    }

    res.status(200).json([basmaTraining]);
  } catch (error) {
    console.error(error);
    res.status(500).json(new ErrorResponse('Failed to retrieve BasmaTraining', ['An error occurred while retrieving the BasmaTraining.']));
  }
};


exports.updateBasmaTraining = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, descr } = req.body;

 
    if (!title || !descr) {
      return res.status(400).json(new ErrorResponse('Validation failed', ['Please enter all the required fields.']));
    }

    const basmaTraining = await BasmaTraining.findByPk(id);

    if (!basmaTraining) {
      return res.status(404).json(new ErrorResponse('BasmaTraining not found', ['No BasmaTraining found with the given ID']));
    }

    basmaTraining.title = title || basmaTraining.title;
    basmaTraining.descr = descr || basmaTraining.descr;

    await basmaTraining.save();

    res.status(200).json({
      message: 'BasmaTraining updated successfully',
      basmaTraining,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json(new ErrorResponse('Failed to update BasmaTraining', ['An error occurred while updating the BasmaTraining.']));
  }
};


exports.deleteBasmaTraining = async (req, res) => {
  try {
    const { id } = req.params;

    const basmaTraining = await BasmaTraining.findByPk(id);

    if (!basmaTraining) {
      return res.status(404).json(new ErrorResponse('BasmaTraining not found', ['No BasmaTraining found with the given ID']));
    }

    await basmaTraining.destroy();

    res.status(200).json({
      message: 'BasmaTraining deleted successfully',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json(new ErrorResponse('Failed to delete BasmaTraining', ['An error occurred while deleting the BasmaTraining.']));
  }
};
