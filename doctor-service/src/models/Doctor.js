/**
 * Doctor model — raw DB queries that don't fit neatly into doctorService
 * (e.g. aggregate / stats queries used only by admin controllers).
 * Core CRUD lives in doctorService.js which this model complements.
 */
const pool = require('../config/db');

/**
 * Aggregate doctor statistics for the admin dashboard.
 * @returns {{ total: number, verified: number, pending: number }}
 */
const getDoctorStats = async () => {
  const [total, verified, pending] = await Promise.all([
    pool.query('SELECT COUNT(*) FROM doctors'),
    pool.query('SELECT COUNT(*) FROM doctors WHERE verified = true'),
    pool.query('SELECT COUNT(*) FROM doctors WHERE verified = false'),
  ]);

  return {
    total:    parseInt(total.rows[0].count),
    verified: parseInt(verified.rows[0].count),
    pending:  parseInt(pending.rows[0].count),
  };
};

module.exports = { getDoctorStats };
