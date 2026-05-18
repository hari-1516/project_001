const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getNotifications, markNotificationsRead } = require('../controllers/notificationController');

router.get('/', protect, getNotifications);
router.put('/read', protect, markNotificationsRead);

module.exports = router;
