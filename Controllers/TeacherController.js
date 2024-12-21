const { client } = require('../Utils/redisClient');
const { ErrorResponse, validateInput } = require("../Utils/validateInput");
const Teacher = require('../Models/TeacherModel')
const asyncHandler = require('../MiddleWares/asyncHandler')
const ffmpeg = require('fluent-ffmpeg');
const Department = require('../Models/DepartmentModel')
const Course = require('../Models/Courses')
const Video = require('../Models/Videos')
const {Sequelize} = require('../Config/dbConnect.js') 

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
        console.log('Returning teacher from cache');
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
      
      const cachedTeachers = await client.get('teachers');
      if (cachedTeachers) {
        console.log('Returning teachers data from cache');
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
  const ffmpegPath =  './ffmpeg/bin/ffmpeg-6.1-win-64/ffmpeg'
const ffprobePath = './ffmpeg/bin/ffprobe-6.1-win-64/ffprobe'
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



  exports.teacherAddCourse = asyncHandler(async (req, res, next) => {
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
      email,
    } = req.body;
  
    const img = req.files["img"] ? req.files["img"][0].filename : null;
    const defaultvideo = req.files["defaultvideo"] ? req.files["defaultvideo"][0].filename : null;
    const links = req.body["link"] || [];
    const normalizedLinks = Array.isArray(links) ? links : (links ? [links] : []);
    const file_book = req.files["file_book"] ? req.files["file_book"][0].filename : null; 
  
    if (!subject_name) {
      return res.status(400).json({
        error: "Failed to add course",
        message: "Subject name cannot be null or empty",
      });
    }
  
    try {
      
      const teacher = await Teacher.findOne({ where: { email } });
      if (!teacher) {
        return res.status(400).json({ error: "Invalid email" });
      }
  
      
      const transaction = await sequelize.transaction();
  
      
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
        file_book,
      }, { transaction });
  
      
      const titles = req.body["title"] || [];
      const videos = Array.isArray(req.files["url"]) ? req.files["url"] : [];
      const normalizedTitles = Array.isArray(titles) ? titles : (titles ? [titles] : []);
    
      const videoFileData = videos.map((file) => ({
        filename: file.filename,
        type: 'file',
      }));
  
      const videoLinkData = normalizedLinks.map((link) => ({
        filename: link,
        type: 'link',
      }));
  
      const videoData = [...videoFileData, ...videoLinkData];
  
      
      const processedVideoData = await Promise.all(videoData.map(async (video) => {
        if (video.type === 'file') {
          const videoPath = `./images/${video.filename}`; 
          const duration = await getVideoDurationInSeconds(videoPath);
          return { ...video, duration, link: null };
        } else {
          return { ...video, duration: null, link: video.filename };
        }
      }));
  
      const totalDurationInSeconds = calculateTotalDuration(processedVideoData
        .filter(v => v.type === 'file')
        .map(v => v.duration));
      const formattedTotalDuration = formatDuration(totalDurationInSeconds);
  
      
      const videoValues = processedVideoData.map((video, index) => [
        course.id,
        normalizedTitles[index] || "Untitled", 
        video.type === 'file' ? video.filename : '',
        video.type === 'link' ? video.link : '',
        video.type,
        formatDuration(video.duration || 0),
      ]);
  
      await Video.bulkCreate(videoValues, { transaction });
  
      
      await course.update({ total_video_duration: formattedTotalDuration }, { transaction });
  
      
      await transaction.commit();
  
      
      await client.del('courses'); 
  
      
      return res.status(200).json({
        message: "Course and videos added successfully",
        totalDuration: formattedTotalDuration,
      });
  
    } catch (err) {
      console.error("Error adding course and videos:", err.message);
  
      
      if (transaction) {
        await transaction.rollback();
      }
  
      
      return res.status(500).json({
        error: "Error adding course",
        message: err.message,
      });
    }
});



// exports.getTeacherCourseById = asyncHandler(async (req, res, next) => {
//     const { id } = req.params;
  
    
//     const cachedData = await client.get(`teacher_courses_${id}`);
//     if (cachedData) {
//       return res.status(200).json(JSON.parse(cachedData));
//     }
  
//     try {
     
//       const teacherCourses = await Course.findAll({
//         where: {
//           teacher_id: id,
//         },
//         include: [
//           {
//             model: Department,
//             attributes: ['title'], 
//           },
//           {
//             model: Teacher,
//             attributes: ['teacher_name'],
//           },
//         ],
//       });
  
    
//       if (!teacherCourses || teacherCourses.length === 0) {
//         return res.status(404).json({
//           message: "No courses found for this teacher"
//         });
//       }
  
     
//       await client.setex(`teacher_courses_${id}`, 3600, JSON.stringify(teacherCourses));
  
     
//       return res.status(200).json(teacherCourses);
//     } catch (err) {
//       console.error('Error fetching course data: ' + err.message);
      
//       return res.status(500).json({
//         error: "Error fetching course data",
//         message: err.message,
//       });
//     }
// });

exports.getTeacherCoursesByEmail = asyncHandler(async (req, res, next) => {
  const { teacherEmail } = req.params;

  // Clear cache for teacher courses
  await client.del("teacher_courses:all");

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
        await Course.destroy({
            where: { teacher_id: id }
        });

        
        await TeacherStudent.destroy({
            where: { teacher_id: id }
        });

        
        const teacher = await Teacher.findOne({ where: { id } });
        if (!teacher) {
            return res.status(404).json({
                error: "Teacher not found",
                message: `Teacher with ID ${id} does not exist.`
            });
        }

        
        await teacher.destroy();

       
        await client.del(`teacher_${id}`);

        
        return res.status(200).json({
            message: "Teacher deleted successfully",
            teacherId: id
        });
    } catch (err) {
        console.error('Error deleting teacher: ', err.message);

        
        return res.status(500).json({
            error: "Internal Server Error",
            message: "An error occurred while deleting the teacher.",
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
      title: titles = []
    } = req.body;
  
    const img = req.files["img"] ? req.files["img"][0].filename : null;
    const defaultvideo = req.files["defaultvideo"] ? req.files["defaultvideo"][0].filename : null;
    const file_book = req.files["file_book"] ? req.files["file_book"][0].filename : null;
    const links = req.body["link"] || [];
    const normalizedLinks = Array.isArray(links) ? links : (links ? [links] : []);
    const videos = Array.isArray(req.files["url"]) ? req.files["url"] : [];
  
    
    const { courseId } = req.params;
  
    if (!courseId) {
      return res.status(400).send({ error: "Course ID is required" });
    }
  
    
    const cachedCourse = await client.get(`course_data_${courseId}`);
    if (cachedCourse) {
      return res.status(200).json(JSON.parse(cachedCourse));
    }
  
    
    const course = await Course.findOne({
      where: { id: courseId },
      include: [{
        model: Teacher,
        where: { email },
        attributes: ['id']
      }]
    });
  
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }
  
    const updatedData = {
      subject_name: subject_name || course.subject_name,
      department_id: department_id || course.department_id,
      before_offer: before_offer || course.before_offer,
      after_offer: after_offer || course.after_offer,
      coupon: coupon || course.coupon,
      descr: descr || course.descr,
      std_num: std_num || course.std_num,
      rating: rating || course.rating,
      img: img || course.img,
      defaultvideo: defaultvideo || course.defaultvideo,
      file_book: file_book || course.file_book
    };
  
   
    if (course.teacher.email !== email) {
      const teacher = await Teacher.findOne({ where: { email } });
      if (!teacher) {
        return res.status(400).json({ error: "Invalid email" });
      }
      updatedData.teacher_id = teacher.id;
    }
  
    
    await course.update(updatedData);
  
    
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
  
   
    const existingVideoRows = await Video.findAll({
      where: { course_id: courseId, type: 'file' },
      attributes: ['duration']
    });
  
    const existingVideoDurations = existingVideoRows.map(row => row.duration);
  
    
    const processedVideoData = await Promise.all(
      videoData.map(async (video) => {
        if (video.type === 'file') {
          const videoPath = `./images/${video.url}`;
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
  
    
    const videoValues = processedVideoData.map((video) => [
      video.id || null,
      video.title || "Untitled",
      video.type === 'file' ? video.url : '',
      video.type === 'link' ? video.link : '',
      video.type,
      video.duration,
      courseId,
    ]);
  
    await Video.bulkCreate(videoValues, { updateOnDuplicate: ["title", "url", "link", "type", "duration"] });
  
    
    const totalDurationInSeconds = [
      ...existingVideoDurations.map(d => parseDurationInSeconds(d)),
      ...processedVideoData
        .filter(v => v.type === 'file' && v.duration)
        .map(video => parseDurationInSeconds(video.duration))
    ].reduce((total, duration) => total + duration, 0);
  
    const formattedTotalDuration = formatDuration(totalDurationInSeconds);
    await course.update({ total_video_duration: formattedTotalDuration });
  
   
    await client.set(`course_data_${courseId}`, JSON.stringify(course));
  
    return res.send({
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
      return res.status(400).json({ error: "Course ID is required" });
    }
  
    const transaction = await sequelize.transaction();
  
    try {
      
      await Video.destroy({
        where: { course_id: id },
        transaction
      });
  
      
      const course = await Course.findOne({
        where: { id },
        transaction
      });
  
      if (!course) {
        return res.status(404).json({ error: "Course not found" });
      }
  
      await course.destroy({ transaction });
  
     
      await transaction.commit();
  
      res.json({ message: "Course and associated videos deleted successfully" });
    } catch (err) {
     
      await transaction.rollback();
      console.error("Error deleting course and videos:", err);
      res.status(500).json({ error: "Database error during deletion", message: err.message });
    }
  });





exports.getTeacheridandCourseById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { teacherEmail } = req.query;
  
    if (!teacherEmail) {
      return res.status(400).json({ error: "Teacher email is required" });
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
        const course = await Course.findOne({
          where: { id, '$teacher.email$': teacherEmail }, 
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
        });
  
        if (!course) {
          return res.status(404).json({ message: "No course found for this teacher and ID" });
        }
  
        
        const responseData = {
          ...course.toJSON(),
          department_name: course.Department.title,
          teacher_name: course.Teacher.teacher_name,
        };
  
       
        client.setex(cacheKey, 3600, JSON.stringify(responseData));
  
        res.json(responseData);
      });
    } catch (err) {
      console.error("Error fetching course:", err);
      res.status(500).json({ error: "Database error", message: err.message });
    }
  });
