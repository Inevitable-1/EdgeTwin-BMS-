# EdgeTwin-BMS+ - Complete Project Structure

## Folder Structure

```
EdgeTwin-BMS+/
│
├── README.md                              # Project overview and quickstart
├── LICENSE                                # MIT License
├── CONTRIBUTING.md                        # Contribution guidelines
├── .gitignore                            # Git ignore rules
├── docker-compose.yml                    # Multi-container orchestration
├── Makefile                              # Build and run commands
│
├── docs/                                 # Complete documentation
│   ├── proposal/                         # Technical proposal (19 documents)
│   │   ├── 01_executive_summary.md
│   │   ├── 02_problem_statement.md
│   │   ├── 03_proposed_solution.md
│   │   ├── 04_innovation_highlights.md
│   │   ├── 05_objectives.md
│   │   ├── 06_features.md
│   │   ├── 07_system_architecture.md
│   │   ├── 08_technology_stack.md
│   │   ├── 09_ai_models.md
│   │   ├── 10_digital_twin_design.md
│   │   ├── 11_ui_dashboard_design.md
│   │   ├── 12_unique_selling_points.md
│   │   ├── 13_business_benefits.md
│   │   ├── 14_future_scope.md
│   │   ├── 15_sustainability_impact.md
│   │   ├── 16_expected_results.md
│   │   ├── 17_swot_analysis.md
│   │   ├── 18_risks_mitigation.md
│   │   └── 19_development_roadmap.md
│   │
│   ├── presentation/                     # Presentation materials
│   │   ├── 20_ppt_content_15_slides.md
│   │   ├── 27_three_minute_pitch.md
│   │   └── 28_seven_minute_script.md
│   │
│   ├── alignment/                        # Hackathon alignment
│   │   └── 29_tata_technologies_alignment.md
│   │
│   └── scoring/                          # Self-evaluation
│       └── 30_self_scoring_judge_feedback.md
│
├── diagrams/                             # Mermaid architecture diagrams
│   ├── 01_system_architecture.mmd
│   ├── 02_data_flow.mmd
│   ├── 03_edge_cloud_architecture.mmd
│   └── 04_deployment_diagram.mmd
│
├── ui/                                   # UI/UX specifications
│   ├── 25_color_palette.md
│   └── design_tokens.json
│
├── icons/                                # Module icon definitions
│   └── 26_module_icons.md
│
├── demo/                                 # Working demo implementation
│   ├── requirements.txt                  # Python dependencies
│   ├── battery_simulator.py              # Battery data generator
│   ├── thermal_pattern_generator.py      # Thermal simulation
│   ├── mqtt_mock_publisher.py            # MQTT data publisher
│   ├── tinyml_inference_demo.py          # TFLite inference demo
│   │
│   ├── fastapi_backend/                  # Backend API
│   │   ├── main.py                       # FastAPI application
│   │   ├── requirements.txt
│   │   ├── Dockerfile
│   │   ├── config.py                     # Configuration
│   │   ├── database.py                   # Database connection
│   │   ├── models/                       # SQLAlchemy models
│   │   │   ├── __init__.py
│   │   │   ├── battery.py
│   │   │   ├── passport.py
│   │   │   ├── telemetry.py
│   │   │   └── maintenance.py
│   │   ├── routes/                       # API endpoints
│   │   │   ├── __init__.py
│   │   │   ├── battery.py
│   │   │   ├── passport.py
│   │   │   ├── digital_twin.py
│   │   │   ├── predictions.py
│   │   │   └── fleet.py
│   │   ├── schemas/                      # Pydantic schemas
│   │   │   ├── __init__.py
│   │   │   ├── battery.py
│   │   │   └── passport.py
│   │   └── services/                     # Business logic
│   │       ├── __init__.py
│   │       ├── ml_service.py
│   │       ├── passport_service.py
│   │       └── alert_service.py
│   │
│   └── react_dashboard/                  # Frontend dashboard
│       ├── package.json
│       ├── tsconfig.json
│       ├── tailwind.config.js
│       ├── Dockerfile
│       ├── public/
│       │   └── index.html
│       └── src/
│           ├── App.tsx
│           ├── index.tsx
│           ├── components/
│           │   ├── Dashboard/
│           │   │   ├── MainDashboard.tsx
│           │   │   ├── BatteryHealthCard.tsx
│           │   │   ├── TemperatureGraph.tsx
│           │   │   ├── VoltageGraph.tsx
│           │   │   └── RiskMeter.tsx
│           │   ├── DigitalTwin/
│           │   │   ├── BatteryPack3D.tsx
│           │   │   ├── CellMonitor.tsx
│           │   │   └── FailureSimulation.tsx
│           │   ├── Passport/
│           │   │   ├── BatteryPassport.tsx
│           │   │   ├── LifecycleTimeline.tsx
│           │   │   └── SustainabilityMetrics.tsx
│           │   ├── Fleet/
│           │   │   ├── FleetOverview.tsx
│           │   │   └── FleetMap.tsx
│           │   ├── Recommendations/
│           │   │   ├── MaintenancePanel.tsx
│           │   │   └── ChargingAdvisor.tsx
│           │   ├── Simulator/
│           │   │   └── BatteryLifeSimulator.tsx
│           │   └── common/
│           │       ├── Sidebar.tsx
│           │       ├── Header.tsx
│           │       └── AlertBanner.tsx
│           ├── hooks/
│           │   ├── useWebSocket.ts
│           │   └── useBatteryData.ts
│           ├── services/
│           │   └── api.ts
│           ├── store/
│           │   └── batteryStore.ts
│           └── types/
│               └── battery.ts
│
├── models/                               # Trained ML models
│   ├── soh_model/                        # State of Health
│   │   ├── model.onnx
│   │   ├── model.tflite
│   │   └── metadata.json
│   ├── soc_model/                        # State of Charge
│   │   ├── model.onnx
│   │   ├── model.tflite
│   │   └── metadata.json
│   ├── rul_model/                        # Remaining Useful Life
│   │   ├── model.onnx
│   │   ├── model.tflite
│   │   └── metadata.json
│   ├── thermal_model/                    # Thermal Runaway
│   │   ├── model.onnx
│   │   ├── model.tflite
│   │   └── metadata.json
│   └── anomaly_model/                    # Anomaly Detection
│       ├── model.onnx
│       └── metadata.json
│
├── firmware/                             # Embedded firmware
│   ├── esp32/
│   │   ├── platformio.ini
│   │   ├── src/
│   │   │   ├── main.cpp
│   │   │   ├── sensors/
│   │   │   │   ├── voltage_sensor.cpp
│   │   │   │   ├── current_sensor.cpp
│   │   │   │   └── temp_sensor.cpp
│   │   │   ├── ml/
│   │   │   │   ├── inference_engine.cpp
│   │   │   │   └── feature_extractor.cpp
│   │   │   ├── comms/
│   │   │   │   ├── mqtt_handler.cpp
│   │   │   │   └── wifi_manager.cpp
│   │   │   └── config.h
│   │   └── models/
│   │       └── battery_model.tflite
│   │
│   └── stm32/
│       ├── CMakeLists.txt
│       └── src/
│           └── main.c
│
├── data/                                 # Datasets and training
│   ├── raw/                              # Raw datasets
│   │   ├── nasa_battery/
│   │   ├── oxford_degradation/
│   │   └── custom_collection/
│   ├── processed/                        # Preprocessed data
│   ├── training/                         # Model training scripts
│   │   ├── train_soh.py
│   │   ├── train_soc.py
│   │   ├── train_rul.py
│   │   ├── train_thermal.py
│   │   └── train_anomaly.py
│   └── evaluation/                       # Model evaluation
│       ├── evaluate_models.py
│       └── benchmarks.md
│
├── tests/                                # Test suite
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── scripts/                              # Utility scripts
│   ├── setup.sh
│   ├── deploy.sh
│   └── data_collection/
│
├── infrastructure/                       # DevOps and deployment
│   ├── docker/
│   │   ├── Dockerfile.backend
│   │   ├── Dockerfile.frontend
│   │   └── Dockerfile.edge
│   ├── kubernetes/
│   │   ├── deployment.yaml
│   │   └── service.yaml
│   └── terraform/
│
└── .github/                              # GitHub configuration
    ├── workflows/
    │   ├── ci.yml
    │   └── deploy.yml
    ├── ISSUE_TEMPLATE/
    └── PULL_REQUEST_TEMPLATE.md
```

---

## API Structure

### REST Endpoints

```
Base URL: http://localhost:8000/api/v1

GET    /batteries                    # List all batteries
GET    /batteries/{id}               # Get battery details
POST   /batteries                    # Register new battery
PUT    /batteries/{id}               # Update battery info
DELETE /batteries/{id}               # Remove battery

GET    /batteries/{id}/telemetry     # Get real-time telemetry
GET    /batteries/{id}/history       # Get historical data
GET    /batteries/{id}/health        # Get health metrics

GET    /batteries/{id}/passport      # Get battery passport
PUT    /batteries/{id}/passport      # Update passport
GET    /batteries/{id}/lifecycle     # Get lifecycle events

GET    /predictions/{id}/soh         # State of Health prediction
GET    /predictions/{id}/soc         # State of Charge prediction
GET    /predictions/{id}/rul         # Remaining Useful Life
GET    /predictions/{id}/thermal     # Thermal risk assessment
GET    /predictions/{id}/anomaly     # Anomaly detection

GET    /twin/{id}/state              # Digital twin state
GET    /twin/{id}/visualization      # 3D visualization data
POST   /twin/{id}/simulate           # Run failure simulation

GET    /fleet/overview               # Fleet summary
GET    /fleet/alerts                 # Fleet-wide alerts
GET    /fleet/analytics              # Fleet analytics

POST   /recommendations/{id}/maintenance  # Get maintenance advice
POST   /recommendations/{id}/charging     # Get charging advice

POST   /simulator/run                # Run battery life simulation
```

### WebSocket Endpoints

```
WS /ws/telemetry/{battery_id}        # Real-time telemetry stream
WS /ws/alerts                        # Alert notifications
WS /ws/twin/{battery_id}             # Digital twin updates
WS /ws/fleet                         # Fleet-wide updates
```

---

## Database Schema

### PostgreSQL Tables

```sql
-- Battery Core Information
CREATE TABLE batteries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    battery_id VARCHAR(50) UNIQUE NOT NULL,
    manufacturer VARCHAR(100),
    chemistry VARCHAR(50),            -- NMC, LFP, NCA
    capacity_ah DECIMAL(10,2),
    nominal_voltage DECIMAL(10,2),
    manufacturing_date TIMESTAMP,
    warranty_expiry TIMESTAMP,
    status VARCHAR(20),               -- active, retired, recycled
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Real-time Telemetry (TimescaleDB hypertable)
CREATE TABLE telemetry (
    time TIMESTAMPTZ NOT NULL,
    battery_id UUID REFERENCES batteries(id),
    voltage DECIMAL(8,4),
    current DECIMAL(8,4),
    temperature DECIMAL(6,2),
    soc DECIMAL(5,2),
    soh DECIMAL(5,2),
    power DECIMAL(10,4),
    cell_voltages JSONB,
    cell_temperatures JSONB
);
SELECT create_hypertable('telemetry', 'time');

-- Battery Passport
CREATE TABLE battery_passports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    battery_id UUID REFERENCES batteries(id),
    cycle_count INTEGER DEFAULT 0,
    total_energy_throughput DECIMAL(12,2),
    fast_charge_count INTEGER DEFAULT 0,
    carbon_footprint_kg DECIMAL(10,2),
    maintenance_history JSONB,
    repair_records JSONB,
    second_life_eligible BOOLEAN,
    recycling_recommended BOOLEAN,
    end_of_life_status VARCHAR(20),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ML Predictions
CREATE TABLE predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    battery_id UUID REFERENCES batteries(id),
    prediction_type VARCHAR(50),      -- soh, soc, rul, thermal, anomaly
    predicted_value DECIMAL(10,4),
    confidence DECIMAL(5,4),
    explanation JSONB,                -- SHAP/LIME values
    model_version VARCHAR(20),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Maintenance Records
CREATE TABLE maintenance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    battery_id UUID REFERENCES batteries(id),
    maintenance_type VARCHAR(50),     -- inspection, repair, replacement
    description TEXT,
    cost DECIMAL(10,2),
    technician_id VARCHAR(50),
    performed_at TIMESTAMP,
    next_recommended TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Alerts
CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    battery_id UUID REFERENCES batteries(id),
    alert_type VARCHAR(50),           -- thermal, voltage, degradation
    severity VARCHAR(20),             -- low, medium, high, critical
    message TEXT,
    explanation JSONB,
    acknowledged BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Fleet Information
CREATE TABLE fleets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fleet_name VARCHAR(100),
    owner_id UUID,
    vehicle_count INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Fleet-Battery Mapping
CREATE TABLE fleet_batteries (
    fleet_id UUID REFERENCES fleets(id),
    battery_id UUID REFERENCES batteries(id),
    vehicle_id VARCHAR(50),
    installed_at TIMESTAMP,
    PRIMARY KEY (fleet_id, battery_id)
);

-- Charging Sessions
CREATE TABLE charging_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    battery_id UUID REFERENCES batteries(id),
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    energy_added_kwh DECIMAL(10,2),
    charging_type VARCHAR(20),        -- slow, fast, rapid
    start_soc DECIMAL(5,2),
    end_soc DECIMAL(5,2),
    ambient_temperature DECIMAL(5,2),
    max_temperature DECIMAL(5,2),
    efficiency DECIMAL(5,2)
);
```

---

## Docker Compose

```yaml
version: '3.8'

services:
  backend:
    build:
      context: ./demo/fastapi_backend
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/edgetwin
      - MQTT_BROKER=mqtt-broker
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis
      - mqtt-broker

  frontend:
    build:
      context: ./demo/react_dashboard
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    depends_on:
      - backend

  db:
    image: timescale/timescaledb:latest-pg15
    ports:
      - "5432:5432"
    environment:
      POSTGRES_DB: edgetwin
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  mqtt-broker:
    image: eclipse-mosquitto:2
    ports:
      - "1883:1883"
    volumes:
      - ./infrastructure/mosquitto.conf:/mosquitto/config/mosquitto.conf

  simulator:
    build:
      context: ./demo
      dockerfile: Dockerfile.simulator
    environment:
      - MQTT_BROKER=mqtt-broker
      - BACKEND_URL=http://backend:8000
    depends_on:
      - mqtt-broker
      - backend

volumes:
  pgdata:
```
