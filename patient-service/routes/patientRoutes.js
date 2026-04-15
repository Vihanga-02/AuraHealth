const express = require("express");
const router = express.Router();

const {
  createPatientProfile,
  getMyPatientProfile,
  getAllPatients,
  getPatientById,
  getPatientByUserId,
  updatePatient,
  addReport,
  getReportsByPatient,
  deleteReport,
  addPrescription,
  addPrescriptionByUserId,
  getPrescriptionsByPatient,
  getPatientHistory,
} = require("../controllers/patientController");

const {
  authenticateToken,
  authorizeRoles,
  allowPatientOwnerOrRoles
} = require("../middleware/authMiddleware");

const upload = require("../config/multer");

router.get("/ping", (req, res) => {
  res.json({ message: "patient route works" });
});

router.post("/profile", authenticateToken, authorizeRoles("Patient"), createPatientProfile);
router.get("/me", authenticateToken, authorizeRoles("Patient"), getMyPatientProfile);
router.get("/", authenticateToken, authorizeRoles("Admin"), getAllPatients);

// ── Doctor/Admin: look up patient profile by auth user ID ────────────────
router.get("/by-user/:userId", authenticateToken, authorizeRoles("Doctor", "Admin"), getPatientByUserId);

// ── Doctor/Admin: add prescription using patient's auth user ID ──────────
router.post("/by-user/:userId/prescriptions", authenticateToken, authorizeRoles("Doctor", "Admin"), addPrescriptionByUserId);

router.get("/:id", authenticateToken, allowPatientOwnerOrRoles("Admin", "Doctor"), getPatientById);
router.put("/:id", authenticateToken, allowPatientOwnerOrRoles("Admin"), updatePatient);

router.post(
  "/:id/reports",
  authenticateToken,
  allowPatientOwnerOrRoles("Admin"),
  upload.single("reportFile"),
  addReport
);

router.get(
  "/:id/reports",
  authenticateToken,
  allowPatientOwnerOrRoles("Admin", "Doctor"),
  getReportsByPatient
);

router.delete(
  "/:id/reports/:reportId",
  authenticateToken,
  allowPatientOwnerOrRoles("Admin"),
  deleteReport
);

router.post("/:id/prescriptions", authenticateToken, authorizeRoles("Doctor", "Admin"), addPrescription);

router.get(
  "/:id/prescriptions",
  authenticateToken,
  allowPatientOwnerOrRoles("Admin", "Doctor"),
  getPrescriptionsByPatient
);

router.get(
  "/:id/history",
  authenticateToken,
  allowPatientOwnerOrRoles("Admin", "Doctor"),
  getPatientHistory
);

module.exports = router;
