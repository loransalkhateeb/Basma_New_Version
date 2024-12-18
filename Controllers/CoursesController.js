const { validateInput, ErrorResponse } = require('../Utils/validateInput');
const Course = require('../Models/Courses.js');
const Video = require('../Models/Videos.js');
// const { sendEmailNotification } = require('../Utils/emailUtils');

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
