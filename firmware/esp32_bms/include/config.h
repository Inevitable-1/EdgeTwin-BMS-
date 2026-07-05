#ifndef CONFIG_H
#define CONFIG_H

// ==================== DEVICE CONFIGURATION ====================
#define DEVICE_ID "BT-2024-001"
#define DEVICE_NAME "EdgeTwin-BMS+"
#define FIRMWARE_VERSION "1.0.0"
#define HARDWARE_VERSION "HW-ESP32-V1"

// ==================== WiFi CONFIGURATION ====================
#define WIFI_SSID "EdgeTwin-Network"
#define WIFI_PASSWORD "EdgeTwin2024!"
#define WIFI_TIMEOUT_MS 10000
#define WIFI_RETRY_INTERVAL_MS 5000

// ==================== MQTT CONFIGURATION ====================
#define MQTT_BROKER "192.168.1.100"
#define MQTT_PORT 1883
#define MQTT_USER ""
#define MQTT_PASSWORD ""
#define MQTT_CLIENT_ID "esp32-bms-001"
#define MQTT_TELEMETRY_TOPIC "edgetwin/telemetry"
#define MQTT_ALERTS_TOPIC "edgetwin/alerts"
#define MQTT_COMMANDS_TOPIC "edgetwin/commands"
#define MQTT_RESPONSES_TOPIC "edgetwin/responses"
#define MQTT_QOS 1

// ==================== SENSOR PIN DEFINITIONS ====================
// INA219 Current Sensor (I2C)
#define INA219_SDA_PIN 21
#define INA219_SCL_PIN 22
#define INA219_ADDR 0x40

// DS18B20 Temperature Sensors (OneWire)
#define TEMP_SENSOR_PIN 4
#define MAX_TEMP_SENSORS 8

// BMS IC Communication (SPI)
#define BMS_CS_PIN 5
#define BMS_MOSI_PIN 23
#define BMS_MISO_PIN 19
#define BMS_SCK_PIN 18

// Status LEDs
#define LED_STATUS_PIN 2
#define LED_ERROR_PIN 15
#define LED_TX_PIN 16
#define LED_RX_PIN 17

// ==================== BATTERY CONFIGURATION ====================
#define BATTERY_CELLS_IN_SERIES 96      // 96S configuration for 355.2V
#define BATTERY_CELLS_IN_PARALLEL 4     // 4P configuration
#define BATTERY_CAPACITY_AH 200         // 200Ah capacity
#define BATTERY_NOMINAL_VOLTAGE 355.2   // 355.2V nominal
#define BATTERY_MAX_VOLTAGE 403.2       // 4.2V per cell max
#define BATTERY_MIN_VOLTAGE 288.0       // 3.0V per cell min
#define BATTERY_MAX_CURRENT 200         // 200A max discharge
#define BATTERY_MAX_TEMP 60.0           // 60°C max operating temp
#define BATTERY_MIN_TEMP -20.0          // -20°C min operating temp

// ==================== AI MODEL CONFIGURATION ====================
#define MODEL_INPUT_SIZE 64             // Input feature vector size
#define MODEL_OUTPUT_SIZE 5             // SOH, SOC, Thermal, Anomaly, RUL
#define INFERENCE_INTERVAL_MS 1000      // 1 second inference cycle
#define CONFIDENCE_THRESHOLD 0.7        // Minimum confidence for predictions
#define ANOMALY_THRESHOLD 0.5           // Anomaly detection threshold
#define THERMAL_RISK_THRESHOLD 70.0     // Thermal risk alert threshold

// ==================== TFLITE MICRO CONFIGURATION ====================
#define TENSOR_ARENA_SIZE (32 * 1024)   // 32KB tensor arena
#define MAX_MODEL_SIZE (80 * 1024)      // 80KB max model size
#define NUM_THREADS 2                   // Dual-core inference

// ==================== TELEMETRY CONFIGURATION ====================
#define TELEMETRY_INTERVAL_MS 1000      // 1 second telemetry rate
#define TELEMETRY_BUFFER_SIZE 512       // JSON buffer size
#define HISTORY_SIZE 60                 // 60 seconds history
#define CELL_VOLTAGE_SAMPLES 10         // Samples for cell voltage averaging
#define TEMP_SENSOR_SAMPLES 5           // Samples for temperature averaging

// ==================== SAFETY LIMITS ====================
#define VOLTAGE_HIGH_THRESHOLD 4.15     // Per cell high voltage
#define VOLTAGE_LOW_THRESHOLD 3.05      // Per cell low voltage
#define CURRENT_HIGH_THRESHOLD 180      // High current discharge
#define TEMP_HIGH_THRESHOLD 55.0        // High temperature
#define TEMP_CRITICAL_THRESHOLD 65.0    // Critical temperature
#define SOC_LOW_THRESHOLD 10.0          // Low SOC warning
#define SOH_LOW_THRESHOLD 70.0          // Low SOH warning

// ==================== OTA UPDATE CONFIGURATION ====================
#define OTA_ENABLE true
#define OTA_PASSWORD "EdgeTwin-OTA-2024!"
#define OTA_PORT 8266

// ==================== POWER MANAGEMENT ====================
#define DEEP_SLEEP_ENABLE false
#define LIGHT_SLEEP_ENABLE true
#define CPU_FREQ_MHZ 240               // Maximum CPU frequency

#endif // CONFIG_H
