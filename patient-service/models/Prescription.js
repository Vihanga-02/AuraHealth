const db = require("../config/db");
const { fromCsv, toCsv } = require("./Patient");

const mapPrescription = (row) => ({
  _id: row._id,
  patientId: row.patientId,
  doctorId: row.doctorId,
  doctorName: row.doctorName,
  diagnosis: row.diagnosis,
  medications: fromCsv(row.medications),
  notes: row.notes,
  issuedDate: row.issuedDate,
  createdAt: row.createdAt
});

const Prescription = {
  create: async (data) => {
    const result = await db.query(
      `INSERT INTO prescriptions (
         patient_id, doctor_id, doctor_name, diagnosis, medications, notes, issued_date
       ) VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING
         id AS "_id", patient_id AS "patientId", doctor_id AS "doctorId",
         doctor_name AS "doctorName", diagnosis, medications, notes,
         issued_date AS "issuedDate", created_at AS "createdAt"`,
      [
        data.patientId, data.doctorId, data.doctorName, data.diagnosis,
        toCsv(data.medications), data.notes, data.issuedDate
      ]
    );
    return result.rows[0];
  },
  findByPatientId: async (patientId) => {
    const result = await db.query(
      `SELECT
         id AS "_id", patient_id AS "patientId", doctor_id AS "doctorId",
         doctor_name AS "doctorName", diagnosis, medications, notes,
         issued_date AS "issuedDate", created_at AS "createdAt"
       FROM prescriptions
       WHERE patient_id = $1
       ORDER BY issued_date DESC, created_at DESC`,
      [patientId]
    );
    return result.rows;
  }
};

module.exports = {
  Prescription,
  mapPrescription
};
