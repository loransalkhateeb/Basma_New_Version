const { client } = require('../Utils/redisClient');
const { validateInput, ErrorResponse } = require("../Utils/ValidateInput");
const  Faq  = require("../Models/FaqModel");  

exports.addFaq = async (req, res) => {
  try {
    const { ques, ans } = req.body;

    if (!ques || !ans) {
      return res
        .status(400)
        .json(ErrorResponse("Validation failed", ["Question and answer are required"]));
    }

    const validationErrors = validateInput({ ques, ans });
    if (validationErrors.length > 0) {
      return res.status(400).json(new ErrorResponse("Validation failed", validationErrors));
    }

    
    const newFaq = await Faq.create({ ques, ans });

  
    await client.set(`faq:${newFaq.id}`, JSON.stringify(newFaq), { EX: 3600 });

    res.status(201).json({
      message: "FAQ added successfully",
      faq: newFaq,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json(ErrorResponse("Failed to create FAQ", ["An error occurred while creating the FAQ"]));
  }
};

exports.getFaq = async (req, res) => {
  try {
    await client.del("faq:all");
    const data = await client.get("faq:all");

    if (data) {
      return res.status(200).json(JSON.parse(data));  
    } else {
     
      const faqs = await Faq.findAll({
        attributes: ['id', 'ques', 'ans'],
        order: [['id', 'DESC']], 
        limit: 10,
      });

     
      await client.setEx("faq:all", 3600, JSON.stringify(faqs));

      res.status(200).json(faqs);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json(ErrorResponse("Failed to fetch FAQs", ["An error occurred while fetching the FAQs"]));
  }
};

exports.getFaqById = async (req, res) => {
  try {
    const { id } = req.params;

    const data = await client.get(`faq:${id}`);

    if (data) {
      return res.status(200).json(JSON.parse(data)); 
    } else {
      const faq = await Faq.findOne({
        attributes: ['id', 'ques', 'ans'],
        where: { id },
      });

      if (!faq) {
        return res.status(404).json(new ErrorResponse("FAQ not found", ["No FAQ found with the given id"]));
      }

      await client.set(`faq:${id}`, JSON.stringify(faq), { EX: 3600 });  

      res.status(200).json(faq);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json(new ErrorResponse("Failed to fetch FAQ", ["An error occurred while fetching the FAQ"]));
  }
};

exports.updateFaq = async (req, res) => {
  try {
    const { id } = req.params;
    const { ques, ans } = req.body;

    const validationErrors = validateInput({ ques, ans });
    if (validationErrors.length > 0) {
      return res.status(400).json(ErrorResponse("Validation failed", validationErrors));
    }

    const faq = await Faq.findByPk(id);

    if (!faq) {
      return res.status(404).json(ErrorResponse("FAQ not found", ["No FAQ found with the given id"]));
    }

    faq.ques = ques || faq.ques;
    faq.ans = ans || faq.ans;

    await faq.save();

  
    await client.setEx(`faq:${id}`, 3600, JSON.stringify(faq));

    res.status(200).json({
      message: "FAQ updated successfully",
      faq,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json(new ErrorResponse("Failed to update FAQ", ["An error occurred while updating the FAQ"]));
  }
};

exports.deleteFaq = async (req, res) => {
  try {
    const { id } = req.params;

    const faq = await Faq.findByPk(id);

    if (!faq) {
      return res.status(404).json(new ErrorResponse("FAQ not found", ["No FAQ found with the given id"]));
    }

    await faq.destroy();

 
    await client.del(`faq:${id}`);

    res.status(200).json({ message: "FAQ deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json(ErrorResponse("Failed to delete FAQ", ["An error occurred while deleting the FAQ"]));
  }
};
