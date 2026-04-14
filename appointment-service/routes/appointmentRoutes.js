const express = require("express");
const router = express.Router();

const {
  createAppointment,
  getMyAppointments,
  updateAppointment,
  cancelAppointment,
  updateAppointmentStatus
} = require("../controllers/appointmentController");

const {
  verifyToken,
  allowRoles,
  allowAppointmentOwnerOrRoles
} = require("../middleware/authMiddleware");

router.post("/", verifyToken, allowRoles("PATIENT"), createAppointment);
router.get("/my", verifyToken, allowRoles("PATIENT"), getMyAppointments);
router.put("/:id", verifyToken, allowAppointmentOwnerOrRoles("ADMIN"), updateAppointment);
router.patch("/:id/cancel", verifyToken, allowAppointmentOwnerOrRoles("ADMIN"), cancelAppointment);
router.patch("/:id/status", verifyToken, allowRoles("DOCTOR", "ADMIN"), updateAppointmentStatus);

module.exports = router;
