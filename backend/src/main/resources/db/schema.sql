-- PostgreSQL Schema for SecureWealth Twin
-- Note: Spring Boot (hibernate.ddl-auto=update) will auto-generate most of this,
-- but this script serves as the formal schema definition as requested.

CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(255),
    created_at TIMESTAMP,
    role VARCHAR(50)
);

CREATE TABLE portfolios (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT UNIQUE NOT NULL REFERENCES users(id),
    total_value DECIMAL(19, 2),
    last_updated TIMESTAMP
);

CREATE TABLE assets (
    id BIGSERIAL PRIMARY KEY,
    portfolio_id BIGINT REFERENCES portfolios(id),
    user_id BIGINT NOT NULL,
    name VARCHAR(255),
    type VARCHAR(50),
    current_value DECIMAL(19, 2),
    purchase_value DECIMAL(19, 2),
    purchase_date DATE,
    notes TEXT
);

CREATE TABLE investments (
    id BIGSERIAL PRIMARY KEY,
    portfolio_id BIGINT REFERENCES portfolios(id),
    user_id BIGINT NOT NULL,
    type VARCHAR(50),
    name VARCHAR(255),
    amount DECIMAL(19, 2),
    start_date DATE,
    maturity_date DATE,
    status VARCHAR(50),
    sip_frequency VARCHAR(50)
);

CREATE TABLE goals (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id),
    name VARCHAR(255),
    target_amount DECIMAL(19, 2),
    current_saved DECIMAL(19, 2),
    deadline DATE,
    category VARCHAR(50),
    created_at TIMESTAMP
);

CREATE TABLE transactions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id),
    amount DECIMAL(19, 2),
    type VARCHAR(50),
    category VARCHAR(255),
    description TEXT,
    timestamp TIMESTAMP,
    channel VARCHAR(255)
);

CREATE TABLE trusted_devices (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id),
    device_id VARCHAR(255) NOT NULL,
    device_name VARCHAR(255),
    last_seen TIMESTAMP,
    is_trusted BOOLEAN,
    registered_at TIMESTAMP
);

CREATE TABLE behavior_profiles (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT UNIQUE NOT NULL REFERENCES users(id),
    avg_transaction_amount DECIMAL(19, 2),
    avg_login_hour INTEGER,
    action_speed_avg_seconds DOUBLE PRECISION,
    otp_retry_count INTEGER,
    cancel_retry_count INTEGER,
    last_updated TIMESTAMP
);

CREATE TABLE security_events (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id),
    action_type VARCHAR(255),
    wprs_score INTEGER,
    decision VARCHAR(50),
    reason VARCHAR(1000),
    device_id VARCHAR(255),
    ip_address VARCHAR(255),
    timestamp TIMESTAMP
);

CREATE TABLE otp_sessions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id),
    otp_hash VARCHAR(255) NOT NULL,
    attempt_count INTEGER,
    action_type VARCHAR(255),
    created_at TIMESTAMP,
    expires_at TIMESTAMP,
    is_verified BOOLEAN
);

CREATE TABLE wealth_scores (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT UNIQUE NOT NULL REFERENCES users(id),
    score INTEGER,
    savings_score INTEGER,
    goal_score INTEGER,
    investment_score INTEGER,
    protection_score INTEGER,
    last_updated TIMESTAMP
);

-- Indexes
CREATE INDEX idx_user_id_assets ON assets(user_id);
CREATE INDEX idx_user_id_investments ON investments(user_id);
CREATE INDEX idx_user_id_goals ON goals(user_id);
CREATE INDEX idx_user_id_transactions ON transactions(user_id);
CREATE INDEX idx_user_id_devices ON trusted_devices(user_id);
CREATE INDEX idx_user_id_events ON security_events(user_id);

-- Composite Indexes
CREATE INDEX idx_security_events_user_timestamp ON security_events(user_id, timestamp);
CREATE INDEX idx_transactions_user_timestamp ON transactions(user_id, timestamp);
