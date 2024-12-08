const express = require('express');
const router = express.Router();
const authRoutes = require('./authRoutes');
const postRoutes = require('./postRoutes');
const userRoutes = require('./userRoutes');
const post = require('@controllers/post');
const { appGuard, authGuard } = require("@middleware/auth");
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

router.get('/', function (req, res) {
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.json({
        status: 'ok',
        app: 'Educonnect API',
        version: '1.1.0'
    });
});
router.use("/auth", authRoutes);
router.use("/user", userRoutes);
router.use("/questions", postRoutes);

router.post('/vote/:itemType/:itemId', [authGuard], post.vote);

module.exports = router;