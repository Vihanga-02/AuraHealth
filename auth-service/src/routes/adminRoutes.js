const express = require('express');
const { listUsers, getUser, toggleActive, deleteUser, getStats, getLogs } = require('../controllers/adminController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();

// All admin routes require authentication + Admin role
router.use(authenticateToken, authorizeRoles('Admin'));

router.get('/stats', getStats);
router.get('/logs', getLogs);
router.get('/users', listUsers);
router.get('/users/:id', getUser);
router.patch('/users/:id/activate', toggleActive);
router.delete('/users/:id', deleteUser);

module.exports = router;
