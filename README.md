# EdgeTwin-BMS+

### AI-Powered Edge Digital Twin & Battery Passport Platform for Electric Vehicles

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Python 3.10+](https://img.shields.io/badge/Python-3.10+-green.svg)](https://python.org)
[![TypeScript 5](https://img.shields.io/badge/TypeScript-5-blue.svg)](https://typescriptlang.org)
[![React 18](https://img.shields.io/badge/React-18-61DAFB.svg)](https://reactjs.org)

---

## Overview

EdgeTwin-BMS+ is a production-grade AI-powered battery management system for electric vehicles. It combines **TinyML on ESP32 edge devices**, **real-time 3D Digital Twin visualization**, **explainable AI predictions**, and **EU Battery Regulation compliant digital passports**.

Built for the **Tata InnoVenture Hackathon** — targeting Electric Mobility, Predictive Maintenance, and Digital Twins.

---

## Features

| Feature | Description |
|---------|-------------|
| **Live Dashboard** | Real-time monitoring of 150 batteries with animated counters, charts, and health distribution |
| **3D Digital Twin** | Interactive Three.js visualization of 40 battery cells with color-coded health status |
| **AI Predictions** | SOH, SOC, RUL, Thermal Risk, Anomaly Detection with confidence scores |
| **Explainable AI (XAI)** | Every prediction explains itself with feature importance and recommendations |
| **Battery Passport** | EU Battery Regulation compliant digital passport with QR code, carbon footprint, second-life eligibility |
| **Fleet Management** | Interactive India map with fleet statistics, manufacturer distribution, location analytics |
| **Alert System** | Real-time alerts with severity levels, recommended actions, and acknowledge/resolve workflow |
| **ESP32 Firmware** | Edge AI inference with TensorFlow Lite Micro, OTA updates, MQTT telemetry |
| **Dark Theme** | Professional dark UI designed for operations centers |

---

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React 18, TypeScript, Vite, TailwindCSS, Three.js, Recharts, Zustand, TanStack Query |
| **Backend** | FastAPI, SQLAlchemy 2.0, Alembic, PostgreSQL + TimescaleDB, Redis, MQTT |
| **AI/ML** | TensorFlow Lite, LightGBM, Scikit-learn, SHAP, ONNX Runtime |
| **Edge** | ESP32, FreeRTOS, PlatformIO, Arduino framework |
| **Infrastructure** | Docker Compose, Nginx, Mosquitto MQTT, GitHub Actions CI/CD |

---

## Quick Start

### Demo Mode (Frontend Only)

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173**

Login with:
- **Admin:** admin@edgetwin.ai / admin123
- **Engineer:** engineer@edgetwin.ai / engineer123
- **Viewer:** viewer@edgetwin.ai / viewer123

### Full Stack (Docker)

```bash
cp .env.example .env
docker-compose up -d
```

---

## Project Structure

```
EdgeTwin-BMS+/
├── frontend/               # React + TypeScript + Vite
│   ├── src/
│   │   ├── components/     # DigitalTwin, XAI, Passport, Layout
│   │   ├── pages/          # Dashboard, Battery, Alerts, Fleet, Passport, Settings
│   │   ├── services/       # API layer with mock fallback
│   │   ├── stores/         # Zustand stores (auth, demo mode)
│   │   └── data/           # 150-battery seed data generator
│   └── package.json
├── backend/                # FastAPI + SQLAlchemy
│   ├── app/
│   │   ├── api/v1/         # REST endpoints
│   │   ├── models/         # SQLAlchemy models
│   │   ├── services/       # MQTT, AI, Telemetry, Passport
│   │   └── core/           # Config, Security, WebSocket
│   └── alembic/            # Database migrations
├── esp32/                  # ESP32 firmware
│   ├── src/main.cpp        # Edge AI + MQTT + Sensors
│   └── include/            # Config, Model Inference, OTA
├── ai/                     # Model training
│   └── training/           # SOH, SOC, RUL, Thermal, Anomaly
├── gateway/                # MQTT-to-REST bridge
├── docker/                 # Dockerfiles + configs
└── docker-compose.yml
```

---

## Architecture

```
┌─────────────┐    MQTT    ┌─────────────┐    REST    ┌──────────────┐
│  ESP32 Edge │ ────────── │   Mosquitto │ ────────── │   FastAPI    │
│  (TinyML)   │            │   Broker    │            │   Backend    │
└─────────────┘            └─────────────┘            └──────┬───────┘
                                                             │
┌─────────────┐   WebSocket ┌─────────────────────────────────┘
│   Browser   │ ◄────────── │
│  (React UI) │             │
└─────────────┘             │
                            │
                     ┌──────┴───────┐
                     │  PostgreSQL  │
                     │ + TimescaleDB│
                     └──────────────┘
```

---

## AI Models

| Model | Architecture | Input | Output |
|-------|-------------|-------|--------|
| SOH | LightGBM + LSTM | Voltage, Current, Temperature, Cycles | State of Health (0-100%) |
| SOC | LSTM Neural Network | Voltage, Current, Temperature | State of Charge (0-100%) |
| RUL | LightGBM | SOH, Cycle Count, Degradation Rate | Remaining Cycles (0-2000) |
| Thermal Risk | Neural Network | Temperature, Voltage Imbalance, Current | Risk Score (0-1) |
| Anomaly | Isolation Forest + Autoencoder | All sensor features | Anomaly Score + Binary |

---

## Hardware

| Component | Model | Cost (INR) |
|-----------|-------|-----------|
| Microcontroller | ESP32 DevKit V1 | ₹500 |
| Current Sensor | INA219 | ₹350 |
| Temperature | DS18B20 (x4) | ₹400 |
| BMS IC | BQ76940 | ₹2,500 |
| OLED Display | SSD1306 0.96" | ₹250 |
| **Total** | | **~₹4,000** |

---

## Demo Credentials

| Role | Email | Password | Access |
|------|-------|----------|--------|
| Admin | admin@edgetwin.ai | admin123 | Full access |
| Engineer | engineer@edgetwin.ai | engineer123 | Operations |
| Viewer | viewer@edgetwin.ai | viewer123 | Read only |

---

## License

MIT License — See [LICENSE](LICENSE) for details.
