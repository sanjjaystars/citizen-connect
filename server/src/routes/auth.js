const express = require('express');
const router = express.Router();
const { sendOtp, verifyOtp, updateProfile, getMe } = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.get('/me', authenticateToken, getMe);
router.put('/profile', authenticateToken, updateProfile);

module.exports = router;
