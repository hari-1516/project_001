const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  updateProfile,
  updatePassword,
  getUsers,
  updateUserRole,
  deleteUser
} = require('../controllers/authController');
const { protect, admin } = require('../middleware/authMiddleware');

router.post('/login', loginUser);
router.post('/register', registerUser);
router.put('/profile', protect, updateProfile);
router.put('/password', protect, updatePassword);
router.get('/users', protect, admin, getUsers);
router.put('/users/:id/role', protect, admin, updateUserRole);
router.delete('/users/:id', protect, admin, deleteUser);

module.exports = router;
