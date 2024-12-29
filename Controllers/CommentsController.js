const  Comment  = require("../Models/Commentsmodel");
const Blog = require("../Models/BlogsModel");
const { ErrorResponse, validateInput } = require("../Utils/ValidateInput");
const nodemailer = require("nodemailer");


const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const { client } = require('../Utils/redisClient');


exports.addComment = async (req, res) => {
    try {
      const { name, email, comment } = req.body;
      const action = "not approved";
  
      if (!name || !email || !comment) {
        return res.status(400).json(ErrorResponse("Validation failed", ["All fields are required"]));
      }
  
      const validationErrors = validateInput({ name, email, comment });
      if (validationErrors.length > 0) {
        return res.status(400).json(new ErrorResponse("Validation failed", validationErrors));
      }
  
      const newComment = await Comment.create({ name, email, comment, action });

      await client.set(`comment:${newComment.id}`, JSON.stringify(newComment), { EX: 3600 });
  
  
      const mailOptions = {
        from: process.env.EMAIL_USER,  
        to: 'admin@example.com',       
        subject: 'New Comment Added',
        text: `New comment from ${name} (${email}):\n\n${comment}`, 
      };
  
    
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error("Error sending email:", error);
        } else {
          console.log("Email sent: " + info.response);
        }
      });
  
 
      res.status(201).json({
        message: "Comment added successfully",
        comment: newComment,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json(ErrorResponse("Failed to create Comment", ["An error occurred while creating the comment"]));
    }
  };


exports.getComments = async (req, res) => {
  try {
    await client.del("comments:all");
    const data = await client.get("comments:all");

    if (data) {
      return res.status(200).json(JSON.parse(data)); 
    } else {
      const comments = await Comment.findAll({
        attributes: ['id', 'name', 'email', 'comment', 'action', 'created_at'],
        order: [['id', 'DESC']],
        limit: 10,
      });

     
      await client.setEx("comments:all", 3600, JSON.stringify(comments));

      res.status(200).json(comments);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json(ErrorResponse("Failed to fetch Comments", ["An error occurred while fetching comments"]));
  }
};


exports.getCommentById = async (req, res) => {
  try {
    const { id } = req.params;

    const data = await client.get(`comment:${id}`);

    if (data) {
      return res.status(200).json(JSON.parse(data)); 
    } else {
      const comment = await Comment.findOne({
        attributes: ['id', 'name', 'email', 'comment', 'action'],
        where: { id },
      });

      if (!comment) {
        return res.status(404).json(new ErrorResponse("Comment not found", ["No comment found with the given id"]));
      }

      await client.set(`comment:${id}`, JSON.stringify(comment), { EX: 3600 });

      res.status(200).json(comment);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json(new ErrorResponse("Failed to fetch Comment", ["An error occurred while fetching the comment"]));
  }
};


exports.updateActionComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body;

    if (!["approved", "not approved"].includes(action)) {
      return res.status(400).json(ErrorResponse("Invalid action value", ["Invalid action"]));
    }

    const comment = await Comment.findByPk(id);
    if (!comment) {
      return res.status(404).json(ErrorResponse("Comment not found", [`No comment with ID: ${id}`]));
    }

    await comment.update({ action });

    res.status(200).json({
      message: "Comment action updated successfully",
      data: comment,
    });
  } catch (error) {
    console.error("Error updating comment action:", error.message);
    res.status(500).json(ErrorResponse("Error updating comment action", [error.message]));
  }
};

exports.deleteComment = async (req, res) => {
  try {
    const { id } = req.params;

    const comment = await Comment.findByPk(id);

    if (!comment) {
      return res.status(404).json(new ErrorResponse("Comment not found", ["No comment found with the given id"]));
    }

    await comment.destroy();

  
    await client.del(`comment:${id}`);

    res.status(200).json({ message: "Comment deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json(ErrorResponse("Failed to delete Comment", ["An error occurred while deleting the comment"]));
  }
};
