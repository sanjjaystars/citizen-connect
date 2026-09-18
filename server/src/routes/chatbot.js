const express = require('express');
const router = express.Router();
const { optionalAuth } = require('../middleware/auth');
const { askChatbot, getChatHistory } = require('../controllers/chatbotController');

router.post('/query', optionalAuth, askChatbot);
router.get('/history', optionalAuth, getChatHistory);

module.exports = router;
