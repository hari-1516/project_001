const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { validatePagination, validateDateQuery, validateThreshold } = require('../middleware/validation');
const {
  getFullReport,
  getDailyReport,
  getStudentReport,
  getSummary,
  getLowAttendanceStudents,
  getStudentsByDepartment
} = require('../controllers/reportController');
const { exportExcel, exportPDF } = require('../controllers/exportController');
const { getEngagementAnalytics, getAttendancePrediction } = require('../controllers/analyticsController');

router.get('/', protect, validatePagination, getFullReport);
router.get('/daily', protect, validateDateQuery, getDailyReport);
router.get('/summary', protect, getSummary);
router.get('/low-attendance', protect, validateThreshold, getLowAttendanceStudents);
router.get('/students-by-department', protect, getStudentsByDepartment);
router.get('/student/:usn', protect, getStudentReport);

// Export routes
router.get('/export/excel', protect, exportExcel);
router.get('/export/pdf', protect, exportPDF);

// Analytics routes
router.get('/analytics/engagement', protect, getEngagementAnalytics);
router.get('/analytics/predict', protect, getAttendancePrediction);

module.exports = router;
