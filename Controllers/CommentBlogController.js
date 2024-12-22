const CommentBlog = require("../Models/CommentBlog");
const Blog = require("../Models/BlogsModel");
const asyncHandler = require("../MiddleWares/asyncHandler");
const nodemailer = require("nodemailer");
const { validateInput, ErrorResponse } = require("../Utils/ValidateInput");
const { client } = require('../Utils/redisClient');

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendEmailNotification = async (subject, content) => {
  if (!process.env.NOTIFY_EMAIL) {
    console.error("Error: No recipient email specified");
    return;
  }

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.NOTIFY_EMAIL,
    subject,
    text: content,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Error sending email:", error);
  }
};

exports.addCommentBlog = asyncHandler(async (req, res) => {
  try {
    const { name, email, comment, blog_id } = req.body || {};

    if (!name || !email || !comment || !blog_id) {
      return res
        .status(400)
        .json(
          ErrorResponse("Validation failed", [
            "All fields are required. Please fill all fields",
          ])
        );
    }

    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json(ErrorResponse("Validation failed", ["Invalid email address"]));
    }

    const blog = await Blog.findByPk(blog_id);
    if (!blog) {
      return res.status(404).json(ErrorResponse("Blog not found", ["The specified blog does not exist"]));
    }
    const blogTitle = blog.title;

    const cachedComment = await client.get(`comment:${blog_id}:${email}`);
    if (cachedComment) {
      return res.status(400).json(ErrorResponse("Duplicate comment", ["You have already commented on this blog"]));
    }

    const newComment = await CommentBlog.create({
      name,
      email,
      comment,
      blog_id,
      action: "not approved",
    });

    await client.setEx(`comment:${blog_id}:${email}`, 3600, JSON.stringify(newComment));

    sendEmailNotification(
      "New Comment Submitted for Approval",
      `A new comment has been submitted for the blog titled "${blogTitle}". Please review it in the admin dashboard.`
    );

    res.status(201).json({
      message: "Comment added successfully and email sent to admin",
      data: newComment,
    });
  } catch (error) {
    console.error("Error adding comment:", error.message);
    res.status(500).json(ErrorResponse("Error adding comment", [error.message]));
  }
});

exports.getCommentBlog = asyncHandler(async (req, res) => {
  try {
    const comments = await CommentBlog.findAll({
      include: [
        {
          model: Blog,
          attributes: ["title"],
        },
      ],
    });

    res.status(200).json(comments);
  } catch (error) {
    console.error("Error fetching comments:", error.message);
    res.status(500).json(ErrorResponse("Error fetching comments", [error.message]));
  }
});

exports.updateActionCommentBlogs = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body;

    if (!["approved", "not approved"].includes(action)) {
      return res.status(400).json(ErrorResponse("Invalid action value", ["Invalid action"]));
    }

    const comment = await CommentBlog.findByPk(id);
    if (!comment) {
      return res.status(404).json(ErrorResponse("Comment not found", [`No comment with ID: ${id}`]));
    }

    await comment.update({ action });

    await client.setEx(`comment:${id}`, 3600, JSON.stringify(comment));

    res.status(200).json({
      message: "Comment action updated successfully",
      data: comment,
    });
  } catch (error) {
    console.error("Error updating comment action:", error.message);
    res.status(500).json(ErrorResponse("Error updating comment action", [error.message]));
  }
});

exports.deleteCommentBlog = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    const comment = await CommentBlog.findByPk(id);
    if (!comment) {
      return res.status(404).json(ErrorResponse("Comment not found", [`No comment with ID: ${id}`]));
    }

    await comment.destroy();
    await client.del(`comment:${id}`);

    res.status(200).json({
      message: "Comment deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting comment:", error.message);
    res.status(500).json(ErrorResponse("Error deleting comment", [error.message]));
  }
});
