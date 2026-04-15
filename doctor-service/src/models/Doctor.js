/**
 * Doctor model — doctors table CRUD, listings, admin stats.
 */
const pool = require('../config/db');

const listDoctors = async ({ specialty, search, verified } = {}) => {
  const conditions = [];
  const values = [];
  let i = 1;

  if (verified !== undefined) {
    conditions.push(`d.verified = $${i++}`);
    values.push(verified);
  }
  if (specialty) {
    conditions.push(`d.specialty ILIKE $${i++}`);
    values.push(`%${specialty}%`);
  }
  if (search) {
    conditions.push(
      `(d.full_name ILIKE $${i} OR d.specialty ILIKE $${i} OR d.hospital_affiliation ILIKE $${i++})`
    );
    values.push(`%${search}%`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const result = await pool.query(
    `SELECT doctor_id, user_id, full_name, specialty, bio, experience_years,
            consultation_fee, phone_number, profile_image_url, languages,
            hospital_affiliation, verified, rating, total_consultations, created_at
     FROM doctors d ${where} ORDER BY rating DESC, total_consultations DESC`,
    values
  );
  return result.rows;
};

const getDoctorById = async (doctorId) => {
  const result = await pool.query(
    `SELECT d.*,
            json_agg(json_build_object(
              'slot_id', s.slot_id, 'day_of_week', s.day_of_week,
              'start_time', s.start_time, 'end_time', s.end_time,
              'max_appointments', s.max_appointments, 'is_available', s.is_available
            ) ORDER BY s.day_of_week, s.start_time) FILTER (WHERE s.slot_id IS NOT NULL) AS availability
     FROM doctors d
     LEFT JOIN availability_slots s ON s.doctor_id = d.doctor_id AND s.is_available = true
     WHERE d.doctor_id = $1
     GROUP BY d.doctor_id`,
    [doctorId]
  );
  return result.rows[0] || null;
};

const getDoctorByUserId = async (userId) => {
  const result = await pool.query(
    `SELECT d.*,
            json_agg(json_build_object(
              'slot_id', s.slot_id, 'day_of_week', s.day_of_week,
              'start_time', s.start_time, 'end_time', s.end_time,
              'max_appointments', s.max_appointments, 'is_available', s.is_available
            ) ORDER BY s.day_of_week, s.start_time) FILTER (WHERE s.slot_id IS NOT NULL) AS availability
     FROM doctors d
     LEFT JOIN availability_slots s ON s.doctor_id = d.doctor_id
     WHERE d.user_id = $1
     GROUP BY d.doctor_id`,
    [userId]
  );
  return result.rows[0] || null;
};

const createDoctor = async ({
  user_id,
  full_name,
  specialty,
  bio,
  license_number,
  qualification,
  experience_years,
  consultation_fee,
  phone_number,
  languages,
  hospital_affiliation,
}) => {
  const result = await pool.query(
    `INSERT INTO doctors (user_id, full_name, specialty, bio, license_number, qualification,
       experience_years, consultation_fee, phone_number, languages, hospital_affiliation)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
     RETURNING *`,
    [
      user_id,
      full_name,
      specialty,
      bio || null,
      license_number || null,
      qualification || null,
      experience_years || 0,
      consultation_fee || 0,
      phone_number || null,
      languages || 'English',
      hospital_affiliation || null,
    ]
  );
  return result.rows[0];
};

const updateOwnProfile = async ({
  user_id,
  full_name,
  specialty,
  bio,
  license_number,
  qualification,
  experience_years,
  consultation_fee,
  phone_number,
  profile_image_url,
  languages,
  hospital_affiliation,
}) => {
  const result = await pool.query(
    `UPDATE doctors SET
       full_name           = COALESCE($2,  full_name),
       specialty           = COALESCE($3,  specialty),
       bio                 = COALESCE($4,  bio),
       license_number      = COALESCE($5,  license_number),
       qualification       = COALESCE($6,  qualification),
       experience_years    = COALESCE($7,  experience_years),
       consultation_fee    = COALESCE($8,  consultation_fee),
       phone_number        = COALESCE($9,  phone_number),
       profile_image_url   = COALESCE($10, profile_image_url),
       languages           = COALESCE($11, languages),
       hospital_affiliation= COALESCE($12, hospital_affiliation),
       updated_at          = NOW()
     WHERE user_id = $1
     RETURNING *`,
    [
      user_id,
      full_name || null,
      specialty || null,
      bio || null,
      license_number || null,
      qualification || null,
      experience_years || null,
      consultation_fee || null,
      phone_number || null,
      profile_image_url || null,
      languages || null,
      hospital_affiliation || null,
    ]
  );
  return result.rows[0] || null;
};

const verifyDoctor = async (doctorId, verified) => {
  const result = await pool.query(
    `UPDATE doctors SET verified = $2, updated_at = NOW()
     WHERE doctor_id = $1 RETURNING *`,
    [doctorId, verified]
  );
  return result.rows[0] || null;
};

const getSpecialties = async () => {
  const result = await pool.query(
    `SELECT DISTINCT specialty FROM doctors WHERE verified = true ORDER BY specialty`
  );
  return result.rows.map((r) => r.specialty);
};

const rateDoctor = async (doctorId, rating) => {
  // Compute rolling average: (current_rating * total_consultations + new_rating) / (total_consultations + 1)
  const result = await pool.query(
    `UPDATE doctors
     SET rating = ROUND(
           (COALESCE(rating, 0) * COALESCE(total_consultations, 0) + $2)::numeric
           / (COALESCE(total_consultations, 0) + 1), 1
         ),
         total_consultations = COALESCE(total_consultations, 0) + 1,
         updated_at = NOW()
     WHERE doctor_id = $1
     RETURNING doctor_id, rating, total_consultations`,
    [doctorId, rating]
  );
  return result.rows[0] || null;
};

const getDoctorStats = async () => {
  const [total, verified, pending] = await Promise.all([
    pool.query('SELECT COUNT(*) FROM doctors'),
    pool.query('SELECT COUNT(*) FROM doctors WHERE verified = true'),
    pool.query('SELECT COUNT(*) FROM doctors WHERE verified = false'),
  ]);

  return {
    total: parseInt(total.rows[0].count),
    verified: parseInt(verified.rows[0].count),
    pending: parseInt(pending.rows[0].count),
  };
};

module.exports = {
  listDoctors,
  getDoctorById,
  getDoctorByUserId,
  createDoctor,
  updateOwnProfile,
  verifyDoctor,
  rateDoctor,
  getSpecialties,
  getDoctorStats,
};
