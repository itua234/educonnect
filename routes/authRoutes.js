const express = require('express');
const router = express.Router();
const auth = require('@controllers/auth');
const user = require('@controllers/user');
const { authGuard, appGuard } = require("@middleware/auth");
const validator = require('@validators/auth');

router.post('/signup', [appGuard, validator.register], auth.register);
router.post('/signin', [appGuard, validator.login], auth.login);
router.post('/google/callback', [appGuard, validator.google_login], auth.google_signin);
router.get('/signout', [authGuard], auth.logout);
// router.post('/reset-password', [appGuard, validator.forgotPassword], auth.forgotPassword);
// router.post('/password-reset', [validator.resetPassword], auth.resetPassword);
router.post('/change-password', [authGuard, validator.changePassword], user.changePassword);
// router.get('/verify-email/:email/:token', [appGuard, validator.verify_email], auth.verify_email);

module.exports = router;