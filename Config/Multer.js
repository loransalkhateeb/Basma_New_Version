const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const cloudinary = require('../Config/CloudinaryConfig');

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'Basma_Academy', 
        allowed_formats: ['jpg', 'png', 'mp4', 'avi', 'mkv'], 
        resource_type: 'auto', 
    },
});

const upload = multer({ storage });

module.exports = upload;
