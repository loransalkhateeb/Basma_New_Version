const express = require('express');
const router = express.Router();
const commentController = require('../Controllers/CommentsController');
const rateLimiter = require('../MiddleWares/rateLimiter');
const authMiddleware = require('../MiddleWares/authMiddleware');  


router.post('/addComment', rateLimiter, commentController.addComment);


router.get('/getComments', rateLimiter, commentController.getComments);


router.get('/getComment/:id', rateLimiter, commentController.getCommentById);


// router.put('/updateComment/:id', rateLimiter, commentController.updateComment);
router.put("/updateActionComment/:id", commentController.updateActionComment); 


router.delete('/deleteComment/:id', rateLimiter, commentController.deleteComment);

module.exports = router;
