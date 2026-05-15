const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const { registerStudent, getStudents } = require('../controllers/studentController');

router.post('/', protect, upload.single('image'), registerStudent);
router.get('/', protect, getStudents);

module.exports = router;

