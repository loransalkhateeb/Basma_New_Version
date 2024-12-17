const express = require('express');
const router = express.Router();
const tagController = require('../Controllers/TagController');
const rateLimiter = require('../MiddleWares/rateLimiter');
const authMiddleware = require('../MiddleWares/authMiddleware');  


router.post('/createTag', rateLimiter, tagController.addTag);


router.get('/getUniqueTags', rateLimiter, tagController.getUniqueTags);


router.get('/getTagById/:id', rateLimiter, tagController.getTagById);


router.get('/getBlogsByTag/:tag_name', rateLimiter, tagController.getBlogsByTag);



router.delete('/deleteTag/:id', rateLimiter, tagController.deleteTag);

module.exports = router;
