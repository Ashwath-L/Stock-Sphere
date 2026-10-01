const express = require('express');
const router = express.Router();
const activityLogController = require('../controllers/activityLogController');
const { authenticateToken, requireOwner } = require('../middleware/authMiddleware');

// Activity Log Routes
router.get('/', authenticateToken, requireOwner, activityLogController.getActivityLogs);

module.exports = router;
