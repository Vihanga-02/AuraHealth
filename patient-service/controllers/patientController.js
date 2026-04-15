const db = require("../config/db");

const { Patient, mapPatient } = require("../models/Patient");
const { Report, mapReport, buildFileUrl } = require("../models/Report");
const { Prescription, mapPrescription } = require("../models/Prescription");

const createPatientProfile = async (req, res) => {
  try {
    const {
      phone,
      dateOfBirth,
      gender,
      address,
      bloodGroup,
      allergies,
      chronicConditions,
      emergencyContactName,
      emergencyContactPhone
    } = req.body;

    if (!phone) {
      return res.status(400).json({ message: "phone is required" });
    }

    const existingPatient = await Patient.findByUserId(req.user.id);
    if (existingPatient) {
      return res.status(409).json({ message: "Patient profile already exists for this user" });
    }

    const newPatientData = {
      userId: req.user.id,
      fullName: req.user.full_name || req.user.name || req.user.email,
      email: req.user.email,
      phone,
      dateOfBirth,
      gender,
      address,
      bloodGroup,
      allergies,
      chronicConditions,
      emergencyContactName,
      emergencyContactPhone
    };

    const row = await Patient.create(newPatientData);
    return res.status(201).json({
      message: "Patient profile created successfully",
      patient: mapPatient(row)
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to create patient profile",
      error: error.message
    });
  }
};

const getMyPatientProfile = async (req, res) => {
  try {
    const patientRow = await Patient.findByUserId(req.user.id);

    if (!patientRow) {
      return res.status(404).json({ message: "Patient profile not found" });
    }

    return res.json(mapPatient(patientRow));
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch patient profile",
      error: error.message
    });
  }
};

const getAllPatients = async (req, res) => {
  try {
    const rows = await Patient.findAll();
    return res.json(rows.map(mapPatient));
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch patients",
      error: error.message
    });
  }
};

const getPatientById = async (req, res) => {
  try {
    if (req.patient) {
      return res.json(mapPatient(req.patient));
    }

    const row = await Patient.findById(req.params.id);

    if (!row) {
      return res.status(404).json({ message: "Patient not found" });
    }

    return res.json(mapPatient(row));
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch patient",
      error: error.message
    });
  }
};

const updatePatient = async (req, res) => {
  try {
    const currentPatient = req.patient || (await Patient.findById(req.params.id));

    if (!currentPatient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    const payload = {
      phone: req.body.phone ?? currentPatient.phone,
      dateOfBirth: req.body.dateOfBirth ?? currentPatient.dateOfBirth,
      gender: req.body.gender ?? currentPatient.gender,
      address: req.body.address ?? currentPatient.address,
      bloodGroup: req.body.bloodGroup ?? currentPatient.bloodGroup,
      allergies: req.body.allergies !== undefined ? req.body.allergies : currentPatient.allergies,
      chronicConditions:
        req.body.chronicConditions !== undefined
          ? req.body.chronicConditions
          : currentPatient.chronicConditions,
      emergencyContactName:
        req.body.emergencyContactName ?? currentPatient.emergencyContactName,
      emergencyContactPhone:
        req.body.emergencyContactPhone ?? currentPatient.emergencyContactPhone
    };

    const row = await Patient.update(req.params.id, payload);
    return res.json({
      message: "Patient updated successfully",
      patient: mapPatient(row)
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to update patient",
      error: error.message
    });
  }
};

const addReport = async (req, res) => {
  try {
    const { reportTitle, reportType } = req.body;

    if (!reportTitle) {
      return res.status(400).json({ message: "reportTitle is required" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "Report file is required" });
    }

    const patient = req.patient || (await Patient.findById(req.params.id));

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    const row = await Report.create({
      patientId: patient._id || patient.id,
      uploadedBy: req.user.id,
      reportTitle,
      reportType: reportType || "General",
      fileName: req.file.filename,
      filePath: req.file.path,
      fileUrl: buildFileUrl(req.file.filename)
    });

    return res.status(201).json({
      message: "Report uploaded successfully",
      report: mapReport(row)
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to upload report",
      error: error.message
    });
  }
};

const getReportsByPatient = async (req, res) => {
  try {
    const rows = await Report.findByPatientId(req.params.id);
    return res.json(rows.map(mapReport));
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch reports",
      error: error.message
    });
  }
};

const deleteReport = async (req, res) => {
  try {
    const { id: patientId, reportId } = req.params;

    const deleted = await Report.deleteById(reportId, patientId);

    if (!deleted) {
      return res.status(404).json({ message: "Report not found or does not belong to this patient" });
    }

    // Delete the physical file from disk
    const fs = require("fs");
    if (deleted.filePath && fs.existsSync(deleted.filePath)) {
      fs.unlinkSync(deleted.filePath);
    }

    return res.json({ message: "Report deleted successfully", reportId: deleted._id });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to delete report",
      error: error.message
    });
  }
};

const addPrescription = async (req, res) => {
  try {
    const { doctorId, doctorName, diagnosis, medications, notes, issuedDate } = req.body;

    if (!doctorName) {
      return res.status(400).json({ message: "doctorName is required" });
    }

    const patient = await Patient.findById(req.params.id);

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    const row = await Prescription.create({
      patientId: patient._id || patient.id,
      doctorId: doctorId || null,
      doctorName,
      diagnosis: diagnosis || null,
      medications: medications || [],
      notes: notes || null,
      issuedDate: issuedDate || null
    });

    return res.status(201).json({
      message: "Prescription added successfully",
      prescription: mapPrescription(row)
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to add prescription",
      error: error.message
    });
  }
};

const getPrescriptionsByPatient = async (req, res) => {
  try {
    const rows = await Prescription.findByPatientId(req.params.id);
    return res.json(rows.map(mapPrescription));
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch prescriptions",
      error: error.message
    });
  }
};

// GET /patients/by-user/:userId  (Doctor / Admin)
const getPatientByUserId = async (req, res) => {
  try {
    const row = await Patient.findByUserId(req.params.userId);
    if (!row) return res.status(404).json({ message: "Patient profile not found" });
    return res.json(mapPatient(row));
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch patient", error: error.message });
  }
};

// POST /patients/by-user/:userId/prescriptions  (Doctor / Admin)
const addPrescriptionByUserId = async (req, res) => {
  try {
    const { doctorName, diagnosis, medications, notes, issuedDate } = req.body;
    if (!doctorName) {
      return res.status(400).json({ message: "doctorName is required" });
    }
    const patient = await Patient.findByUserId(req.params.userId);
    if (!patient) {
      return res.status(404).json({ message: "Patient profile not found" });
    }
    const row = await Prescription.create({
      patientId:  patient._id || patient.id,
      doctorId:   req.user.id,
      doctorName,
      diagnosis:  diagnosis  || null,
      medications: medications || [],
      notes:       notes       || null,
      issuedDate:  issuedDate  || null,
    });
    return res.status(201).json({
      message: "Prescription added successfully",
      prescription: mapPrescription(row),
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to add prescription", error: error.message });
  }
};

const getPatientHistory = async (req, res) => {
  try {
    const [patientRow, reportsRows, prescriptionsRows] = await Promise.all([
      Patient.findById(req.params.id),
      Report.findByPatientId(req.params.id),
      Prescription.findByPatientId(req.params.id)
    ]);

    if (!patientRow) {
      return res.status(404).json({ message: "Patient not found" });
    }

    return res.json({
      patient: mapPatient(patientRow),
      reports: reportsRows.map(mapReport),
      prescriptions: prescriptionsRows.map(mapPrescription)
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch patient history",
      error: error.message
    });
  }
};

module.exports = {
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
};
