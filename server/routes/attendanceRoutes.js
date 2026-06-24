const express = require('express');
const router = express.Router();
const { upload } = require('../middleware/uploadMiddleware');
const { protect } = require('../middleware/authMiddleware');
const { captureAttendance } = require('../controllers/attendanceController');

// POST /api/attendance/capture - Upload classroom image and mark attendance
router.post('/capture', protect, upload.single('image'), captureAttendance);

// GET /api/attendance/report - Get attendance report (Skeleton)
router.get('/report', protect, (req, res) => {
  res.json({ message: 'Attendance report route' });
});

module.exports = router;
