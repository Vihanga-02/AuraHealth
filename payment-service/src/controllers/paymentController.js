const PaymentModel = require('../models/paymentModel');
const axios = require('axios');

const getStripe = () => {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
        const err = new Error('Stripe is not configured: missing STRIPE_SECRET_KEY');
        err.statusCode = 503;
        throw err;
    }
    return require('stripe')(key);
};

// 1. Checkout logic
exports.checkout = async (req, res) => {
    const { amount, appointmentId, currency = 'lkr', customerEmail, customerName } = req.body;
    
    try {
        const stripe = getStripe();
        const amountInCents = currency === 'usd' ? amount * 100 : amount * 100;
        
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amountInCents,
            currency: currency.toLowerCase(),
            metadata: { 
                appointmentId: appointmentId.toString(),
                customerEmail: customerEmail || '',
                customerName: customerName || ''
            }
        });

        await PaymentModel.createTransaction({
            appointmentId,
            paymentIntentId: paymentIntent.id,
            amount,
            currency,
            customerEmail,
            customerName,
            paymentIntentData: paymentIntent
        });

        res.status(200).json({ 
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id,
            message: "Payment intent created successfully"
        });
    } catch (err) {
        console.error("❌ Checkout Error:", err.message);
        res.status(err.statusCode || 500).json({ error: err.message });
    }
};

// 1.5 Sync Confirm
exports.confirmPayment = async (req, res) => {
    const { paymentIntentId, customerPhone } = req.body;
    try {
        const stripe = getStripe();
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        if (paymentIntent.status === 'succeeded') {
            const tx = await PaymentModel.getTransactionByStripeId(paymentIntentId);
            
            if (tx && tx.status !== 'succeeded') {
                // If DB is still pending, process normally
                await handlePaymentSuccess(paymentIntent, customerPhone);
            } else if (tx && tx.status === 'succeeded' && customerPhone) {
                // RACE CONDITION FIX: If Webhook already set DB to succeeded, it didn't send SMS (no phone num).
                // So we just send the SMS here!
                try {
                    const appointmentId = paymentIntent.metadata.appointmentId;
                    const notificationUrl = process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:5006';
                    const smsMessage = `Your payment of LKR ${paymentIntent.amount / 100} for Appointment APT-${appointmentId} was successful. Thank you!`;
                    
                    await axios.post(`${notificationUrl}/notify`, {
                        phone: customerPhone,
                        message: smsMessage
                    });
                    console.log(`📱 SMS Receipt sent to ${customerPhone} (Post-Webhook Sync)`);
                } catch (smsErr) {
                    console.error("⚠️ Failed to send SMS:", smsErr.message);
                }
            }
            res.json({ success: true, message: 'Payment confirmed synchronized' });
        } else {
            res.status(400).json({ error: 'Payment not successful yet' });
        }
    } catch (err) {
        console.error("❌ Sync Confirm Error:", err.message);
        res.status(err.statusCode || 500).json({ error: err.message });
    }
};

// 2. Webhook logic
exports.stripeWebhook = async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        const stripe = getStripe();
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.error(`❌ Webhook Signature Error: ${err.message}`);
        const code = err.statusCode || 400;
        return res.status(code).send(`Webhook Error: ${err.message}`);
    }

    switch (event.type) {
        case 'payment_intent.succeeded':
            await handlePaymentSuccess(event.data.object);
            break;
        case 'payment_intent.payment_failed':
            await handlePaymentFailure(event.data.object);
            break;
        case 'charge.refunded':
            await handleRefund(event.data.object);
            break;
        default:
            console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
};

async function handlePaymentSuccess(paymentIntent, customerPhone = null) {
    const appointmentId = paymentIntent.metadata.appointmentId;
    const customerEmail = paymentIntent.metadata.customerEmail;
    const customerName = paymentIntent.metadata.customerName;

    console.log(`💰 Payment succeeded for Appointment: ${appointmentId}`);

    try {
        await PaymentModel.updatePaymentSuccess(
            paymentIntent.id,
            paymentIntent.payment_method,
            customerEmail,
            customerName
        );
        console.log("✅ Payment DB updated to 'succeeded'");

        // Prefer container DNS name in docker; fall back to localhost for local runs.
        const appointmentUrl = process.env.APPOINTMENT_SERVICE_URL || 'http://appointment-service:5004';
        try {
            await axios.put(`${appointmentUrl}/appointments/${appointmentId}/confirm`, {
                paymentStatus: 'Paid',
                stripeId: paymentIntent.id,
                amount: paymentIntent.amount / 100,
                transactionDate: new Date().toISOString()
            }, {
                headers: {
                    'x-internal-token': process.env.INTERNAL_SERVICE_TOKEN || ''
                }
            });
            console.log(`🚀 Successfully notified Appointment Service for ID: ${appointmentId}`);
        } catch (error) {
            console.error("⚠️ Failed to notify Appointment Service:", error.message);
        }

        if (customerPhone) {
            try {
                const notificationUrl = process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:5006';
                const smsMessage = `Your payment of LKR ${paymentIntent.amount / 100} for Appointment APT-${appointmentId} was successful. Thank you!`;
                
                await axios.post(`${notificationUrl}/notify`, {
                    phone: customerPhone,
                    message: smsMessage
                });
                console.log(`📱 SMS Receipt sent to ${customerPhone}`);
            } catch (smsErr) {
                console.error("⚠️ Failed to send SMS:", smsErr.message);
            }
        }
    } catch (error) {
        console.error("⚠️ Database update failed:", error.message);
    }
}

async function handlePaymentFailure(paymentIntent) {
    console.log(`❌ Payment failed for Intent: ${paymentIntent.id}`);
    try {
        const errorMessage = paymentIntent.last_payment_error?.message || 'Payment failed';
        await PaymentModel.updatePaymentFailure(paymentIntent.id, errorMessage);
        console.log("✅ Payment DB updated to 'failed'");
    } catch (error) {
        console.error("⚠️ Failed to update failed payment status:", error.message);
    }
}

async function handleRefund(charge) {
    console.log(`🔄 Refund processed for Charge: ${charge.id}`);
    try {
        const stripe = getStripe();
        const paymentIntent = await stripe.paymentIntents.retrieve(charge.payment_intent);
        const refundId = charge.refunds.data[0]?.id;
        const refundAmount = charge.amount_refunded / 100;
        
        await PaymentModel.updatePaymentRefund(paymentIntent.id, refundId, refundAmount);
        console.log("✅ Payment DB updated to 'refunded'");
    } catch (error) {
        console.error("⚠️ Failed to update refund status:", error.message);
    }
}

// 3. Get all transactions
exports.getTransactions = async (req, res) => {
    try {
        const result = await PaymentModel.getTransactions(req.query);
        res.json({
            ...result,
            limit: parseInt(req.query.limit || 50),
            offset: parseInt(req.query.offset || 0)
        });
    } catch (err) {
        console.error("❌ Error fetching transactions:", err.message);
        res.status(500).json({ error: err.message });
    }
};

// 4. Get single transaction
exports.getTransactionById = async (req, res) => {
    const { id } = req.params;
    try {
        const transaction = await PaymentModel.getTransactionByIdOrStripeId(id);
        
        if (!transaction) {
            return res.status(404).json({ error: "Transaction not found" });
        }
        
        res.json(transaction);
    } catch (err) {
        console.error("❌ Error fetching transaction:", err.message);
        res.status(500).json({ error: err.message });
    }
};

// 5. Process refund
exports.processRefund = async (req, res) => {
    const { id } = req.params;
    const { amount } = req.body;
    
    try {
        const stripe = getStripe();
        const payment = await PaymentModel.getTransactionByIdOrStripeId(id);
        
        if (!payment) {
            return res.status(404).json({ error: "Transaction not found" });
        }
        
        if (payment.status !== 'succeeded') {
            return res.status(400).json({ error: "Only successful payments can be refunded" });
        }
        
        const refundAmount = amount ? amount * 100 : undefined;
        let refund;
        
        try {
            refund = await stripe.refunds.create({
                payment_intent: payment.transactionId,
                amount: refundAmount
            });
        } catch (stripeErr) {
             console.error("❌ Stripe Refund API Error:", stripeErr.message);
             return res.status(500).json({ error: stripeErr.message });
        }
        
        const finalRefundAmount = refundAmount ? refundAmount / 100 : payment.amount;
        
        await PaymentModel.updatePaymentRefund(payment.transactionId, refund.id, finalRefundAmount);
        
        res.json({ 
            success: true, 
            refund: {
                id: refund.id,
                amount: refund.amount / 100,
                status: refund.status,
                createdAt: refund.created
            }
        });
    } catch (err) {
        console.error("❌ Refund Error:", err.message);
        res.status(500).json({ error: err.message });
    }
};

// 6. Get statistics
exports.getTransactionStats = async (req, res) => {
    try {
        const [overview, dailyStats] = await Promise.all([
            PaymentModel.getStatsOverview(),
            PaymentModel.getDailyStats()
        ]);
        
        res.json({
            overview,
            daily_stats: dailyStats
        });
    } catch (err) {
        console.error("❌ Error fetching stats:", err.message);
        res.status(500).json({ error: err.message });
    }
};