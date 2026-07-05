/**
 * EdgeTwin-BMS+ ESP32 Firmware
 * AI-Powered Edge Digital Twin & Battery Passport Platform
 * 
 * Features:
 * - Real-time battery monitoring (voltage, current, temperature)
 * - Edge AI inference using TensorFlow Lite Micro
 * - MQTT telemetry publishing
 * - Anomaly detection and thermal risk prediction
 * - Battery passport generation
 * - OTA firmware updates
 * 
 * Hardware: ESP32 + INA219 + DS18B20 + BMS IC
 * 
 * Author: EdgeTwin Team
 * License: MIT
 */

#include <Arduino.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include <Adafruit_INA219.h>
#include <Update.h>

// TFLite Micro headers
#include "tensorflow/lite/micro/micro_interpreter.h"
#include "tensorflow/lite/micro/micro_mutable_op_resolver.h"
#include "tensorflow/lite/schema/schema_generated.h"

// Local headers
#include "config.h"
#include "model_inference.h"
#include "ota_manager.h"

// ==================== GLOBAL OBJECTS ====================
WiFiClient wifiClient;
PubSubClient mqttClient(wifiClient);
Adafruit_INA219 ina219;
OneWire oneWire(TEMP_SENSOR_PIN);
DallasTemperature tempSensors(&oneWire);

// TFLite Micro objects
tflite::MicroInterpreter* interpreter = nullptr;
TfLiteTensor* input_tensor = nullptr;
TfLiteTensor* output_tensor = nullptr;

// Tensor arena for model inference
constexpr int kTensorArenaSize = TENSOR_ARENA_SIZE;
alignas(16) uint8_t tensor_arena[kTensorArenaSize];

// ==================== DATA STRUCTURES ====================
struct BatteryData {
    float voltage;
    float current;
    float temperature;
    float soc;
    float soh;
    float power;
    uint32_t cycleCount;
    float rul;
    float thermalRisk;
    float anomalyScore;
    float cellVoltages[40];
    float cellTemperatures[8];
    bool charging;
    bool driving;
    bool anomalyActive;
    unsigned long timestamp;
};

struct AIPredictions {
    float soh;
    float soc;
    float thermalRisk;
    float anomalyScore;
    float rul;
    float confidence;
    char explanation[256];
};

struct SystemStatus {
    bool wifiConnected;
    bool mqttConnected;
    bool modelLoaded;
    uint32_t inferenceCount;
    uint32_t errorCount;
    float cpuUsage;
    uint32_t freeHeap;
    unsigned long lastInference;
    unsigned long lastTelemetry;
    unsigned long lastSensorRead;
};

// ==================== GLOBAL VARIABLES ====================
BatteryData batteryData;
AIPredictions predictions;
SystemStatus systemStatus;

// History buffers for temporal analysis
float voltageHistory[HISTORY_SIZE];
float currentHistory[HISTORY_SIZE];
float temperatureHistory[HISTORY_SIZE];
uint32_t historyIndex = 0;

// Model data (will be loaded from flash)
const unsigned char* modelData = nullptr;
size_t modelSize = 0;

// ==================== FUNCTION DECLARATIONS ====================
void setupWiFi();
void setupMQTT();
void setupSensors();
void setupTFLite();
void readSensors();
void runInference();
void publishTelemetry();
void processCommands();
void checkSafetyLimits();
void generateBatteryPassport();
void updateLEDs();
void handleOTAUpdate();

// ==================== SETUP ====================
void setup() {
    Serial.begin(115200);
    delay(1000);
    
    Serial.println("====================================");
    Serial.println("EdgeTwin-BMS+ Firmware");
    Serial.printf("Version: %s\n", FIRMWARE_VERSION);
    Serial.printf("Device: %s\n", DEVICE_ID);
    Serial.println("====================================");
    
    // Initialize status LEDs
    pinMode(LED_STATUS_PIN, OUTPUT);
    pinMode(LED_ERROR_PIN, OUTPUT);
    pinMode(LED_TX_PIN, OUTPUT);
    pinMode(LED_RX_PIN, OUTPUT);
    digitalWrite(LED_STATUS_PIN, HIGH);
    
    // Initialize I2C
    Wire.begin(INA219_SDA_PIN, INA219_SCL_PIN);
    
    // Initialize components
    setupWiFi();
    setupMQTT();
    setupSensors();
    setupTFLite();
    
    // Initialize OTA manager
    otaManager.initialize(DEVICE_ID, FIRMWARE_VERSION);
    otaManager.onProgress([](int progress) {
        Serial.printf("[OTA] Progress: %d%%\n", progress);
    });
    otaManager.onComplete([](bool success) {
        if (success) {
            Serial.println("[OTA] Update successful, restarting...");
            delay(1000);
            ESP.restart();
        } else {
            Serial.println("[OTA] Update failed");
        }
    });
    
    // Initialize data structures
    memset(&batteryData, 0, sizeof(batteryData));
    memset(&predictions, 0, sizeof(predictions));
    memset(&systemStatus, 0, sizeof(systemStatus));
    memset(voltageHistory, 0, sizeof(voltageHistory));
    memset(currentHistory, 0, sizeof(currentHistory));
    memset(temperatureHistory, 0, sizeof(temperatureHistory));
    
    systemStatus.wifiConnected = false;
    systemStatus.mqttConnected = false;
    systemStatus.modelLoaded = false;
    
    Serial.println("\n[SETUP] Initialization complete!");
    digitalWrite(LED_STATUS_PIN, LOW);
}

// ==================== MAIN LOOP ====================
void loop() {
    unsigned long currentMillis = millis();
    
    // Handle WiFi reconnection
    if (WiFi.status() != WL_CONNECTED) {
        setupWiFi();
    }
    
    // Handle MQTT reconnection
    if (!mqttClient.connected()) {
        setupMQTT();
    }
    mqttClient.loop();
    
    // Read sensors at configured interval
    if (currentMillis - systemStatus.lastSensorRead >= TELEMETRY_INTERVAL_MS) {
        readSensors();
        systemStatus.lastSensorRead = currentMillis;
    }
    
    // Run AI inference at configured interval
    if (currentMillis - systemStatus.lastInference >= INFERENCE_INTERVAL_MS) {
        if (systemStatus.modelLoaded) {
            runInference();
        }
        systemStatus.lastInference = currentMillis;
    }
    
    // Publish telemetry
    if (currentMillis - systemStatus.lastTelemetry >= TELEMETRY_INTERVAL_MS) {
        publishTelemetry();
        systemStatus.lastTelemetry = currentMillis;
    }
    
    // Process incoming commands
    processCommands();
    
    // Handle OTA updates
    handleOTAUpdate();
    
    // Check safety limits
    checkSafetyLimits();
    
    // Update status LEDs
    updateLEDs();
    
    // Yield to other tasks
    yield();
}

// ==================== WiFi SETUP ====================
void setupWiFi() {
    if (WiFi.status() == WL_CONNECTED) {
        return;
    }
    
    Serial.printf("\n[WiFi] Connecting to %s", WIFI_SSID);
    WiFi.mode(WIFI_STA);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    
    uint32_t attemptCount = 0;
    while (WiFi.status() != WL_CONNECTED && attemptCount < WIFI_TIMEOUT_MS / 500) {
        delay(500);
        Serial.print(".");
        attemptCount++;
        
        // Blink LED during connection
        digitalWrite(LED_STATUS_PIN, !digitalRead(LED_STATUS_PIN));
    }
    
    if (WiFi.status() == WL_CONNECTED) {
        Serial.println("\n[WiFi] Connected!");
        Serial.printf("[WiFi] IP Address: %s\n", WiFi.localIP().toString().c_str());
        Serial.printf("[WiFi] RSSI: %d dBm\n", WiFi.RSSI());
        systemStatus.wifiConnected = true;
        digitalWrite(LED_STATUS_PIN, HIGH);
    } else {
        Serial.println("\n[WiFi] Connection failed!");
        systemStatus.wifiConnected = false;
        digitalWrite(LED_ERROR_PIN, HIGH);
    }
}

// ==================== MQTT SETUP ====================
void setupMQTT() {
    if (mqttClient.connected()) {
        return;
    }
    
    Serial.println("[MQTT] Connecting to broker...");
    
    mqttClient.setServer(MQTT_BROKER, MQTT_PORT);
    mqttClient.setCallback(mqttCallback);
    mqttClient.setBufferSize(TELEMETRY_BUFFER_SIZE);
    
    // Attempt connection
    if (mqttClient.connect(MQTT_CLIENT_ID, MQTT_USER, MQTT_PASSWORD)) {
        Serial.println("[MQTT] Connected!");
        
        // Subscribe to command topic
        mqttClient.subscribe(MQTT_COMMANDS_TOPIC, MQTT_QOS);
        Serial.printf("[MQTT] Subscribed to: %s\n", MQTT_COMMANDS_TOPIC);
        
        systemStatus.mqttConnected = true;
        
        // Publish connection status
        StaticJsonDocument<128> doc;
        doc["device_id"] = DEVICE_ID;
        doc["status"] = "online";
        doc["firmware_version"] = FIRMWARE_VERSION;
        
        char buffer[128];
        serializeJson(doc, buffer);
        mqttClient.publish(MQTT_ALERTS_TOPIC, buffer, true);
        
    } else {
        Serial.printf("[MQTT] Connection failed, rc=%d\n", mqttClient.state());
        systemStatus.mqttConnected = false;
    }
}

// ==================== MQTT CALLBACK ====================
void mqttCallback(char* topic, byte* payload, unsigned int length) {
    // Blink RX LED
    digitalWrite(LED_RX_PIN, HIGH);
    
    // Parse incoming message
    StaticJsonDocument<256> doc;
    DeserializationError error = deserializeJson(doc, payload, length);
    
    if (error) {
        Serial.printf("[MQTT] JSON parse error: %s\n", error.c_str());
        return;
    }
    
    const char* command = doc["command"];
    if (command) {
        Serial.printf("[MQTT] Received command: %s\n", command);
        
        // Handle commands
        if (strcmp(command, "ping") == 0) {
            // Respond to ping
            StaticJsonDocument<128> response;
            response["device_id"] = DEVICE_ID;
            response["command"] = "pong";
            response["timestamp"] = millis();
            
            char buffer[128];
            serializeJson(response, buffer);
            mqttClient.publish(MQTT_RESPONSES_TOPIC, buffer);
        }
        else if (strcmp(command, "get_passport") == 0) {
            generateBatteryPassport();
        }
        else if (strcmp(command, "reset_cycles") == 0) {
            batteryData.cycleCount = 0;
            Serial.println("[MQTT] Cycle count reset");
        }
    }
    
    digitalWrite(LED_RX_PIN, LOW);
}

// ==================== SENSOR SETUP ====================
void setupSensors() {
    Serial.println("[SENSORS] Initializing...");
    
    // Initialize INA219
    if (!ina219.begin()) {
        Serial.println("[SENSORS] INA219 not found!");
        digitalWrite(LED_ERROR_PIN, HIGH);
    } else {
        Serial.println("[SENSORS] INA219 initialized");
        // Configure INA219 for high current measurement
        ina219.setCalibration_32V_2A();
    }
    
    // Initialize temperature sensors
    tempSensors.begin();
    uint8_t sensorCount = tempSensors.getDeviceCount();
    Serial.printf("[SENSORS] Found %d temperature sensors\n", sensorCount);
    
    if (sensorCount == 0) {
        Serial.println("[SENSORS] No temperature sensors found!");
    }
    
    // Configure sensor resolution
    tempSensors.setResolution(12);  // 12-bit resolution
    
    Serial.println("[SENSORS] Initialization complete");
}

// ==================== TFLITE SETUP ====================
void setupTFLite() {
    Serial.println("[TFLite] Initializing TensorFlow Lite Micro...");
    
    // In a real implementation, model data would be loaded from flash
    // For demo purposes, we'll use a placeholder
    // modelData = (const unsigned char*)MODEL_DATA;
    // modelSize = MODEL_DATA_SIZE;
    
    // Create model from data
    // const tflite::Model* model = tflite::GetModel(modelData);
    
    // For demo, create a simple placeholder model
    Serial.println("[TFLite] Model loading simulated");
    
    // Create op resolver (add operations used by model)
    static tflite::MicroMutableOpResolver<10> resolver;
    // resolver.AddFullyConnected();
    // resolver.AddRelu();
    // resolver.AddSoftmax();
    // resolver.AddReshape();
    // resolver.AddQuantize();
    // resolver.AddDequantize();
    
    // Create interpreter
    // static tflite::MicroInterpreter static_interpreter(
    //     model, resolver, tensor_arena, kTensorArenaSize);
    // interpreter = &static_interpreter;
    
    // Allocate tensors
    // interpreter->AllocateTensors();
    
    // Get input and output tensors
    // input_tensor = interpreter->input(0);
    // output_tensor = interpreter->output(0);
    
    Serial.printf("[TFLite] Tensor arena size: %d bytes\n", kTensorArenaSize);
    Serial.println("[TFLite] Initialization complete (simulated)");
    
    systemStatus.modelLoaded = true;  // Set to true for demo
}

// ==================== SENSOR READING ====================
void readSensors() {
    // Read voltage and current from INA219
    batteryData.voltage = ina219.getBusVoltage_V();
    batteryData.current = ina219.getCurrent_mA() / 1000.0;  // Convert to Amps
    batteryData.power = batteryData.voltage * abs(batteryData.current);
    
    // Scale voltage to pack level (INA219 measures through voltage divider)
    batteryData.voltage = batteryData.voltage * (BATTERY_NOMINAL_VOLTAGE / 12.0);  // Adjust for divider
    
    // Read temperature sensors
    tempSensors.requestTemperatures();
    uint8_t sensorCount = tempSensors.getDeviceCount();
    
    float totalTemp = 0;
    for (uint8_t i = 0; i < sensorCount && i < MAX_TEMP_SENSORS; i++) {
        float tempC = tempSensors.getTempCByIndex(i);
        if (tempC != DEVICE_DISCONNECTED_C) {
            batteryData.cellTemperatures[i] = tempC;
            totalTemp += tempC;
        }
    }
    
    if (sensorCount > 0) {
        batteryData.temperature = totalTemp / sensorCount;
    }
    
    // Simulate cell voltages (in real implementation, read from BMS IC)
    for (int i = 0; i < 40; i++) {
        float baseVoltage = batteryData.voltage / 96.0;  // Per cell voltage
        batteryData.cellVoltages[i] = baseVoltage + (random(-10, 10) / 1000.0);
    }
    
    // Calculate SOC from voltage (simplified)
    float socVoltage = batteryData.voltage;
    batteryData.soc = map(socVoltage * 10, BATTERY_MIN_VOLTAGE * 10, 
                          BATTERY_MAX_VOLTAGE * 10, 0, 100);
    batteryData.soc = constrain(batteryData.soc, 0, 100);
    
    // Update history
    voltageHistory[historyIndex] = batteryData.voltage;
    currentHistory[historyIndex] = batteryData.current;
    temperatureHistory[historyIndex] = batteryData.temperature;
    historyIndex = (historyIndex + 1) % HISTORY_SIZE;
    
    // Determine charging/discharging state
    batteryData.charging = batteryData.current > 0.5;
    batteryData.driving = batteryData.current < -0.5;
    
    // Update timestamp
    batteryData.timestamp = millis();
}

// ==================== AI INFERENCE ====================
void runInference() {
    if (!systemStatus.modelLoaded || !input_tensor || !output_tensor) {
        return;
    }
    
    unsigned long startTime = micros();
    
    // Prepare input features
    // Feature vector: [voltage, current, temperature, soc, soh, cycle_count, 
    //                  cell_voltages(40), cell_temperatures(8), history(3)]
    float* inputData = input_tensor->data.f;
    
    int featureIndex = 0;
    
    // Basic features
    inputData[featureIndex++] = batteryData.voltage / BATTERY_MAX_VOLTAGE;
    inputData[featureIndex++] = batteryData.current / BATTERY_MAX_CURRENT;
    inputData[featureIndex++] = batteryData.temperature / BATTERY_MAX_TEMP;
    inputData[featureIndex++] = batteryData.soc / 100.0;
    inputData[featureIndex++] = batteryData.soh / 100.0;
    inputData[featureIndex++] = (float)batteryData.cycleCount / 10000.0;
    
    // Cell voltages (normalized)
    for (int i = 0; i < 40; i++) {
        inputData[featureIndex++] = batteryData.cellVoltages[i] / 4.2;
    }
    
    // Cell temperatures (normalized)
    for (int i = 0; i < 8; i++) {
        inputData[featureIndex++] = batteryData.cellTemperatures[i] / BATTERY_MAX_TEMP;
    }
    
    // Historical statistics
    float avgVoltage = 0, avgCurrent = 0, avgTemp = 0;
    for (int i = 0; i < HISTORY_SIZE; i++) {
        avgVoltage += voltageHistory[i];
        avgCurrent += currentHistory[i];
        avgTemp += temperatureHistory[i];
    }
    inputData[featureIndex++] = (avgVoltage / HISTORY_SIZE) / BATTERY_MAX_VOLTAGE;
    inputData[featureIndex++] = (avgCurrent / HISTORY_SIZE) / BATTERY_MAX_CURRENT;
    inputData[featureIndex++] = (avgTemp / HISTORY_SIZE) / BATTERY_MAX_TEMP;
    
    // Run inference
    // TfLiteStatus invoke_status = interpreter->Invoke();
    // if (invoke_status != kTfLiteOk) {
    //     Serial.println("[TFLite] Inference failed!");
    //     systemStatus.errorCount++;
    //     return;
    // }
    
    // Parse outputs
    float* outputData = output_tensor->data.f;
    
    // For demo, simulate predictions
    predictions.soh = batteryData.soh + (random(-10, 10) / 100.0);
    predictions.soc = batteryData.soc + (random(-5, 5) / 100.0);
    predictions.thermalRisk = calculateThermalRisk();
    predictions.anomalyScore = calculateAnomalyScore();
    predictions.rul = calculateRUL();
    predictions.confidence = 0.85 + (random(0, 15) / 100.0);
    
    // Generate explanation
    generateExplanation();
    
    // Update system status
    unsigned long inferenceTime = micros() - startTime;
    systemStatus.cpuUsage = (float)inferenceTime / (INFERENCE_INTERVAL_MS * 1000.0) * 100.0;
    systemStatus.inferenceCount++;
    
    Serial.printf("[TFLite] Inference completed in %lu μs\n", inferenceTime);
}

// ==================== HELPER FUNCTIONS ====================
float calculateThermalRisk() {
    float maxTemp = 0;
    for (int i = 0; i < 8; i++) {
        if (batteryData.cellTemperatures[i] > maxTemp) {
            maxTemp = batteryData.cellTemperatures[i];
        }
    }
    
    // Thermal risk calculation
    float risk = 0;
    if (maxTemp > TEMP_CRITICAL_THRESHOLD) {
        risk = 100;
    } else if (maxTemp > TEMP_HIGH_THRESHOLD) {
        risk = 70 + (maxTemp - TEMP_HIGH_THRESHOLD) / 
               (TEMP_CRITICAL_THRESHOLD - TEMP_HIGH_THRESHOLD) * 30;
    } else if (maxTemp > 40) {
        risk = (maxTemp - 40) / (TEMP_HIGH_THRESHOLD - 40) * 70;
    }
    
    // Factor in temperature variance
    float tempVariance = 0;
    float avgTemp = batteryData.temperature;
    for (int i = 0; i < 8; i++) {
        tempVariance += pow(batteryData.cellTemperatures[i] - avgTemp, 2);
    }
    tempVariance /= 8;
    risk += tempVariance * 2;
    
    return constrain(risk, 0, 100);
}

float calculateAnomalyScore() {
    // Calculate voltage standard deviation
    float avgVoltage = 0;
    for (int i = 0; i < 40; i++) {
        avgVoltage += batteryData.cellVoltages[i];
    }
    avgVoltage /= 40;
    
    float voltageVariance = 0;
    for (int i = 0; i < 40; i++) {
        voltageVariance += pow(batteryData.cellVoltages[i] - avgVoltage, 2);
    }
    voltageVariance /= 40;
    float voltageStd = sqrt(voltageVariance);
    
    // Anomaly score based on voltage imbalance and thermal risk
    float score = voltageStd * 10 + (predictions.thermalRisk / 100) * 0.3;
    
    // Check for sudden changes
    if (historyIndex > 0) {
        float voltageDelta = abs(batteryData.voltage - voltageHistory[(historyIndex - 1 + HISTORY_SIZE) % HISTORY_SIZE]);
        if (voltageDelta > 5.0) {  // Sudden 5V change
            score += 0.2;
        }
    }
    
    return constrain(score, 0, 1);
}

float calculateRUL() {
    // Simplified RUL calculation based on SOH and cycle count
    float rulCycles = (batteryData.soh / 100.0) * 5000 - batteryData.cycleCount;
    
    // Factor in temperature history
    float avgTemp = 0;
    for (int i = 0; i < HISTORY_SIZE; i++) {
        avgTemp += temperatureHistory[i];
    }
    avgTemp /= HISTORY_SIZE;
    
    // High temperature accelerates degradation
    if (avgTemp > 35) {
        rulCycles *= (1.0 - (avgTemp - 35) / 100.0);
    }
    
    return max(0.0f, rulCycles);
}

void generateExplanation() {
    char* explanation = predictions.explanation;
    
    if (predictions.thermalRisk > 70) {
        sprintf(explanation, "CRITICAL: High thermal risk detected. Max cell temp: %.1f°C. "
                "Recommend immediate power reduction.", batteryData.temperature);
    } else if (predictions.anomalyScore > 0.5) {
        sprintf(explanation, "WARNING: Anomaly detected. Voltage imbalance: %.3fV. "
                "Recommend cell balancing check.", 
                calculateVoltageImbalance());
    } else if (predictions.soh < 70) {
        sprintf(explanation, "CAUTION: Battery health degraded to %.1f%%. "
                "Consider replacement planning.", predictions.soh);
    } else {
        sprintf(explanation, "Battery operating normally. Health: %.1f%%, "
                "Thermal risk: %.1f%%, Anomaly: %.3f", 
                predictions.soh, predictions.thermalRisk, predictions.anomalyScore);
    }
}

float calculateVoltageImbalance() {
    float maxV = 0, minV = 999;
    for (int i = 0; i < 40; i++) {
        if (batteryData.cellVoltages[i] > maxV) maxV = batteryData.cellVoltages[i];
        if (batteryData.cellVoltages[i] < minV) minV = batteryData.cellVoltages[i];
    }
    return maxV - minV;
}

// ==================== MQTT PUBLISHING ====================
void publishTelemetry() {
    if (!mqttClient.connected()) {
        return;
    }
    
    // Blink TX LED
    digitalWrite(LED_TX_PIN, HIGH);
    
    // Create JSON document
    StaticJsonDocument<TELEMETRY_BUFFER_SIZE> doc;
    
    // Device info
    doc["device_id"] = DEVICE_ID;
    doc["timestamp"] = millis();
    doc["firmware_version"] = FIRMWARE_VERSION;
    
    // Battery data
    JsonObject battery = doc.createNestedObject("battery");
    battery["voltage"] = round(batteryData.voltage * 100) / 100;
    battery["current"] = round(batteryData.current * 100) / 100;
    battery["temperature"] = round(batteryData.temperature * 100) / 100;
    battery["soc"] = round(batteryData.soc * 100) / 100;
    battery["soh"] = round(batteryData.soh * 100) / 100;
    battery["power"] = round(batteryData.power * 100) / 100;
    battery["cycle_count"] = batteryData.cycleCount;
    battery["charging"] = batteryData.charging;
    battery["driving"] = batteryData.driving;
    
    // AI predictions
    JsonObject ai = doc.createNestedObject("ai");
    ai["rul"] = round(predictions.rul);
    ai["thermal_risk"] = round(predictions.thermalRisk * 100) / 100;
    ai["anomaly_score"] = round(predictions.anomalyScore * 10000) / 10000;
    ai["confidence"] = round(predictions.confidence * 100) / 100;
    ai["explanation"] = predictions.explanation;
    
    // Cell data (subset for telemetry)
    JsonArray cellVoltages = battery.createNestedArray("cell_voltages");
    for (int i = 0; i < 40; i++) {
        cellVoltages.add(round(batteryData.cellVoltages[i] * 1000) / 1000);
    }
    
    JsonArray cellTemps = battery.createNestedArray("cell_temperatures");
    for (int i = 0; i < 8; i++) {
        cellTemps.add(round(batteryData.cellTemperatures[i] * 100) / 100);
    }
    
    // System status
    JsonObject status = doc.createNestedObject("status");
    status["wifi_rssi"] = WiFi.RSSI();
    status["free_heap"] = ESP.getFreeHeap();
    status["inference_count"] = systemStatus.inferenceCount;
    status["error_count"] = systemStatus.errorCount;
    status["cpu_usage"] = round(systemStatus.cpuUsage * 100) / 100;
    
    // Serialize and publish
    char buffer[TELEMETRY_BUFFER_SIZE];
    serializeJson(doc, buffer);
    
    if (mqttClient.publish(MQTT_TELEMETRY_TOPIC, buffer, false)) {
        Serial.printf("[MQTT] Published telemetry: %d bytes\n", strlen(buffer));
    } else {
        Serial.println("[MQTT] Publish failed!");
        systemStatus.errorCount++;
    }
    
    digitalWrite(LED_TX_PIN, LOW);
}

// ==================== BATTERY PASSPORT ====================
void generateBatteryPassport() {
    StaticJsonDocument<512> doc;
    
    doc["battery_id"] = DEVICE_ID;
    doc["manufacturer"] = "Tata Autocomp";
    doc["chemistry"] = "NMC 811";
    doc["capacity_kwh"] = BATTERY_CAPACITY_AH * BATTERY_NOMINAL_VOLTAGE / 1000;
    doc["nominal_voltage"] = BATTERY_NOMINAL_VOLTAGE;
    doc["manufacturing_date"] = "2024-01-15";
    doc["warranty_status"] = "ACTIVE";
    doc["warranty_expiry"] = "2032-01-15";
    doc["cycle_count"] = batteryData.cycleCount;
    doc["soh"] = round(batteryData.soh * 100) / 100;
    doc["predicted_rul_cycles"] = round(predictions.rul);
    doc["fast_charge_count"] = 234;
    doc["total_energy_throughput"] = batteryData.cycleCount * BATTERY_CAPACITY_AH * BATTERY_NOMINAL_VOLTAGE / 1000 * 0.8;
    doc["carbon_footprint_kg"] = batteryData.cycleCount * BATTERY_CAPACITY_AH * 0.5 * 0.001;
    doc["second_life_eligible"] = batteryData.soh > 40;
    doc["recycling_recommended"] = batteryData.soh < 20;
    doc["end_of_life_status"] = batteryData.soh > 20 ? "ACTIVE" : "RECYCLING";
    
    // Publish passport
    char buffer[512];
    serializeJson(doc, buffer);
    mqttClient.publish(MQTT_RESPONSES_TOPIC, buffer);
    
    Serial.println("[PASSPORT] Battery passport published");
}

// ==================== SAFETY CHECKS ====================
void checkSafetyLimits() {
    bool alert = false;
    StaticJsonDocument<256> alertDoc;
    
    // Check voltage limits
    for (int i = 0; i < 40; i++) {
        if (batteryData.cellVoltages[i] > VOLTAGE_HIGH_THRESHOLD) {
            alertDoc["type"] = "voltage_high";
            alertDoc["severity"] = "critical";
            alertDoc["cell"] = i;
            alertDoc["value"] = batteryData.cellVoltages[i];
            alertDoc["threshold"] = VOLTAGE_HIGH_THRESHOLD;
            alert = true;
        }
        else if (batteryData.cellVoltages[i] < VOLTAGE_LOW_THRESHOLD) {
            alertDoc["type"] = "voltage_low";
            alertDoc["severity"] = "critical";
            alertDoc["cell"] = i;
            alertDoc["value"] = batteryData.cellVoltages[i];
            alertDoc["threshold"] = VOLTAGE_LOW_THRESHOLD;
            alert = true;
        }
    }
    
    // Check temperature limits
    for (int i = 0; i < 8; i++) {
        if (batteryData.cellTemperatures[i] > TEMP_CRITICAL_THRESHOLD) {
            alertDoc["type"] = "temperature_critical";
            alertDoc["severity"] = "critical";
            alertDoc["sensor"] = i;
            alertDoc["value"] = batteryData.cellTemperatures[i];
            alertDoc["threshold"] = TEMP_CRITICAL_THRESHOLD;
            alert = true;
        }
        else if (batteryData.cellTemperatures[i] > TEMP_HIGH_THRESHOLD) {
            alertDoc["type"] = "temperature_high";
            alertDoc["severity"] = "warning";
            alertDoc["sensor"] = i;
            alertDoc["value"] = batteryData.cellTemperatures[i];
            alertDoc["threshold"] = TEMP_HIGH_THRESHOLD;
            alert = true;
        }
    }
    
    // Check current limits
    if (abs(batteryData.current) > CURRENT_HIGH_THRESHOLD) {
        alertDoc["type"] = "current_high";
        alertDoc["severity"] = "warning";
        alertDoc["value"] = batteryData.current;
        alertDoc["threshold"] = CURRENT_HIGH_THRESHOLD;
        alert = true;
    }
    
    // Check SOC limits
    if (batteryData.soc < SOC_LOW_THRESHOLD) {
        alertDoc["type"] = "soc_low";
        alertDoc["severity"] = "warning";
        alertDoc["value"] = batteryData.soc;
        alertDoc["threshold"] = SOC_LOW_THRESHOLD;
        alert = true;
    }
    
    // Publish alert if triggered
    if (alert) {
        alertDoc["device_id"] = DEVICE_ID;
        alertDoc["timestamp"] = millis();
        
        char buffer[256];
        serializeJson(alertDoc, buffer);
        mqttClient.publish(MQTT_ALERTS_TOPIC, buffer, false);
        
        Serial.printf("[SAFETY] Alert published: %s\n", alertDoc["type"].as<const char*>());
        digitalWrite(LED_ERROR_PIN, HIGH);
    } else {
        digitalWrite(LED_ERROR_PIN, LOW);
    }
}

// ==================== LED UPDATE ====================
void updateLEDs() {
    // Status LED indicates system health
    if (systemStatus.wifiConnected && systemStatus.mqttConnected) {
        digitalWrite(LED_STATUS_PIN, HIGH);
    } else {
        // Blink status LED
        static unsigned long lastBlink = 0;
        if (millis() - lastBlink > 500) {
            digitalWrite(LED_STATUS_PIN, !digitalRead(LED_STATUS_PIN));
            lastBlink = millis();
        }
    }
}

// ==================== OTA UPDATE HANDLER ====================
void handleOTAUpdate() {
    otaManager.update();
}

// ==================== COMMAND PROCESSING ====================
void processCommands() {
    // Local serial commands for debugging
    if (Serial.available()) {
        String command = Serial.readStringUntil('\n');
        command.trim();
        
        if (command == "status") {
            Serial.println("\n=== System Status ===");
            Serial.printf("WiFi: %s\n", systemStatus.wifiConnected ? "Connected" : "Disconnected");
            Serial.printf("MQTT: %s\n", systemStatus.mqttConnected ? "Connected" : "Disconnected");
            Serial.printf("Model: %s\n", systemStatus.modelLoaded ? "Loaded" : "Not Loaded");
            Serial.printf("Inferences: %lu\n", systemStatus.inferenceCount);
            Serial.printf("Errors: %lu\n", systemStatus.errorCount);
            Serial.printf("Free Heap: %lu bytes\n", ESP.getFreeHeap());
            Serial.printf("Battery SOC: %.1f%%\n", batteryData.soc);
            Serial.printf("Battery SOH: %.1f%%\n", batteryData.soh);
            Serial.printf("Temperature: %.1f°C\n", batteryData.temperature);
        }
        else if (command == "passport") {
            generateBatteryPassport();
        }
        else if (command == "reconnect") {
            setupWiFi();
            setupMQTT();
        }
        else if (command.startsWith("set_soh ")) {
            float newSoh = command.substring(8).toFloat();
            if (newSoh >= 0 && newSoh <= 100) {
                batteryData.soh = newSoh;
                Serial.printf("SOH set to %.1f%%\n", newSoh);
            }
        }
    }
}
