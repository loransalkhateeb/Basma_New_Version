const { client } = require('../Utils/redisClient');
const { ErrorResponse, validateInput } = require("../Utils/ValidateInput.js");
const Teacher = require('../Models/TeacherModel')
const asyncHandler = require('../MiddleWares/asyncHandler')
const ffmpeg = require('fluent-ffmpeg');
const Department = require('../Models/DepartmentModel')
const Course = require('../Models/Courses')
const Video = require('../Models/Videos')
const {Sequelize} = require('../Config/dbConnect.js'); 
const course_users = require('../Models/course_users.js');
const CommentCourse = require('../Models/CommentCourseModel.js');
const Payment = require('../Models/PaymentsModel.js');
const TeacherStudent=require('../Models/Teacher_StudentModel.js')
exports.addTeacherAndCourses = asyncHandler(async (req, res, next) => {
    const { teacher_name, descr, email, department_id } = req.body;

    if (!req.file) {
        return res.status(400).json({
            error: "All fields (teacher_name, descr, email, department_id, img) are required.",
            details: 400
        });
    }

    const img = req.file.path; 

   
    if (!teacher_name || !descr || !email || !department_id) {
        return res.status(400).json({
            error: "All fields (teacher_name, descr, email, department_id, img) are required.",
            details: 400
        });
    }

    try {
       
        const existingTeacher = await Teacher.findOne({
            where: { email }, 
            attributes: ['id', 'email'], 
        });

        if (existingTeacher) {
            return res.status(400).json({
                error: "Teacher with this email already exists.",
                details: 400
            });
        }
       
        const teacher = await Teacher.create({
            teacher_name,
            descr,
            email,
            department_id,
            img,
        });

       
        await client.del('teachers'); 
        const teachersList = await Teacher.findAll(); 
        await client.set('teachers', JSON.stringify(teachersList), { EX: 3600 }); 

        
        return res.status(201).json({
            message: 'Teacher added successfully',
            teacher
        });

    } catch (err) {
        console.error('Error inserting teacher data: ' + err.message);
        return res.status(500).json({
            error: "Internal Server Error",
            details: 500
        });
    }
});


  









exports.getTeacherById = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
  
   
    const isValidId = validateInput(id);
    if (!isValidId) {
        return res.status(400).json({
            error: "Invalid teacher ID format",
            details: 400
        });
    }
  
    const cachedTeacher = await client.get(`teacher:${id}`);
    if (cachedTeacher) {
        return res.status(200).json(JSON.parse(cachedTeacher)); 
    }
  
    try {
        
        const teacher = await Teacher.findOne({
            where: { id },
            attributes: ['id', 'teacher_name', 'descr', 'email', 'img', 'department_id'],  
                });

        if (!teacher) {
            return res.status(404).json({
                error: "Teacher not found",
                details: 404
            });
        }

        
        await client.set(`teacher:${id}`, JSON.stringify(teacher), 'EX', 3600);

        
        return res.status(200).json(teacher);

    } catch (err) {
        console.error('Error fetching teacher data: ' + err.message);
        return res.status(500).json({
            error: "Error fetching teacher data",
            details: 500
        });
    }
});

  




exports.getTeacher = asyncHandler(async (req, res, next) => {
    try {
      client.del(`teachers`);

      const cachedTeachers = await client.get('teachers');
      if (cachedTeachers) {
        return res.json(JSON.parse(cachedTeachers));  
      }
  
      
      const teachers = await Teacher.findAll({
        attributes: ['id', 'teacher_name', 'descr', 'img', 'email', 'department_id'],
        include: [
          {
            model: Department,
            attributes: ['title'], 
          }
        ],
      });
  
     
      await client.set('teachers', JSON.stringify(teachers), 'EX', 3600);  
  
     
      return res.json(teachers);
    } catch (err) {
      console.error('Error fetching teacher data: ' + err.message);
      return next(new ErrorResponse("Error fetching teacher data", 500));
    }
  });



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
const ffmpegPath =
  "C:\\Users\\Admin\\Desktop\\New Ba9ma\\Basma_New_Version\\ffmpeg\\bin\\ffmpeg";
const ffprobePath =
  "C:\\Users\\Admin\\Desktop\\New Ba9ma\\Basma_New_Version\\ffmpeg\\bin\\ffprobe-6.1-win-64\\ffprobe";
// const ffmpegPath ='/usr/bin/ffmpeg'; // Default to Linux path
// const ffprobePath = '/usr/bin/ffprobe'; // Default to Linux path

ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);



function formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
  
    // Return the formatted duration
    return `${hours}h ${minutes}m ${secs}s`;
  }
  // Function to calculate total duration in seconds
  function calculateTotalDuration(durations) {
    return durations.reduce((total, duration) => total + duration, 0);
  }

  exports.teacherAddCourse = async (req, res) => {
    const {
      subject_name,
      department_id,
      before_offer,
      after_offer,
      coupon,
      descr,
      std_num,
      rating,
      email,
    } = req.body;
  
    const img = req.files["img"] ? req.files["img"][0].filename : null;
    const defaultvideo = req.files["defaultvideo"] ? req.files["defaultvideo"][0].filename : null;
    const links = req.body["link"] || [];
    const normalizedLinks = Array.isArray(links) ? links : (links ? [links] : []);
    const file_book = req.files["file_book"] ? req.files["file_book"][0].filename : null; // Handle file book  
    if (!subject_name) {
      return res.status(400).send({
        error: "Failed to add course",
        message: "Subject name cannot be null or empty",
      });
    }
  
    try {
      // Find the teacher by email
      const teacher = await Teacher.findOne({ where: { email } });
  
      if (!teacher) {
        return res.status(400).json({ error: "Invalid email" });
      }
  
      // Create the course
      const course = await Course.create({
        subject_name,
        department_id,
        before_offer,
        after_offer,
        coupon,
        descr,
        std_num,
        rating,
        teacher_id: teacher.id,
        img,
        defaultvideo,
        file_book, // Add file book to the course
      });
  
      const titles = req.body["title"] || [];
      const videos = Array.isArray(req.files["url"]) ? req.files["url"] : [];
      const normalizedTitles = Array.isArray(titles) ? titles : (titles ? [titles] : []);
  
      // Prepare video data
      const videoFileData = videos.map((file) => ({
        filename: file.filename,
        type: 'file',
      }));
  
      const videoLinkData = normalizedLinks.map((link) => ({
        filename: link,
        type: 'link',
      }));
  
      const videoData = [...videoFileData, ...videoLinkData];
  
      // Process video data to calculate durations
      const processedVideoData = await Promise.all(
        videoData.map(async (video) => {
          if (video.type === 'file') {
          const videoPath = `https://res.cloudinary.com/durjqlivi/video/upload/${video.filename}`;
            const duration = await getVideoDurationInSeconds(videoPath);
            return {
              ...video,
              duration,
              link: null, // No link for file videos
            };
          } else {
            return {
              ...video,
              duration: null,
              link: video.filename, // Link stored in filename
            };
          }
        })
      );
  
      // Calculate total duration for file videos
      const totalDurationInSeconds = calculateTotalDuration(
        processedVideoData.filter((v) => v.type === 'file').map((v) => v.duration)
      );
      const formattedTotalDuration = formatDuration(totalDurationInSeconds);
  
      // Insert videos
      const videoPromises = processedVideoData.map((video, index) =>
        Video.create({
          course_id: course.id,
          title: normalizedTitles[index] || "Untitled", // Provide default title if missing
          url: video.type === 'file' ? video.filename : '', // URL for files
          link: video.type === 'link' ? video.link : '', // Link for links
          type: video.type,
          duration: formatDuration(video.duration || 0),
        })
      );
  
      await Promise.all(videoPromises);
  
      // Update course total video duration
      await course.update({ total_video_duration: formattedTotalDuration });
  
      res.send({
        message: "Course and videos added successfully",
        totalDuration: formattedTotalDuration,
      });
    } catch (error) {
      console.error("Error adding course:", error);
      res.status(500).send({
        error: "Failed to add course",
        message: error.message,
      });
    }
  };
  
  
exports.getTeacherCoursesByEmail = asyncHandler(async (req, res, next) => {
  const { teacherEmail } = req.params;

  // Clear cache for teacher courses
  await client.del(`teacher_courses_${teacherEmail}`);

  // Check for cached data
  const cachedData = await client.get(`teacher_courses_${teacherEmail}`);
  if (cachedData) {
      return res.status(200).json(JSON.parse(cachedData));
  }

  try {
      // Fetch courses by teacher email
      const teacherCourses = await Course.findAll({
          include: [
              {
                  model: Department,
                  attributes: ['title'], 
              },
              {
                  model: Teacher,
                  attributes: ['teacher_name', 'email'], // Ensure the email field is included in the Teacher model
                  where: {
                      email: teacherEmail, // Match the teacher email
                  },
              },
          ],
      });

      // Check if courses were found
      if (!teacherCourses || teacherCourses.length === 0) {
          return res.status(404).json({
              message: "No courses found for this teacher",
          });
      }

      // Cache the data for future requests
      await client.setEx(`teacher_courses_${teacherEmail}`, 3600, JSON.stringify(teacherCourses));

      // Return the fetched data
      return res.status(200).json(teacherCourses);
  } catch (err) {
      console.error("Error fetching course data: " + err.message);

      return res.status(500).json({
          error: "Error fetching course data",
          message: err.message,
      });
  }
});





exports.updateTeacher = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const { teacher_name, descr, email, department_id } = req.body;

    let img;
    if (req.files && req.files.img && req.files.img[0]) {
      img = req.files.img[0].filename;
    }

    try {
      const teacher = await Teacher.findOne({ where: { id } });
      if (!teacher) {
        return res.status(404).json({
          error: 'No data found for the specified ID',
          message: 'The teacher with the provided ID does not exist.'
        });
      }

      const updatedImg = img || teacher.img;

      const [updated] = await Teacher.update({
        teacher_name,
        descr,
        email,
        department_id,
        img: updatedImg,
      }, {
        where: { id },
      });

      if (!updated) {
        return res.status(400).json({
          message: 'No changes detected',
          error: 'The teacher data has not been updated because no changes were detected.'
        });
      }

      await client.set(`teacher_${id}`, 3600, JSON.stringify({
        id,
        teacher_name,
        descr,
        email,
        department_id,
        img: updatedImg
      }));

      return res.status(200).json({
        message: 'Teacher updated successfully',
        data: {
          id,
          teacher_name,
          descr,
          email,
          department_id,
          img: updatedImg
        }
      });
    } catch (err) {
      console.error('Error updating teacher data: ', err);

      
      if (err.name === 'SequelizeValidationError') {
        return res.status(400).json({
          error: 'Validation error',
          message: 'There was an issue with the data validation.',
          details: err.errors.map(e => e.message)
        });
      }

      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'An error occurred while updating the teacher data.',
        details: err.message
      });
    }
});




exports.deleteTeacher = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  try {
     
      const courses = await Course.findAll({ where: { teacher_id: id } });
      
      for (let course of courses) {
          await Video.destroy({
              where: { course_id: course.id }
          });

          
          await course.destroy();
          await client.del(`course_${course.id}`);
      }

     
      await TeacherStudent.destroy({
          where: { teacher_id: id }
      });

      
      const teacher = await Teacher.findOne({ where: { id } });
      if (teacher) {
          await teacher.destroy();
          await client.del(`teacher_${id}`);
      }

      return res.status(200).json({
          message: "Teacher and associated courses and videos deleted successfully",
          teacherId: id
      });
  } catch (err) {
      console.error('Error deleting teacher and associated data: ', err.message);

      return res.status(500).json({
          error: "Internal Server Error",
          message: "An error occurred while deleting the teacher and associated data.",
          details: err.message
      });
  }
});





exports.getStudentCountForTeacher = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    try {
      const cachedCount = await client.get(`teacher_student_count_${id}`);
      if (cachedCount) {
        return res.status(200).json(JSON.parse(cachedCount));
      }
  
     
      const result = await Teacher.findOne({
        attributes: [
          'id',
          [Sequelize.fn('COUNT', Sequelize.col('teacher_students.student_id')), 'student_count']
        ],
        include: {
          model: TeacherStudent,
          attributes: [],
          where: { teacher_id: id },
          required: true
        },
        group: ['teacher.id'],
        where: { id },
      });
  
      if (!result) {
        return res.status(404).json({ message: 'No students found for this teacher' });
      }
  
      
      await client.set(`teacher_student_count_${id}`, JSON.stringify(result));
  
      return res.status(200).json(result);
    } catch (err) {
      console.error('Failed to fetch student count for teacher:', err.message);
      return next(new ErrorResponse('Failed to fetch student count for teacher', 500));
    }
  });


exports.updateTeacherCourse = asyncHandler(async (req, res) => {
  const {
    subject_name,
    department_id,
    before_offer,
    after_offer,
    coupon,
    descr,
    std_num,
    rating,
    email,
    title: titles = [] // Default to empty array if no titles are provided
  } = req.body;

  const img = req.files["img"] ? req.files["img"][0].filename : null;
  const defaultvideo = req.files["defaultvideo"] ? req.files["defaultvideo"][0].filename : null;
  const file_book = req.files["file_book"] ? req.files["file_book"][0].filename : null; // Added file_book
  const links = req.body["link"] || [];
  const normalizedLinks = Array.isArray(links) ? links : (links ? [links] : []);
  const videos = Array.isArray(req.files["url"]) ? req.files["url"] : [];

  // Get the course ID from URL parameters
  const { courseId } = req.params;

  if (!courseId) {
    return res.status(400).send({ error: "Course ID is required" });
  }

  // Fetch current course data using Sequelize
  const existingCourse = await Course.findOne({ where: { id: courseId } });

  if (!existingCourse) {
    return res.status(404).json({ error: "Course not found" });
  }

  // Construct the updated data, using existing values if not provided
  const updatedData = {
    subject_name: subject_name || existingCourse.subject_name,
    department_id: department_id || existingCourse.department_id,
    before_offer: before_offer || existingCourse.before_offer,
    after_offer: after_offer || existingCourse.after_offer,
    coupon: coupon || existingCourse.coupon,
    descr: descr || existingCourse.descr,
    std_num: std_num || existingCourse.std_num,
    rating: rating || existingCourse.rating,
    img: img || existingCourse.img,
    defaultvideo: defaultvideo || existingCourse.defaultvideo,
    file_book: file_book || existingCourse.file_book
  };

  // Check if the teacher exists using Sequelize
  const teacher = await Teacher.findOne({ where: { email } });

  if (!teacher) {
    return res.status(400).json({ error: "Invalid email" });
  }

  updatedData.teacher_id = teacher.id;

  // Update the course using Sequelize
  await existingCourse.update(updatedData);

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

  // Retrieve existing video durations from the database using Sequelize
  const existingVideos = await Video.findAll({
    where: { course_id: courseId, type: 'file' },
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

  // Insert or update new videos in the database using Sequelize
  for (let video of processedVideoData) {
    await Video.upsert({
      id: video.id || null,
      title: video.title || "Untitled",
      url: video.type === 'file' ? video.url : '',
      link: video.type === 'link' ? video.link : '',
      type: video.type,
      duration: video.duration,
      course_id: courseId,
    });
  }

  // Calculate total video duration
  const totalDurationInSeconds = [
    ...existingVideoDurations.map(d => parseDurationInSeconds(d)),
    ...processedVideoData
      .filter(v => v.type === 'file' && v.duration)
      .map(video => parseDurationInSeconds(video.duration))
  ].reduce((total, duration) => total + duration, 0);

  const formattedTotalDuration = formatDuration(totalDurationInSeconds);

  // Update total video duration in the course record using Sequelize
  await existingCourse.update({ total_video_duration: formattedTotalDuration });

  res.send({
    message: "Course updated successfully",
    courseId,
    totalDuration: formattedTotalDuration
  });
});

  function parseDurationInSeconds(durationStr) {
    const match = durationStr.match(/(\d+)h (\d+)m (\d+)s/);
    if (!match) {
      console.error('Invalid duration format:', durationStr);
      return 0; 
    }
    const hours = parseInt(match[1], 10) || 0;
    const minutes = parseInt(match[2], 10) || 0;
    const seconds = parseInt(match[3], 10) || 0;
    return hours * 3600 + minutes * 60 + seconds;
  }




  exports.deleteTeacherCourse = asyncHandler(async (req, res) => {
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


exports.getTeacheridandCourseById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { teacherEmail } = req.query;

  if (!teacherEmail || !id) {
    return res.status(400).json({
      error: "Both teacherEmail and course ID are required."
    });
  }
  const cacheKey = `course:${id}:teacher:${teacherEmail}`;
  try {
    client.get(cacheKey, async (err, cachedData) => {
              if (err) {
                console.error('Error fetching data from Redis:', err);
              }
        
              if (cachedData) {
                
                return res.json(JSON.parse(cachedData));
              }
                       });

    // Fetch course with associated teacher and department
    const course = await Course.findOne({
      where: { id },
      include: [
        {
          model: Teacher,
          attributes: ["teacher_name", "email"],
          where: { email: teacherEmail }
        },
        {
          model: Department,
          attributes: ["title"]
        }
      ]
    });

    if (!course) {
      return res
        .status(404)
        .json({ message: "No course found for this teacher and ID" });
    }

    // Transform the response to match the original SQL output
    const result = {
      ...course.get(),
      department_name: course.Department?.title || null,
      teacher_name: course.Teacher?.teacher_name || null
    };
      client.setEx(cacheKey, 3600, JSON.stringify(result));

    res.json(result);
  } catch (err) {
    console.error("Error fetching course:", err);
  res.status(500).json({ error: "Database error", message: err.message });
}
});

