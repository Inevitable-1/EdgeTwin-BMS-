-- =============================================================================
-- EdgeTwin-BMS+ Database Initialization
-- =============================================================================

-- Enable TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pgcrypto for encryption
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =============================================================================
-- CUSTOM TYPES
-- =============================================================================

-- User roles
CREATE TYPE user_role AS ENUM ('admin', 'operator', 'viewer', 'api');

-- Battery status
CREATE TYPE battery_status AS ENUM ('active', 'inactive', 'maintenance', 'retired', 'recycled');

-- Alert severity
CREATE TYPE alert_severity AS ENUM ('info', 'warning', 'critical', 'emergency');

-- Alert status
CREATE TYPE alert_status AS ENUM ('active', 'acknowledged', 'resolved', 'dismissed');

-- Maintenance type
CREATE TYPE maintenance_type AS ENUM ('inspection', 'repair', 'replacement', 'balancing', 'calibration', 'software_update');

-- Passport status
CREATE TYPE passport_status AS ENUM ('active', 'expired', 'revoked', 'pending');

-- Second life status
CREATE TYPE second_life_status AS ENUM ('eligible', 'not_eligible', 'in_process', 'completed');

-- =============================================================================
-- TABLES
-- =============================================================================

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    role user_role NOT NULL DEFAULT 'viewer',
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_verified BOOLEAN NOT NULL DEFAULT false,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Fleets table
CREATE TABLE fleets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Batteries table
CREATE TABLE batteries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    battery_id VARCHAR(50) UNIQUE NOT NULL,
    fleet_id UUID REFERENCES fleets(id) ON DELETE SET NULL,
    manufacturer VARCHAR(255) NOT NULL,
    model VARCHAR(255),
    chemistry VARCHAR(50) NOT NULL,
    capacity_kwh DECIMAL(10, 2) NOT NULL,
    nominal_voltage DECIMAL(10, 2) NOT NULL,
    max_voltage DECIMAL(10, 2) NOT NULL,
    min_voltage DECIMAL(10, 2) NOT NULL,
    max_current DECIMAL(10, 2) NOT NULL,
    cycles_in_series INTEGER NOT NULL,
    cycles_in_parallel INTEGER NOT NULL,
    status battery_status NOT NULL DEFAULT 'active',
    manufacturing_date DATE,
    installation_date DATE,
    warranty_expiry DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Telemetry table (TimescaleDB hypertable)
CREATE TABLE telemetry (
    id BIGSERIAL,
    battery_id UUID NOT NULL REFERENCES batteries(id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    voltage DECIMAL(10, 2),
    current DECIMAL(10, 2),
    temperature DECIMAL(10, 2),
    soc DECIMAL(5, 2),
    soh DECIMAL(5, 2),
    power DECIMAL(10, 2),
    cell_voltages JSONB,
    cell_temperatures JSONB,
    charging BOOLEAN DEFAULT false,
    driving BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id, timestamp)
);

-- Convert to hypertable (must be done after table creation)
SELECT create_hypertable('telemetry', 'timestamp', chunk_time_interval => INTERVAL '1 day');

-- Predictions table
CREATE TABLE predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    battery_id UUID NOT NULL REFERENCES batteries(id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    model_type VARCHAR(50) NOT NULL,
    prediction_value DECIMAL(10, 4) NOT NULL,
    confidence DECIMAL(5, 4) NOT NULL,
    explanation JSONB,
    features_used JSONB,
    inference_time_ms DECIMAL(10, 2),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Alerts table
CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    battery_id UUID NOT NULL REFERENCES batteries(id) ON DELETE CASCADE,
    severity alert_severity NOT NULL,
    status alert_status NOT NULL DEFAULT 'active',
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    source VARCHAR(100),
    metadata JSONB,
    acknowledged_by UUID REFERENCES users(id),
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Battery passports table
CREATE TABLE battery_passports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    battery_id UUID UNIQUE NOT NULL REFERENCES batteries(id) ON DELETE CASCADE,
    passport_number VARCHAR(100) UNIQUE NOT NULL,
    status passport_status NOT NULL DEFAULT 'active',
    manufacturing_date DATE NOT NULL,
    first_use_date DATE,
    warranty_expiry DATE,
    total_energy_throughput DECIMAL(15, 2) DEFAULT 0,
    fast_charge_count INTEGER DEFAULT 0,
    total_cycles INTEGER DEFAULT 0,
    carbon_footprint_kg DECIMAL(10, 2) DEFAULT 0,
    second_life_status second_life_status DEFAULT 'eligible',
    recycling_date DATE,
    recycling_facility VARCHAR(255),
    qr_code TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Maintenance records table
CREATE TABLE maintenance_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    battery_id UUID NOT NULL REFERENCES batteries(id) ON DELETE CASCADE,
    maintenance_type maintenance_type NOT NULL,
    description TEXT NOT NULL,
    performed_by UUID REFERENCES users(id),
    cost DECIMAL(10, 2),
    duration_hours DECIMAL(5, 2),
    parts_replaced JSONB,
    notes TEXT,
    next_maintenance_date DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Audit logs table
CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Digital twins table
CREATE TABLE digital_twins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    battery_id UUID UNIQUE NOT NULL REFERENCES batteries(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    configuration JSONB NOT NULL DEFAULT '{}',
    sync_status VARCHAR(50) DEFAULT 'synced',
    last_sync_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- INDEXES
-- =============================================================================

-- Users indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);

-- Fleets indexes
CREATE INDEX idx_fleets_owner_id ON fleets(owner_id);

-- Batteries indexes
CREATE INDEX idx_batteries_battery_id ON batteries(battery_id);
CREATE INDEX idx_batteries_fleet_id ON batteries(fleet_id);
CREATE INDEX idx_batteries_status ON batteries(status);

-- Telemetry indexes (TimescaleDB auto-creates some)
CREATE INDEX idx_telemetry_battery_id ON telemetry(battery_id);
CREATE INDEX idx_telemetry_timestamp ON telemetry(timestamp DESC);
CREATE INDEX idx_telemetry_battery_timestamp ON telemetry(battery_id, timestamp DESC);

-- Predictions indexes
CREATE INDEX idx_predictions_battery_id ON predictions(battery_id);
CREATE INDEX idx_predictions_timestamp ON predictions(timestamp DESC);
CREATE INDEX idx_predictions_model_type ON predictions(model_type);

-- Alerts indexes
CREATE INDEX idx_alerts_battery_id ON alerts(battery_id);
CREATE INDEX idx_alerts_severity ON alerts(severity);
CREATE INDEX idx_alerts_status ON alerts(status);
CREATE INDEX idx_alerts_created_at ON alerts(created_at DESC);

-- Battery passports indexes
CREATE INDEX idx_battery_passports_battery_id ON battery_passports(battery_id);
CREATE INDEX idx_battery_passports_passport_number ON battery_passports(passport_number);

-- Maintenance records indexes
CREATE INDEX idx_maintenance_records_battery_id ON maintenance_records(battery_id);
CREATE INDEX idx_maintenance_records_type ON maintenance_records(maintenance_type);

-- Audit logs indexes
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Digital twins indexes
CREATE INDEX idx_digital_twins_battery_id ON digital_twins(battery_id);

-- =============================================================================
-- VIEWS
-- =============================================================================

-- Battery health overview view
CREATE OR REPLACE VIEW v_battery_health AS
SELECT 
    b.id,
    b.battery_id,
    b.manufacturer,
    b.model,
    b.chemistry,
    b.capacity_kwh,
    b.status,
    b.fleet_id,
    f.name AS fleet_name,
    (SELECT soh FROM telemetry WHERE battery_id = b.id ORDER BY timestamp DESC LIMIT 1) AS current_soh,
    (SELECT soc FROM telemetry WHERE battery_id = b.id ORDER BY timestamp DESC LIMIT 1) AS current_soc,
    (SELECT temperature FROM telemetry WHERE battery_id = b.id ORDER BY timestamp DESC LIMIT 1) AS current_temperature,
    (SELECT voltage FROM telemetry WHERE battery_id = b.id ORDER BY timestamp DESC LIMIT 1) AS current_voltage,
    (SELECT current FROM telemetry WHERE battery_id = b.id ORDER BY timestamp DESC LIMIT 1) AS current_current,
    (SELECT COUNT(*) FROM alerts WHERE battery_id = b.id AND status = 'active') AS active_alerts,
    bp.total_cycles,
    bp.total_energy_throughput,
    bp.carbon_footprint_kg,
    b.created_at,
    b.updated_at
FROM batteries b
LEFT JOIN fleets f ON b.fleet_id = f.id
LEFT JOIN battery_passports bp ON b.id = bp.battery_id;

-- Fleet statistics view
CREATE OR REPLACE VIEW v_fleet_statistics AS
SELECT 
    f.id,
    f.name,
    f.owner_id,
    COUNT(b.id) AS total_batteries,
    COUNT(CASE WHEN b.status = 'active' THEN 1 END) AS active_batteries,
    ROUND(AVG((SELECT soh FROM telemetry WHERE battery_id = b.id ORDER BY timestamp DESC LIMIT 1))::numeric, 2) AS avg_soh,
    ROUND(MIN((SELECT soh FROM telemetry WHERE battery_id = b.id ORDER BY timestamp DESC LIMIT 1))::numeric, 2) AS min_soh,
    ROUND(MAX((SELECT soh FROM telemetry WHERE battery_id = b.id ORDER BY timestamp DESC LIMIT 1))::numeric, 2) AS max_soh,
    (SELECT COUNT(*) FROM alerts a 
     JOIN batteries b2 ON a.battery_id = b2.id 
     WHERE b2.fleet_id = f.id AND a.status = 'active' AND a.severity = 'critical') AS critical_alerts,
    (SELECT COUNT(*) FROM alerts a 
     JOIN batteries b2 ON a.battery_id = b2.id 
     WHERE b2.fleet_id = f.id AND a.status = 'active' AND a.severity = 'warning') AS warning_alerts
FROM fleets f
LEFT JOIN batteries b ON f.id = b.fleet_id
GROUP BY f.id, f.name, f.owner_id;

-- Recent telemetry view (last 24 hours)
CREATE OR REPLACE VIEW v_recent_telemetry AS
SELECT 
    t.*,
    b.battery_id,
    b.manufacturer,
    b.model
FROM telemetry t
JOIN batteries b ON t.battery_id = b.id
WHERE t.timestamp >= NOW() - INTERVAL '24 hours';

-- =============================================================================
-- FUNCTIONS
-- =============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to calculate battery health score
CREATE OR REPLACE FUNCTION calculate_health_score(
    p_soh DECIMAL,
    p_soc DECIMAL,
    p_temperature DECIMAL,
    p_voltage DECIMAL
) RETURNS DECIMAL AS $$
DECLARE
    health_score DECIMAL;
BEGIN
    -- Weighted health score calculation
    health_score := (
        (p_soh * 0.4) +           -- SOH weight: 40%
        (p_soc * 0.2) +            -- SOC weight: 20%
        (CASE 
            WHEN p_temperature BETWEEN 20 AND 40 THEN 100
            WHEN p_temperature BETWEEN 15 AND 45 THEN 75
            WHEN p_temperature BETWEEN 10 AND 50 THEN 50
            ELSE 25
        END * 0.2) +               -- Temperature weight: 20%
        (CASE
            WHEN p_voltage BETWEEN 3.0 AND 4.2 THEN 100
            WHEN p_voltage BETWEEN 2.8 AND 4.3 THEN 75
            ELSE 50
        END * 0.2)                 -- Voltage weight: 20%
    );
    
    RETURN ROUND(health_score, 2);
END;
$$ LANGUAGE plpgsql;

-- Function to get telemetry statistics
CREATE OR REPLACE FUNCTION get_telemetry_stats(
    p_battery_id UUID,
    p_hours INTEGER DEFAULT 24
) RETURNS TABLE (
    avg_voltage DECIMAL,
    max_voltage DECIMAL,
    min_voltage DECIMAL,
    avg_current DECIMAL,
    max_current DECIMAL,
    avg_temperature DECIMAL,
    max_temperature DECIMAL,
    avg_soc DECIMAL,
    data_points BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ROUND(AVG(t.voltage)::numeric, 2),
        ROUND(MAX(t.voltage)::numeric, 2),
        ROUND(MIN(t.voltage)::numeric, 2),
        ROUND(AVG(t.current)::numeric, 2),
        ROUND(MAX(t.current)::numeric, 2),
        ROUND(AVG(t.temperature)::numeric, 2),
        ROUND(MAX(t.temperature)::numeric, 2),
        ROUND(AVG(t.soc)::numeric, 2),
        COUNT(t.id)
    FROM telemetry t
    WHERE t.battery_id = p_battery_id
    AND t.timestamp >= NOW() - (p_hours || ' hours')::INTERVAL;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Trigger for users updated_at
CREATE TRIGGER trigger_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for batteries updated_at
CREATE TRIGGER trigger_batteries_updated_at
    BEFORE UPDATE ON batteries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for alerts updated_at
CREATE TRIGGER trigger_alerts_updated_at
    BEFORE UPDATE ON alerts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for battery_passports updated_at
CREATE TRIGGER trigger_battery_passports_updated_at
    BEFORE UPDATE ON battery_passports
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for digital_twins updated_at
CREATE TRIGGER trigger_digital_twins_updated_at
    BEFORE UPDATE ON digital_twins
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- CONTINUOUS AGGREGATES (TimescaleDB)
-- =============================================================================

-- Hourly telemetry aggregates
CREATE MATERIALIZED VIEW IF NOT EXISTS telemetry_hourly
WITH (timescaledb.continuous) AS
SELECT 
    battery_id,
    time_bucket('1 hour', timestamp) AS hour,
    AVG(voltage) AS avg_voltage,
    MAX(voltage) AS max_voltage,
    MIN(voltage) AS min_voltage,
    AVG(current) AS avg_current,
    MAX(current) AS max_current,
    AVG(temperature) AS avg_temperature,
    MAX(temperature) AS max_temperature,
    AVG(soc) AS avg_soc,
    AVG(soh) AS avg_soh,
    COUNT(*) AS data_points
FROM telemetry
GROUP BY battery_id, time_bucket('1 hour', timestamp);

-- Daily telemetry aggregates
CREATE MATERIALIZED VIEW IF NOT EXISTS telemetry_daily
WITH (timescaledb.continuous) AS
SELECT 
    battery_id,
    time_bucket('1 day', timestamp) AS day,
    AVG(voltage) AS avg_voltage,
    MAX(voltage) AS max_voltage,
    MIN(voltage) AS min_voltage,
    AVG(current) AS avg_current,
    MAX(current) AS max_current,
    AVG(temperature) AS avg_temperature,
    MAX(temperature) AS max_temperature,
    AVG(soc) AS avg_soc,
    AVG(soh) AS avg_soh,
    COUNT(*) AS data_points
FROM telemetry
GROUP BY battery_id, time_bucket('1 day', timestamp);

-- =============================================================================
-- RETENTION POLICIES (TimescaleDB)
-- =============================================================================

-- Drop raw data after 30 days (keep aggregates)
SELECT add_retention_policy('telemetry', INTERVAL '30 days');

-- =============================================================================
-- COMPRESSION POLICIES (TimescaleDB)
-- =============================================================================

-- Compress chunks older than 7 days
ALTER TABLE telemetry SET (
    timescaledb.compress,
    timescaledb.compress_segmentby = 'battery_id',
    timescaledb.compress_orderby = 'timestamp DESC'
);

SELECT add_compression_policy('telemetry', INTERVAL '7 days');

-- =============================================================================
-- SAMPLE DATA (for development)
-- =============================================================================

-- Insert sample admin user (password: admin123)
INSERT INTO users (email, username, hashed_password, full_name, role, is_active, is_verified)
VALUES (
    'admin@edgetwin.com',
    'admin',
    '$2b$12$LJ3m4ys3Lk0TSwMCPNEPluAINoB6YR4.uSG3O7LYCHa4JG3qO2Gu2',
    'System Administrator',
    'admin',
    true,
    true
) ON CONFLICT (email) DO NOTHING;

-- Insert sample fleet
INSERT INTO fleets (id, name, description, owner_id)
SELECT 
    'f47ac10b-58cc-4372-a567-0e02b2c3d479'::UUID,
    'Tata EV Fleet',
    'Primary electric vehicle fleet for testing',
    id
FROM users 
WHERE username = 'admin'
ON CONFLICT DO NOTHING;

-- Insert sample batteries
INSERT INTO batteries (battery_id, fleet_id, manufacturer, model, chemistry, capacity_kwh, nominal_voltage, max_voltage, min_voltage, max_current, cycles_in_series, cycles_in_parallel, status, manufacturing_date)
VALUES 
    ('BT-2024-001', 'f47ac10b-58cc-4372-a567-0e02b2c3d479'::UUID, 'Tata Autocomp', 'NMC-96S4P', 'NMC 811', 75.0, 355.2, 403.2, 288.0, 200.0, 96, 4, 'active', '2024-01-15'),
    ('BT-2024-002', 'f47ac10b-58cc-4372-a567-0e02b2c3d479'::UUID, 'Tata Autocomp', 'NMC-96S4P', 'NMC 811', 75.0, 355.2, 403.2, 288.0, 200.0, 96, 4, 'active', '2024-02-20'),
    ('BT-2024-003', 'f47ac10b-58cc-4372-a567-0e02b2c3d479'::UUID, 'Tata Autocomp', 'NMC-96S4P', 'NMC 811', 75.0, 355.2, 403.2, 288.0, 200.0, 96, 4, 'active', '2024-03-10')
ON CONFLICT (battery_id) DO NOTHING;

-- Insert sample battery passports
INSERT INTO battery_passports (battery_id, passport_number, status, manufacturing_date, first_use_date, warranty_expiry, total_cycles, fast_charge_count, total_energy_throughput, carbon_footprint_kg)
SELECT 
    id,
    'PP-' || SUBSTRING(battery_id FROM 4),
    'active',
    manufacturing_date,
    manufacturing_date + INTERVAL '30 days',
    manufacturing_date + INTERVAL '8 years',
    FLOOR(RANDOM() * 1500 + 500)::INTEGER,
    FLOOR(RANDOM() * 300 + 100)::INTEGER,
    ROUND((RANDOM() * 50000 + 20000)::numeric, 2),
    ROUND((RANDOM() * 500 + 200)::numeric, 2)
FROM batteries
ON CONFLICT (battery_id) DO NOTHING;

-- Insert sample digital twins
INSERT INTO digital_twins (battery_id, name, configuration)
SELECT 
    id,
    'Digital Twin - ' || battery_id,
    '{"update_interval_ms": 1000, "enable_3d_visualization": true, "enable_heatmap": true}'::JSONB
FROM batteries
ON CONFLICT (battery_id) DO NOTHING;
