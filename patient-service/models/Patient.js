const db = require("../config/db");

const normalizeArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

const toCsv = (value) => normalizeArray(value).join(", ");
const fromCsv = (value) => normalizeArray(value);

const mapPatient = (row) => ({
  _id: row._id,
  userId: row.userId,
  fullName: row.fullName,
  email: row.email,
  phone: row.phone,
  dateOfBirth: row.dateOfBirth,
  gender: row.gender,
  address: row.address,
  bloodGroup: row.bloodGroup,
  allergies: fromCsv(row.allergies),
  chronicConditions: fromCsv(row.chronicConditions),
  emergencyContactName: row.emergencyContactName,
  emergencyContactPhone: row.emergencyContactPhone,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt
});

const patientSelect = `
  SELECT
    id AS "_id",
    user_id AS "userId",
    full_name AS "fullName",
    email,
    phone,
    date_of_birth AS "dateOfBirth",
    gender,
    address,
    blood_group AS "bloodGroup",
    allergies,
    chronic_conditions AS "chronicConditions",
    emergency_contact_name AS "emergencyContactName",
    emergency_contact_phone AS "emergencyContactPhone",
    created_at AS "createdAt",
    updated_at AS "updatedAt"
  FROM patients
`;

const Patient = {
  findByUserId: async (userId) => {
    const result = await db.query(`${patientSelect} WHERE user_id = $1`, [userId]);
    return result.rows[0]; // Raw row, model returns raw or mapped? I'll return raw and controller maps or model maps?
  },
  findById: async (id) => {
    const result = await db.query(`${patientSelect} WHERE id = $1`, [id]);
    return result.rows[0];
  },
  findAll: async () => {
    const result = await db.query(`${patientSelect} ORDER BY created_at DESC`);
    return result.rows;
  },
  create: async (data) => {
    const result = await db.query(
      `INSERT INTO patients (
         user_id, full_name, email, phone, date_of_birth, gender, address,
         blood_group, allergies, chronic_conditions, emergency_contact_name,
         emergency_contact_phone
       )
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       RETURNING
         id AS "_id", user_id AS "userId", full_name AS "fullName", email, phone,
         date_of_birth AS "dateOfBirth", gender, address, blood_group AS "bloodGroup",
         allergies, chronic_conditions AS "chronicConditions",
         emergency_contact_name AS "emergencyContactName",
         emergency_contact_phone AS "emergencyContactPhone",
         created_at AS "createdAt", updated_at AS "updatedAt"`,
      [
        data.userId, data.fullName, data.email, data.phone, data.dateOfBirth,
        data.gender, data.address, data.bloodGroup, toCsv(data.allergies),
        toCsv(data.chronicConditions), data.emergencyContactName, data.emergencyContactPhone
      ]
    );
    return result.rows[0];
  },
  update: async (id, data) => {
    const result = await db.query(
      `UPDATE patients
       SET phone = $1, date_of_birth = $2, gender = $3, address = $4,
           blood_group = $5, allergies = $6, chronic_conditions = $7,
           emergency_contact_name = $8, emergency_contact_phone = $9,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $10
       RETURNING
         id AS "_id", user_id AS "userId", full_name AS "fullName", email, phone,
         date_of_birth AS "dateOfBirth", gender, address, blood_group AS "bloodGroup",
         allergies, chronic_conditions AS "chronicConditions",
         emergency_contact_name AS "emergencyContactName",
         emergency_contact_phone AS "emergencyContactPhone",
         created_at AS "createdAt", updated_at AS "updatedAt"`,
      [
        data.phone, data.dateOfBirth, data.gender, data.address,
        data.bloodGroup, toCsv(data.allergies), toCsv(data.chronicConditions),
        data.emergencyContactName, data.emergencyContactPhone, id
      ]
    );
    return result.rows[0];
  }
};

module.exports = {
  Patient,
  mapPatient,
  toCsv,
  fromCsv
};
