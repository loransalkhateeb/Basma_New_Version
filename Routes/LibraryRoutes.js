const express = require('express');
const router = express.Router();
const libraryController = require('../Controllers/LibraryController');
const rateLimiter = require('../MiddleWares/rateLimiter');
const authMiddleware = require('../MiddleWares/authMiddleware');
const upload = require('../Config/Multer'); 

router.post('/createLibrary', 
    rateLimiter, 
    upload.single('file_book'),  
    libraryController.createLibrary  
  );

router.get('/getLibraries', rateLimiter, libraryController.getLibrary);

router.get('/getLibrary/:id', rateLimiter, libraryController.getLibraryById);

router.get('/getFile/:filename',rateLimiter,libraryController.getByFile)

router.put('/updateLibrary/:id', rateLimiter, libraryController.updateLibrary);

router.delete('/deleteLibrary/:id', rateLimiter, libraryController.deleteLibrary);

module.exports = router;
