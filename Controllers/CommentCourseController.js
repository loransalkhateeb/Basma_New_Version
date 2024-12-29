const CommentCourse = require("../Models/CommentCourseModel");
const Course= require("../Models/Courses");
const { ErrorResponse, validateInput } = require("../Utils/ValidateInput");
const nodemailer = require("nodemailer");
require("dotenv").config();


const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  secure: true, 
  tls: {
    rejectUnauthorized: true, 
    },
});



exports.addCommentCourse = async (req, res) => {
  try {
    const { name, email, comment, rating, course_id } = req.body;
    
    const validationErrors = validateInput({ name, email, comment, rating, course_id });
    if (validationErrors.length > 0) {
      return res.status(400).json(ErrorResponse("Validation failed", validationErrors));
    }

    
    const course = await Course.findByPk(course_id, {
      attributes: ["subject_name"], 
        });
    if (!course) {
      return res.status(404).json(ErrorResponse("Course not found", [`No course with ID: ${course_id}`]));
    }

    
    const newComment = await CommentCourse.create({
      name,
      email,
      comment,
      rating,
      course_id,
      action: "not approved",
    });

    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.NOTIFY_EMAIL, 
      subject: "تعليق جديد يتطلب الموافقة",
      html: `
        <p>تم تقديم تعليق جديد ويتطلب موافقتك</p>
        <p><strong>الاسم:</strong> ${name}</p>
        <p><strong>البريد الإلكتروني:</strong> ${email}</p>
        <p><strong>التعليق:</strong> ${comment}</p>
        <p><strong>اسم الكورس:</strong> ${course.subject_name}</p>
        <p>يرجى تسجيل الدخول إلى لوحة التحكم للموافقة على هذا التعليق أو رفضه:</p>
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


exports.getCommentCourse = async (req, res) => {
  try {
    const comments = await CommentCourse.findAll({
      attributes: ["id", "name", "email", "comment", "rating", "action"],
      include: [
        {
          model: Course,
          attributes: ["subject_name"], 
        },
      ],
    });

    res.status(200).json(comments);
  } catch (error) {
    console.error("Error fetching comments:", error.message);
    res.status(500).json(ErrorResponse("Error fetching comments", [error.message]));
  }
};


exports.updateActionCommentCourses = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body;

    if (!["approved", "not approved"].includes(action)) {
      return res.status(400).json(ErrorResponse("Invalid action value", ["Invalid action"]));
    }

    const comment = await CommentCourse.findByPk(id);
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


exports.deleteCommentCourse = async (req, res) => {
  try {
    const { id } = req.params;

    const comment = await CommentCourse.findByPk(id);
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
