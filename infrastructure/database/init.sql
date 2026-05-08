CREATE TABLE IF NOT EXISTS telemetry (
    id SERIAL PRIMARY KEY,
    district_id VARCHAR(50) NOT NULL,
    substation_id VARCHAR(50) NOT NULL,
    consumption_kw DECIMAL(10, 2) NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);