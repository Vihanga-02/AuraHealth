const {
  listDoctors, getDoctorById, getDoctorByUserId,
  createDoctor, updateOwnProfile, verifyDoctor, getSpecialties
} = require('../services/doctorService');
const DoctorModel = require('../models/Doctor');

// GET /doctors?specialty=&search=
const getAllDoctors = async (req, res) => {
  try {
    const { specialty, search } = req.query;
    const doctors = await listDoctors({ specialty, search, verified: true });
    res.json({ doctors });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// GET /doctors/specialties
const getAllSpecialties = async (_req, res) => {
  try {
    const specialties = await getSpecialties();
    res.json({ specialties });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// GET /doctors/:id
const getOneDoctor = async (req, res) => {
  try {
    const doctor = await getDoctorById(req.params.id);
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
    res.json({ doctor });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// GET /doctors/me/profile
const getMyDoctorProfile = async (req, res) => {
  try {
    const doctor = await getDoctorByUserId(req.user.id);
    if (!doctor) return res.status(404).json({ message: 'Doctor profile not found. Please create one.' });
    res.json({ doctor });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// POST /doctors/me/profile
const createDoctorProfile = async (req, res) => {
  try {
    const { full_name, specialty } = req.body;
    if (!full_name || !specialty) {
      return res.status(400).json({ message: 'full_name and specialty are required' });
    }
    const existing = await getDoctorByUserId(req.user.id);
    if (existing) return res.status(400).json({ message: 'Doctor profile already exists' });

    const doctor = await createDoctor({ user_id: req.user.id, ...req.body });
    res.status(201).json({ doctor });
  } catch (err) { res.status(400).json({ message: err.message }); }
};

// PUT /doctors/me/profile
const updateMyDoctorProfile = async (req, res) => {
  try {
    const doctor = await updateOwnProfile({ user_id: req.user.id, ...req.body });
    if (!doctor) return res.status(404).json({ message: 'Doctor profile not found' });
    res.json({ doctor });
  } catch (err) { res.status(400).json({ message: err.message }); }
};

// PATCH /doctors/admin/:id/verify  (Admin only)
const adminVerifyDoctor = async (req, res) => {
  try {
    const verified = req.body.verified === true || req.body.verified === 'true';
    const doctor = await verifyDoctor(req.params.id, verified);
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
    res.json({ doctor, message: `Doctor ${verified ? 'verified' : 'unverified'} successfully` });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// GET /doctors/admin/all  (Admin only)
const adminListAllDoctors = async (req, res) => {
  try {
    const { specialty, search } = req.query;
    const doctors = await listDoctors({ specialty, search });
    res.json({ doctors });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// GET /doctors/admin/stats  (Admin only)
const adminDoctorStats = async (_req, res) => {
  try {
    const stats = await DoctorModel.getDoctorStats();
    res.json({ stats });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

module.exports = {
  getAllDoctors, getAllSpecialties, getOneDoctor, getMyDoctorProfile,
  createDoctorProfile, updateMyDoctorProfile, adminVerifyDoctor,
  adminListAllDoctors, adminDoctorStats,
};
