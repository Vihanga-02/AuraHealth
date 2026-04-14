const db = require("../config/db");

const mapAppointment = (row) => ({
  _id: row.id,
  patientUserId: row.patient_user_id,
  patientName: row.patient_name,
  doctorId: row.doctor_id,
  doctorName: row.doctor_name,
  specialty: row.specialty,
  appointmentDate: row.appointment_date,
  appointmentTime: row.appointment_time,
  visitType: row.visit_type,
  status: row.status,
  hospital: row.hospital,
  location: row.location,
  notes: row.notes,
  videoLink: row.video_link,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

const Appointment = {
  create: async (data) => {
    const result = await db.query(
      `
      INSERT INTO appointments
      (
        patient_user_id, patient_name, doctor_id, doctor_name, specialty,
        appointment_date, appointment_time, visit_type, hospital, location,
        notes, status, video_link
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'PENDING',$12)
      RETURNING *
      `,
      [
        data.patientUserId,
        data.patientName,
        data.doctorId,
        data.doctorName,
        data.specialty,
        data.appointmentDate,
        data.appointmentTime,
        data.visitType,
        data.hospital,
        data.location,
        data.notes || "",
        data.videoLink
      ]
    );
    return result.rows[0];
  },
  findAllByPatient: async (patientUserId, status) => {
    let sql = `SELECT * FROM appointments WHERE patient_user_id = $1`;
    const params = [patientUserId];

    if (status) {
      sql += ` AND status = $2`;
      params.push(status);
    }

    sql += ` ORDER BY appointment_date ASC, appointment_time ASC`;

    const result = await db.query(sql, params);
    return result.rows;
  },
  checkConflict: async (doctorId, appointmentDate, appointmentTime) => {
    const conflict = await db.query(
      `
      SELECT id FROM appointments
      WHERE doctor_id = $1
        AND appointment_date = $2
        AND appointment_time = $3
        AND status NOT IN ('CANCELLED')
      `,
      [doctorId, appointmentDate, appointmentTime]
    );
    return conflict.rows.length > 0;
  },
  update: async (id, data) => {
    const result = await db.query(
      `
      UPDATE appointments
      SET appointment_date = $1,
          appointment_time = $2,
          visit_type = $3,
          notes = $4,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING *
      `,
      [data.appointmentDate, data.appointmentTime, data.visitType, data.notes, id]
    );
    return result.rows[0];
  },
  updateStatus: async (id, status) => {
    const result = await db.query(
      `
      UPDATE appointments
      SET status = $1,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
      `,
      [status, id]
    );
    return result.rows[0];
  }
};

module.exports = { Appointment, mapAppointment };
