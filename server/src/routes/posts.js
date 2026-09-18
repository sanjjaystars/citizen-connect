const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const {
  getPosts,
  checkDuplicatePost,
  previewClassification,
  createPost,
  toggleUpvote,
  getPostById,
} = require('../controllers/postController');

router.get('/', optionalAuth, getPosts);
router.get('/:id', optionalAuth, getPostById);
router.post('/check-duplicate', optionalAuth, checkDuplicatePost);
router.post('/preview-classify', optionalAuth, previewClassification);
router.post('/', authenticateToken, upload.single('photo'), createPost);
router.post('/:id/upvote', authenticateToken, toggleUpvote);

module.exports = router;
