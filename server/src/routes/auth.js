const express = require('express');
const router = express.Router();
const { sendOtp, verifyOtp, googleLogin, emailLogin, updateProfile, getMe } = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/google', googleLogin);
router.post('/email', emailLogin);
router.get('/me', authenticateToken, getMe);
router.put('/profile', authenticateToken, updateProfile);

module.exports = router;
