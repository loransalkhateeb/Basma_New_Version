const CommentBlog = require("../Models/CommentBlog");
const Blog = require("../Models/BlogsModel");
const { ErrorResponse, validateInput } = require("../Utils/validateInput");
const nodemailer = require("nodemailer");


const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});


exports.addCommentBlog = async (req, res) => {
  try {
    const { name, email, comment, blog_id } = req.body;


    const validationErrors = validateInput({ name, email, comment, blog_id });
    if (validationErrors.length > 0) {
      return res.status(400).json(ErrorResponse("Validation failed", validationErrors));
    }

 
    const blog = await Blog.findByPk(blog_id);
    const blogTitle = blog ? blog.title : "Unknown Blog";

  
    const newComment = await CommentBlog.create({
      name,
      email,
      comment,
      blog_id,
      action: "not approved",
    });

  
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: "loransmahmoodalkhateeb@gmail.com",
      subject: "تعليق جديد يتطلب الموافقة", 
      html: `
        <p>تم تقديم تعليق جديد ويتطلب موافقتك</p>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Comment:</strong> ${comment}</p>
        <p><strong>Blog Name:</strong> ${blogTitle}</p>
        <p>يرجى تسجيل الدخول إلى لوحة التحكم للموافقة على هذا التعليق أو رفضه:</p>
        <p><a href="https://dashboard.kassel.icu/">https://dashboard.kassel.icu/</a></p>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.status(201).json({
      message: "Comment added successfully and email sent to admin",
      data: newComment,
    });
  } catch (error) {
    console.error("Error adding comment:", error.message);
    res.status(500).json(ErrorResponse("Error adding comment", [error.message]));
  }
};


exports.getCommentBlog = async (req, res) => {
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
};


exports.updateActionCommentBlogs = async (req, res) => {
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

    res.status(200).json({
      message: "Comment action updated successfully",
      data: comment,
    });
  } catch (error) {
    console.error("Error updating comment action:", error.message);
    res.status(500).json(ErrorResponse("Error updating comment action", [error.message]));
  }
};


exports.deleteCommentBlog = async (req, res) => {
  try {
    const { id } = req.params;

    const comment = await CommentBlog.findByPk(id);
    if (!comment) {
      return res.status(404).json(ErrorResponse("Comment not found", [`No comment with ID: ${id}`]));
    }

    await comment.destroy();

    res.status(200).json({
      message: "Comment deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting comment:", error.message);
    res.status(500).json(ErrorResponse("Error deleting comment", [error.message]));
  }
};
