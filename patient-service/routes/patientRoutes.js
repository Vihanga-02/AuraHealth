const express = require("express");
const router = express.Router();

const {
  createPatientProfile,
  getMyPatientProfile,
  getAllPatients,
  getPatientById,
  updatePatient,
  addReport,
  getReportsByPatient,
  deleteReport,
  addPrescription,
  getPrescriptionsByPatient,
  getPatientHistory
} = require("../controllers/patientController");

const {
  verifyToken,
  allowRoles,
  allowPatientOwnerOrRoles
} = require("../middleware/authMiddleware");

const upload = require("../config/multer");

router.get("/ping", (req, res) => {
  res.json({ message: "patient route works" });
});

router.post("/profile", verifyToken, allowRoles("PATIENT"), createPatientProfile);
router.get("/me", verifyToken, allowRoles("PATIENT"), getMyPatientProfile);
router.get("/", verifyToken, allowRoles("ADMIN"), getAllPatients);

router.get("/:id", verifyToken, allowPatientOwnerOrRoles("ADMIN", "DOCTOR"), getPatientById);
router.put("/:id", verifyToken, allowPatientOwnerOrRoles("ADMIN"), updatePatient);

router.post(
  "/:id/reports",
  verifyToken,
  allowPatientOwnerOrRoles("ADMIN"),
  upload.single("reportFile"),
  addReport
);

router.get(
  "/:id/reports",
  verifyToken,
  allowPatientOwnerOrRoles("ADMIN", "DOCTOR"),
  getReportsByPatient
);

router.delete(
  "/:id/reports/:reportId",
  verifyToken,
  allowPatientOwnerOrRoles("ADMIN"),
  deleteReport
);

router.post("/:id/prescriptions", verifyToken, allowRoles("DOCTOR", "ADMIN"), addPrescription);

router.get(
  "/:id/prescriptions",
  verifyToken,
  allowPatientOwnerOrRoles("ADMIN", "DOCTOR"),
  getPrescriptionsByPatient
);

router.get(
  "/:id/history",
  verifyToken,
  allowPatientOwnerOrRoles("ADMIN", "DOCTOR"),
  getPatientHistory
);

module.exports = router;
