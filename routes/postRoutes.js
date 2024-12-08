const express = require('express');
const router = express.Router();
const post = require('@controllers/post');
const { authGuard, appGuard } = require("@middleware/auth");
const validator = require('@validators/post');
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const handleMulterError = (err, req, res, next) => {
    if(err instanceof multer.MulterError && err.code === "LIMIT_FILE_COUNT"){
        console.log("Too many files. Max allowed: 5 files");
        return res.status(422).json({
            message: "failed to create new event",
            error: {
                images: "Too many files. Max allowed: 3 files"
            }
        });
    }else if (err) {
        return res.status(500).json({
            message: "Failed to upload files",
            error: err.message
        });
    }
    next();
}

router.route('/')
.get(authGuard, post.getQuestions)
.post([
    authGuard, 
    upload.fields([
        { name: 'images', maxCount: 3 }
    ]), 
    handleMulterError, validator.createQuestion
], post.createQuestion);

router.get("/:questionId", [authGuard], post.getQuestionData);

router.route('/:questionId/answer')
//.get(combinedGuard, post.getPosts)
.post([
    authGuard, 
    upload.fields([
        { name: 'images', maxCount: 3 }
    ]), 
    handleMulterError, validator.createAnswer
], post.createAnswer);

module.exports = router;