const pool = require('../config/db');

const ensureScheduleTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schedules (
      id SERIAL PRIMARY KEY,
      appointment_id VARCHAR(100) NOT NULL,
      doctor_id VARCHAR(100) NOT NULL,
      patient_id VARCHAR(100) NOT NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      date DATE NOT NULL,
      start_time TIME NOT NULL,
      end_time TIME NOT NULL,
      channel_name VARCHAR(255),
      session_status VARCHAR(20) NOT NULL DEFAULT 'scheduled',
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);
};

const createSchedule = async (schedule) => {
  const {
    appointment_id,
    doctor_id,
    patient_id,
    title,
    description,
    date,
    start_time,
    end_time
  } = schedule;

  const result = await pool.query(
    `INSERT INTO schedules (appointment_id, doctor_id, patient_id, title, description, date, start_time, end_time)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [appointment_id, doctor_id, patient_id, title, description, date, start_time, end_time]
  );
  return result.rows[0];
};

const getSchedules = async () => {
  const result = await pool.query('SELECT * FROM schedules ORDER BY date DESC, start_time DESC');
  return result.rows;
};

const getScheduleById = async (id) => {
  const result = await pool.query('SELECT * FROM schedules WHERE id = $1', [id]);
  return result.rows[0] || null;
};

const setChannelName = async (id, channelName) => {
  const result = await pool.query(
    `UPDATE schedules
     SET channel_name = $1, updated_at = NOW()
     WHERE id = $2
     RETURNING *`,
    [channelName, id]
  );
  return result.rows[0] || null;
};

const markSessionCompleted = async (id) => {
  const result = await pool.query(
    `UPDATE schedules
     SET session_status = 'completed', updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [id]
  );
  return result.rows[0] || null;
};

const updateSessionStatus = async (id, status) => {
  const result = await pool.query(
    `UPDATE schedules
     SET session_status = $1, updated_at = NOW()
     WHERE id = $2
     RETURNING *`,
    [status, id]
  );
  return result.rows[0] || null;
};

const extendScheduleEndTime = async (id, minutes) => {
  const result = await pool.query(
    `UPDATE schedules
     SET end_time = (end_time + ($1::text || ' minutes')::interval)::time,
         updated_at = NOW()
     WHERE id = $2
     RETURNING *`,
    [String(minutes), id]
  );

  return result.rows[0] || null;
};

module.exports = {
  ensureScheduleTable,
  createSchedule,
  getSchedules,
  getScheduleById,
  setChannelName,
  markSessionCompleted,
  updateSessionStatus,
  extendScheduleEndTime
};