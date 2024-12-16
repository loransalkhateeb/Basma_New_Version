const express = require("express");
const router = express.Router();
const CommentBlogController = require("../Controllers/CommentBlogController");


router.post("/addCommentBlog", CommentBlogController.addCommentBlog);
router.get("/getAllCommentBlogs", CommentBlogController.getCommentBlog);
// router.get("/getCommentBlogById/:id", CommentBlogController.getCommentById); 
router.put("/updateActionCommentBlogs/:id", CommentBlogController.updateActionCommentBlogs); 
router.delete("/deleteCommentBlog/:id", CommentBlogController.deleteCommentBlog); 

module.exports = router;
