const Blog = require("../Models/BlogsModel");
const Tag = require("../Models/TagModel");
const Department = require("../Models/DepartmentModel");
const asyncHandler = require("../MiddleWares/asyncHandler");
const nodemailer = require("nodemailer");
const { validateInput, ErrorResponse } = require("../Utils/validateInput");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendEmailNotification = async (subject, content) => {
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

exports.createBlog = async (req, res) => {
  try {
    const { title, author, descr, department_id, tags } = req.body || {};

    if (!title || !author || !descr || !department_id || !tags) {
      return res
        .status(400)
        .json(
          ErrorResponse("Validation failed", [
            "The All Fields is required Please fiull all fields",
          ])
        );
    }

    const img = req.file ? req.file.filename : null;

    const validationErrors = validateInput({
      title,
      author,
      descr,
      department_id,
      tags,
    });
    if (validationErrors.length > 0) {
      return res
        .status(400)
        .json(ErrorResponse("Validation failed", validationErrors));
    }
    const newBlog = await Blog.create({
      title,
      author,
      descr,
      department_id,
      tags,
      img,
    });

    res.status(201).json({
      message: "Blog  created successfully",
      Blog: newBlog,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json(
        ErrorResponse("Failed to create Blog", [
          "An error occurred while creating the new Blog Please try again",
        ])
      );
  }
};
exports.getAllBlogs = asyncHandler(async (req, res) => {
  try {
    const blogs = await Blog.findAll({
      include: [
        {
          model: Department,
          attributes: ["title", "price"],
        },
      ],
    });

    res.status(200).json(blogs);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json(
        new ErrorResponse("Failed to retrieve blogs", [
          "An error occurred while retrieving the blogs",
        ])
      );
  }
});

exports.getBlogById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const blog = await Blog.findByPk(id, {
      include: [
        { model: Department, attributes: ['title'] },
        { model: Tag, attributes: ['tag_name'] },
      ],
    });

    if (!blog) {
      return res.status(404).json(
         ErrorResponse('Blog not found', ['No blog found with the given ID'])
      );
    }

    res.status(200).json(blog);
  } catch (error) {
    console.error(error);
    res.status(500).json(
       ErrorResponse('Failed to retrieve the blog', ['An error occurred while retrieving the blog'])
    );
  }
});

exports.updateBlog = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, author, descr, department_id, tags } = req.body;
  const img = req.files["img"] ? req.files["img"][0].filename : null;

  if (!title || !author || !descr || !department_id || !img) {
    return res
      .status(400)
      .json(
        new ErrorResponse("Validation failed", [
          "Please enter all the required fields.",
        ])
      );
  }

  const blog = await Blog.findByPk(id);
  if (!blog) {
    return res
      .status(404)
      .json(
        new ErrorResponse("Blog not found", ["No blog found with the given ID"])
      );
  }

  blog.title = title || blog.title;
  blog.author = author || blog.author;
  blog.descr = descr || blog.descr;
  blog.department_id = department_id || blog.department_id;
  blog.img = img || blog.img;

  await blog.save();

  if (tags) {
    const tagValues = Array.isArray(tags) ? tags : [tags];
    await Tag.destroy({ where: { blog_id: blog.id } });
    const tagEntries = tagValues.map((tag) => ({
      blog_id: blog.id,
      tag_name: tag,
    }));
    await Tag.bulkCreate(tagEntries);
  }

  res.status(200).json({
    message: "Blog updated successfully",
    blog,
  });
});

exports.deleteBlog = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const blog = await Blog.findByPk(id);
  if (!blog) {
    return res
      .status(404)
      .json(
        new ErrorResponse("Blog not found", ["No blog found with the given ID"])
      );
  }

  await blog.destroy();
  await Tag.destroy({ where: { blog_id: id } });

  res.status(200).json({
    message: "Blog and associated tags deleted successfully",
  });
});
