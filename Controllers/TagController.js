const { client } = require('../Utils/redisClient');
const { ErrorResponse, validateInput } = require("../Utils/ValidateInput");
const Blog = require('../Models/BlogsModel')
const Tag = require('../Models/TagModel')




exports.addTag = async (req, res) => {
    try {
      const { tag_name, blog_id } = req.body;
  
      if (!tag_name || !blog_id) {
        return res.status(400).json(ErrorResponse("Validation failed", ["Tag name and blog ID are required"]));
      }
  
      const validationErrors = validateInput({ tag_name, blog_id });
      if (validationErrors.length > 0) {
        return res.status(400).json(new ErrorResponse("Validation failed", validationErrors));
      }
  
      const newTag = await Tag.create({ tag_name, blog_id });
  
      
      await client.set(`tag:${newTag.id}`, JSON.stringify(newTag), { EX: 3600 });
  
      res.status(201).json({
        message: "Tag added successfully",
        tag: newTag,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json(ErrorResponse("Failed to create tag", ["An error occurred while creating the tag"]));
    }
  };



exports.getTagById = async (req, res) => {
    try {
      const { id } = req.params;
  
      
      const data = await client.get(`tag:${id}`);
      if (data) {
        return res.status(200).json(JSON.parse(data)); 
      } else {
        
        const tag = await Tag.findOne({
          where: { id },
          include: {
            model: Blog, 
            attributes: ['title', 'author'],
          },
        });
  
        if (!tag) {
          return res.status(404).json(new ErrorResponse("Tag not found", ["No tag found with the given id"]));
        }
  
        
        await client.set(`tag:${id}`, JSON.stringify(tag), { EX: 3600 });
        
        return res.status(200).json(tag);
      }
    } catch (error) {
      console.error(error);
      res.status(500).json(new ErrorResponse("Failed to fetch tag", ["An error occurred while fetching the tag"]));
    }
  };
  
  
  exports.getUniqueTags = async (req, res) => {
    try {
      await client.del("tag:unique");

      const data = await client.get("tag:unique");
      if (data) {
        return res.status(200).json(JSON.parse(data)); 
      } else {
        
        const tags = await Tag.findAll({
          attributes: ['tag_name'], 
          distinct: true, 
        });
  
        
        await client.setEx("tag:unique", 3600, JSON.stringify(tags));
  
        res.status(200).json(tags);
      }
    } catch (error) {
      console.error(error);
      res.status(500).json(new ErrorResponse("Failed to fetch unique tags", ["An error occurred while fetching the unique tags"]));
    }
  };
  
  
  exports.getBlogsByTag = async (req, res) => {
    try {
      const { tag_name } = req.params;
  
      
      const data = await client.get(`blogs:byTag:${tag_name}`);
      if (data) {
        return res.status(200).json(JSON.parse(data)); 
      } else {
        
        const blogs = await Blog.findAll({
          attributes: ['id', 'title', 'author', 'descr', 'img', 'createdAt'],
          include: {
            model: Tag, 
            where: { tag_name },
            attributes: [],
          },
          order: [['action', 'DESC']], 
          limit: 10, 
        });
  
        
        await client.setEx(`blogs:byTag:${tag_name}`, 3600, JSON.stringify(blogs));
  
        res.status(200).json(blogs);
      }
    } catch (error) {
      console.error(error);
      res.status(500).json(ErrorResponse("Failed to fetch blogs", ["An error occurred while fetching the blogs"]));
    }
  };
  
  
  exports.deleteTag = async (req, res) => {
    try {
      const { id } = req.params;
  
      
      const tag = await Tag.findByPk(id);
  
      if (!tag) {
        return res.status(404).json(new ErrorResponse("Tag not found", ["No tag found with the given id"]));
      }
  
      
      await tag.destroy();
  
    
      await client.del(`tag:${id}`);
      await client.del(`blogs:byTag:${tag.tag_name}`); 
  
      res.status(200).json({ message: "Tag deleted successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json(new ErrorResponse("Failed to delete tag", ["An error occurred while deleting the tag"]));
    }
  };