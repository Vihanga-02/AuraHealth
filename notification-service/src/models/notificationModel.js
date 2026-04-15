import { pool } from '../config/index.js';

/**
 * Notification Model (DAO)
 */
class NotificationModel {
  /**
   * Create a new notification record in PENDING state
   */
  async create(recipient, message) {
    const query = `
      INSERT INTO notifications (recipient_number, message_body, status) 
      VALUES ($1, $2, $3) 
      RETURNING id
    `;
    const result = await pool.query(query, [recipient, message, 'PENDING']);
    return result.rows[0].id;
  }

  /**
   * Update notification status and details
   */
  async updateStatus(id, status, providerRef = null, errorMessage = null) {
    const query = `
      UPDATE notifications 
      SET status = $1, 
          provider_ref = $2, 
          error_message = $3, 
          sent_at = CASE WHEN $1 = 'SENT' THEN NOW() ELSE sent_at END
      WHERE id = $4
    `;
    return await pool.query(query, [status, providerRef, errorMessage, id]);
  }

  /**
   * Find notifications with limit
   */
  async findAll(limit = 100) {
    const query = `
      SELECT id, recipient_number, message_body, status, error_message, provider_ref, sent_at
      FROM notifications 
      ORDER BY id DESC 
      LIMIT $1
    `;
    const result = await pool.query(query, [limit]);
    return result.rows;
  }

  /**
   * Get notification statistics by status
   */
  async getStats() {
    const query = `
      SELECT status, COUNT(*) as count 
      FROM notifications 
      GROUP BY status
    `;
    const result = await pool.query(query);
    
    const stats = result.rows.reduce((acc, row) => {
      acc[row.status] = parseInt(row.count);
      return acc;
    }, {});

    return {
      total: result.rows.length > 0 ? Object.values(stats).reduce((a, b) => a + b, 0) : 0,
      ...stats
    };
  }
}

export const Notification = new NotificationModel();
export default Notification;
