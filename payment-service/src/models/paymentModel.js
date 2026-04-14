const pool = require('../config/db');

class PaymentModel {
    static async createTransaction(data) {
        const { appointmentId, paymentIntentId, amount, currency, customerEmail, customerName, paymentIntentData } = data;
        const query = `
            INSERT INTO transactions 
            (appointment_id, stripe_payment_id, amount, currency, status, customer_email, customer_name, payment_intent_data) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *`;
        const values = [appointmentId, paymentIntentId, amount, currency, 'pending', customerEmail || null, customerName || null, JSON.stringify(paymentIntentData)];
        const result = await pool.query(query, values);
        return result.rows[0];
    }

    static async getTransactionByStripeId(stripePaymentId) {
        const query = 'SELECT * FROM transactions WHERE stripe_payment_id = $1';
        const result = await pool.query(query, [stripePaymentId]);
        return result.rows[0] || null;
    }

    static async updatePaymentSuccess(stripePaymentId, paymentMethod, customerEmail, customerName) {
        const query = `
            UPDATE transactions 
            SET status = $1, 
                updated_at = NOW(),
                payment_method = $2,
                customer_email = COALESCE($3, customer_email),
                customer_name = COALESCE($4, customer_name)
            WHERE stripe_payment_id = $5
            RETURNING *`;
        const pMethod = paymentMethod === undefined ? null : paymentMethod;
        const cEmail = customerEmail === undefined ? null : customerEmail;
        const cName = customerName === undefined ? null : customerName;
        const result = await pool.query(query, ['succeeded', pMethod, cEmail, cName, stripePaymentId]);
        return result.rows[0];
    }

    static async updatePaymentFailure(stripePaymentId, errorMessage) {
        const query = 'UPDATE transactions SET status = $1, updated_at = NOW(), error_message = $2 WHERE stripe_payment_id = $3';
        const result = await pool.query(query, ['failed', errorMessage, stripePaymentId]);
        return result.rowCount;
    }

    static async updatePaymentRefund(stripePaymentId, refundId, refundAmount) {
        const query = `
            UPDATE transactions 
            SET status = $1, 
                updated_at = NOW(),
                refund_id = $2,
                refund_amount = $3,
                refund_date = NOW()
            WHERE stripe_payment_id = $4
            RETURNING *`;
        const result = await pool.query(query, ['refunded', refundId, refundAmount, stripePaymentId]);
        return result.rows[0];
    }

    static async getTransactions(filters) {
        const { status, startDate, endDate, search, limit = 50, offset = 0, sortBy = 'created_at', sortOrder = 'DESC' } = filters;
        
        let query = `
            SELECT 
                id, appointment_id as "appointmentId", stripe_payment_id as "transactionId",
                amount, currency, status, created_at as "createdAt", updated_at as "updatedAt",
                customer_email as "customerEmail", customer_name as "customerName",
                payment_method as "paymentMethod", error_message as "errorMessage",
                refund_id as "refundId", refund_amount as "refundAmount", refund_date as "refundDate"
            FROM transactions 
            WHERE 1=1
        `;
        let countQuery = `SELECT COUNT(*) as total FROM transactions WHERE 1=1`;
        
        const params = [];
        let paramIndex = 1;

        if (status && status !== 'all') {
            query += ` AND status = $${paramIndex}`;
            countQuery += ` AND status = $${paramIndex}`;
            params.push(status);
            paramIndex++;
        }

        if (startDate) {
            query += ` AND created_at >= $${paramIndex}`;
            countQuery += ` AND created_at >= $${paramIndex}`;
            params.push(startDate);
            paramIndex++;
        }

        if (endDate) {
            query += ` AND created_at <= $${paramIndex}`;
            countQuery += ` AND created_at <= $${paramIndex}`;
            params.push(endDate);
            paramIndex++;
        }

        if (search) {
            const searchStr = ` AND (
                appointment_id::text ILIKE $${paramIndex} OR 
                stripe_payment_id ILIKE $${paramIndex} OR 
                customer_email ILIKE $${paramIndex} OR 
                customer_name ILIKE $${paramIndex}
            )`;
            query += searchStr;
            countQuery += searchStr;
            params.push(`%${search}%`);
            paramIndex++;
        }

        const countParams = [...params];

        const safeSortBy = ['created_at', 'amount'].includes(sortBy) ? sortBy : 'created_at';
        const safeSortOrder = ['ASC', 'DESC'].includes(String(sortOrder).toUpperCase()) ? String(sortOrder).toUpperCase() : 'DESC';

        query += ` ORDER BY ${safeSortBy} ${safeSortOrder} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(limit, offset);
        
        const [transactionsResult, countResult] = await Promise.all([
            pool.query(query, params),
            pool.query(countQuery, countParams)
        ]);

        return {
            transactions: transactionsResult.rows,
            total: parseInt(countResult.rows[0].total)
        };
    }

    static async getTransactionByIdOrStripeId(id) {
        const query = `
            SELECT 
                id, appointment_id as "appointmentId", stripe_payment_id as "transactionId",
                amount, currency, status, created_at as "createdAt", updated_at as "updatedAt",
                customer_email as "customerEmail", customer_name as "customerName",
                payment_method as "paymentMethod", error_message as "errorMessage",
                refund_id as "refundId", refund_amount as "refundAmount", refund_date as "refundDate"
            FROM transactions 
            WHERE id = $1 OR stripe_payment_id = $1`;
        const result = await pool.query(query, [id]);
        return result.rows[0] || null;
    }

    static async getStatsOverview() {
        const query = `
            SELECT 
                COUNT(*) as total_transactions,
                COUNT(CASE WHEN status = 'succeeded' THEN 1 END) as successful,
                COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
                COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
                COUNT(CASE WHEN status = 'refunded' THEN 1 END) as refunded,
                COALESCE(SUM(CASE WHEN status = 'succeeded' THEN amount ELSE 0 END), 0) as total_revenue,
                COALESCE(AVG(CASE WHEN status = 'succeeded' THEN amount END), 0) as avg_transaction_value
            FROM transactions
        `;
        const result = await pool.query(query);
        return result.rows[0];
    }

    static async getDailyStats() {
        const query = `
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as count,
                COALESCE(SUM(CASE WHEN status = 'succeeded' THEN amount ELSE 0 END), 0) as revenue,
                COUNT(CASE WHEN status = 'succeeded' THEN 1 END) as successful_count
            FROM transactions
            WHERE created_at >= NOW() - INTERVAL '30 days'
            GROUP BY DATE(created_at)
            ORDER BY date DESC
        `;
        const result = await pool.query(query);
        return result.rows;
    }
}

module.exports = PaymentModel;
