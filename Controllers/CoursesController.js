const { validateInput, ErrorResponse } = require("../Utils/ValidateInput.js");
const Course = require("../Models/Courses.js");
const Video = require("../Models/Videos.js");
const { client } = require("../Utils/redisClient");
const User = require('../Models/UserModel.js')
const course_users = require("../Models/course_users.js");
const Payment = require('../Models/PaymentsModel.js')

const { Sequelize } = require("../Config/dbConnect.js");
const asyncHandler = require("../MiddleWares/asyncHandler.js");
const ffmpeg = require("fluent-ffmpeg");
require("dotenv").config();
const ffmpegPath =
  "C:\\Users\\Admin\\Desktop\\New Ba9ma\\Basma_New_Version\\ffmpeg\\bin\\ffmpeg";
const ffprobePath =
  "C:\\Users\\Admin\\Desktop\\New Ba9ma\\Basma_New_Version\\ffmpeg\\bin\\ffprobe-6.1-win-64\\ffprobe";
// const ffmpegPath ='/usr/bin/ffmpeg'; // Default to Linux path
// const ffprobePath = '/usr/bin/ffprobe'; // Default to Linux path

ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

const Teacher = require("../Models/TeacherModel.js");
const Department = require("../Models/DepartmentModel.js");
const CommentCourse = require("../Models/CommentCourseModel.js");

function getVideoDurationInSeconds(videoPath) {
  return new Promise((resolve, reject) => {
    ffmpeg.setFfprobePath('/usr/bin/ffprobe');  // Ensure it's set correctly
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) {
        reject(err);
      } else {
        const duration = metadata.format.duration;
        resolve(duration);
      }
    });
  });
}

// Function to format seconds into hours, minutes, and seconds
function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  // Return the formatted duration
  return `${hours}h ${minutes}m ${secs}s`;
}

exports.addCourse = async (req, res) => {
  try {
    const {
      subject_name,
      department_id,
      before_offer,
      after_offer,
      coupon,
      descr,
      std_num,
      rating,
      teacher_id,
    } = req.body;

    const titles = req.body["title"] || [];
    const links = req.body["link"] || [];
    const normalizedTitles = Array.isArray(titles) ? titles : [titles];
    const normalizedLinks = Array.isArray(links) ? links : links ? [links] : [];

    const img = req.files["img"] ? req.files["img"][0].filename : null;
    const defaultvideo = req.files["defaultvideo"] ? req.files["defaultvideo"][0].filename : null;
    const videoFiles = req.files["url"] || [];
    let file_book = req.files["file_book"] ? req.files["file_book"][0].filename : null;
    // let file_book = req.files.filename;

    if (file_book && !file_book.endsWith('.pdf')) {
      file_book += '.pdf';
    }

    const newCourse = await Course.create({
      subject_name,
      department_id,
      before_offer,
      after_offer,
      coupon,
      descr,
      std_num,
      rating,
      teacher_id,
      img,
      defaultvideo,
      file_book,
    });

    const courseId = newCourse.id;

   
    const videoFileData = videoFiles.map((file) => ({
      filename: file.filename,
      type: "file",
    }));

    const videoLinkData = normalizedLinks.map((link) => ({
      filename: link,
      type: "link",
    }));

    const videoData = [...videoFileData, ...videoLinkData];

    const processedVideoData = await Promise.all(
      videoData.map(async (video) => {
        if (video.type === "file") {
          const videoPath = `https://res.cloudinary.com/durjqlivi/video/upload/${video.filename}`;
          try {
            const duration = await getVideoDurationInSeconds(videoPath); 
            return { ...video, duration, link: null };
          } catch (err) {
            console.error(`Error processing video ${video.filename}: ${err.message}`);
            return { ...video, duration: 0, link: null }; 
          }
        } else {
          return { ...video, duration: 0, link: video.filename };
        }
      })
    );

    const totalDurationInSeconds = processedVideoData.filter((v) => v.type === "file").reduce((acc, v) => acc + v.duration, 0);
    const formattedTotalDuration = formatDuration(totalDurationInSeconds);

    const videoValues = processedVideoData.map((video, index) => [
      courseId,
      normalizedTitles[index] || "Untitled",
      video.type === "file" ? video.filename : "",
      video.type === "link" ? video.link : "",
      video.type,
      formatDuration(video.duration || 0),
    ]);

    await Video.bulkCreate(
      videoValues.map(([course_id, title, url, link, type, duration]) => ({
        course_id,
        title,
        url,
        link,
        type,
        duration,
      }))
    );

    await newCourse.update({
      total_video_duration: formattedTotalDuration || "0h 0m 0s", 
    });

    res.status(201).json({
      message: "Course and videos added successfully",
      totalDuration: formattedTotalDuration,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Failed to add course",
      message: "An error occurred while adding the course. Please try again later.",
    });
  }
};
exports.getcourses = async (req, res) => {
  try {
    const courses = await Course.findAll({
      include: [
        { model: Department, attributes: ["title"] },
        { model: Teacher, attributes: ["teacher_name"] },
      ],
    });
    res.status(200).json(courses);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json(
        ErrorResponse("Failed to fetch courses", [
          "An error occurred while fetching the courses.",
        ])
      );
  }
};

exports.getCourseById = async (req, res) => {
  try {
    const { id } = req.params;
    const course = await Course.findByPk(id, {
      include: [
        { model: Department, attributes: ["title"] },
        { model: Teacher, attributes: ["teacher_name","descr","img"] },
      ],
    });
    if (!course) {
      return res
        .status(404)
        .json(
          ErrorResponse("Course not found", [
            `No course found with the given ID: ${id}`,
          ])
        );
    }
    res.status(200).json([course]);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json(
        ErrorResponse("Failed to fetch course", [
          "An error occurred while fetching the course.",
        ])
      );
  }
};





exports.deleteCourse = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ error: "ID is required" });
  }

  try {
    await Video.destroy({ where: { course_id: id } });
    await course_users.destroy({ where: { course_id: id } });
    await CommentCourse.destroy({ where: { course_id: id } });
    await Payment.destroy({ where: { course_id: id } });

   
    const deletedCourse = await Course.destroy({ where: { id: id } });
  
    if (deletedCourse === 0) {
      return res.status(404).json({ error: "Course not found or already deleted" });
    }

    res.json({ message: "Course and all related data deleted successfully" });

  } catch (error) {
    console.error("Error during deletion:", error);
    res.status(500).json({ error: error.message });
  }
});










exports.getCourseVideos = async (req, res) => {
  try {
    const { id } = req.params;

    const videos = await Video.findAll({
      where: { course_id: id },
      include: [
        {
          model: Course,
          attributes: [
            'subject_name',
            'before_offer',
            'after_offer',
            'coupon',
            'descr',
            'img',
            'defaultvideo',
            'file_book',
          ],
          include: [
            {
              model: Department,
              attributes: ['title'],
            },
            {
              model: Teacher,
              attributes: ['teacher_name'],
            },
          ],
        },
      ],
    });

    res.status(200).json(videos);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Failed to fetch videos",
      details: [
        "An error occurred while fetching videos.",
        error.message,
      ],
    });
  }
};
exports.deleteVideoById = async (req, res) => {
  try {
    const { id } = req.params;
    const video = await Video.findByPk(id);
    if (!video) {
      return res
        .status(404)
        .json(
          ErrorResponse("Video not found", [
            `No video found with the given ID: ${id}`,
          ])
        );
    }

    await video.destroy();
    res.status(200).json({ message: "Video deleted successfully" });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json(
        ErrorResponse("Failed to delete video", [
          "An error occurred while deleting the video.",
        ])
      );
  }
};

exports.getByDepartmentAndTeacher = async (req, res) => {
  try {
    const department_id = req.params.department_id;
    const teacher_email = req.params.teacher_email;


    
    const courses = await Course.findAll({
    
      include: [
        {
          model: Department,
          attributes: ["title"],
          where: { id: department_id },
        },
        {
          model: Teacher,
          attributes: ["teacher_name", "email"],
          where: { email: teacher_email },
        },
      ],
    });

    // Handle case where no courses are found
    if (courses.length === 0) {
      return res.status(404).json({
        message: "No courses found for the given department and teacher.",
      });
    }

    // Cache the result
    await client.setEx(`courses:${department_id}:${teacher_email}`, 600, JSON.stringify(courses));

    // Send response
    res.status(200).json(
      courses
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to fetch courses by department and teacher",
      error: error.message,
    });
  }
};
function parseDurationInSeconds(durationStr) {
  const match = durationStr.match(/(\d+)h (\d+)m (\d+)s/);
  if (!match) {
    console.error('Invalid duration format:', durationStr);
    return 0; // Default to 0 if parsing fails
  }
  const hours = parseInt(match[1], 10) || 0;
  const minutes = parseInt(match[2], 10) || 0;
  const seconds = parseInt(match[3], 10) || 0;
  return hours * 3600 + minutes * 60 + seconds;
}
 exports.updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      subject_name,
      department_id,
      before_offer,
      after_offer,
      coupon,
      descr,
      teacher_id,
    } = req.body;

    // Fetch the current course details including image and default video
    const existingCourse = await Course.findByPk(id);

    if (!existingCourse) {
      return res.status(404).send({
        error: "Course not found",
        message: "No course found with the provided ID",
      });
    }

    // Check if the provided department_id and teacher_id exist in the database
    if (department_id) {
      const departmentExists = await Department.findByPk(department_id);
      if (!departmentExists) {
        return res.status(400).json({ error: "Invalid department_id" });
      }
    }

    if (teacher_id) {
      const teacherExists = await Teacher.findByPk(teacher_id);
      if (!teacherExists) {
        return res.status(400).json({ error: "Invalid teacher_id" });
      }
    }

    // Determine the fields to update
    const updatedCourse = {
      subject_name: subject_name || existingCourse.subject_name,
      teacher_id: teacher_id || existingCourse.teacher_id,
      before_offer: before_offer || existingCourse.before_offer,
      after_offer: after_offer || existingCourse.after_offer,
      descr: descr || existingCourse.descr,
      department_id: department_id || existingCourse.department_id,
      img: req.files && req.files["img"] ? req.files["img"][0].filename : existingCourse.img,
      defaultvideo: req.files && req.files["defaultvideo"] ? req.files["defaultvideo"][0].filename : existingCourse.defaultvideo,
      file_book: req.files && req.files["file_book"] ? req.files["file_book"][0].filename : existingCourse.file_book,
    };

    // Update the course in the database
    await existingCourse.update(updatedCourse);

    // Process video files and links if provided
    const videoFiles = req.files?.videoFiles || [];
    const videoLinks = [];

    for (let key in req.body) {
      if (key.startsWith('videoLinks[')) {
        const index = key.match(/\d+/)[0];
        const prop = key.match(/\.(\w+)$/)[1];
        videoLinks[index] = videoLinks[index] || {};
        videoLinks[index][prop] = req.body[key];
      }
    }

    const videoFileData = videoFiles.map((file, index) => {
      const originalNameWithoutExtension = file.originalname.split('.').slice(0, -1).join('.');
      return {
        id: req.body[`id[${index}]`],
        title: req.body[`title[${index}]`] || originalNameWithoutExtension,
        url: file.filename || '',
        type: 'file',
      };
    });

    const videoLinkData = videoLinks.map((link) => ({
      id: link.id,
      title: link.title || "Untitled",
      filename: '',
      type: 'link',
      link: link.link,
    }));

    const videoData = [...videoFileData, ...videoLinkData];

    // Retrieve existing video durations from the database
    const existingVideos = await Video.findAll({
      where: { course_id: id, type: 'file' },
      attributes: ['duration'],
    });

    const existingVideoDurations = existingVideos.map(video => video.duration);

    // Process new video data and calculate total duration
    const processedVideoData = await Promise.all(
      videoData.map(async (video) => {
        if (video.type === 'file') {
          const videoPath = `https://res.cloudinary.com/durjqlivi/video/upload/${video.url}`;
          try {
            const duration = await getVideoDurationInSeconds(videoPath);
            return {
              ...video,
              duration: formatDuration(duration),
              link: null,
            };
          } catch (error) {
            console.error('Error getting video duration:', error);
            return {
              ...video,
              duration: "0h 0m 0s",
              link: null,
            };
          }
        } else {
          return {
            ...video,
            duration: "0h 0m 0s",
            link: video.link,
          };
        }
      })
    );

    // Insert or update new videos in the database
    if (processedVideoData.length > 0) {
      await Promise.all(
        processedVideoData.map(async (video) => {
          await Video.upsert({
            id: video.id || null,
            title: video.title || "Untitled",
            url: video.type === 'file' ? video.url : '',
            link: video.type === 'link' ? video.link : '',
            type: video.type,
            duration: video.duration,
            course_id: id,
          });
        })
      );
    }

    // Calculate total video duration
    const totalDurationInSeconds = [
      ...existingVideoDurations.map(d => parseDurationInSeconds(d)),
      ...processedVideoData
        .filter(v => v.type === 'file' && v.duration)
        .map(video => parseDurationInSeconds(video.duration))
    ].reduce((total, duration) => total + duration, 0);

    const formattedTotalDuration = formatDuration(totalDurationInSeconds);
    await existingCourse.update({ total_video_duration: formattedTotalDuration });

    res.send({
      message: "Course updated successfully",
      courseId: id,
      totalDuration: formattedTotalDuration
    });
  } catch (error) {
    console.error("General Error:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'An error occurred' });
    }
  }};

  exports.getCourseLinks = asyncHandler(async (req, res) => {
    const { id } = req.params;
  
    try {
      // Fetch video links for the given course ID using Sequelize
      const videoLinks = await Video.findAll({
        where: {
          course_id: id,
          type: "link",
        },
        attributes: ["id", "title", "link"],
      });
  
      res.json(videoLinks);
    } catch (error) {
      console.error("Error fetching video links:", error);
      res.status(500).json({ error: 'Failed to fetch video links' });
    }
  });
  

exports.getUserCountForCourse = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await client.del(`course:${id}:student_count`);

  const cachedData = await client.get(`course:${id}:student_count`);
  if (cachedData) {
    return res
      .status(200)
      .json({ id, student_count: parseInt(cachedData, 10) });
  }

  try {
    const courseData = await Course.findOne({
      where: { id },
      attributes: [
        "id",
        [
          Sequelize.fn("COUNT", Sequelize.col("course_users.user_id")),
          "student_count",
        ],
      ],
      include: [
        {
          model: course_users,
          as: "course_users",
          attributes: [],
        },
      ],
      group: ["courses.id"],
    });

    if (!courseData) {
      throw new ErrorResponse("Course not found", 404);
    }

    const studentCount = parseInt(courseData.dataValues.student_count, 10);
    await client.setEx(
      `course:${id}:student_count`,
      300, // Expiration time in seconds
      studentCount.toString() // Value to store
    );
    

    res.status(200).json({
      id: courseData.id,
      student_count: studentCount,
    });
  } catch (err) {
    // console.error('Failed to fetch user count for course:', err);
    res.status(err.statusCode || 500).json({
      error: "Failed to fetch user count for course",
      message: err.message,
    });
  }
});

exports.getCourseCountByTeacher = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const validationErrors = validateInput({ id });
  if (validationErrors.length > 0) {
    return res.status(400).json({ errors: validationErrors });
  }

  try {
    const teacherData = await Teacher.findOne({
      where: { id },
      attributes: [
        "id",
        "teacher_name",

        [Sequelize.fn("COUNT", Sequelize.col("courses.id")), "course_count"],
      ],
      include: [
        {
          model: Course,
          attributes: [],
        },
      ],

      group: ["teachers.id", "teachers.teacher_name"],
    });

    if (!teacherData) {
      throw ErrorResponse("Teacher not found", 404);
    }

    const result = [
      {
        id: teacherData.id,
        teacher_name: teacherData.teacher_name,
        course_count: parseInt(teacherData.dataValues.course_count, 10),
      },
    ];

    const cacheData = JSON.stringify(result);
    if (typeof cacheData !== "string") {
      throw new TypeError("Invalid cache data");
    }

    await client.setEx(`teacher:${id}:course_count`, 300, cacheData);

    res.status(200).json(result);
  } catch (err) {
    console.error("Failed to fetch teacher course counts:", err);
    res.status(err.statusCode || 500).json({
      error: "Failed to fetch teacher course counts",
      message: err.message,
    });
  }
});

exports.getLessonCountForCourses = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await client.del(`course:${id}:lesson_count`);
  // Validate input
  const validationErrors = validateInput({ id });
  if (validationErrors.length > 0) {
    return res.status(400).json({ errors: validationErrors });
  }
  // Check Redis cache
  const cachedData = await client.get(`course:${id}:lesson_count`);
  if (cachedData) {
    return res.status(200).json(JSON.parse(cachedData));
  }

  try {
    // Fetch lesson count from the database
    const lessonCountData = await Video.findAll({
      where: { course_id: id },
      attributes: [
        "course_id",
        [Sequelize.fn("COUNT", Sequelize.col("title")), "lesson_count"],
      ],
      group: ["course_id"],
      raw: true,
    });

    // If no lessons are found
    if (!lessonCountData || lessonCountData.length === 0) {
      console.warn("No lessons found");
      return res.status(404).json({ message: "No lessons found" });
    }

    const result = lessonCountData.map((entry) => ({
      course_id: entry.course_id,
      lesson_count: entry.lesson_count,
    })); // Return result in array format

    // Save to Redis cache with a 300-second expiration
    await client.setEx(
      `course:${id}:lesson_count`,
      300,
      JSON.stringify(result)
    );

    res.status(200).json(result); // Send response as an array
  } catch (err) {
    // console.error('Failed to fetch lesson count for courses:', err);
    res.status(500).json({
      error: "Failed to fetch lesson count for courses",
      message: err.message,
    });
  }
});

exports.getByDepartment = async (req, res) => {
  try {
    const department_id = req.params.id;
    const courses = await Course.findAll({
      where: {
        department_id: department_id,
      },
      include: [
        {
          model: Department,
          attributes: ["title"],
        },
        { model: Teacher, attributes: ["teacher_name", "email"] },
      ],
      attributes: {
        include: [
          [
            Sequelize.fn(
              "DATE_FORMAT",
              Sequelize.col("created_at"),
              "%Y-%m-%d"
            ),
            "created_date",
          ],
        ],
      },
    });

    if (!courses || courses.length === 0) {
      return res
        .status(404)
        .json({ message: "No courses found for this department." });
    }

    return res.json(courses);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
