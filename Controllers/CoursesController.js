const { validateInput, ErrorResponse } = require('../Utils/validateInput');
const Course = require('../Models/Courses.js');
const Video = require('../Models/Videos.js');
// const { sendEmailNotification } = require('../Utils/emailUtils');
const { client } = require('../Utils/redisClient');

const CourseUsers = require('../Models/CourseUsers.js')

const {Sequelize} = require('../Config/dbConnect.js') 

const { type } = require("os");
const asyncHandler = require("../MiddleWares/asyncHandler.js");

const db = require("../Config/dbConnect.js");
const ffmpeg = require('fluent-ffmpeg');
require('dotenv').config();
const path = require('path');
// const ffmpegPathw = process.env.FFMPEG_PATH

// const ffmpegPath =  './ffmpeg/bin/ffmpeg-6.1-win-64/ffmpeg'
// const ffprobePath = './ffmpeg/bin/ffprobe-6.1-win-64/ffprobe'
const ffmpegPath = 'C:\\Users\\Admin\\Desktop\\New Ba9ma\\Basma_New_Version\\ffmpeg\\bin\\ffmpeg';
const ffprobePath = 'C:\\Users\\Admin\\Desktop\\New Ba9ma\\Basma_New_Version\\ffmpeg\\bin\\ffprobe-6.1-win-64\\ffprobe';

ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

// ffmpeg.ffprobe('./videoplayback.mp4', function(err, metadata) {
//   if (err) {
//     console.error('ffprobe error:', err);
//   } else {
//     console.log('ffprobe metadata:', metadata);
//   }
// });

const Teacher = require('../Models/TeacherModel.js');  
const Department = require('../Models/DepartmentModel.js');  

// function getVideoDurationInSeconds(videoPath) {
//   return new Promise((resolve, reject) => {
//     ffmpeg.ffprobe(videoPath, (err, metadata) => {
//       if (err) {
//         reject(err);
//       } else {
//         const duration = metadata.format.duration;
//         resolve(duration);
//       }
//     });
//   });
// }
function getVideoDurationInSeconds(videoPath) {
  return new Promise((resolve, reject) => {
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
// Function to calculate total duration in seconds
// function calculateTotalDuration(durations) {
//   return durations.reduce((total, duration) => total + duration, 0);
// }



function calculateTotalDuration(durations) {
  return durations.reduce((total, duration) => total + duration, 0);
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

    // Validation checks
    // const errors = [];
    // if (!subject_name || subject_name.length < 3) errors.push("Subject name is required and must be at least 3 characters.");
    // if (!department_id) errors.push("Department ID is required.");
    // if (!before_offer) errors.push("Before offer price is required.");
    // if (!after_offer) errors.push("After offer price is required.");
    // if (!coupon) errors.push("Coupon is required.");
    // if (!descr || descr.length < 10) errors.push("Description is required and must be at least 10 characters.");
    // if (!std_num || std_num < 1) errors.push("Number of students must be greater than 0.");
    // if (!rating || rating < 1 || rating > 5) errors.push("Rating must be between 1 and 5.");
    // if (!teacher_id) errors.push("Teacher ID is required.");

    // if (errors.length > 0) {
    //   return res.status(400).json({
    //     error: "Validation failed",
    //     details: errors
    //   });
    // }

    // Handling uploaded files
    const titles = req.body["title"] || [];
    const links = req.body["link"] || [];
    const normalizedTitles = Array.isArray(titles) ? titles : [titles];
    const normalizedLinks = Array.isArray(links) ? links : (links ? [links] : []);

    const img = req.files["img"] ? req.files["img"][0].filename : null;
    const defaultvideo = req.files["defaultvideo"] ? req.files["defaultvideo"][0].filename : null;
    const videoFiles = req.files["url"] || [];
    const file_book = req.files["file_book"] ? req.files["file_book"][0].filename : null;

    // Create new course
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
      file_book
    });

    const courseId = newCourse.id;

    // Process video files
    const videoFileData = videoFiles.map((file) => ({
      filename: file.filename,
      type: 'file'
    }));

    const videoLinkData = normalizedLinks.map((link) => ({
      filename: link,
      type: 'link'
    }));

    const videoData = [...videoFileData, ...videoLinkData];

    const processedVideoData = await Promise.all(videoData.map(async (video) => {
      if (video.type === 'file') {
        const videoPath = `https://res.cloudinary.com/durjqlivi/video/upload/${video.filename}`
        try {
          const duration = await getVideoDurationInSeconds(videoPath);
          return { ...video, duration, link: null };
        } catch (err) {
          console.error(`Error processing video ${video.filename}: ${err.message}`);
          return { ...video, duration: 0, link: null }; // Handle error gracefully
        }
      } else {
        return { ...video, duration: 0, link: video.filename };
      }
    }));

    // Calculate total video duration
    const totalDurationInSeconds = calculateTotalDuration(
      processedVideoData.filter(v => v.type === 'file').map(v => v.duration)
    );
    const formattedTotalDuration = formatDuration(totalDurationInSeconds);

    // Save video records
    const videoValues = processedVideoData.map((video, index) => [
      courseId,
      normalizedTitles[index] || "Untitled",
      video.type === 'file' ? video.filename : '',
      video.type === 'link' ? video.link : '',
      video.type,
      formatDuration(video.duration || 0)
    ]);

    await Video.bulkCreate(
      videoValues.map(([course_id, title, url, link, type, duration]) => ({
        course_id,
        title,
        url,
        link,
        type,
        duration
      }))
    );

    // Update total video duration in the course
    await newCourse.update({
      total_video_duration: formattedTotalDuration || '0h 0m 0s' // Ensure it's not null
    });

    res.status(201).json({
      message: "Course and videos added successfully",
      totalDuration: formattedTotalDuration
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Failed to add course",
      message: "An error occurred while adding the course. Please try again later."
    });
  }
};
// exports.addCourse = async (req, res) => {
//   try {
//     const {
//       subject_name,
//       department_id,
//       before_offer,
//       after_offer,
//       coupon,
//       descr,
//       std_num,
//       rating,
//       teacher_id,
//     } = req.body;

  
//     const errors = [];
//     if (!subject_name || subject_name.length < 3) errors.push("Subject name is required and must be at least 3 characters.");
//     if (!department_id) errors.push("Department ID is required.");
//     if (!before_offer) errors.push("Before offer price is required.");
//     if (!after_offer) errors.push("After offer price is required.");
//     if (!coupon) errors.push("Coupon is required.");
//     if (!descr || descr.length < 10) errors.push("Description is required and must be at least 10 characters.");
//     if (!std_num || std_num < 1) errors.push("Number of students must be greater than 0.");
//     if (!rating || rating < 1 || rating > 5) errors.push("Rating must be between 1 and 5.");
//     if (!teacher_id) errors.push("Teacher ID is required.");

//     if (errors.length > 0) {
//       return res.status(400).json({
//         error: "Validation failed",
//         details: errors
//       });
//     }

   
//     const titles = req.body["title"] || [];
//     const links = req.body["link"] || [];
//     const normalizedTitles = Array.isArray(titles) ? titles : [titles];
//     const normalizedLinks = Array.isArray(links) ? links : (links ? [links] : []);

   
//     const img = req.files["img"] ? req.files["img"][0].filename : null;
//     const defaultvideo = req.files["defaultvideo"] ? req.files["defaultvideo"][0].filename : null;
//     const videoFiles = req.files["url"] || [];
//     const file_book = req.files["file_book"] ? req.files["file_book"][0].filename : null;

    
//     const newCourse = await Course.create({
//       subject_name,
//       department_id,
//       before_offer,
//       after_offer,
//       coupon,
//       descr,
//       std_num,
//       rating,
//       teacher_id,
//       img,
//       defaultvideo,
//       file_book
//     });

//     const courseId = newCourse.id;

  
//     const videoFileData = videoFiles.map((file) => ({
//       filename: file.filename,
//       type: 'file'
//     }));

//     const videoLinkData = normalizedLinks.map((link) => ({
//       filename: link,
//       type: 'link'
//     }));

//     const videoData = [...videoFileData, ...videoLinkData];

//     const processedVideoData = await Promise.all(videoData.map(async (video) => {
//       if (video.type === 'file') {
//         const videoPath = `./images/${video.filename}`; 
//         const duration = await getVideoDurationInSeconds(videoPath);
//         return {
//           ...video,
//           duration,
//           link: null
//         };
//       } else {
//         return {
//           ...video,
//           duration: null,
//           link: video.filename
//         };
//       }
//     }));

   
//     const totalDurationInSeconds = calculateTotalDuration(
//       processedVideoData.filter(v => v.type === 'file').map(v => v.duration)
//     );
//     const formattedTotalDuration = formatDuration(totalDurationInSeconds);

   
//     const videoValues = processedVideoData.map((video, index) => [
//       courseId,
//       normalizedTitles[index] || "Untitled",
//       video.type === 'file' ? video.filename : '',
//       video.type === 'link' ? video.link : '',
//       video.type,
//       formatDuration(video.duration || 0)
//     ]);

//     await Video.bulkCreate(
//       videoValues.map(([course_id, title, url, link, type, duration]) => ({
//         course_id,
//         title,
//         url,
//         link,
//         type,
//         duration
//       }))
//     );

    
//     await newCourse.update({
//       total_video_duration: formattedTotalDuration
//     });

   
//     res.status(201).json({
//       message: "Course and videos added successfully",
//       totalDuration: formattedTotalDuration
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({
//       error: "Failed to add course",
//       message: "An error occurred while adding the course. Please try again later."
//     });
//   }
// };


exports.getcourses = async (req, res) => {
  try {
    const courses = await Course.findAll();
    res.status(200).json(courses);
  } catch (error) {
    console.error(error);
    res.status(500).json(
      ErrorResponse("Failed to fetch courses", ["An error occurred while fetching the courses."])
    );
  }
};

exports.getCourseById = async (req, res) => {
  try {
    const { id } = req.params;
    const course = await Course.findByPk(id);
    if (!course) {
      return res.status(404).json(
        ErrorResponse("Course not found", [`No course found with the given ID: ${id}`])
      );
    }
    res.status(200).json(course);
  } catch (error) {
    console.error(error);
    res.status(500).json(
      ErrorResponse("Failed to fetch course", ["An error occurred while fetching the course."])
    );
  }
};

exports.deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const course = await Course.findByPk(id);
    if (!course) {
      return res.status(404).json(
        ErrorResponse("Course not found", [`No course found with the given ID: ${id}`])
      );
    }

    await course.destroy();
    res.status(200).json({ message: "Course deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json(
      ErrorResponse("Failed to delete course", ["An error occurred while deleting the course."])
    );
  }
};

exports.getCourseVideos = async (req, res) => {
  try {
    const { id } = req.params;
    const videos = await Video.findAll({ where: { course_id: id } });
    res.status(200).json(videos);
  } catch (error) {
    console.error(error);
    res.status(500).json(
      ErrorResponse("Failed to fetch videos", ["An error occurred while fetching videos."])
    );
  }
};






exports.deleteVideoById = async (req, res) => {
  try {
    const { id } = req.params;
    const video = await Video.findByPk(id);
    if (!video) {
      return res.status(404).json(
        ErrorResponse("Video not found", [`No video found with the given ID: ${id}`])
      );
    }

    await video.destroy();
    res.status(200).json({ message: "Video deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json(
      ErrorResponse("Failed to delete video", ["An error occurred while deleting the video."])
    );
  }
};

exports.getByDepartmentAndTeacher = async (req, res) => {
  try {
    const { department_id, teacher_email } = req.params;
    const courses = await Course.findAll({
      where: {
        department_id,
        teacher_id: teacher_email
      }
    });
    res.status(200).json(courses);
  } catch (error) {
    console.error(error);
    res.status(500).json(
      ErrorResponse("Failed to fetch courses by department and teacher", [
        "An error occurred while fetching the courses."
      ])
    );
  }
};

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
      std_num,
      rating,
      teacher_id,
    } = req.body;

    
    const validationErrors = validateInput({ subject_name, department_id, before_offer, after_offer, coupon, descr, std_num, rating, teacher_id });
    if (validationErrors.length > 0) {
      return res.status(400).json(ErrorResponse("Validation failed", validationErrors));
    }

    const course = await Course.findByPk(id);
    if (!course) {
      return res.status(404).json(
        ErrorResponse("Course not found", [`No course found with the given ID: ${id}`])
      );
    }

    await course.update({
      subject_name,
      department_id,
      before_offer,
      after_offer,
      coupon,
      descr,
      std_num,
      rating,
      teacher_id,
    });

    res.status(200).json({
      message: "Course updated successfully",
      course
    });
  } catch (error) {
    console.error(error);
    res.status(500).json(
      ErrorResponse("Failed to update course", ["An error occurred while updating the course."])
    );
  }
};




exports.getUserCountForCourse = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const cachedData = await client.get(`course:${id}:student_count`);
  if (cachedData) {
    console.log('Serving from cache');
    return res.status(200).json({ id, student_count: parseInt(cachedData, 10) });
  }

  try {
    const courseData = await Course.findOne({
      where: { id },
      attributes: [
        'id',
        [Sequelize.fn('COUNT', Sequelize.col('courseUsers.user_id')), 'student_count'], 
      ],
      include: [
        {
          model: CourseUsers,
          as: 'courseUsers', 
          attributes: [],  
        },
      ],
      group: ['courses.id'],
    });

    if (!courseData) {
      throw new ErrorResponse('Course not found', 404);
    }

    const studentCount = parseInt(courseData.dataValues.student_count, 10);

    await client.setEx(`course:${id}:student_count`, studentCount.toString(), 'EX', 300);

    res.status(200).json({
      id: courseData.id,
      student_count: studentCount,
    });
  } catch (err) {
    console.error('Failed to fetch user count for course:', err);
    res.status(err.statusCode || 500).json({
      error: 'Failed to fetch user count for course',
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
        'id',
        'teacher_name',
        
        [Sequelize.fn('COUNT', Sequelize.col('courses.id')), 'course_count'],
      ],
      include: [
        {
          model: Course, 
          attributes: [], 
        },
      ],
      
      group: ['teachers.id', 'teachers.teacher_name'], 
    });

    
    if (!teacherData) {
      throw  ErrorResponse('Teacher not found', 404);
    }

    
    const result = {
      id: teacherData.id,
      teacher_name: teacherData.teacher_name,
      course_count: parseInt(teacherData.dataValues.course_count, 10),
    };

    
    const cacheData = JSON.stringify(result);
    if (typeof cacheData !== 'string') {
      throw new TypeError('Invalid cache data');
    }

   
    await client.setEx(`teacher:${id}:course_count`, 300, cacheData);

   
    res.status(200).json(result);
  } catch (err) {
    console.error('Failed to fetch teacher course counts:', err);
    res.status(err.statusCode || 500).json({
      error: 'Failed to fetch teacher course counts',
      message: err.message,
    });
  }
});








exports.getLessonCountForCourses = asyncHandler(async (req, res) => {
  const { id } = req.params;

  
  const validationErrors = validateInput({ id });
  if (validationErrors.length > 0) {
    return res.status(400).json({ errors: validationErrors });
  }

  
  const cachedData = await client.get(`course:${id}:lesson_count`);
  if (cachedData) {
    console.log('Serving from cache');
    return res.status(200).json(JSON.parse(cachedData));
  }

  try {
    
    const lessonCountData = await Video.findAll({
      where: { course_id: id },
      attributes: [
        'course_id',
        [Sequelize.fn('COUNT', Sequelize.col('title')), 'lesson_count'],
      ],
      group: ['course_id'],
      raw: true,
    });

    
    if (!lessonCountData || lessonCountData.length === 0) {
      console.warn('No lessons found');
      return res.status(404).json({ message: 'No lessons found' });
    }

    const result = lessonCountData[0]; 

    
    await client.setEx(`course:${id}:lesson_count`, JSON.stringify(result), 'EX', 300);

    res.status(200).json(result);
  } catch (err) {
    console.error('Failed to fetch lesson count for courses:', err);
    res.status(500).json({
      error: 'Failed to fetch lesson count for courses',
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
          attributes: ['title'],
        },
      ],
      attributes: {
        include: [
         
          [Sequelize.fn('DATE_FORMAT', Sequelize.col('created_at'), '%Y-%m-%d'), 'created_date']
        ]
      }
    });

    
    if (!courses || courses.length === 0) {
      return res.status(404).json({ message: 'No courses found for this department.' });
    }

    return res.json(courses);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

