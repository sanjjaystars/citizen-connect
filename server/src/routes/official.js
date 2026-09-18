const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth');
const {
  getJurisdictionPosts,
  updatePostStatus,
  getAnalytics,
} = require('../controllers/officialController');

// Only official role can access
router.use(authenticateToken);
router.use(requireRole('official'));

router.get('/posts', getJurisdictionPosts);
router.patch('/posts/:id/status', updatePostStatus);
router.get('/analytics', getAnalytics);

module.exports = router;
