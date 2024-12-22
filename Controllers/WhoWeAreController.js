const { client } = require('../Utils/redisClient');
const { validateInput, ErrorResponse } = require("../Utils/ValidateInput");
const  Whoweare  = require("../Models/WhoWeAre");


exports.addWhoweare = async (req, res) => {
  try {
    const { title } = req.body;

    if (!title) {
      return res.status(400).json(ErrorResponse("Validation failed", ["Title is required"]));
    }

    const validationErrors = validateInput({ title });
    if (validationErrors.length > 0) {
      return res.status(400).json(new ErrorResponse("Validation failed", validationErrors));
    }

 
    const newWhoweare = await Whoweare.create({ title });

    
    await client.set(`whoweare:${newWhoweare.id}`, JSON.stringify(newWhoweare), { EX: 3600 });

    res.status(201).json({
      message: "Whoweare added successfully",
      data: newWhoweare,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json(ErrorResponse("Failed to create Whoweare", ["An error occurred while creating the Whoweare"]));
  }
};

exports.getWhoweare = async (req, res) => {
  try {
    await client.del("whoweare:all");
    const data = await client.get("whoweare:all");

    if (data) {
      return res.status(200).json(JSON.parse(data)); 
    } else {
      
      const result = await Whoweare.findAll({
        attributes: ['id', 'title'], 
        order: [['id', 'DESC']],  
        limit: 10,  
      });

   
      await client.setEx("whoweare:all", 3600, JSON.stringify(result));

      res.status(200).json(result);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json(ErrorResponse("Failed to fetch Whoweare", ["An error occurred while fetching the Whoweare"]));
  }
};

exports.getWhoweareById = async (req, res) => {
  try {
    const { id } = req.params;

    const data = await client.get(`whoweare:${id}`);

    if (data) {
      return res.status(200).json([JSON.parse(data)]); 
    } else {
      const whoweare = await Whoweare.findByPk(id, {
        attributes: ['id', 'title'],  
      });

      if (!whoweare) {
        return res.status(404).json(new ErrorResponse("Whoweare not found", ["No Whoweare found with the given id"]));
      }

     
      await client.set(`whoweare:${id}`, JSON.stringify(whoweare), { EX: 3600 });

      res.status(200).json(whoweare);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json(new ErrorResponse("Failed to fetch Whoweare", ["An error occurred while fetching the Whoweare"]));
  }
};


exports.updateWhoweare = async (req, res) => {
  try {
    const { id } = req.params;
    const { title } = req.body;

    const validationErrors = validateInput({ title });
    if (validationErrors.length > 0) {
      return res.status(400).json(ErrorResponse("Validation failed", validationErrors));
    }

    const whoweare = await Whoweare.findByPk(id);

    if (!whoweare) {
      return res.status(404).json(ErrorResponse("Whoweare not found", ["No Whoweare found with the given id"]));
    }

    whoweare.title = title || whoweare.title;
    await whoweare.save();

 
    await client.setEx(`whoweare:${id}`, 3600, JSON.stringify(whoweare));

    res.status(200).json({
      message: "Whoweare updated successfully",
      data: whoweare,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json(new ErrorResponse("Failed to update Whoweare", ["An error occurred while updating the Whoweare"]));
  }
};


exports.deleteWhoweare = async (req, res) => {
  try {
    const { id } = req.params;

    const whoweare = await Whoweare.findByPk(id);

    if (!whoweare) {
      return res.status(404).json(new ErrorResponse("Whoweare not found", ["No Whoweare found with the given id"]));
    }

    await whoweare.destroy();

  
    await client.del(`whoweare:${id}`);

    res.status(200).json({ message: "Whoweare deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json(ErrorResponse("Failed to delete Whoweare", ["An error occurred while deleting the Whoweare"]));
  }
};
