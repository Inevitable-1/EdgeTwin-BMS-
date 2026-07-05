# Complete System Architecture

## EdgeTwin-BMS+ Architecture Specification

---

## 1. High-Level Architecture

### 1.1 System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        EdgeTwin-BMS+ Platform                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                      PRESENTATION LAYER                         │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐     │   │
│  │  │Dashboard │  │Digital   │  │Battery   │  │Fleet     │     │   │
│  │  │(React)   │  │Twin(3D)  │  │Passport  │  │Overview  │     │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘     │   │
│  └─────────────────────────┬───────────────────────────────────────┘   │
│                            │ WebSocket / REST                          │
│  ┌─────────────────────────▼───────────────────────────────────────┐   │
│  │                      APPLICATION LAYER                          │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐     │   │
│  │  │FastAPI   │  │ML Service│  │Passport  │  │Alert     │     │   │
│  │  │Backend   │  │(SHAP)    │  │Service   │  │Service   │     │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘     │   │
│  └─────────────────────────┬───────────────────────────────────────┘   │
│                            │                                           │
│  ┌─────────────────────────▼───────────────────────────────────────┐   │
│  │                      DATA LAYER                                 │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐     │   │
│  │  │PostgreSQL│  │TimescaleDB│  │SQLite    │  │Redis     │     │   │
│  │  │(Primary) │  │(Time-series)│  │(Edge)   │  │(Cache)   │     │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘     │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                            ▲                                           │
│                            │ MQTT (TLS)                                │
│  ┌─────────────────────────┴───────────────────────────────────────┐   │
│  │                      EDGE LAYER                                 │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐     │   │
│  │  │ESP32     │  │STM32     │  │RPi Gateway│  │Local     │     │   │
│  │  │(Inference)│  │(Sensors) │  │(Broker)  │  │Dashboard │     │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘     │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                            ▲                                           │
│                            │ ADC / I2C / SPI                           │
│  ┌─────────────────────────┴───────────────────────────────────────┐   │
│  │                      SENSOR LAYER                               │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐     │   │
│  │  │Voltage   │  │Current   │  │Temperature│  │IMU       │     │   │
│  │  │Sensors   │  │Sensors   │  │Sensors   │  │Sensors   │     │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘     │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Detailed Component Architecture

### 2.1 Edge Layer (ESP32)

```
┌─────────────────────────────────────────────────┐
│                 ESP32 Microcontroller            │
├─────────────────────────────────────────────────┤
│                                                  │
│  ┌─────────────────────────────────────────┐   │
│  │           SENSOR INTERFACE               │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐│   │
│  │  │ADC (CH1)│  │ADC (CH2)│  │I2C Bus  ││   │
│  │  │Voltage  │  │Current  │  │Temp/IMU ││   │
│  │  └─────────┘  └─────────┘  └─────────┘│   │
│  └─────────────────────┬───────────────────┘   │
│                        │                        │
│  ┌─────────────────────▼───────────────────┐   │
│  │        FEATURE EXTRACTION ENGINE        │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐│   │
│  │  │Sliding  │  │Statistical│  │Frequency││   │
│  │  │Window   │  │Features  │  │Domain   ││   │
│  │  │Buffer   │  │(μ,σ,max) │  │Features ││   │
│  │  └─────────┘  └─────────┘  └─────────┘│   │
│  └─────────────────────┬───────────────────┘   │
│                        │                        │
│  ┌─────────────────────▼───────────────────┐   │
│  │         TFLITE INFERENCE ENGINE          │   │
│  │  ┌─────────────────────────────────────┐│   │
│  │  │  Model: battery_model_int8.tflite   ││   │
│  │  │  Size: 19 KB                        ││   │
│  │  │  Tensor Arena: 10 KB                ││   │
│  │  │  Latency: 8-12 ms                   ││   │
│  │  └─────────────────────────────────────┘│   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐│   │
│  │  │SOH      │  │SOC      │  │Thermal  ││   │
│  │  │Predict  │  │Predict  │  │Risk     ││   │
│  │  └─────────┘  └─────────┘  └─────────┘│   │
│  └─────────────────────┬───────────────────┘   │
│                        │                        │
│  ┌─────────────────────▼───────────────────┐   │
│  │          MQTT PUBLISHER                  │   │
│  │  ┌─────────────────────────────────────┐│   │
│  │  │  Topic: edgetwin/{battery_id}/data  ││   │
│  │  │  QoS: 1 (At least once)             ││   │
│  │  │  TLS: Enabled                       ││   │
│  │  └─────────────────────────────────────┘│   │
│  └─────────────────────────────────────────┘   │
│                                                  │
│  ┌─────────────────────────────────────────┐   │
│  │          FREE_RTOS TASKS                 │   │
│  │  Core 0: Sensor + Feature Extraction    │   │
│  │  Core 1: ML Inference + MQTT Publish    │   │
│  └─────────────────────────────────────────┘   │
│                                                  │
└─────────────────────────────────────────────────┘
```

### 2.2 Gateway Layer (Raspberry Pi)

```
┌─────────────────────────────────────────────────┐
│            Raspberry Pi 4 Gateway                │
├─────────────────────────────────────────────────┤
│                                                  │
│  ┌─────────────────────────────────────────┐   │
│  │         MQTT BROKER (Mosquitto)          │   │
│  │  ┌─────────────────────────────────────┐│   │
│  │  │  Port: 1883 (TLS: 8883)             ││   │
│  │  │  Topics: edgetwin/+/data             ││   │
│  │  │          edgetwin/+/alerts           ││   │
│  │  │          edgetwin/+/commands         ││   │
│  │  └─────────────────────────────────────┘│   │
│  └─────────────────────┬───────────────────┘   │
│                        │                        │
│  ┌─────────────────────▼───────────────────┐   │
│  │         FASTAPI APPLICATION              │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐│   │
│  │  │REST API │  │WebSocket│  │Background││   │
│  │  │Endpoints│  │Server   │  │Tasks     ││   │
│  │  └─────────┘  └─────────┘  └─────────┘│   │
│  └─────────────────────┬───────────────────┘   │
│                        │                        │
│  ┌─────────────────────▼───────────────────┐   │
│  │         ML SERVICE                       │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐│   │
│  │  │SHAP     │  │LIME     │  │Maint.   ││   │
│  │  │Explainer│  │Explainer│  │Recomm.  ││   │
│  │  └─────────┘  └─────────┘  └─────────┘│   │
│  └─────────────────────┬───────────────────┘   │
│                        │                        │
│  ┌─────────────────────▼───────────────────┐   │
│  │         DATABASE                         │   │
│  │  ┌─────────────────────────────────────┐│   │
│  │  │  PostgreSQL + TimescaleDB            ││   │
│  │  │  Port: 5432                          ││   │
│  │  │  Hypertable: telemetry               ││   │
│  │  └─────────────────────────────────────┘│   │
│  └─────────────────────────────────────────┘   │
│                                                  │
└─────────────────────────────────────────────────┘
```

### 2.3 Application Layer

```
┌─────────────────────────────────────────────────┐
│              React Application                   │
├─────────────────────────────────────────────────┤
│                                                  │
│  ┌─────────────────────────────────────────┐   │
│  │         STATE MANAGEMENT                 │   │
│  │  ┌─────────────────────────────────────┐│   │
│  │  │  Zustand Store                       ││   │
│  │  │  - batteryData (real-time)           ││   │
│  │  │  - predictions (ML output)           ││   │
│  │  │  - passport (lifecycle data)         ││   │
│  │  │  - alerts (notification queue)       ││   │
│  │  └─────────────────────────────────────┘│   │
│  └─────────────────────┬───────────────────┘   │
│                        │                        │
│  ┌─────────────────────▼───────────────────┐   │
│  │         UI COMPONENTS                    │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐│   │
│  │  │Dashboard│  │Digital  │  │Battery  ││   │
│  │  │View     │  │Twin View│  │Passport ││   │
│  │  └─────────┘  └─────────┘  └─────────┘│   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐│   │
│  │  │Fleet    │  │Simulator│  │Recomm.  ││   │
│  │  │View     │  │View     │  │Panel    ││   │
│  │  └─────────┘  └─────────┘  └─────────┘│   │
│  └─────────────────────┬───────────────────┘   │
│                        │                        │
│  ┌─────────────────────▼───────────────────┐   │
│  │         VISUALIZATION ENGINE             │   │
│  │  ┌─────────────────────────────────────┐│   │
│  │  │  Three.js + React Three Fiber        ││   │
│  │  │  - 3D Battery Pack Model             ││   │
│  │  │  - Cell Instance Rendering           ││   │
│  │  │  - Thermal Heatmap Shader            ││   │
│  │  │  - Animation Controller              ││   │
│  │  └─────────────────────────────────────┘│   │
│  └─────────────────────────────────────────┘   │
│                                                  │
└─────────────────────────────────────────────────┘
```

---

## 3. Data Flow Architecture

### 3.1 Real-Time Telemetry Flow

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  Sensor  │───▶│  ESP32   │───▶│  MQTT    │───▶│  FastAPI │
│  (100Hz) │    │  (10ms)  │    │  Broker  │    │  Backend │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
                                       │              │
                                       │              ▼
                                       │         ┌──────────┐
                                       │         │PostgreSQL│
                                       │         │+Timescale│
                                       │         └──────────┘
                                       │              │
                                       │              ▼
                                       │         ┌──────────┐
                                       │         │WebSocket │
                                       │         │ Server   │
                                       │         └──────────┘
                                       │              │
                                       │              ▼
                                       │         ┌──────────┐
                                       └────────▶│ React    │
                                                 │Dashboard │
                                                 └──────────┘
```

### 3.2 ML Inference Flow

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  Feature │───▶│  TFLite  │───▶│  Post-   │───▶│  SHAP    │
│  Extract │    │  Invoke  │    │  Process │    │  Explain │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
                    │                                    │
                    ▼                                    ▼
              ┌──────────┐                        ┌──────────┐
              │  Raw     │                        │Explanation│
              │  Predict │                        │  + Action │
              └──────────┘                        └──────────┘
```

### 3.3 Digital Twin Update Flow

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  Edge    │───▶│  Gateway │───▶│  Backend │───▶│  React   │
│  Data    │    │  (MQTT)  │    │  (WS)    │    │  (3D)    │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
                                                         │
                                                         ▼
                                                    ┌──────────┐
                                                    │Three.js  │
                                                    │Renderer  │
                                                    └──────────┘
                                                         │
                                                         ▼
                                                    ┌──────────┐
                                                    │  3D Pack │
                                                    │  + Cells │
                                                    └──────────┘
```

---

## 4. Security Architecture

```
┌─────────────────────────────────────────────────┐
│              SECURITY LAYERS                     │
├─────────────────────────────────────────────────┤
│                                                  │
│  ┌─────────────────────────────────────────┐   │
│  │  LAYER 4: APPLICATION SECURITY          │   │
│  │  - JWT Authentication                   │   │
│  │  - Role-Based Access Control            │   │
│  │  - Input Validation                     │   │
│  │  - Rate Limiting                        │   │
│  └─────────────────────────────────────────┘   │
│                                                  │
│  ┌─────────────────────────────────────────┐   │
│  │  LAYER 3: DATA SECURITY                 │   │
│  │  - AES-256 Encryption at Rest           │   │
│  │  - TLS 1.3 in Transit                   │   │
│  │  - Database Encryption                  │   │
│  │  - Secure Key Management                │   │
│  └─────────────────────────────────────────┘   │
│                                                  │
│  ┌─────────────────────────────────────────┐   │
│  │  LAYER 2: NETWORK SECURITY              │   │
│  │  - MQTT over TLS                        │   │
│  │  - VPN for Remote Access                │   │
│  │  - Firewall Rules                       │   │
│  │  - Network Segmentation                 │   │
│  └─────────────────────────────────────────┘   │
│                                                  │
│  ┌─────────────────────────────────────────┐   │
│  │  LAYER 1: EDGE SECURITY                 │   │
│  │  - Secure Boot                          │   │
│  │  - OTA Signature Verification           │   │
│  │  - Tamper Detection                     │   │
│  │  - Hardware Security Module             │   │
│  └─────────────────────────────────────────┘   │
│                                                  │
└─────────────────────────────────────────────────┘
```

---

## 5. Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    DEPLOYMENT TOPOLOGY                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    CLOUD (Optional)                      │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐             │   │
│  │  │  AWS     │  │  S3      │  │  Cloud-  │             │   │
│  │  │  EC2     │  │  Storage │  │  Watch   │             │   │
│  │  └──────────┘  └──────────┘  └──────────┘             │   │
│  └─────────────────────────┬───────────────────────────────┘   │
│                            │                                     │
│                            │ Internet (VPN)                      │
│                            │                                     │
│  ┌─────────────────────────▼───────────────────────────────┐   │
│  │                    EDGE HUB                              │   │
│  │  ┌─────────────────────────────────────────────────────┐│   │
│  │  │              Raspberry Pi 4                          ││   │
│  │  │  ┌──────────┐  ┌──────────┐  ┌──────────┐         ││   │
│  │  │  │Mosquitto │  │ FastAPI  │  │PostgreSQL│         ││   │
│  │  │  │Broker    │  │ Backend  │  │Database  │         ││   │
│  │  │  └──────────┘  └──────────┘  └──────────┘         ││   │
│  │  └─────────────────────────────────────────────────────┘│   │
│  └─────────────────────────┬───────────────────────────────┘   │
│                            │                                     │
│                            │ MQTT (Local Network)                │
│                            │                                     │
│  ┌─────────────────────────▼───────────────────────────────┐   │
│  │                    VEHICLE FLEET                         │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐             │   │
│  │  │  EV #1   │  │  EV #2   │  │  EV #N   │             │   │
│  │  │  ┌─────┐ │  │  ┌─────┐ │  │  ┌─────┐ │             │   │
│  │  │  │ESP32│ │  │  │ESP32│ │  │  │ESP32│ │             │   │
│  │  │  └─────┘ │  │  └─────┘ │  │  └─────┘ │             │   │
│  │  └──────────┘  └──────────┘  └──────────┘             │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. Scalability Architecture

### 6.1 Single Vehicle (Minimum)

```
ESP32 → Local Dashboard (Laptop)
```

### 6.2 Small Fleet (10-50 vehicles)

```
Multiple ESP32 → Single RPi Gateway → Local Network Dashboard
```

### 6.3 Enterprise Fleet (100-1000+ vehicles)

```
Multiple ESP32 → RPi Gateways → Cloud Backend → Enterprise Dashboard
                                       │
                                       └── Federated Learning Aggregator
```

---

## 7. Technology Stack Summary

| Layer | Component | Technology | Purpose |
|-------|-----------|-----------|---------|
| **Sensor** | Voltage | ADS1115 | 16-bit ADC |
| | Current | INA219 | Current sensing |
| | Temperature | NTC 10kΩ | Temperature monitoring |
| | IMU | MPU6050 | Vibration detection |
| **Edge** | MCU | ESP32-WROOM-32E | Main controller |
| | Firmware | Arduino + FreeRTOS | Real-time OS |
| | ML Runtime | TFLite Micro | On-device inference |
| **Gateway** | Computer | Raspberry Pi 4 | Edge server |
| | Broker | Mosquitto | MQTT messaging |
| | Database | PostgreSQL + TimescaleDB | Data storage |
| **Application** | Backend | Python + FastAPI | REST/WebSocket API |
| | ML Service | SHAP + scikit-learn | Explainability |
| | Frontend | React + TypeScript | User interface |
| | 3D Engine | Three.js + R3F | Digital twin |
| **DevOps** | Containers | Docker + Compose | Deployment |
| | CI/CD | GitHub Actions | Automation |

---

*EdgeTwin-BMS+: Architecture designed for reliability, built for scale.*
