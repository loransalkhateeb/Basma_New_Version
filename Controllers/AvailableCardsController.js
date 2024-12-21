const AvailableCards = require('../Models/AvailableCard');
const Governorate = require('../Models/Governorate');
const { validateInput, ErrorResponse } = require('../Utils/validateInput');

exports.createAvailableCard = async (req, res) => {
    try {
     
  
      const { governorate_id, name, location, mapslink, address, phone } = req.body;
  
      
      if (!governorate_id || !name || !location || !mapslink || !address || !phone) {
        return res.status(400).json(
           ErrorResponse("Validation failed", [
            "Please enter all the required fields."
          ])
        );
      }
  
   
 
      const newAvailableCard = await AvailableCards.create({
        governorate_id,
        name,
        location,
        mapslink,
        address,
        phone,
      });
  
     
      res.status(201).json({
        message: "Available Card created successfully",
        card: newAvailableCard
      });
    } catch (error) {
      console.error(error);
      
      res.status(500).json(
         ErrorResponse("Failed to create Available Card", [
          "An error occurred while creating the Available card. Please try again later."
        ])
      );
    }
  };
  


exports.getAllAvailableCards = async (req, res) => {
  try {
    const availableCards = await AvailableCards.findAll({
      include: [{ model: Governorate, as: 'governorate', attributes: ['governorate'] }]
    });

    res.status(200).json(availableCards);
  } catch (error) {
    console.error(error);
    res.status(500).json(new ErrorResponse('Failed to retrieve available cards', ['An error occurred while retrieving the cards']));
  }
};


exports.getAvailableCardById = async (req, res) => {
  try {
    const { id } = req.params;

    const card = await AvailableCards.findByPk(id, {
      include: [{ model: Governorate,as:"governorate", attributes: ['governorate'] }]
    });

    if (!card) {
      return res.status(404).json(new ErrorResponse('Card not found', ['No card found with the given ID']));
    }

    res.status(200).json([card]);
  } catch (error) {
    console.error(error);
    res.status(500).json(new ErrorResponse('Failed to retrieve available card', ['An error occurred while retrieving the card']));
  }
};


exports.updateAvailableCard = async (req, res) => {
  try {
    const { id } = req.params;
    const { governorate_id, name, location, mapslink, address, phone } = req.body;

    const validationErrors = validateInput({ governorate_id, name, location, mapslink, address, phone });
    if (validationErrors.length > 0) {
      return res.status(400).json(new ErrorResponse('Validation failed', validationErrors));
    }

    const card = await AvailableCards.findByPk(id);
    if (!card) {
      return res.status(404).json(new ErrorResponse('Card not found', ['No card found with the given ID']));
    }

    card.governorate_id = governorate_id || card.governorate_id;
    card.name = name || card.name;
    card.location = location || card.location;
    card.mapslink = mapslink || card.mapslink;
    card.address = address || card.address;
    card.phone = phone || card.phone;

    await card.save();

    res.status(200).json({
      message: 'Available card updated successfully',
      card
    });
  } catch (error) {
    console.error(error);
    res.status(500).json(new ErrorResponse('Failed to update available card', ['An error occurred while updating the card']));
  }
};


exports.deleteAvailableCard = async (req, res) => {
  try {
    const { id } = req.params;

    const card = await AvailableCards.findByPk(id);
    if (!card) {
      return res.status(404).json(new ErrorResponse('Card not found', ['No card found with the given ID']));
    }

    await card.destroy();

    res.status(200).json({
      message: 'Available card deleted successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json(new ErrorResponse('Failed to delete available card', ['An error occurred while deleting the card']));
  }
};


exports.getAllGovernorates = async (req, res) => {
  try {
    const governorates = await Governorate.findAll();

    res.status(200).json(governorates);
  } catch (error) {
    console.error(error);
    res.status(500).json(new ErrorResponse('Failed to retrieve governorates', ['An error occurred while retrieving the governorates']));
  }
};


exports.createGovernorate = async (req, res) => {
  try {
    const { governorate } = req.body;

    const validationErrors = validateInput({ governorate });
    if (validationErrors.length > 0) {
      return res.status(400).json(new ErrorResponse('Validation failed', validationErrors));
    }

    const newGovernorate = await Governorate.create({ governorate });

    res.status(201).json({
      message: 'Governorate created successfully',
      governorate: newGovernorate
    });
  } catch (error) {
    console.error(error);
    res.status(500).json(new ErrorResponse('Failed to create governorate', ['An error occurred while creating the governorate']));
  }
};


exports.deleteGovernorate = async (req, res) => {
  try {
    const { id } = req.params;

    const governorate = await Governorate.findByPk(id);
    if (!governorate) {
      return res.status(404).json(new ErrorResponse('Governorate not found', ['No governorate found with the given ID']));
    }

    await governorate.destroy();

    res.status(200).json({
      message: 'Governorate deleted successfully'
    });
  } catch (error) {
    console.error(error);
    return res.status(404).json(new ErrorResponse('Governorate not found', ['No governorate found with the given ID']));
  }
};

exports.getAvailableCardBygovermentId = async (req, res) => {
  try {
    const { governorate_id } = req.params;

    const card = await Governorate.findByPk(governorate_id, {
      include: [{
        model: AvailableCards,
        as: 'availableCards',
        attributes: ['name', 'location', 'mapslink', 'address', 'phone'],
      }]
    });

    if (!card) {
      return res.status(404).json(new ErrorResponse('Card not found', ['No card found with the given governorate_id']));
    }

    res.status(200).json(card);
  } catch (error) {
    console.error(error);
    res.status(500).json(new ErrorResponse('Failed to retrieve available card', ['An error occurred while retrieving the card']));
  }
};
