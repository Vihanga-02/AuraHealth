/**
 * User model — users / admin_logs tables plus auth flows (register, login, profile, password).
 * Controllers should call these; they must NOT write raw SQL themselves.
 */
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const createToken = (user) =>
  jwt.sign(
    { id: user.user_id, email: user.email, role: user.role, full_name: user.full_name },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

// ── User Queries ──────────────────────────────────────────────────────────────

/**
 * Fetch a filtered/paginated list of users.
 * @param {{ role?: string, is_active?: string, search?: string }} filters
 */
const findAll = async ({ role, is_active, search } = {}) => {
  const conditions = [];
  const values = [];
  let i = 1;

  if (role)                    { conditions.push(`role = $${i++}`);                              values.push(role); }
  if (is_active !== undefined) { conditions.push(`is_active = $${i++}`);                         values.push(is_active === 'true'); }
  if (search)                  { conditions.push(`(email ILIKE $${i} OR full_name ILIKE $${i++})`); values.push(`%${search}%`); }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const result = await pool.query(
    `SELECT user_id, email, role, full_name, phone, is_active, created_at, updated_at
     FROM users ${where} ORDER BY created_at DESC`,
    values
  );
  return result.rows;
};

/**
 * Find a single user by primary key.
 * @param {string|number} userId
 */
const findById = async (userId) => {
  const result = await pool.query(
    `SELECT user_id, email, role, full_name, phone, is_active, created_at, updated_at
     FROM users WHERE user_id = $1`,
    [userId]
  );
  return result.rows[0] || null;
};

/**
 * Toggle the is_active flag on a user.
 * @param {string|number} userId
 * @param {boolean} is_active
 */
const setActive = async (userId, is_active) => {
  const result = await pool.query(
    `UPDATE users SET is_active = $2, updated_at = NOW()
     WHERE user_id = $1
     RETURNING user_id, email, role, full_name, is_active`,
    [userId, is_active]
  );
  return result.rows[0] || null;
};

/**
 * Hard-delete a user by ID.
 * @param {string|number} userId
 */
const remove = async (userId) => {
  const result = await pool.query(
    'DELETE FROM users WHERE user_id = $1 RETURNING user_id, email',
    [userId]
  );
  return result.rows[0] || null;
};

// ── Stats ─────────────────────────────────────────────────────────────────────

/**
 * Aggregate platform user statistics.
 */
const getStats = async () => {
  const [total, doctors, patients, admins, pendingDoctors] = await Promise.all([
    pool.query('SELECT COUNT(*) FROM users'),
    pool.query("SELECT COUNT(*) FROM users WHERE role = 'Doctor'"),
    pool.query("SELECT COUNT(*) FROM users WHERE role = 'Patient'"),
    pool.query("SELECT COUNT(*) FROM users WHERE role = 'Admin'"),
    pool.query("SELECT COUNT(*) FROM users WHERE role = 'Doctor' AND is_active = false"),
  ]);

  return {
    total:          parseInt(total.rows[0].count),
    doctors:        parseInt(doctors.rows[0].count),
    patients:       parseInt(patients.rows[0].count),
    admins:         parseInt(admins.rows[0].count),
    pendingDoctors: parseInt(pendingDoctors.rows[0].count),
  };
};

// ── Admin Logs ────────────────────────────────────────────────────────────────

/**
 * Insert an admin audit-log entry.
 * @param {{ adminId, action, targetUserId, details }} params
 */
const addLog = async ({ adminId, action, targetUserId, details }) => {
  await pool.query(
    'INSERT INTO admin_logs (admin_id, action, target_user_id, details) VALUES ($1, $2, $3, $4)',
    [adminId, action, targetUserId, details]
  );
};

/**
 * Fetch the most recent 100 admin audit-log entries.
 */
const getLogs = async () => {
  const result = await pool.query(
    `SELECT l.log_id, l.action, l.details, l.created_at,
            u.email AS admin_email
     FROM admin_logs l
     LEFT JOIN users u ON l.admin_id = u.user_id
     ORDER BY l.created_at DESC LIMIT 100`
  );
  return result.rows;
};

// ── Auth (register / login / self-service profile) ───────────────────────────

const registerUser = async ({ email, password, role, full_name, phone }) => {
  const existing = await pool.query('SELECT user_id FROM users WHERE email = $1', [email]);
  if (existing.rows.length > 0) {
    throw new Error('Email already registered');
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const is_active = role === 'Doctor' ? false : true;

  const result = await pool.query(
    `INSERT INTO users (email, password_hash, role, full_name, phone, is_active)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING user_id, email, role, full_name, phone, is_active, created_at`,
    [email, passwordHash, role, full_name || null, phone || null, is_active]
  );

  const user = result.rows[0];
  const message =
    role === 'Doctor'
      ? 'Registration successful. Your account is pending admin approval.'
      : 'Registration successful.';

  return { user, message };
};

const loginUser = async ({ email, password }) => {
  const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  if (result.rows.length === 0) {
    throw new Error('Invalid credentials');
  }

  const user = result.rows[0];
  let isMatch = password === user.password_hash;
  if (!isMatch && user.password_hash.startsWith('$2')) {
    isMatch = await bcrypt.compare(password, user.password_hash);
  }

  if (!isMatch) {
    throw new Error('Invalid credentials');
  }

  if (!user.is_active) {
    throw new Error('Your account is pending activation by an administrator.');
  }

  const token = createToken(user);
  return {
    user: {
      user_id: user.user_id,
      email: user.email,
      role: user.role,
      full_name: user.full_name,
      phone: user.phone,
      is_active: user.is_active,
      created_at: user.created_at,
    },
    token,
  };
};

const updateProfile = async (userId, { full_name, phone }) => {
  const result = await pool.query(
    `UPDATE users
     SET full_name = COALESCE($2, full_name),
         phone     = COALESCE($3, phone),
         updated_at = NOW()
     WHERE user_id = $1
     RETURNING user_id, email, role, full_name, phone, is_active, created_at, updated_at`,
    [userId, full_name || null, phone || null]
  );
  return result.rows[0] || null;
};

const changePassword = async (userId, { currentPassword, newPassword }) => {
  const result = await pool.query('SELECT * FROM users WHERE user_id = $1', [userId]);
  if (result.rows.length === 0) throw new Error('User not found');

  const user = result.rows[0];
  const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
  if (!isMatch) throw new Error('Current password is incorrect');

  const newHash = await bcrypt.hash(newPassword, 10);
  await pool.query('UPDATE users SET password_hash = $2, updated_at = NOW() WHERE user_id = $1', [
    userId,
    newHash,
  ]);
  return { message: 'Password changed successfully' };
};

module.exports = {
  findAll,
  findById,
  setActive,
  remove,
  getStats,
  addLog,
  getLogs,
  registerUser,
  loginUser,
  updateProfile,
  changePassword,
};
