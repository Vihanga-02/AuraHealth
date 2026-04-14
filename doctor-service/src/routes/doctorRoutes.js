const express = require('express');
const {
  getAllDoctors, getAllSpecialties, getOneDoctor, getMyDoctorProfile,
  createDoctorProfile, updateMyDoctorProfile, adminVerifyDoctor,
  adminListAllDoctors, adminDoctorStats
} = require('../controllers/doctorController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');
const availabilityRoutes = require('./availabilityRoutes');

const router = express.Router();

// ── Public (no wildcard /:id yet) ────────────────────────────────────────────
router.get('/specialties', getAllSpecialties);
router.get('/', getAllDoctors);

// ── Admin (must be before /:id wildcard) ─────────────────────────────────────
router.get('/admin/stats', authenticateToken, authorizeRoles('Admin'), adminDoctorStats);
router.get('/admin/all',   authenticateToken, authorizeRoles('Admin'), adminListAllDoctors);
router.patch('/admin/:id/verify', authenticateToken, authorizeRoles('Admin'), adminVerifyDoctor);

// ── Doctor own profile (must be before /:id wildcard) ────────────────────────
router.get('/me/profile',  authenticateToken, authorizeRoles('Doctor'), getMyDoctorProfile);
router.post('/me/profile', authenticateToken, authorizeRoles('Doctor'), createDoctorProfile);
router.put('/me/profile',  authenticateToken, authorizeRoles('Doctor'), updateMyDoctorProfile);

// ── Doctor availability ───────────────────────────────────────────────────────
router.use('/me/availability', authenticateToken, authorizeRoles('Doctor'), availabilityRoutes);

// ── Public: single doctor by ID (wildcard — must come last) ──────────────────
router.get('/:id', getOneDoctor);

module.exports = router;
