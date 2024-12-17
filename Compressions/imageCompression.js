const sharp = require('sharp');
const path = require('path');
const fs = require('fs');


const compressImage = (inputPath, outputPath) => {
  return sharp(inputPath)
    .resize(800) 
    .toFormat('jpeg') 
    .jpeg({ quality: 80 }) 
    .toFile(outputPath, (err, info) => {
      if (err) {
        console.error('Error compressing image:', err);
      } else {
        console.log('Image compressed:', info);
      }
    });
};


const inputImagePath = path.join(__dirname, 'uploads', 'input-image.jpg');
const outputImagePath = path.join(__dirname, 'uploads', 'output-image.jpg');
compressImage(inputImagePath, outputImagePath);
