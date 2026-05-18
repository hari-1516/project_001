const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getFullReport,
  getDailyReport,
  getStudentReport,
  getSummary
} = require('../controllers/reportController');

router.get('/', protect, getFullReport);
router.get('/daily', protect, getDailyReport);
router.get('/summary', protect, getSummary);
router.get('/student/:usn', protect, getStudentReport);

module.exports = router;
