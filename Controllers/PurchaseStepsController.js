const Purchasesteps = require("../Models/PurchaseSteps.js");
const { client } = require('../Utils/redisClient'); 

const { validateInput, ErrorResponse } = require("../Utils/ValidateInput.js");

exports.createPurchasesteps = async (req, res) => {
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

    const newHero = await Purchasesteps.create({ title, descr, img });


    await client.set(`Purchasesteps:${newHero.id}`, JSON.stringify(newHero), {
      EX: 3600,
    });

    res.status(201).json({
      message: "Purchasesteps created successfully",
      hero: newHero,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json(ErrorResponse("Failed to create Purchasesteps", ["An error occurred while creating the hero"]));
  }
};
exports.getpurchasesteps = async (req, res) => {
    try {
    
      await client.del("purchasesteps:all");
  
      const data = await client.get("purchasesteps:all");
  
      if (data) {
        return res.status(200).json(JSON.parse(data)); 
      } else {
       
        const purchasestepsEntries = await Purchasesteps.findAll({
          attributes: ['id', 'title', 'descr', 'img'], 
          order: [['id', 'DESC']], 
        });
  
    
        await client.setEx("purchasesteps:all", 3600, JSON.stringify(purchasestepsEntries));
  
        res.status(200).json(purchasestepsEntries);
      }
    } catch (error) {
      console.error(error);
      res.status(500).json(ErrorResponse("Failed to fetch purchasesteps entries", ["An error occurred while fetching the entries"]));
    }
  };
  exports.getpurchasestepsById = async (req, res) => {
    try {
      const { id } = req.params;
  
   
      const data = await client.get(`purchasesteps:${id}`);
  
      if (data) {
    
        return res.status(200).json([JSON.parse(data)]);
      } else {
      
        const purchasestepsEntry = await Purchasesteps.findOne({
          attributes: ['id', 'title', 'descr', 'img'],
          where: { id },
        });
  
        if (!purchasestepsEntry) {
          return res.status(404).json( ErrorResponse("purchasesteps entry not found", ["No purchasesteps entry found with the given id"]));
        }
  
      
        await client.set(`purchasesteps:${id}`, JSON.stringify(purchasestepsEntry), {
          EX: 3600, 
        });
  
       
        res.status(200).json(purchasestepsEntry);
      }
    } catch (error) {
      console.error(error);
      res.status(500).json( ErrorResponse("Failed to fetch purchasesteps entry", ["An error occurred while fetching the entry"]));
    }
  };
  
  exports.updatepurchasesteps= async (req, res) => {
    try {
      const { id } = req.params;
      const { title, descr } = req.body;
      const image = req.file ? req.file.filename : null;
  
      const validationErrors = validateInput({ title, descr });
      if (validationErrors.length > 0) {
        return res.status(400).json(ErrorResponse("Validation failed", validationErrors));
      }
  
      const purchasestepsEntry = await Purchasesteps.findByPk(id, {
        attributes: ['id', 'title', 'descr', 'img'],
      });
  
      if (!purchasestepsEntry) {
        return res.status(404).json(ErrorResponse("purchasestepsentry not found", ["No purchasestepsentry found with the given id"]));
      }
  
      purchasestepsEntry.title = title || purchasestepsEntry.title;
      purchasestepsEntry.descr = descr || purchasestepsEntry.descr;
      purchasestepsEntry.img = image || purchasestepsEntry.img;
  
      await purchasestepsEntry.save();
  
      await client.setEx(`purchasesteps:${id}`, 3600, JSON.stringify(purchasestepsEntry));
  
      res.status(200).json({
        message: "purchasestepsentry updated successfully",
        purchasestepsEntry,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json(new ErrorResponse("Failed to update purchasestepsentry", ["An error occurred while updating the entry"]));
    }
  };
  exports.deletepurchasesteps= async (req, res) => {
    try {
      const { id } = req.params;
  
      const purchasestepsEntry = await Purchasesteps.findByPk(id, {
        attributes: ['id', 'title', 'descr', 'img'],
      });
  
      if (!purchasestepsEntry) {
        return res.status(404).json(new ErrorResponse("purchasestepsentry not found", ["No purchasestepsentry found with the given id"]));
      }
  
      await purchasestepsEntry.destroy();
  
      client.del(`purchasesteps:${id}`);  
  
      res.status(200).json({ message: "purchasestepsentry deleted successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json(ErrorResponse("Failed to delete purchasestepsentry", ["An error occurred while deleting the entry"]));
    }
  };