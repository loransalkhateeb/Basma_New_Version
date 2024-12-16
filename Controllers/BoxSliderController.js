const { validateInput, ErrorResponse } = require('../Utils/validateInput');
const BoxSlider = require('../Models/BoxSlider'); 


exports.createBoxSlider = async (req, res) => {
  try {
    const { title, descr } = req.body || {};

    
    if (!title || !descr) {
      return res.status(400).json(
        ErrorResponse("Validation failed", ["All fields are required. Please fill all fields."])
      );
    }

    
    const validationErrors = validateInput({ title, descr });
    if (validationErrors.length > 0) {
      return res.status(400).json(ErrorResponse("Validation failed", validationErrors));
    }

    
    const newBoxSlider = await BoxSlider.create({ title, descr });

    res.status(201).json({
      message: "BoxSlider created successfully",
      boxSlider: newBoxSlider
    });
  } catch (error) {
    console.error(error);
    res.status(500).json(
      ErrorResponse("Failed to create BoxSlider", [
        "An error occurred while creating the new BoxSlider. Please try again later."
      ])
    );
  }
};


exports.getAllBoxSliders = async (req, res) => {
  try {
    const boxSliders = await BoxSlider.findAll();
    res.status(200).json(boxSliders);
  } catch (error) {
    console.error(error);
    res.status(500).json(
      ErrorResponse("Failed to fetch BoxSliders", ["An error occurred while fetching the BoxSliders."])
    );
  }
};


exports.getBoxSliderById = async (req, res) => {
  try {
    const { id } = req.params;
    const boxSlider = await BoxSlider.findByPk(id);

    if (!boxSlider) {
      return res.status(404).json(
        ErrorResponse("BoxSlider not found", [`No BoxSlider found with the given ID: ${id}`])
      );
    }

    res.status(200).json(boxSlider);
  } catch (error) {
    console.error(error);
    res.status(500).json(
      ErrorResponse("Failed to fetch BoxSlider", ["An error occurred while fetching the BoxSlider."])
    );
  }
};


exports.updateBoxSlider = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, descr } = req.body;

  
    if (!title || !descr) {
      return res.status(400).json(
        ErrorResponse("Validation failed", ["All fields are required. Please fill all fields."])
      );
    }

   
    const validationErrors = validateInput({ title, descr });
    if (validationErrors.length > 0) {
      return res.status(400).json(ErrorResponse("Validation failed", validationErrors));
    }

    const boxSlider = await BoxSlider.findByPk(id);
    if (!boxSlider) {
      return res.status(404).json(
        ErrorResponse("BoxSlider not found", [`No BoxSlider found with the given ID: ${id}`])
      );
    }

    boxSlider.title = title || boxSlider.title;
    boxSlider.descr = descr || boxSlider.descr;

    await boxSlider.save();

    res.status(200).json({
      message: "BoxSlider updated successfully",
      boxSlider
    });
  } catch (error) {
    console.error(error);
    res.status(500).json(
      ErrorResponse("Failed to update BoxSlider", ["An error occurred while updating the BoxSlider."])
    );
  }
};


exports.deleteBoxSlider = async (req, res) => {
  try {
    const { id } = req.params;

    const boxSlider = await BoxSlider.findByPk(id);
    if (!boxSlider) {
      return res.status(404).json(
        ErrorResponse("BoxSlider not found", [`No BoxSlider found with the given ID: ${id}`])
      );
    }

    await boxSlider.destroy();

    res.status(200).json({
      message: "BoxSlider deleted successfully"
    });
  } catch (error) {
    console.error(error);
    res.status(500).json(
      ErrorResponse("Failed to delete BoxSlider", ["An error occurred while deleting the BoxSlider."])
    );
  }
};
