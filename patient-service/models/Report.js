const db = require("../config/db");

const mapReport = (row) => ({
  _id: row._id,
  patientId: row.patientId,
  uploadedBy: row.uploadedBy,
  reportTitle: row.reportTitle,
  reportType: row.reportType,
  fileName: row.fileName,
  filePath: row.filePath,
  fileUrl: row.fileUrl,
  createdAt: row.createdAt
});

const buildFileUrl = (fileName) => {
  return `${process.env.BASE_FILE_URL || ""}/uploads/reports/${fileName}`;
};

const Report = {
  create: async (data) => {
    const result = await db.query(
      `INSERT INTO reports (
         patient_id, uploaded_by, report_title, report_type, file_name, file_path, file_url
       ) VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING
         id AS "_id", patient_id AS "patientId", uploaded_by AS "uploadedBy",
         report_title AS "reportTitle", report_type AS "reportType",
         file_name AS "fileName", file_path AS "filePath", file_url AS "fileUrl",
         created_at AS "createdAt"`,
      [
        data.patientId, data.uploadedBy, data.reportTitle, data.reportType,
        data.fileName, data.filePath, data.fileUrl
      ]
    );
    return result.rows[0];
  },
  findByPatientId: async (patientId) => {
    const result = await db.query(
      `SELECT
         id AS "_id", patient_id AS "patientId", uploaded_by AS "uploadedBy",
         report_title AS "reportTitle", report_type AS "reportType",
         file_name AS "fileName", file_path AS "filePath", file_url AS "fileUrl",
         created_at AS "createdAt"
       FROM reports
       WHERE patient_id = $1
       ORDER BY created_at DESC`,
      [patientId]
    );
    return result.rows;
  },

  deleteById: async (reportId, patientId) => {
    const result = await db.query(
      `DELETE FROM reports
       WHERE id = $1 AND patient_id = $2
       RETURNING
         id AS "_id", file_path AS "filePath", file_name AS "fileName"`,
      [reportId, patientId]
    );
    return result.rows[0]; // returns deleted row (for file cleanup), or undefined if not found
  }
};

module.exports = {
  Report,
  mapReport,
  buildFileUrl
};
