const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const { getClasses, createClass, updateClass, deleteClass } = require('../controllers/classController');

router.get('/', protect, getClasses);
router.post('/', protect, admin, createClass);
router.put('/:id', protect, admin, updateClass);
router.delete('/:id', protect, admin, deleteClass);

module.exports = router;
