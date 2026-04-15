const express = require("express");
const router = express.Router();

const {
  createAppointment,
  getMyAppointments,
  updateAppointment,
  cancelAppointment,
  updateAppointmentStatus,
  confirmAppointment,
  getDoctorAppointments,
  doctorSetStatus
} = require("../controllers/appointmentController");

const {
  authenticateToken,
  authorizeRoles,
  allowInternalOrRoles,
  allowAppointmentOwnerOrRoles
} = require("../middleware/authMiddleware");

router.post("/", authenticateToken, authorizeRoles("Patient"), createAppointment);
router.get("/my", authenticateToken, authorizeRoles("Patient"), getMyAppointments);
router.get("/doctor/my", authenticateToken, authorizeRoles("Doctor"), getDoctorAppointments);
router.put("/:id", authenticateToken, allowAppointmentOwnerOrRoles("Admin"), updateAppointment);
router.patch("/:id/cancel", authenticateToken, allowAppointmentOwnerOrRoles("Admin"), cancelAppointment);
router.patch("/:id/status", authenticateToken, authorizeRoles("Admin"), updateAppointmentStatus);
router.patch("/:id/doctor-status", authenticateToken, authorizeRoles("Doctor"), doctorSetStatus);
// No authenticateToken here — allowInternalOrRoles handles both internal token and JWT
router.put("/:id/confirm", allowInternalOrRoles("Admin"), confirmAppointment);

module.exports = router;
