# EdgeTwin-BMS+ ESP32 Firmware

AI-Powered Edge Digital Twin & Battery Passport Platform

## Overview

This firmware runs on ESP32 microcontrollers to provide real-time battery monitoring with edge AI inference. It collects sensor data, runs TensorFlow Lite Micro models, and publishes telemetry via MQTT.

## Features

- **Real-time Monitoring**: Voltage, current, temperature, cell balancing
- **Edge AI Inference**: 5 ML models running on-device
  - SOH (State of Health) prediction
  - SOC (State of Charge) estimation
  - Thermal risk assessment
  - Anomaly detection
  - RUL (Remaining Useful Life) calculation
- **MQTT Telemetry**: JSON-formatted data publishing
- **OTA Updates**: Web-based and MQTT-triggered firmware updates
- **Safety Monitoring**: Automated alerts for critical conditions
- **Battery Passport**: EU Battery Regulation compliant data generation

## Hardware Requirements

### ESP32 Module
- ESP32-WROOM-32D or ESP32-S3
- 4MB Flash, 520KB SRAM
- WiFi 802.11 b/g/n
- Bluetooth 4.2

### Sensors
- **INA219**: I2C current/voltage sensor
- **DS18B20**: OneWire temperature sensors (up to 8)
- **BMS IC**: SPI-based battery management IC

### Pin Configuration

| Function | Pin | Description |
|----------|-----|-------------|
| INA219 SDA | 21 | I2C Data |
| INA219 SCL | 22 | I2C Clock |
| Temp Sensors | 4 | OneWire Bus |
| BMS CS | 5 | SPI Chip Select |
| BMS MOSI | 23 | SPI Data Out |
| BMS MISO | 19 | SPI Data In |
| BMS SCK | 18 | SPI Clock |
| Status LED | 2 | Green |
| Error LED | 15 | Red |
| TX LED | 16 | Blue |
| RX LED | 17 | Yellow |

## Software Dependencies

### PlatformIO Libraries
```ini
lib_deps = 
    knolleary/PubSubClient@^2.8
    bblanchon/ArduinoJson@^6.21.3
    paulstoffregen/OneWire@^2.3.7
    milesburton/DallasTemperature@^3.9.1
    adafruit/Adafruit INA219@^1.2.1
    ESP Async WebServer
    AsyncTCP
```

### TensorFlow Lite Micro
- TFLite Micro runtime for ESP32
- Optimized for INT8 quantized models
- 32KB tensor arena (configurable)

## Building

### Prerequisites
1. Install PlatformIO CLI or VS Code extension
2. Install ESP32 development tools

### Build Commands
```bash
# Build firmware
pio run

# Build debug version
pio run -e debug

# Build release version
pio run -e release

# Upload firmware
pio run -t upload

# Monitor serial output
pio device monitor
```

## Configuration

### WiFi Settings
Edit `include/config.h`:
```cpp
#define WIFI_SSID "YourNetwork"
#define WIFI_PASSWORD "YourPassword"
```

### MQTT Settings
```cpp
#define MQTT_BROKER "192.168.1.100"
#define MQTT_PORT 1883
#define MQTT_TELEMETRY_TOPIC "edgetwin/telemetry"
```

### Battery Configuration
```cpp
#define BATTERY_CELLS_IN_SERIES 96
#define BATTERY_CELLS_IN_PARALLEL 4
#define BATTERY_CAPACITY_AH 200
```

## MQTT Topics

| Topic | Direction | Description |
|-------|-----------|-------------|
| `edgetwin/telemetry` | Publish | Battery telemetry data |
| `edgetwin/alerts` | Publish | Safety alerts |
| `edgetwin/responses` | Publish | Command responses |
| `edgetwin/commands` | Subscribe | Remote commands |

### Telemetry Message Format
```json
{
  "device_id": "BT-2024-001",
  "timestamp": 1234567890,
  "battery": {
    "voltage": 355.2,
    "current": 45.3,
    "temperature": 32.4,
    "soc": 62.4,
    "soh": 87.3,
    "cell_voltages": [...],
    "cell_temperatures": [...]
  },
  "ai": {
    "rul": 847,
    "thermal_risk": 12.5,
    "anomaly_score": 0.02,
    "confidence": 0.95,
    "explanation": "Battery operating normally"
  }
}
```

## Serial Commands

Connect via serial at 115200 baud:

| Command | Description |
|---------|-------------|
| `status` | Show system status |
| `passport` | Generate battery passport |
| `reconnect` | Reconnect WiFi/MQTT |
| `set_soh <value>` | Set SOH for testing |

## OTA Updates

### Web Interface
1. Connect to ESP32's IP address
2. Upload `.bin` firmware file
3. Device reboots automatically

### MQTT Triggered
Send command to `edgetwin/commands`:
```json
{"command": "update", "url": "http://server/firmware.bin"}
```

## Safety Features

- **Voltage Monitoring**: Per-cell high/low voltage detection
- **Temperature Monitoring**: Critical temperature shutdown
- **Current Limiting**: Overcurrent protection
- **SOC Alerts**: Low battery warnings
- **Anomaly Detection**: AI-powered fault detection

## Development

### Adding New Models
1. Train model in Python
2. Convert to TFLite format
3. Quantize to INT8
4. Add to `model_inference.h`
5. Implement inference in `model_inference.cpp`

### Testing
- Use serial commands to simulate conditions
- Monitor MQTT output with mosquitto_sub
- Test OTA with web interface

## License

MIT License - EdgeTwin-BMS+ Project

## Support

For issues or questions, contact the EdgeTwin team.
