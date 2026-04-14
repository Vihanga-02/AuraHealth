const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const createToken = (user) => {
  return jwt.sign(
    { id: user.user_id, email: user.email, role: user.role, full_name: user.full_name },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

const registerUser = async ({ email, password, role, full_name, phone }) => {
  const existing = await pool.query('SELECT user_id FROM users WHERE email = $1', [email]);
  if (existing.rows.length > 0) {
    throw new Error('Email already registered');
  }

  const passwordHash = await bcrypt.hash(password, 10);

  // Doctors start inactive until admin approves
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
  
  // Custom fallback for demo accounts with plaintext passwords
  let isMatch = (password === user.password_hash);
  
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

const getUserById = async (userId) => {
  const result = await pool.query(
    'SELECT user_id, email, role, full_name, phone, is_active, created_at, updated_at FROM users WHERE user_id = $1',
    [userId]
  );
  return result.rows[0] || null;
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

module.exports = { registerUser, loginUser, getUserById, updateProfile, changePassword };
