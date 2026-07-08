"""initial migration

Revision ID: 001_initial
Revises: 
Create Date: 2025-01-01 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB, INET

revision: str = '001_initial'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Enable extensions
    op.execute("CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE")
    op.execute("CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\"")
    op.execute("CREATE EXTENSION IF NOT EXISTS pgcrypto")
    
    # Create custom types
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE user_role AS ENUM ('admin', 'operator', 'viewer', 'api');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE battery_status AS ENUM ('active', 'inactive', 'maintenance', 'retired', 'recycled');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE alert_severity AS ENUM ('info', 'warning', 'critical', 'emergency');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE alert_status AS ENUM ('active', 'acknowledged', 'resolved', 'dismissed');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE maintenance_type AS ENUM ('inspection', 'repair', 'replacement', 'balancing', 'calibration', 'software_update');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE passport_status AS ENUM ('active', 'expired', 'revoked', 'pending');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE second_life_status AS ENUM ('eligible', 'not_eligible', 'in_process', 'completed');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)
    
    # Users table
    op.create_table(
        'users',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column('email', sa.String(255), unique=True, nullable=False, index=True),
        sa.Column('username', sa.String(100), unique=True, nullable=False, index=True),
        sa.Column('hashed_password', sa.String(255), nullable=False),
        sa.Column('full_name', sa.String(255)),
        sa.Column('role', sa.Enum('admin', 'operator', 'viewer', 'api', name='user_role'), nullable=False, server_default='viewer'),
        sa.Column('is_active', sa.Boolean, nullable=False, server_default='true'),
        sa.Column('is_verified', sa.Boolean, nullable=False, server_default='false'),
        sa.Column('last_login', sa.DateTime(timezone=True)),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    
    # Fleets table
    op.create_table(
        'fleets',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('description', sa.Text),
        sa.Column('owner_id', UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('is_active', sa.Boolean, nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    
    # Batteries table
    op.create_table(
        'batteries',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column('battery_id', sa.String(50), unique=True, nullable=False, index=True),
        sa.Column('fleet_id', UUID(as_uuid=True), sa.ForeignKey('fleets.id', ondelete='SET NULL')),
        sa.Column('manufacturer', sa.String(255), nullable=False),
        sa.Column('model', sa.String(255)),
        sa.Column('chemistry', sa.String(50), nullable=False),
        sa.Column('capacity_kwh', sa.Numeric(10, 2), nullable=False),
        sa.Column('nominal_voltage', sa.Numeric(10, 2), nullable=False),
        sa.Column('max_voltage', sa.Numeric(10, 2), nullable=False),
        sa.Column('min_voltage', sa.Numeric(10, 2), nullable=False),
        sa.Column('max_current', sa.Numeric(10, 2), nullable=False),
        sa.Column('cycles_in_series', sa.Integer, nullable=False),
        sa.Column('cycles_in_parallel', sa.Integer, nullable=False),
        sa.Column('status', sa.Enum('active', 'inactive', 'maintenance', 'retired', 'recycled', name='battery_status'), nullable=False, server_default='active'),
        sa.Column('manufacturing_date', sa.Date),
        sa.Column('installation_date', sa.Date),
        sa.Column('warranty_expiry', sa.Date),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    
    # Create hypertable for telemetry (TimescaleDB)
    op.execute("""
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
        )
    """)
    op.execute("SELECT create_hypertable('telemetry', 'timestamp', chunk_time_interval => INTERVAL '1 day')")
    
    # Create indexes for telemetry
    op.create_index('idx_telemetry_battery_id', 'telemetry', ['battery_id'])
    op.create_index('idx_telemetry_timestamp', 'telemetry', ['timestamp DESC'])
    op.create_index('idx_telemetry_battery_timestamp', 'telemetry', ['battery_id', 'timestamp DESC'])
    
    # Predictions table
    op.create_table(
        'predictions',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column('battery_id', UUID(as_uuid=True), sa.ForeignKey('batteries.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('timestamp', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now(), index=True),
        sa.Column('model_type', sa.String(50), nullable=False, index=True),
        sa.Column('prediction_value', sa.Numeric(10, 4), nullable=False),
        sa.Column('confidence', sa.Numeric(5, 4), nullable=False),
        sa.Column('explanation', JSONB),
        sa.Column('features_used', JSONB),
        sa.Column('inference_time_ms', sa.Numeric(10, 2)),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    
    # Alerts table
    op.create_table(
        'alerts',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column('battery_id', UUID(as_uuid=True), sa.ForeignKey('batteries.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('severity', sa.Enum('info', 'warning', 'critical', 'emergency', name='alert_severity'), nullable=False, index=True),
        sa.Column('status', sa.Enum('active', 'acknowledged', 'resolved', 'dismissed', name='alert_status'), nullable=False, server_default='active', index=True),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('message', sa.Text, nullable=False),
        sa.Column('source', sa.String(100)),
        sa.Column('metadata', JSONB),
        sa.Column('acknowledged_by', UUID(as_uuid=True), sa.ForeignKey('users.id')),
        sa.Column('acknowledged_at', sa.DateTime(timezone=True)),
        sa.Column('resolved_at', sa.DateTime(timezone=True)),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    
    # Battery passports table
    op.create_table(
        'battery_passports',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column('battery_id', UUID(as_uuid=True), sa.ForeignKey('batteries.id', ondelete='CASCADE'), unique=True, nullable=False),
        sa.Column('passport_number', sa.String(100), unique=True, nullable=False, index=True),
        sa.Column('status', sa.Enum('active', 'expired', 'revoked', 'pending', name='passport_status'), nullable=False, server_default='active'),
        sa.Column('manufacturing_date', sa.Date, nullable=False),
        sa.Column('first_use_date', sa.Date),
        sa.Column('warranty_expiry', sa.Date),
        sa.Column('total_energy_throughput', sa.Numeric(15, 2), server_default='0'),
        sa.Column('fast_charge_count', sa.Integer, server_default='0'),
        sa.Column('total_cycles', sa.Integer, server_default='0'),
        sa.Column('carbon_footprint_kg', sa.Numeric(10, 2), server_default='0'),
        sa.Column('second_life_status', sa.Enum('eligible', 'not_eligible', 'in_process', 'completed', name='second_life_status'), server_default='eligible'),
        sa.Column('recycling_date', sa.Date),
        sa.Column('recycling_facility', sa.String(255)),
        sa.Column('qr_code', sa.Text),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    
    # Maintenance records table
    op.create_table(
        'maintenance_records',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column('battery_id', UUID(as_uuid=True), sa.ForeignKey('batteries.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('maintenance_type', sa.Enum('inspection', 'repair', 'replacement', 'balancing', 'calibration', 'software_update', name='maintenance_type'), nullable=False),
        sa.Column('description', sa.Text, nullable=False),
        sa.Column('performed_by', UUID(as_uuid=True), sa.ForeignKey('users.id')),
        sa.Column('cost', sa.Numeric(10, 2)),
        sa.Column('duration_hours', sa.Numeric(5, 2)),
        sa.Column('parts_replaced', JSONB),
        sa.Column('notes', sa.Text),
        sa.Column('next_maintenance_date', sa.Date),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    
    # Audit logs table
    op.execute("""
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
        )
    """)
    op.create_index('idx_audit_logs_user_id', 'audit_logs', ['user_id'])
    op.create_index('idx_audit_logs_action', 'audit_logs', ['action'])
    op.create_index('idx_audit_logs_resource', 'audit_logs', ['resource_type', 'resource_id'])
    op.create_index('idx_audit_logs_created_at', 'audit_logs', ['created_at DESC'])
    
    # Digital twins table
    op.create_table(
        'digital_twins',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column('battery_id', UUID(as_uuid=True), sa.ForeignKey('batteries.id', ondelete='CASCADE'), unique=True, nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('configuration', JSONB, nullable=False, server_default='{}'),
        sa.Column('sync_status', sa.String(50), server_default='synced'),
        sa.Column('last_sync_at', sa.DateTime(timezone=True)),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    
    # Create views
    op.execute("""
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
            (SELECT "current" FROM telemetry WHERE battery_id = b.id ORDER BY timestamp DESC LIMIT 1) AS current_current,
            (SELECT COUNT(*) FROM alerts WHERE battery_id = b.id AND status = 'active') AS active_alerts,
            bp.total_cycles,
            bp.total_energy_throughput,
            bp.carbon_footprint_kg,
            b.created_at,
            b.updated_at
        FROM batteries b
        LEFT JOIN fleets f ON b.fleet_id = f.id
        LEFT JOIN battery_passports bp ON b.id = bp.battery_id
    """)
    
    # Create functions
    op.execute("""
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ language 'plpgsql'
    """)
    
    op.execute("""
        CREATE OR REPLACE FUNCTION calculate_health_score(
            p_soh DECIMAL,
            p_soc DECIMAL,
            p_temperature DECIMAL,
            p_voltage DECIMAL
        ) RETURNS DECIMAL AS $$
        DECLARE
            health_score DECIMAL;
        BEGIN
            health_score := (
                (p_soh * 0.4) +
                (p_soc * 0.2) +
                (CASE 
                    WHEN p_temperature BETWEEN 20 AND 40 THEN 100
                    WHEN p_temperature BETWEEN 15 AND 45 THEN 75
                    WHEN p_temperature BETWEEN 10 AND 50 THEN 50
                    ELSE 25
                END * 0.2) +
                (CASE
                    WHEN p_voltage BETWEEN 3.0 AND 4.2 THEN 100
                    WHEN p_voltage BETWEEN 2.8 AND 4.3 THEN 75
                    ELSE 50
                END * 0.2)
            );
            RETURN ROUND(health_score, 2);
        END;
        $$ LANGUAGE plpgsql
    """)
    
    op.execute("""
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
                ROUND(AVG(t."current")::numeric, 2),
                ROUND(MAX(t."current")::numeric, 2),
                ROUND(AVG(t.temperature)::numeric, 2),
                ROUND(MAX(t.temperature)::numeric, 2),
                ROUND(AVG(t.soc)::numeric, 2),
                COUNT(t.id)
            FROM telemetry t
            WHERE t.battery_id = p_battery_id
            AND t.timestamp >= NOW() - (p_hours || ' hours')::INTERVAL;
        END;
        $$ LANGUAGE plpgsql
    """)
    
    # Create triggers
    op.execute("""
        CREATE TRIGGER trigger_users_updated_at
            BEFORE UPDATE ON users
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column()
    """)
    op.execute("""
        CREATE TRIGGER trigger_batteries_updated_at
            BEFORE UPDATE ON batteries
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column()
    """)
    op.execute("""
        CREATE TRIGGER trigger_alerts_updated_at
            BEFORE UPDATE ON alerts
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column()
    """)
    op.execute("""
        CREATE TRIGGER trigger_battery_passports_updated_at
            BEFORE UPDATE ON battery_passports
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column()
    """)
    op.execute("""
        CREATE TRIGGER trigger_digital_twins_updated_at
            BEFORE UPDATE ON digital_twins
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column()
    """)
    
    # Create continuous aggregates
    op.execute("""
        CREATE MATERIALIZED VIEW telemetry_hourly
        WITH (timescaledb.continuous) AS
        SELECT 
            battery_id,
            time_bucket('1 hour', timestamp) AS hour,
            AVG(voltage) AS avg_voltage,
            MAX(voltage) AS max_voltage,
            MIN(voltage) AS min_voltage,
            AVG("current") AS avg_current,
            MAX("current") AS max_current,
            AVG(temperature) AS avg_temperature,
            MAX(temperature) AS max_temperature,
            AVG(soc) AS avg_soc,
            AVG(soh) AS avg_soh,
            COUNT(*) AS data_points
        FROM telemetry
        GROUP BY battery_id, time_bucket('1 hour', timestamp)
    """)
    
    op.execute("""
        CREATE MATERIALIZED VIEW telemetry_daily
        WITH (timescaledb.continuous) AS
        SELECT 
            battery_id,
            time_bucket('1 day', timestamp) AS day,
            AVG(voltage) AS avg_voltage,
            MAX(voltage) AS max_voltage,
            MIN(voltage) AS min_voltage,
            AVG("current") AS avg_current,
            MAX("current") AS max_current,
            AVG(temperature) AS avg_temperature,
            MAX(temperature) AS max_temperature,
            AVG(soc) AS avg_soc,
            AVG(soh) AS avg_soh,
            COUNT(*) AS data_points
        FROM telemetry
        GROUP BY battery_id, time_bucket('1 day', timestamp)
    """)
    
    # Add retention policy
    op.execute("SELECT add_retention_policy('telemetry', INTERVAL '30 days')")
    
    # Add compression
    op.execute("""
        ALTER TABLE telemetry SET (
            timescaledb.compress,
            timescaledb.compress_segmentby = 'battery_id',
            timescaledb.compress_orderby = 'timestamp DESC'
        )
    """)
    op.execute("SELECT add_compression_policy('telemetry', INTERVAL '7 days')")


def downgrade() -> None:
    # Drop views and continuous aggregates
    op.execute("DROP VIEW IF EXISTS telemetry_hourly")
    op.execute("DROP VIEW IF EXISTS telemetry_daily")
    op.execute("DROP VIEW IF EXISTS v_battery_health")
    
    # Drop triggers
    op.execute("DROP TRIGGER IF EXISTS trigger_users_updated_at ON users")
    op.execute("DROP TRIGGER IF EXISTS trigger_batteries_updated_at ON batteries")
    op.execute("DROP TRIGGER IF EXISTS trigger_alerts_updated_at ON alerts")
    op.execute("DROP TRIGGER IF EXISTS trigger_battery_passports_updated_at ON battery_passports")
    op.execute("DROP TRIGGER IF EXISTS trigger_digital_twins_updated_at ON digital_twins")
    
    # Drop functions
    op.execute("DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE")
    op.execute("DROP FUNCTION IF EXISTS calculate_health_score(decimal, decimal, decimal, decimal) CASCADE")
    op.execute("DROP FUNCTION IF EXISTS get_telemetry_stats(uuid, integer) CASCADE")
    
    # Drop tables in reverse order
    op.drop_table('digital_twins')
    op.drop_table('audit_logs')
    op.drop_table('maintenance_records')
    op.drop_table('battery_passports')
    op.drop_table('alerts')
    op.drop_table('predictions')
    op.drop_table('telemetry')
    op.drop_table('batteries')
    op.drop_table('fleets')
    op.drop_table('users')
    
    # Drop enum types
    op.execute("DROP TYPE IF EXISTS user_role")
    op.execute("DROP TYPE IF EXISTS battery_status")
    op.execute("DROP TYPE IF EXISTS alert_severity")
    op.execute("DROP TYPE IF EXISTS alert_status")
    op.execute("DROP TYPE IF EXISTS maintenance_type")
    op.execute("DROP TYPE IF EXISTS passport_status")
    op.execute("DROP TYPE IF EXISTS second_life_status")
