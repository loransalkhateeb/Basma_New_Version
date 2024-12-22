const { client } = require('../Utils/redisClient');
const { validateInput, ErrorResponse } = require("../Utils/ValidateInput");
const  Contact  = require("../Models/ContactModel");  

exports.addContact = async (req, res) => {
  try {
    const { title, descr,phone,email,facebook,whatsup } = req.body;

    const validationErrors = validateInput({ title, descr,phone,email,facebook,whatsup });
    if (validationErrors.length > 0) {
      return res.status(400).json(new ErrorResponse("Validation failed", validationErrors));
    }
    const newContact = await Contact.create({ title, descr,phone,email,facebook,whatsup });
    await client.set(`contact:${newContact.id}`, JSON.stringify(newContact), { EX: 3600 });
    res.status(201).json({
      message: "Contact added successfully",
      Contact: newContact,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json(ErrorResponse("Failed to create Contact", ["An error occurred while creating the Contact"]));
  }
};
exports.getcontactus = async (req, res) => {
    try {
        await client.del("contact:all");

      const data = await client.get("contact:all");
  
      if (data) {
        return res.status(200).json(JSON.parse(data));  
      } else {
       
        const contacts = await Contact.findAll({
          attributes: ['id', 'title', 'descr','phone','email', 'facebook', 'whatsup'],
          order: [['id', 'DESC']], 
        });
  
       
        await client.setEx("contact:all", 3600, JSON.stringify(contacts));
  
        res.status(200).json(contacts);
      }
    } catch (error) {
      console.error(error);
      res.status(500).json(ErrorResponse("Failed to fetch contacts", ["An error occurred while fetching the contacts"]));
    }
  };
  exports.updatecontactus= async (req, res) => {
    try {
      const { id } = req.params;
      const {  title, descr,phone,email,facebook,whatsup } = req.body;
  
      const validationErrors = validateInput({ title, descr,phone,email,facebook,whatsup });
      if (validationErrors.length > 0) {
        return res.status(400).json(ErrorResponse("Validation failed", validationErrors));
      }
  
      const contact= await Contact.findByPk(id);
  
      if (!contact) {
        return res.status(404).json(ErrorResponse("contact not found", ["No contact found with the given id"]));
      }
  
      contact.title = title || contact.title;
      contact.descr = descr || contact.descr;
      contact.phone = phone || contact.phone;
      contact.email = email || contact.email;
      contact.facebook = facebook || contact.facebook;
      contact.whatsup = whatsup || contact.whatsup;
  
      await contact.save();
    
      await client.setEx(`contact:${id}`, 3600, JSON.stringify(contact));
  
      res.status(200).json({
        message: "contact updated successfully",
        contact,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json(new ErrorResponse("Failed to update contact", ["An error occurred while updating the contact"]));
    }
  };
  exports.getContactById = async (req, res) => {
    try {
      const { id } = req.params;
  
      const data = await client.get(`contact:${id}`);
  
      if (data) {
        return res.status(200).json([JSON.parse(data)]); 
      } else {
        const contact = await Contact.findOne({
          attributes:['id', 'title', 'descr','phone','email', 'facebook', 'whatsup'],
          where: { id },
        });
  
        if (!contact) {
          return res.status(404).json(new ErrorResponse("Contact not found", ["No Contact found with the given id"]));
        }
  
        await client.set(`contact:${id}`, JSON.stringify(contact), { EX: 3600 });  
  
        res.status(200).json(contact);
      }
    } catch (error) {
      console.error(error);
      res.status(500).json(new ErrorResponse("Failed to fetch Contact", ["An error occurred while fetching the Contact"]));
    }
  };
  