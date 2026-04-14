const { Appointment, mapAppointment } = require("../models/Appointment");
const { Doctor } = require("../models/Doctor");

const createAppointment = async (req, res) => {
  try {
    const { doctorId, appointmentDate, appointmentTime, visitType, notes } = req.body;

    if (!doctorId || !appointmentDate || !appointmentTime) {
      return res.status(400).json({ message: "doctorId, appointmentDate and appointmentTime are required" });
    }

    const doctor = await Doctor.findById(doctorId);

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    const isConflict = await Appointment.checkConflict(doctorId, appointmentDate, appointmentTime);

    if (isConflict) {
      return res.status(409).json({ message: "Selected doctor slot is already booked" });
    }

    const resolvedVisitType = visitType || doctor.visit_type || "Telemedicine";
    const videoLink = resolvedVisitType === "Telemedicine" ? `https://meet.jit.si/appointment-${Date.now()}` : null;

    const row = await Appointment.create({
      patientUserId: req.user.id,
      patientName: req.user.name,
      doctorId: doctor.id,
      doctorName: doctor.name,
      specialty: doctor.specialty,
      appointmentDate,
      appointmentTime,
      visitType: resolvedVisitType,
      hospital: doctor.hospital,
      location: doctor.location,
      notes,
      videoLink
    });

    return res.status(201).json({
      message: "Appointment booked successfully",
      appointment: mapAppointment(row)
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to create appointment", error: error.message });
  }
};

const getMyAppointments = async (req, res) => {
  try {
    const status = req.query.status || "";
    const rows = await Appointment.findAllByPatient(req.user.id, status);
    
    return res.json(rows.map(mapAppointment));
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch appointments", error: error.message });
  }
};

const updateAppointment = async (req, res) => {
  try {
    const current = req.appointment;
    const appointmentDate = req.body.appointmentDate || current.appointment_date;
    const appointmentTime = req.body.appointmentTime || current.appointment_time;
    const notes = req.body.notes ?? current.notes;
    const visitType = req.body.visitType || current.visit_type;

    if (current.status === "CANCELLED" || current.status === "COMPLETED") {
      return res.status(400).json({ message: "This appointment cannot be modified" });
    }

    const row = await Appointment.update(req.params.id, {
      appointmentDate,
      appointmentTime,
      visitType,
      notes
    });

    return res.json({
      message: "Appointment updated successfully",
      appointment: mapAppointment(row)
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update appointment", error: error.message });
  }
};

const cancelAppointment = async (req, res) => {
  try {
    const row = await Appointment.updateStatus(req.params.id, 'CANCELLED');

    if (!row) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    return res.json({
      message: "Appointment cancelled successfully",
      appointment: mapAppointment(row)
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to cancel appointment", error: error.message });
  }
};

const updateAppointmentStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ["PENDING", "CONFIRMED", "CHECKED_IN", "IN_CONSULTATION", "COMPLETED", "CANCELLED"];

    if (!allowed.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const row = await Appointment.updateStatus(req.params.id, status);

    if (!row) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    return res.json({
      message: "Appointment status updated",
      appointment: mapAppointment(row)
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update status", error: error.message });
  }
};

module.exports = {
  createAppointment,
  getMyAppointments,
  updateAppointment,
  cancelAppointment,
  updateAppointmentStatus
};
