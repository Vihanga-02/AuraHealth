-- Notification Service Database Schema

CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    recipient_number VARCHAR(20) NOT NULL,
    message_body TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, SENT, FAILED
    provider_ref VARCHAR(100),            -- ID from the SMS provider
    error_message TEXT,                   -- Error message if failed
    sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster lookups by recipient
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_number);

-- Index for faster lookups by status
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
