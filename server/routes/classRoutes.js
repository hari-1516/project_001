const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const { validateObjectId, validateClassBody } = require('../middleware/validation');
const { getClasses, createClass, updateClass, deleteClass } = require('../controllers/classController');

router.get('/', protect, getClasses);
router.post('/', protect, admin, validateClassBody, createClass);
router.put('/:id', protect, admin, validateObjectId('id'), validateClassBody, updateClass);
router.delete('/:id', protect, admin, validateObjectId('id'), deleteClass);

module.exports = router;
