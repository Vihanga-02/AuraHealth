const Availability = require('../models/Availability');
const Doctor = require('../models/Doctor');

// GET /doctors/me/availability
const getMyAvailability = async (req, res) => {
  try {
    const doctor = await Doctor.getDoctorByUserId(req.user.id);
    if (!doctor) return res.status(404).json({ message: 'Doctor profile not found' });
    const slots = await Availability.getSlotsByDoctorId(doctor.doctor_id);
    res.json({ slots });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// POST /doctors/me/availability
const addMySlot = async (req, res) => {
  try {
    const doctor = await Doctor.getDoctorByUserId(req.user.id);
    if (!doctor) return res.status(404).json({ message: 'Doctor profile not found' });
    const { day_of_week, start_time, end_time, max_appointments } = req.body;
    if (!day_of_week || !start_time || !end_time) {
      return res.status(400).json({ message: 'day_of_week, start_time and end_time are required' });
    }
    const slot = await Availability.addSlot(doctor.doctor_id, {
      day_of_week,
      start_time,
      end_time,
      max_appointments,
    });
    res.status(201).json({ slot });
  } catch (err) { res.status(400).json({ message: err.message }); }
};

// PUT /doctors/me/availability/:slotId
const updateMySlot = async (req, res) => {
  try {
    const doctor = await Doctor.getDoctorByUserId(req.user.id);
    if (!doctor) return res.status(404).json({ message: 'Doctor profile not found' });
    const slot = await Availability.updateSlot(req.params.slotId, doctor.doctor_id, req.body);
    if (!slot) return res.status(404).json({ message: 'Slot not found' });
    res.json({ slot });
  } catch (err) { res.status(400).json({ message: err.message }); }
};

// DELETE /doctors/me/availability/:slotId
const deleteMySlot = async (req, res) => {
  try {
    const doctor = await Doctor.getDoctorByUserId(req.user.id);
    if (!doctor) return res.status(404).json({ message: 'Doctor profile not found' });
    const deleted = await Availability.deleteSlot(req.params.slotId, doctor.doctor_id);
    if (!deleted) return res.status(404).json({ message: 'Slot not found' });
    res.json({ message: 'Slot deleted successfully' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

module.exports = { getMyAvailability, addMySlot, updateMySlot, deleteMySlot };
