const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: 'defnyzhak', 
    api_key: '911196318829961',       
    api_secret: 'H5r0izVv5pbchI6j2zzptP6kI6c', 
});

module.exports = cloudinary;