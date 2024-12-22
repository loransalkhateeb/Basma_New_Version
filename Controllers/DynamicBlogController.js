const { client } = require('../Utils/redisClient');
const { validateInput, ErrorResponse } = require("../Utils/ValidateInput");
const DynamicBlog = require("../Models/DynamicBlogModel"); 

exports.addDynamicBlog = async (req, res) => {
  try {
    const { title, descr } = req.body || {};

    if (!title || !descr) {
      return res
        .status(400)
        .json(ErrorResponse("Validation failed", ["Title and description are required"]));
    }

    const validationErrors = validateInput({ title, descr });
    if (validationErrors.length > 0) {
      return res.status(400).json(new ErrorResponse("Validation failed", validationErrors));
    }

   
    const newDynamicBlog = await DynamicBlog.create({ title, descr });

   
    await client.set(`dynamicblog:${newDynamicBlog.id}`, JSON.stringify(newDynamicBlog), { EX: 3600 });

    res.status(201).json({
      message: "Dynamic blog created successfully",
      dynamicBlog: newDynamicBlog,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json(ErrorResponse("Failed to create dynamic blog", ["An error occurred while creating the blog"]));
  }
};

exports.getDynamicBlogs = async (req, res) => {
  try {
    await client.del("dynamicblog:all");
    const data = await client.get("dynamicblog:all");

    if (data) {
      return res.status(200).json(JSON.parse(data)); 
    } else {
     
      const dynamicBlogs = await DynamicBlog.findAll({
        attributes: ['id', 'title', 'descr'],
        order: [['id', 'DESC']], 
      });

     
      await client.setEx("dynamicblog:all", 3600, JSON.stringify(dynamicBlogs));

      res.status(200).json(dynamicBlogs);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json(ErrorResponse("Failed to fetch dynamic blogs", ["An error occurred while fetching the blogs"]));
  }
};

exports.getDynamicBlogById = async (req, res) => {
  try {
    const { id } = req.params;

   
    const data = await client.get(`dynamicblog:${id}`);

    if (data) {
      return res.status(200).json(JSON.parse(data));
    } else {
   
      const dynamicBlog = await DynamicBlog.findOne({
        attributes: ['id', 'title', 'descr'],
        where: { id },
      });

      if (!dynamicBlog) {
        return res.status(404).json(new ErrorResponse("Dynamic blog not found", ["No dynamic blog found with the given id"]));
      }

      
      await client.set(`dynamicblog:${id}`, JSON.stringify(dynamicBlog), { EX: 3600 });

      res.status(200).json(dynamicBlog);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json(new ErrorResponse("Failed to fetch dynamic blog", ["An error occurred while fetching the blog"]));
  }
};

exports.updateDynamicBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, descr } = req.body;

    const validationErrors = validateInput({ title, descr });
    if (validationErrors.length > 0) {
      return res.status(400).json(ErrorResponse("Validation failed", validationErrors));
    }

    const dynamicBlog = await DynamicBlog.findByPk(id);

    if (!dynamicBlog) {
      return res.status(404).json(ErrorResponse("Dynamic blog not found", ["No dynamic blog found with the given id"]));
    }

    dynamicBlog.title = title || dynamicBlog.title;
    dynamicBlog.descr = descr || dynamicBlog.descr;

    await dynamicBlog.save();

   
    await client.setEx(`dynamicblog:${id}`, 3600, JSON.stringify(dynamicBlog));

    res.status(200).json({
      message: "Dynamic blog updated successfully",
      dynamicBlog,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json(new ErrorResponse("Failed to update dynamic blog", ["An error occurred while updating the blog"]));
  }
};

exports.deleteDynamicBlog = async (req, res) => {
  try {
    const { id } = req.params;

    const dynamicBlog = await DynamicBlog.findByPk(id);

    if (!dynamicBlog) {
      return res.status(404).json(new ErrorResponse("Dynamic blog not found", ["No dynamic blog found with the given id"]));
    }

    await dynamicBlog.destroy();

   
    await client.del(`dynamicblog:${id}`);

    res.status(200).json({ message: "Dynamic blog deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json(ErrorResponse("Failed to delete dynamic blog", ["An error occurred while deleting the blog"]));
  }
};
