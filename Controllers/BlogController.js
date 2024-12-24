const Blog = require("../Models/BlogsModel");
const Tag = require("../Models/TagModel");
const Department = require("../Models/DepartmentModel");
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



// exports.createBlog = async (req, res) => {
//   try {
//     const { title, author, descr, department_id, tags } = req.body || {};

    
//     const processedTags = tags && Array.isArray(tags) ? tags : tags.split(',').map(tag => tag.trim()).filter(Boolean);

//     if (!title || !author || !descr || !department_id || !processedTags.length) {
//       return res.status(400).json({
//         error: "Validation failed",
//         message: "All fields are required. Please fill all fields."
//       });
//     }

   
//     const validationErrors = validateInput({ title, author, descr, department_id, tags: processedTags });
//     if (validationErrors.length > 0) {
//       return res.status(400).json({
//         error: "Validation failed",
//         message: validationErrors
//       });
//     }

   
//     const img = req.file ? req.file.filename : null;
//     const newBlog = await Blog.create({
//       title,
//       author,
//       descr,
//       department_id,
//       img,
//     });

    
//     const tagsToCreate = await Promise.all(processedTags.map(async (tag) => {
//       const [existingTag] = await Tag.findOrCreate({
//         where: { tag_name: tag },
//         defaults: { tag_name: tag }
//       });
//       return { blog_id: newBlog.id, tag_name: existingTag.tag_name, tag_id: existingTag.id };
//     }));

    
//     await Tag.bulkCreate(tagsToCreate);

   
//     sendEmailNotification("New Blog Created", `A new blog titled "${title}" has been created`);

   
//     res.status(201).json({
//       message: "Blog created successfully",
//       blog: newBlog,
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({
//       error: "Failed to create Blog",
//       message: "An error occurred while creating the new Blog. Please try again."
//     });
//   }
// };




exports.createBlog = asyncHandler(async (req, res) => {
  const { title, author, descr, department_id, tags } = req.body;

  // Check if file was uploaded correctly
  if (!req.file) {
    return res.status(400).send({
      error: "Failed to add blog",
      message: "Image file is required",
    });
  }

  const img = req.file.filename; // Get the filename of the uploaded image
  const action = "not approved";

  if (!title) {
    return res.status(400).send({
      error: "Failed to add blog",
      message: "Title cannot be null or empty",
    });
  }

  try {
    // Insert the blog into the blog table
    const newBlog = await Blog.create({
      title,
      author,
      descr,
      img,
      action,
      department_id,
    });

    // Handle tags if provided
    if (tags) {
      let tagValues = [];

      // Ensure tags is always an array
      if (Array.isArray(tags)) {
        tagValues = tags.map(tag => ({
          blog_id: newBlog.id,
          tag_name: tag
        }));
      } else {
        tagValues = [{ blog_id: newBlog.id, tag_name: tags }];
      }

      // Insert tags into the tag table and associate them with the blog
      await Tag.bulkCreate(tagValues);
    }
    sendEmailNotification("New Blog Created", `A new blog titled "${title}" has been created`);
      res.send({
        message: tags
          ? "Blog added successfully with tags, admin notified"
          : "Blog added successfully, but no tags provided. Admin notified",
      });
    
  } catch (err) {
    console.error("Error adding blog:", err);
    res.status(500).send({
      error: "Failed to add blog",
      message: err.message,
    });
  }
});


exports.getAllBlogs = asyncHandler(async (req, res) => {
  try {
    const blogs = await Blog.findAll({
      include: [
        {
          model: Department,
          attributes: ["title", "price"],
        },
        {
          model: Tag,
          attributes: ["tag_name"],
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
        { model: Tag, attributes: ['id','tag_name'] },
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

  // Handle image upload
  let img = null;
  if (req.file) {
    img = req.file.filename; // Adjusted for single file uploads
  }

  const blog = await Blog.findByPk(id);
  if (!blog) {
    return res
      .status(404)
      .json(
        new ErrorResponse("Blog not found", ["No blog found with the given ID"])
      );
  }

  // Update blog fields
  blog.title = title || blog.title;
  blog.author = author || blog.author;
  blog.descr = descr || blog.descr;
  blog.department_id = department_id || blog.department_id;

  // Update image only if a new one is uploaded
  if (img) {
    blog.img = img;
  }

  await blog.save();

  // Update tags if provided
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

  try {
    const { id } = req.params;
    const [blog, _] = await Promise.all([
      Blog.findByPk(id),
      client.del(`blog:${id}`), 
    ]);

    if (!blog) {
      return res.status(404).json(
        ErrorResponse("Blog not found", [
          "No blog found with the given ID",
        ])
      );
    }

   
    await Promise.all([
      Blog.destroy({ where: { id } }), 
      Tag.destroy({ where: { blog_id: id } }),
    ]);

    return res.status(200).json({
      message: "Blog and associated tags deleted successfully",
    });
  } catch (error) {
    console.error("Error in deleteBlog:", error);

    return res.status(500).json(
      ErrorResponse("Failed to delete Blog entry", [
        "An internal server error occurred. Please try again later.",
      ])
    );
  }
});







exports.getLastThreeBlogs = asyncHandler(async (req, res) => {
  try {
    const blogs = await Blog.findAll({
      order: [['createdAt', 'DESC']],
      limit: 3,
    });

    res.status(200).json(blogs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});
exports.updateActionBlogs = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body;

    if (!["approved", "not approved"].includes(action)) {
      return res.status(400).json(ErrorResponse("Invalid action value", ["Invalid action"]));
    }

    const blog = await Blog.findByPk(id);
    if (!blog) {
      return res.status(404).json(ErrorResponse("blog not found", [`No blog with ID: ${id}`]));
    }

    await blog.update({ action });

    await client.setEx(`blog:${id}`, 3600, JSON.stringify(blog));

    res.status(200).json({
      message: "blog action updated successfully",
      data: blog,
    });
  } catch (error) {
    console.error("Error updating blog action:", error.message);
    res.status(500).json(ErrorResponse("Error updating blog action", [error.message]));
  }
});