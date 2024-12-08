const express = require('express');
const router = express.Router();
const user = require('@controllers/user');
const post = require('@controllers/post');
const { authGuard, appGuard } = require("@middleware/auth");
//const validator = require('@validators/user');
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
.get(authGuard, user.getUser)
// .post([
//     authGuard, 
//     upload.fields([
//         { name: 'image', maxCount: 1 },
//         { name: 'moi', maxCount: 1 }
//     ]), 
//     handleMulterError, validator.update_profile
// ], user.update_profile);
router.get("/questions", [authGuard], post.getUserQuestions);

module.exports = router;