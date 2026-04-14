const express = require('express');
const { register, login, me, updateMe, changeMyPassword } = require('../controllers/authController');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticateToken, me);
router.put('/me', authenticateToken, updateMe);
router.post('/change-password', authenticateToken, changeMyPassword);

module.exports = router;
