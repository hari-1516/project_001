const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { validateNotificationIds } = require('../middleware/validation');
const { getNotifications, markNotificationsRead } = require('../controllers/notificationController');

router.get('/', protect, getNotifications);
router.put('/read', protect, validateNotificationIds, markNotificationsRead);

module.exports = router;
