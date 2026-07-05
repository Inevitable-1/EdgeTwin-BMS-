# Technology Stack

## Complete Technology Stack Specification

---

## 1. Hardware Stack

### 1.1 Edge Microcontrollers

| Component | Model | Specifications | Use Case |
|-----------|-------|---------------|----------|
| **Primary MCU** | ESP32-WROOM-32E | Dual-core 240MHz, 520KB SRAM, 4MB Flash, WiFi+BLE | Main inference engine |
| **Secondary MCU** | STM32F407VGT6 | ARM Cortex-M4 168MHz, 1MB Flash, 192KB RAM | High-speed sensor sampling |
| **Gateway** | Raspberry Pi 4 Model B | Quad-core Cortex-A72 1.5GHz, 4GB RAM, WiFi+ETH | Edge server, MQTT broker |
| **Optional GPU** | NVIDIA Jetson Nano | 128-core Maxwell, 4GB LPDDR4 | Advanced computer vision |

### 1.2 Sensor Array

| Sensor | Model | Interface | Range | Accuracy | Sample Rate |
|--------|-------|-----------|-------|----------|-------------|
| **Voltage** | ADS1115 | I2C | 0-5V | ±2mV | 100 Hz |
| **Current** | INA219 | I2C | ±5A | ±0.5mA | 100 Hz |
| **Temperature** | NTC 10kΩ | ADC | -40-125°C | ±0.5°C | 10 Hz |
| **Ambient Temp** | DHT22 | GPIO | -40-80°C | ±0.3°C | 1 Hz |
| **Vibration** | MPU6050 | I2C | ±16g | ±0.1g | 100 Hz |
| **Impedance** | Custom EIS | ADC | 1mΩ-100Ω | ±1% | 1 Hz |

### 1.3 Communication Modules

| Module | Model | Protocol | Range | Data Rate |
|--------|-------|----------|-------|-----------|
| **WiFi** | ESP32 Built-in | 802.11 b/g/n | 100m | 150 Mbps |
| **BLE** | ESP32 Built-in | BLE 5.0 | 50m | 2 Mbps |
| **LoRa** | SX1276 | LoRaWAN | 10km | 50 kbps |
| **CAN** | MCP2515 | CAN 2.0B | 40m | 1 Mbps |

---

## 2. Software Stack

### 2.1 Edge Firmware

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| **IDE** | PlatformIO | 6.x | Development environment |
| **Framework** | Arduino ESP32 | 2.x | Hardware abstraction |
| **RTOS** | FreeRTOS | 10.5 | Task scheduling |
| **ML Runtime** | TensorFlow Lite Micro | 2.14 | On-device inference |
| **MQTT Client** | PubSubClient | 2.8 | MQTT communication |
| **JSON** | ArduinoJson | 6.x | Data serialization |

### 2.2 Backend

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| **Runtime** | Python | 3.10+ | Server language |
| **Web Framework** | FastAPI | 0.104 | REST API |
| **ASGI Server** | Uvicorn | 0.24 | HTTP server |
| **ORM** | SQLAlchemy | 2.0 | Database operations |
| **Task Queue** | Celery | 5.3 | Background tasks |
| **Cache** | Redis | 7.x | In-memory cache |
| **MQTT Client** | paho-mqtt | 1.6 | MQTT subscriber |
| **ML Inference** | ONNX Runtime | 1.16 | Model serving |
| **Explainability** | SHAP | 0.43 | Model explanations |
| **Data Validation** | Pydantic | 2.5 | Schema validation |

### 2.3 Frontend

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| **Framework** | React | 18.2 | UI library |
| **Language** | TypeScript | 5.3 | Type safety |
| **Build Tool** | Vite | 5.0 | Fast builds |
| **State Mgmt** | Zustand | 4.4 | State management |
| **Styling** | TailwindCSS | 3.3 | Utility-first CSS |
| **3D Engine** | Three.js | 0.160 | 3D rendering |
| **React 3D** | @react-three/fiber | 8.15 | React Three.js renderer |
| **3D Helpers** | @react-three/drei | 9.92 | Three.js utilities |
| **Charts** | Recharts | 2.10 | Data visualization |
| **Icons** | Lucide React | 0.294 | Icon library |
| **WebSocket** | Socket.io Client | 4.7 | Real-time updates |

### 2.4 Database

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| **Primary DB** | PostgreSQL | 15 | Relational data |
| **Time-Series** | TimescaleDB | 2.12 | Telemetry storage |
| **Edge DB** | SQLite | 3.44 | Offline data storage |
| **Cache** | Redis | 7.2 | Session + cache |

### 2.5 DevOps

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Containerization** | Docker | Application packaging |
| **Orchestration** | Docker Compose | Multi-container deployment |
| **CI/CD** | GitHub Actions | Automated pipeline |
| **Monitoring** | Prometheus + Grafana | System monitoring |
| **Logging** | ELK Stack | Log aggregation |
| **Version Control** | Git + GitHub | Source control |

---

## 3. AI/ML Stack

### 3.1 Model Training

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Framework** | PyTorch | Model development |
| **Experiment Tracking** | MLflow | Experiment management |
| **Data Processing** | Pandas + NumPy | Data manipulation |
| **Feature Engineering** | scikit-learn | Feature pipelines |
| **Visualization** | Matplotlib + Seaborn | Result visualization |

### 3.2 Model Conversion

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **ONNX Export** | torch.onnx | Cross-platform format |
| **TFLite Converter** | TFLite Converter | Edge deployment |
| **Quantization** | INT8 Post-Training | Size reduction |
| **Optimization** | TFLite Optimize | Performance tuning |

### 3.3 Explainability

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **SHAP** | shap 0.43 | Feature importance |
| **LIME** | lime 0.2 | Local explanations |
| **Captum** | captum 0.6 | PyTorch interpretability |

---

## 4. Code Examples

### 4.1 ESP32 Firmware (Arduino)

```cpp
#include <WiFi.h>
#include <PubSubClient.h>
#include <TensorFlowLite_ESP32.h>
#include "battery_model_data.h"
#include "sensor_manager.h"

// WiFi and MQTT
WiFiClient wifiClient;
PubSubClient mqtt(wifiClient);

// TFLite
tflite::MicroErrorReporter errorReporter;
tflite::AllOpsResolver resolver;
tflite::MicroInterpreter interpreter(nullptr, resolver, errorReporter);

// Sensor buffers
float voltageBuffer[100];
float currentBuffer[100];
float tempBuffer[100];
int bufferIndex = 0;

void setup() {
    Serial.begin(115200);
    
    // Initialize WiFi
    WiFi.begin("SSID", "PASSWORD");
    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
    }
    
    // Initialize MQTT
    mqtt.setServer("192.168.1.100", 1883);
    mqtt.setCallback(mqttCallback);
    
    // Initialize TFLite
    static tflite::MicroInterpreter static_interpreter(
        model, resolver, tensorArena, kTensorArenaSize, &errorReporter);
    interpreter = &static_interpreter;
    interpreter->AllocateTensors();
    
    // Initialize sensors
    initSensors();
}

void loop() {
    // Reconnect MQTT if needed
    if (!mqtt.connected()) {
        reconnectMQTT();
    }
    mqtt.loop();
    
    // Read sensors
    float voltage = readVoltage();
    float current = readCurrent();
    float temperature = readTemperature();
    
    // Update buffers
    voltageBuffer[bufferIndex] = voltage;
    currentBuffer[bufferIndex] = current;
    tempBuffer[bufferIndex] = temperature;
    bufferIndex = (bufferIndex + 1) % 100;
    
    // Feature extraction
    float features[16];
    extractFeatures(voltageBuffer, currentBuffer, tempBuffer, features);
    
    // TFLite inference
    float* input = interpreter->input(0)->data.f;
    memcpy(input, features, 16 * sizeof(float));
    
    unsigned long startTime = millis();
    interpreter->Invoke();
    unsigned long inferenceTime = millis() - startTime;
    
    // Get predictions
    float* output = interpreter->output(0)->data.f;
    float soh = output[0];
    float soc = output[1];
    float thermalRisk = output[2];
    float anomalyScore = output[3];
    float rul = output[4];
    
    // Create JSON payload
    StaticJsonDocument<512> doc;
    doc["device_id"] = DEVICE_ID;
    doc["voltage"] = voltage;
    doc["current"] = current;
    doc["temperature"] = temperature;
    doc["soh"] = soh;
    doc["soc"] = soc;
    doc["thermal_risk"] = thermalRisk;
    doc["anomaly_score"] = anomalyScore;
    doc["rul"] = rul;
    doc["inference_ms"] = inferenceTime;
    doc["timestamp"] = millis();
    
    char payload[512];
    serializeJson(doc, payload);
    
    // Publish via MQTT
    mqtt.publish("edgetwin/telemetry", payload);
    
    // Check for alerts
    if (thermalRisk > 0.8) {
        publishAlert("CRITICAL", "Thermal risk high", thermalRisk);
    } else if (thermalRisk > 0.6) {
        publishAlert("WARNING", "Thermal risk elevated", thermalRisk);
    }
    
    delay(10); // 100 Hz loop
}
```

### 4.2 FastAPI Backend (Python)

```python
from fastapi import FastAPI, WebSocket, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import paho.mqtt.client as mqtt
import asyncio
import json
from datetime import datetime
from typing import Optional
import shap
import numpy as np

app = FastAPI(title="EdgeTwin-BMS+ API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# WebSocket connections
active_connections: list[WebSocket] = []

@app.websocket("/ws/telemetry/{battery_id}")
async def websocket_endpoint(websocket: WebSocket, battery_id: str):
    await websocket.accept()
    active_connections.append(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # Handle incoming data if needed
    except:
        active_connections.remove(websocket)

@app.get("/api/v1/batteries/{battery_id}/health")
async def get_battery_health(battery_id: str):
    """Get comprehensive battery health metrics"""
    # Fetch from database
    battery = await fetch_battery(battery_id)
    if not battery:
        raise HTTPException(status_code=404, detail="Battery not found")
    
    # Get latest prediction
    prediction = await get_latest_prediction(battery_id)
    
    # Generate explanation
    explanation = generate_explanation(prediction)
    
    return {
        "battery_id": battery_id,
        "soh": prediction.soh,
        "soc": prediction.soc,
        "rul": prediction.rul,
        "thermal_risk": prediction.thermal_risk,
        "anomaly_score": prediction.anomaly_score,
        "explanation": explanation,
        "timestamp": datetime.now().isoformat()
    }

@app.get("/api/v1/batteries/{battery_id}/passport")
async def get_battery_passport(battery_id: str):
    """Get complete battery passport"""
    passport = await fetch_passport(battery_id)
    if not passport:
        raise HTTPException(status_code=404, detail="Passport not found")
    
    return passport

@app.post("/api/v1/simulator/run")
async def run_simulation(params: SimulationParams):
    """Run battery life simulation"""
    result = simulate_battery_life(
        driving_style=params.driving_style,
        charging_pattern=params.charging_pattern,
        daily_distance=params.daily_distance,
        ambient_temperature=params.ambient_temperature,
        charging_soc=params.charging_soc
    )
    return result

def generate_explanation(prediction):
    """Generate SHAP explanation for prediction"""
    explainer = shap.DeepExplainer(model, background_data)
    shap_values = explainer.shap_values(prediction.features)
    
    return {
        "summary": generate_summary(shap_values),
        "feature_importance": format_shap_values(shap_values),
        "root_cause": identify_root_cause(shap_values),
        "recommendations": generate_recommendations(shap_values)
    }
```

### 4.3 React Digital Twin Component

```tsx
import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { useBatteryStore } from '../store/batteryStore';

interface CellProps {
  position: [number, number, number];
  voltage: number;
  temperature: number;
  soh: number;
}

const BatteryCell: React.FC<CellProps> = ({ position, voltage, temperature, soh }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  // Color based on risk level
  const color = useMemo(() => {
    if (soh > 0.8) return new THREE.Color('#00FF88'); // Green - Safe
    if (soh > 0.6) return new THREE.Color('#FFD700'); // Yellow - Warning
    if (soh > 0.4) return new THREE.Color('#FF8C00'); // Orange - Critical
    return new THREE.Color('#FF0000'); // Red - Emergency
  }, [soh]);
  
  // Subtle animation based on temperature
  useFrame((state) => {
    if (meshRef.current) {
      const scale = 1 + Math.sin(state.clock.elapsedTime * (temperature / 20)) * 0.02;
      meshRef.current.scale.setScalar(scale);
    }
  });
  
  return (
    <mesh ref={meshRef} position={position}>
      <boxGeometry args={[0.8, 0.4, 0.8]} />
      <meshStandardMaterial 
        color={color} 
        emissive={color}
        emissiveIntensity={0.3}
        metalness={0.8}
        roughness={0.2}
      />
    </mesh>
  );
};

const BatteryPack: React.FC = () => {
  const { cells, packVoltage, packCurrent, packTemperature } = useBatteryStore();
  
  return (
    <group>
      {/* Pack enclosure */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[5, 1.5, 3]} />
        <meshStandardMaterial 
          color="#1a1a2e" 
          transparent 
          opacity={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Battery cells */}
      {cells.map((cell, index) => (
        <BatteryCell
          key={cell.id}
          position={[
            (index % 6) * 0.9 - 2.5,
            Math.floor(index / 6) * 0.5 - 0.5,
            0
          ]}
          voltage={cell.voltage}
          temperature={cell.temperature}
          soh={cell.soh}
        />
      ))}
      
      {/* Pack info display */}
      <group position={[0, 1.5, 0]}>
        <mesh>
          <planeGeometry args={[4, 0.5]} />
          <meshBasicMaterial color="#0a0a1a" transparent opacity={0.8} />
        </mesh>
      </group>
    </group>
  );
};

export const DigitalTwinView: React.FC = () => {
  return (
    <div className="w-full h-full bg-gray-900 rounded-lg overflow-hidden">
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 2, 5]} />
        <OrbitControls />
        
        {/* Lighting */}
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} />
        
        {/* Battery Pack */}
        <BatteryPack />
        
        {/* Grid helper */}
        <gridHelper args={[10, 10, '#333', '#222']} />
      </Canvas>
    </div>
  );
};
```

---

## 5. Deployment Configuration

### 5.1 Docker Compose (Development)

```yaml
version: '3.8'

services:
  backend:
    build: ./demo/fastapi_backend
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/edgetwin
      - MQTT_BROKER=mqtt-broker
    depends_on:
      - db
      - mqtt-broker

  frontend:
    build: ./demo/react_dashboard
    ports:
      - "3000:3000"
    depends_on:
      - backend

  db:
    image: timescale/timescaledb:latest-pg15
    environment:
      POSTGRES_DB: edgetwin
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
    volumes:
      - pgdata:/var/lib/postgresql/data

  mqtt-broker:
    image: eclipse-mosquitto:2
    ports:
      - "1883:1883"

volumes:
  pgdata:
```

---

*EdgeTwin-BMS+: Enterprise-grade technology stack for mission-critical battery intelligence.*
