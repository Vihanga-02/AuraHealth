CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    appointment_id INTEGER NOT NULL,
    stripe_payment_id VARCHAR(255) UNIQUE NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'LKR',
    status VARCHAR(50) DEFAULT 'pending',
    customer_email VARCHAR(255),
    customer_name VARCHAR(255),
    payment_method VARCHAR(100),
    error_message TEXT,
    refund_id VARCHAR(255),
    refund_amount DECIMAL(10, 2),
    refund_date TIMESTAMP,
    payment_intent_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_transactions_appointment_id ON transactions(appointment_id);
CREATE INDEX idx_transactions_stripe_payment_id ON transactions(stripe_payment_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);
CREATE INDEX idx_transactions_customer_email ON transactions(customer_email);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_transactions_updated_at 
    BEFORE UPDATE ON transactions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();