const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const cloudinary = require('../Config/CloudinaryConfig');

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const fileExtension = file.originalname.split('.').pop().toLowerCase();
    let resourceType = 'auto';

    if (['pdf', 'doc', 'docx', 'txt'].includes(fileExtension)) {
      resourceType = 'raw';
    }

    return {
      folder: '/Documents', 
      resource_type: resourceType,
    };
  },
});

const upload = multer({ storage });
module.exports = upload;
