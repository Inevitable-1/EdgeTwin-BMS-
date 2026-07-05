/**
 * Model Inference Engine Implementation
 * EdgeTwin-BMS+ ESP32 Firmware
 */

#include "model_inference.h"
#include <cstring>
#include <cmath>

// ==================== GLOBAL INSTANCES ====================
ModelInferenceEngine inferenceEngine;
FeatureExtractor featureExtractor;
ExplainabilityEngine explainabilityEngine;

// ==================== MODEL INFERENCE ENGINE ====================
ModelInferenceEngine::ModelInferenceEngine() {
    initializeModelStates();
}

ModelInferenceEngine::~ModelInferenceEngine() {
    // Cleanup if needed
}

void ModelInferenceEngine::initializeModelStates() {
    for (int i = 0; i < MAX_MODELS; i++) {
        models[i].loaded = false;
        models[i].quantized = false;
        models[i].data = nullptr;
        models[i].size = 0;
        models[i].totalInferenceTime = 0;
        models[i].inferenceCount = 0;
    }
}

bool ModelInferenceEngine::initialize() {
    Serial.println("[ModelEngine] Initializing inference engine...");
    
    // Try to load all models
    bool allLoaded = true;
    allLoaded &= loadModel(MODEL_SOH);
    allLoaded &= loadModel(MODEL_SOC);
    allLoaded &= loadModel(MODEL_THERMAL);
    allLoaded &= loadModel(MODEL_ANOMALY);
    allLoaded &= loadModel(MODEL_RUL);
    
    if (allLoaded) {
        Serial.println("[ModelEngine] All models loaded successfully");
    } else {
        Serial.println("[ModelEngine] Some models failed to load");
    }
    
    return allLoaded;
}

bool ModelInferenceEngine::loadModel(ModelType type) {
    if (type >= MAX_MODELS) {
        return false;
    }
    
    ModelState& state = models[type];
    
    // Select model data based on type
    switch (type) {
        case MODEL_SOH:
            state.data = SOH_MODEL_DATA;
            state.size = SOH_MODEL_SIZE;
            break;
        case MODEL_SOC:
            state.data = SOC_MODEL_DATA;
            state.size = SOC_MODEL_SIZE;
            break;
        case MODEL_THERMAL:
            state.data = THERMAL_MODEL_DATA;
            state.size = THERMAL_MODEL_SIZE;
            break;
        case MODEL_ANOMALY:
            state.data = ANOMALY_MODEL_DATA;
            state.size = ANOMALY_MODEL_SIZE;
            break;
        case MODEL_RUL:
            state.data = RUL_MODEL_DATA;
            state.size = RUL_MODEL_SIZE;
            break;
        default:
            return false;
    }
    
    // Validate model data
    if (!validateModelData(state.data, state.size)) {
        Serial.printf("[ModelEngine] Model %s validation failed\n", getModelName(type));
        return false;
    }
    
    state.loaded = true;
    state.quantized = false;
    
    Serial.printf("[ModelEngine] Model %s loaded (%d bytes)\n", getModelName(type), state.size);
    return true;
}

void ModelInferenceEngine::unloadModel(ModelType type) {
    if (type < MAX_MODELS) {
        models[type].loaded = false;
        models[type].data = nullptr;
        models[type].size = 0;
    }
}

bool ModelInferenceEngine::isModelLoaded(ModelType type) {
    return type < MAX_MODELS && models[type].loaded;
}

InferenceResult ModelInferenceEngine::predict(ModelType type, const float* input, uint16_t inputSize) {
    InferenceResult result = {0, 0, false, 0};
    
    if (!isModelLoaded(type) || !input) {
        return result;
    }
    
    unsigned long startTime = micros();
    
    // In a real implementation, this would run TFLite inference
    // For demo, we simulate predictions based on input features
    
    switch (type) {
        case MODEL_SOH: {
            // Simulate SOH prediction based on cycle count and temperature
            float cycleFactor = input[5] * 10000.0;  // Denormalize cycle count
            float avgTemp = 0;
            for (int i = 46; i < 54; i++) {
                avgTemp += input[i];
            }
            avgTemp = (avgTemp / 8) * 60.0;  // Denormalize temperature
            
            // SOH degradation model
            float degradation = 0.0001 * cycleFactor + 0.001 * max(0.0f, avgTemp - 35);
            result.value = max(0.0f, min(100.0f, 100.0f - degradation * 100));
            result.confidence = 0.85 + (random(0, 15) / 100.0);
            break;
        }
        
        case MODEL_SOC: {
            // Simulate SOC prediction from voltage and current
            float voltage = input[0] * 403.2;  // Denormalize
            float current = input[1] * 200.0;
            
            // SOC from voltage (simplified OCV model)
            float ocv = voltage / 96.0;  // Per cell
            result.value = max(0.0f, min(100.0f, (ocv - 3.0) / 1.2 * 100));
            result.confidence = 0.90 + (random(0, 10) / 100.0);
            break;
        }
        
        case MODEL_THERMAL: {
            // Simulate thermal risk prediction
            float maxTemp = 0;
            for (int i = 6; i < 14; i++) {
                float temp = input[i] * 60.0;
                if (temp > maxTemp) maxTemp = temp;
            }
            
            // Thermal risk calculation
            float risk = 0;
            if (maxTemp > 55) {
                risk = 70 + (maxTemp - 55) / 10 * 30;
            } else if (maxTemp > 40) {
                risk = (maxTemp - 40) / 15 * 70;
            }
            
            result.value = min(100.0f, risk);
            result.confidence = 0.80 + (random(0, 20) / 100.0);
            break;
        }
        
        case MODEL_ANOMALY: {
            // Simulate anomaly detection
            float voltageImbalance = 0;
            float avgVoltage = 0;
            for (int i = 6; i < 46; i++) {
                avgVoltage += input[i];
            }
            avgVoltage /= 40;
            
            for (int i = 6; i < 46; i++) {
                voltageImbalance += pow(input[i] - avgVoltage, 2);
            }
            voltageImbalance = sqrt(voltageImbalance / 40);
            
            result.value = min(1.0f, voltageImbalance * 10 + (input[54] / 60.0) * 0.3);
            result.confidence = 0.75 + (random(0, 25) / 100.0);
            break;
        }
        
        case MODEL_RUL: {
            // Simulate RUL prediction
            float soh = input[0] * 100;
            float cycleCount = input[5] * 10000;
            
            result.value = max(0.0f, (soh / 100) * 5000 - cycleCount);
            result.confidence = 0.82 + (random(0, 18) / 100.0);
            break;
        }
        
        default:
            return result;
    }
    
    result.valid = true;
    result.inferenceTimeUs = micros() - startTime;
    
    // Update performance counters
    models[type].totalInferenceTime += result.inferenceTimeUs;
    models[type].inferenceCount++;
    
    return result;
}

bool ModelInferenceEngine::predictAll(const float* input, uint16_t inputSize, float* outputs) {
    if (!input || !outputs) {
        return false;
    }
    
    for (int i = 0; i < MAX_MODELS; i++) {
        InferenceResult result = predict(static_cast<ModelType>(i), input, inputSize);
        if (result.valid) {
            outputs[i * 2] = result.value;
            outputs[i * 2 + 1] = result.confidence;
        } else {
            outputs[i * 2] = 0;
            outputs[i * 2 + 1] = 0;
        }
    }
    
    return true;
}

bool ModelInferenceEngine::predictBatch(const float* inputs, uint16_t batchSize, float* outputs) {
    if (!inputs || !outputs || batchSize == 0) {
        return false;
    }
    
    uint16_t featuresPerSample = MODEL_INPUT_FEATURES;
    uint16_t outputsPerSample = MAX_MODELS * 2;
    
    for (uint16_t b = 0; b < batchSize; b++) {
        const float* sampleInput = inputs + (b * featuresPerSample);
        float* sampleOutput = outputs + (b * outputsPerSample);
        
        if (!predictAll(sampleInput, featuresPerSample, sampleOutput)) {
            return false;
        }
    }
    
    return true;
}

uint8_t ModelInferenceEngine::getLoadedModelCount() {
    uint8_t count = 0;
    for (int i = 0; i < MAX_MODELS; i++) {
        if (models[i].loaded) count++;
    }
    return count;
}

const char* ModelInferenceEngine::getModelName(ModelType type) {
    switch (type) {
        case MODEL_SOH: return "SOH";
        case MODEL_SOC: return "SOC";
        case MODEL_THERMAL: return "Thermal";
        case MODEL_ANOMALY: return "Anomaly";
        case MODEL_RUL: return "RUL";
        default: return "Unknown";
    }
}

size_t ModelInferenceEngine::getModelSize(ModelType type) {
    return type < MAX_MODELS ? models[type].size : 0;
}

unsigned long ModelInferenceEngine::getAverageInferenceTime(ModelType type) {
    if (type >= MAX_MODELS || models[type].inferenceCount == 0) {
        return 0;
    }
    return models[type].totalInferenceTime / models[type].inferenceCount;
}

uint32_t ModelInferenceEngine::getInferenceCount(ModelType type) {
    return type < MAX_MODELS ? models[type].inferenceCount : 0;
}

void ModelInferenceEngine::resetPerformanceCounters() {
    for (int i = 0; i < MAX_MODELS; i++) {
        models[i].totalInferenceTime = 0;
        models[i].inferenceCount = 0;
    }
}

bool ModelInferenceEngine::validateModelData(const unsigned char* data, size_t size) {
    if (!data || size < 8) {
        return false;
    }
    
    // Check TFLite header magic bytes
    if (data[0] != 0x20 || data[1] != 0x00 || data[2] != 0x00 || data[3] != 0x00) {
        return false;
    }
    
    // Check "TFL3" identifier
    if (data[4] != 0x54 || data[5] != 0x46 || data[6] != 0x4C || data[7] != 0x33) {
        return false;
    }
    
    return true;
}

float ModelInferenceEngine::quantizeFloat(float value, float scale, int32_t zeroPoint) {
    return round(value / scale + zeroPoint);
}

float ModelInferenceEngine::dequantizeFloat(int8_t value, float scale, int32_t zeroPoint) {
    return (value - zeroPoint) * scale;
}

bool ModelInferenceEngine::updateModel(ModelType type, const unsigned char* newData, size_t newSize) {
    if (type >= MAX_MODELS || !newData || newSize == 0) {
        return false;
    }
    
    // Validate new model data
    if (!validateModelData(newData, newSize)) {
        return false;
    }
    
    ModelState& state = models[type];
    state.data = newData;
    state.size = newSize;
    state.loaded = true;
    
    Serial.printf("[ModelEngine] Model %s updated (%d bytes)\n", getModelName(type), newSize);
    return true;
}

bool ModelInferenceEngine::verifyModel(ModelType type) {
    if (!isModelLoaded(type)) {
        return false;
    }
    
    ModelState& state = models[type];
    return validateModelData(state.data, state.size);
}

// ==================== FEATURE EXTRACTOR ====================
bool FeatureExtractor::extractFeatures(
    const float* voltageHistory,
    const float* currentHistory,
    const float* temperatureHistory,
    const float* cellVoltages,
    const float* cellTemperatures,
    uint32_t cycleCount,
    float soc,
    float soh,
    float* outputFeatures,
    uint16_t* outputSize
) {
    if (!voltageHistory || !currentHistory || !temperatureHistory ||
        !cellVoltages || !cellTemperatures || !outputFeatures || !outputSize) {
        return false;
    }
    
    uint16_t idx = 0;
    
    // Basic features (normalized)
    outputFeatures[idx++] = cellVoltages[0] / 4.2;  // Reference cell voltage
    outputFeatures[idx++] = currentHistory[59] / 200.0;  // Current (normalized)
    outputFeatures[idx++] = temperatureHistory[59] / 60.0;  // Temperature (normalized)
    outputFeatures[idx++] = soc / 100.0;
    outputFeatures[idx++] = soh / 100.0;
    outputFeatures[idx++] = (float)cycleCount / 10000.0;
    
    // Cell voltages (40 values, normalized)
    for (int i = 0; i < 40; i++) {
        outputFeatures[idx++] = cellVoltages[i] / 4.2;
    }
    
    // Cell temperatures (8 values, normalized)
    for (int i = 0; i < 8; i++) {
        outputFeatures[idx++] = cellTemperatures[i] / 60.0;
    }
    
    // Historical statistics (6 values)
    outputFeatures[idx++] = calculateMean(voltageHistory, 60) / 403.2;
    outputFeatures[idx++] = calculateStdDev(voltageHistory, 60) / 10.0;
    outputFeatures[idx++] = calculateMean(currentHistory, 60) / 200.0;
    outputFeatures[idx++] = calculateStdDev(currentHistory, 60) / 50.0;
    outputFeatures[idx++] = calculateMean(temperatureHistory, 60) / 60.0;
    outputFeatures[idx++] = calculateSlope(temperatureHistory, 60);
    
    *outputSize = idx;
    
    // Normalize all features
    normalizeFeatures(outputFeatures, *outputSize);
    
    return true;
}

bool FeatureExtractor::normalizeFeatures(float* features, uint16_t size) {
    if (!features || size == 0) {
        return false;
    }
    
    // Simple min-max normalization to [0, 1]
    // In production, use pre-computed statistics from training
    for (int i = 0; i < size; i++) {
        features[i] = max(0.0f, min(1.0f, features[i]));
    }
    
    return true;
}

float FeatureExtractor::calculateMean(const float* data, uint16_t size) {
    if (!data || size == 0) return 0;
    
    float sum = 0;
    for (int i = 0; i < size; i++) {
        sum += data[i];
    }
    return sum / size;
}

float FeatureExtractor::calculateStdDev(const float* data, uint16_t size) {
    if (!data || size == 0) return 0;
    
    float mean = calculateMean(data, size);
    float variance = 0;
    for (int i = 0; i < size; i++) {
        variance += pow(data[i] - mean, 2);
    }
    return sqrt(variance / size);
}

float FeatureExtractor::calculateMin(const float* data, uint16_t size) {
    if (!data || size == 0) return 0;
    
    float minVal = data[0];
    for (int i = 1; i < size; i++) {
        if (data[i] < minVal) minVal = data[i];
    }
    return minVal;
}

float FeatureExtractor::calculateMax(const float* data, uint16_t size) {
    if (!data || size == 0) return 0;
    
    float maxVal = data[0];
    for (int i = 1; i < size; i++) {
        if (data[i] > maxVal) maxVal = data[i];
    }
    return maxVal;
}

float FeatureExtractor::calculateSlope(const float* data, uint16_t size) {
    if (!data || size < 2) return 0;
    
    // Simple linear regression slope
    float sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    for (int i = 0; i < size; i++) {
        sumX += i;
        sumY += data[i];
        sumXY += i * data[i];
        sumX2 += i * i;
    }
    
    float denominator = size * sumX2 - sumX * sumX;
    if (denominator == 0) return 0;
    
    return (size * sumXY - sumX * sumY) / denominator;
}

float FeatureExtractor::calculateInternalResistance(float voltage, float current) {
    if (abs(current) < 0.1) return 0;
    return voltage / current;
}

float FeatureExtractor::calculatePowerEfficiency(float voltageIn, float currentIn, float voltageOut, float currentOut) {
    float powerIn = voltageIn * currentIn;
    float powerOut = voltageOut * currentOut;
    if (powerIn == 0) return 0;
    return (powerOut / powerIn) * 100;
}

float FeatureExtractor::calculateThermalResistance(float tempDelta, float powerDissipation) {
    if (powerDissipation == 0) return 0;
    return tempDelta / powerDissipation;
}

// ==================== EXPLAINABILITY ENGINE ====================
const char* ExplainabilityEngine::featureNames[] = {
    "Voltage", "Current", "Temperature", "SOC", "SOH", "Cycle Count",
    "Cell Voltage 1", "Cell Voltage 2", "Cell Voltage 3", "Cell Voltage 4",
    "Cell Voltage 5", "Cell Voltage 6", "Cell Voltage 7", "Cell Voltage 8",
    "Cell Voltage 9", "Cell Voltage 10", "Cell Voltage 11", "Cell Voltage 12",
    "Cell Voltage 13", "Cell Voltage 14", "Cell Voltage 15", "Cell Voltage 16",
    "Cell Voltage 17", "Cell Voltage 18", "Cell Voltage 19", "Cell Voltage 20",
    "Cell Voltage 21", "Cell Voltage 22", "Cell Voltage 23", "Cell Voltage 24",
    "Cell Voltage 25", "Cell Voltage 26", "Cell Voltage 27", "Cell Voltage 28",
    "Cell Voltage 29", "Cell Voltage 30", "Cell Voltage 31", "Cell Voltage 32",
    "Cell Voltage 33", "Cell Voltage 34", "Cell Voltage 35", "Cell Voltage 36",
    "Cell Voltage 37", "Cell Voltage 38", "Cell Voltage 39", "Cell Voltage 40",
    "Cell Temp 1", "Cell Temp 2", "Cell Temp 3", "Cell Temp 4",
    "Cell Temp 5", "Cell Temp 6", "Cell Temp 7", "Cell Temp 8",
    "Avg Voltage", "Voltage StdDev", "Avg Current", "Current StdDev",
    "Avg Temperature", "Temperature Slope"
};

const uint16_t ExplainabilityEngine::numFeatureNames = sizeof(featureNames) / sizeof(featureNames[0]);

const float ExplainabilityEngine::thermalRiskThresholds[] = {0.0f, 0.3f, 0.6f, 0.8f, 1.0f};
const float ExplainabilityEngine::anomalyScoreThresholds[] = {0.0f, 0.3f, 0.6f, 0.8f, 1.0f};
const float ExplainabilityEngine::sohThresholds[] = {90.0f, 80.0f, 70.0f, 60.0f, 0.0f};

bool ExplainabilityEngine::explain(
    ModelType modelType,
    const float* inputFeatures,
    uint16_t featureSize,
    float prediction,
    float confidence,
    char* explanation,
    uint16_t maxExplanationSize
) {
    if (!inputFeatures || !explanation || maxExplanationSize == 0) {
        return false;
    }
    
    char tempBuffer[256];
    
    switch (modelType) {
        case MODEL_SOH:
            if (prediction < 70) {
                snprintf(tempBuffer, sizeof(tempBuffer),
                    "Battery health critical (%.1f%%). Significant degradation detected. "
                    "Primary factors: high cycle count (%.0f), elevated temperature history. "
                    "Recommend immediate replacement planning.",
                    prediction, inputFeatures[5] * 10000);
            } else if (prediction < 80) {
                snprintf(tempBuffer, sizeof(tempBuffer),
                    "Battery health moderate (%.1f%%). Normal degradation for age. "
                    "Monitor temperature variance and reduce fast charging.",
                    prediction);
            } else {
                snprintf(tempBuffer, sizeof(tempBuffer),
                    "Battery health good (%.1f%%). Minor degradation observed. "
                    "Continue normal operation with periodic monitoring.",
                    prediction);
            }
            break;
            
        case MODEL_SOC:
            snprintf(tempBuffer, sizeof(tempBuffer),
                "State of Charge: %.1f%%. Estimated range: %.0f km. "
                "Charging status: %s. Optimal charging window: 20-80%%.",
                prediction, prediction * 3.5, inputFeatures[1] > 0 ? "Yes" : "No");
            break;
            
        case MODEL_THERMAL:
            if (prediction > 70) {
                snprintf(tempBuffer, sizeof(tempBuffer),
                    "CRITICAL thermal risk (%.1f%%). Immediate action required. "
                    "Recommend power reduction and active cooling.",
                    prediction);
            } else if (prediction > 30) {
                snprintf(tempBuffer, sizeof(tempBuffer),
                    "Moderate thermal risk (%.1f%%). Monitor cell temperatures. "
                    "Consider reducing charge/discharge rate.",
                    prediction);
            } else {
                snprintf(tempBuffer, sizeof(tempBuffer),
                    "Low thermal risk (%.1f%%). Temperature within safe limits.",
                    prediction);
            }
            break;
            
        case MODEL_ANOMALY:
            if (prediction > 0.5) {
                snprintf(tempBuffer, sizeof(tempBuffer),
                    "ANOMALY DETECTED (score: %.3f). Unusual battery behavior observed. "
                    "Possible causes: cell imbalance, sensor fault, or external interference. "
                    "Recommend diagnostic check.",
                    prediction);
            } else {
                snprintf(tempBuffer, sizeof(tempBuffer),
                    "Normal operation (anomaly score: %.3f). No unusual patterns detected.",
                    prediction);
            }
            break;
            
        case MODEL_RUL:
            snprintf(tempBuffer, sizeof(tempBuffer),
                "Estimated remaining life: %.0f cycles (%.1f years at current usage). "
                "Confidence: %.0f%%. Plan maintenance accordingly.",
                prediction, prediction / 300, confidence * 100);
            break;
            
        default:
            snprintf(tempBuffer, sizeof(tempBuffer),
                "Prediction: %.2f (confidence: %.0f%%)",
                prediction, confidence * 100);
    }
    
    strncpy(explanation, tempBuffer, maxExplanationSize - 1);
    explanation[maxExplanationSize - 1] = '\0';
    
    return true;
}

bool ExplainabilityEngine::calculateFeatureImportance(
    const float* inputFeatures,
    uint16_t featureSize,
    float* importanceScores,
    uint16_t* topFeatures,
    uint16_t numTopFeatures
) {
    if (!inputFeatures || !importanceScores || !topFeatures || numTopFeatures == 0) {
        return false;
    }
    
    // Simplified feature importance based on deviation from nominal
    for (int i = 0; i < featureSize && i < numFeatureNames; i++) {
        // Calculate how much this feature deviates from "normal" (0.5 for normalized features)
        float deviation = abs(inputFeatures[i] - 0.5);
        importanceScores[i] = deviation * 2;  // Scale to [0, 1]
    }
    
    // Find top N features
    bool* used = new bool[featureSize];
    memset(used, 0, featureSize);
    
    for (int n = 0; n < numTopFeatures && n < featureSize; n++) {
        float maxScore = -1;
        int maxIdx = -1;
        
        for (int i = 0; i < featureSize; i++) {
            if (!used[i] && importanceScores[i] > maxScore) {
                maxScore = importanceScores[i];
                maxIdx = i;
            }
        }
        
        if (maxIdx >= 0) {
            topFeatures[n] = maxIdx;
            used[maxIdx] = true;
        }
    }
    
    delete[] used;
    return true;
}

bool ExplainabilityEngine::generateRecommendations(
    ModelType modelType,
    float prediction,
    float confidence,
    const float* inputFeatures,
    uint16_t featureSize,
    char* recommendations,
    uint16_t maxRecommendationsSize
) {
    if (!recommendations || maxRecommendationsSize == 0) {
        return false;
    }
    
    char tempBuffer[512] = {0};
    int offset = 0;
    
    switch (modelType) {
        case MODEL_SOH:
            if (prediction < 70) {
                offset += snprintf(tempBuffer + offset, sizeof(tempBuffer) - offset,
                    "1. Schedule battery replacement within 3 months\n");
            }
            if (prediction < 80) {
                offset += snprintf(tempBuffer + offset, sizeof(tempBuffer) - offset,
                    "2. Reduce fast charging to <20%% of sessions\n");
            }
            offset += snprintf(tempBuffer + offset, sizeof(tempBuffer) - offset,
                "3. Continue regular health monitoring\n");
            break;
            
        case MODEL_THERMAL:
            if (prediction > 70) {
                offset += snprintf(tempBuffer + offset, sizeof(tempBuffer) - offset,
                    "1. IMMEDIATE: Reduce power output by 50%%\n"
                    "2. Activate active cooling system\n"
                    "3. Schedule thermal system inspection\n");
            } else if (prediction > 30) {
                offset += snprintf(tempBuffer + offset, sizeof(tempBuffer) - offset,
                    "1. Monitor cell temperatures closely\n"
                    "2. Consider reducing charge rate\n");
            }
            break;
            
        case MODEL_ANOMALY:
            if (prediction > 0.5) {
                offset += snprintf(tempBuffer + offset, sizeof(tempBuffer) - offset,
                    "1. Run diagnostic scan on battery cells\n"
                    "2. Check sensor calibration\n"
                    "3. Verify BMS communication\n");
            }
            break;
            
        default:
            offset += snprintf(tempBuffer + offset, sizeof(tempBuffer) - offset,
                "Continue normal operation with periodic monitoring.\n");
    }
    
    strncpy(recommendations, tempBuffer, maxRecommendationsSize - 1);
    recommendations[maxRecommendationsSize - 1] = '\0';
    
    return true;
}
