const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const cloudinary = require('../Config/CloudinaryConfig');  

const storage = new CloudinaryStorage({
  cloudinary: cloudinary, 
  params: {

    folder: '/Basma_Academy', 
    access_mode: 'public',
    allowed_formats: ['jpg', 'png', 'mp4', 'avi', 'mkv', 'pdf', 'doc', 'docx', 'txt','webp',"avif"],  
  },
});


const upload = multer({ storage });

module.exports = upload;
