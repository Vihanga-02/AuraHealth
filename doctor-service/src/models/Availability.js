/**
 * Availability model — availability_slots table.
 */
const pool = require('../config/db');

const getSlotsByDoctorId = async (doctorId) => {
  const result = await pool.query(
    `SELECT * FROM availability_slots WHERE doctor_id = $1
     ORDER BY CASE day_of_week
       WHEN 'Monday' THEN 1 WHEN 'Tuesday' THEN 2 WHEN 'Wednesday' THEN 3
       WHEN 'Thursday' THEN 4 WHEN 'Friday' THEN 5 WHEN 'Saturday' THEN 6
       WHEN 'Sunday' THEN 7 END, start_time`,
    [doctorId]
  );
  return result.rows;
};

const addSlot = async (doctorId, { day_of_week, start_time, end_time, max_appointments }) => {
  const result = await pool.query(
    `INSERT INTO availability_slots (doctor_id, day_of_week, start_time, end_time, max_appointments)
     VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [doctorId, day_of_week, start_time, end_time, max_appointments || 10]
  );
  return result.rows[0];
};

const updateSlot = async (
  slotId,
  doctorId,
  { day_of_week, start_time, end_time, max_appointments, is_available }
) => {
  const result = await pool.query(
    `UPDATE availability_slots SET
       day_of_week       = COALESCE($3, day_of_week),
       start_time        = COALESCE($4, start_time),
       end_time          = COALESCE($5, end_time),
       max_appointments  = COALESCE($6, max_appointments),
       is_available      = COALESCE($7, is_available)
     WHERE slot_id = $1 AND doctor_id = $2 RETURNING *`,
    [
      slotId,
      doctorId,
      day_of_week || null,
      start_time || null,
      end_time || null,
      max_appointments || null,
      is_available ?? null,
    ]
  );
  return result.rows[0] || null;
};

const deleteSlot = async (slotId, doctorId) => {
  const result = await pool.query(
    `DELETE FROM availability_slots WHERE slot_id = $1 AND doctor_id = $2 RETURNING slot_id`,
    [slotId, doctorId]
  );
  return result.rows[0] || null;
};

module.exports = { getSlotsByDoctorId, addSlot, updateSlot, deleteSlot };
