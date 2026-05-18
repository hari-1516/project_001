const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const { registerStudent, getStudents, getStudentById, updateStudent, deleteStudent } = require('../controllers/studentController');

router.post('/', protect, upload.single('image'), registerStudent);
router.get('/', protect, getStudents);
router.get('/:id', protect, getStudentById);
router.put('/:id', protect, upload.single('image'), updateStudent);
router.delete('/:id', protect, deleteStudent);

module.exports = router;
