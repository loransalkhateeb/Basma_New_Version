const ffmpeg = require('fluent-ffmpeg');
const path = require('path');


const compressVideo = (inputPath, outputPath) => {
  ffmpeg(inputPath)
    .outputOptions('-vcodec', 'libx264') 
    .outputOptions('-crf', '28') 
        .output(outputPath)
    .on('end', () => {
      console.log('Video compression finished');
    })
    .on('error', (err) => {
      console.error('Error compressing video:', err);
    })
    .run();
};


const inputVideoPath = path.join(__dirname, 'uploads', 'input-video.mp4');
const outputVideoPath = path.join(__dirname, 'uploads', 'output-video.mp4');
compressVideo(inputVideoPath, outputVideoPath);
