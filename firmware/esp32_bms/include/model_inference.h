#ifndef MODEL_INFERENCE_H
#define MODEL_INFERENCE_H

#include <Arduino.h>

// ==================== MODEL CONFIGURATION ====================
#define MAX_MODELS 5
#define MODEL_INPUT_FEATURES 64
#define MODEL_OUTPUT_CLASSES 5

// ==================== MODEL TYPES ====================
enum ModelType {
    MODEL_SOH = 0,      // State of Health
    MODEL_SOC = 1,      // State of Charge
    MODEL_THERMAL = 2,  // Thermal Risk
    MODEL_ANOMALY = 3,  // Anomaly Detection
    MODEL_RUL = 4       // Remaining Useful Life
};

// ==================== MODEL STRUCTURES ====================
struct ModelConfig {
    ModelType type;
    const char* name;
    const char* description;
    uint16_t inputSize;
    uint16_t outputSize;
    const unsigned char* modelData;
    size_t modelSize;
    bool quantized;
};

struct InferenceResult {
    float value;
    float confidence;
    bool valid;
    unsigned long inferenceTimeUs;
};

// ==================== MODEL DEFINITIONS ====================
// SOH Prediction Model (CNN-LSTM)
// Input: [voltage, current, temperature, soc, cycle_count, cell_voltages(40), history(16)]
// Output: [soh_prediction, confidence]
static const unsigned char SOH_MODEL_DATA[] = {
    // Placeholder for actual TFLite model data
    // In production, this would be generated from training
    0x20, 0x00, 0x00, 0x00, 0x54, 0x46, 0x4C, 0x33,  // TFL3 header
    // ... model weights and architecture would follow
};
static const size_t SOH_MODEL_SIZE = sizeof(SOH_MODEL_DATA);

// SOC Prediction Model (LSTM)
// Input: [voltage, current, temperature, cell_voltages(40), history(18)]
// Output: [soc_prediction, confidence]
static const unsigned char SOC_MODEL_DATA[] = {
    0x20, 0x00, 0x00, 0x00, 0x54, 0x46, 0x4C, 0x33,
};
static const size_t SOC_MODEL_SIZE = sizeof(SOC_MODEL_DATA);

// Thermal Risk Model (Physics-Informed Neural Network)
// Input: [current, cell_temperatures(8), ambient_temp, cooling_status]
// Output: [thermal_risk_score, max_temp_prediction, confidence]
static const unsigned char THERMAL_MODEL_DATA[] = {
    0x20, 0x00, 0x00, 0x00, 0x54, 0x46, 0x4C, 0x33,
};
static const size_t THERMAL_MODEL_SIZE = sizeof(THERMAL_MODEL_DATA);

// Anomaly Detection Model (Isolation Forest / Autoencoder)
// Input: [voltage, current, temperature, cell_voltages(40), cell_temperatures(8), history(12)]
// Output: [anomaly_score, reconstruction_error, confidence]
static const unsigned char ANOMALY_MODEL_DATA[] = {
    0x20, 0x00, 0x00, 0x00, 0x54, 0x46, 0x4C, 0x33,
};
static const size_t ANOMALY_MODEL_SIZE = sizeof(ANOMALY_MODEL_DATA);

// RUL Prediction Model (Gradient Boosting via TFLite)
// Input: [soh, cycle_count, temperature_history(10), voltage_history(10), current_history(10)]
// Output: [rul_cycles, rul_years, confidence]
static const unsigned char RUL_MODEL_DATA[] = {
    0x20, 0x00, 0x00, 0x00, 0x54, 0x46, 0x4C, 0x33,
};
static const size_t RUL_MODEL_SIZE = sizeof(RUL_MODEL_DATA);

// ==================== MODEL INFERENCE ENGINE ====================
class ModelInferenceEngine {
public:
    ModelInferenceEngine();
    ~ModelInferenceEngine();
    
    // Initialization
    bool initialize();
    bool loadModel(ModelType type);
    void unloadModel(ModelType type);
    bool isModelLoaded(ModelType type);
    
    // Inference
    InferenceResult predict(ModelType type, const float* input, uint16_t inputSize);
    bool predictAll(const float* input, uint16_t inputSize, float* outputs);
    
    // Batch inference
    bool predictBatch(const float* inputs, uint16_t batchSize, float* outputs);
    
    // Model management
    uint8_t getLoadedModelCount();
    const char* getModelName(ModelType type);
    size_t getModelSize(ModelType type);
    
    // Performance monitoring
    unsigned long getAverageInferenceTime(ModelType type);
    uint32_t getInferenceCount(ModelType type);
    void resetPerformanceCounters();
    
    // Quantization support
    bool quantizeModel(ModelType type);
    bool dequantizeModel(ModelType type);
    
    // Model update
    bool updateModel(ModelType type, const unsigned char* newData, size_t newSize);
    bool verifyModel(ModelType type);

private:
    // Model storage
    struct ModelState {
        bool loaded;
        bool quantized;
        const unsigned char* data;
        size_t size;
        unsigned long totalInferenceTime;
        uint32_t inferenceCount;
    };
    
    ModelState models[MAX_MODELS];
    
    // Internal methods
    void initializeModelStates();
    bool validateModelData(const unsigned char* data, size_t size);
    float quantizeFloat(float value, float scale, int32_t zeroPoint);
    float dequantizeFloat(int8_t value, float scale, int32_t zeroPoint);
};

// ==================== FEATURE EXTRACTION ====================
class FeatureExtractor {
public:
    // Extract features from raw sensor data
    static bool extractFeatures(
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
    );
    
    // Normalize features
    static bool normalizeFeatures(float* features, uint16_t size);
    
    // Apply windowing for temporal models
    static bool applyWindowing(
        const float* history,
        uint16_t historySize,
        uint16_t windowSize,
        float* output,
        uint16_t* outputSize
    );
    
    // Calculate statistical features
    static float calculateMean(const float* data, uint16_t size);
    static float calculateStdDev(const float* data, uint16_t size);
    static float calculateMin(const float* data, uint16_t size);
    static float calculateMax(const float* data, uint16_t size);
    static float calculateSlope(const float* data, uint16_t size);
    
    // Physics-informed features
    static float calculateInternalResistance(float voltage, float current);
    static float calculatePowerEfficiency(float voltageIn, float currentIn, float voltageOut, float currentOut);
    static float calculateThermalResistance(float tempDelta, float powerDissipation);
};

// ==================== EXPLAINABILITY ENGINE ====================
class ExplainabilityEngine {
public:
    // Generate explanation for prediction
    static bool explain(
        ModelType modelType,
        const float* inputFeatures,
        uint16_t featureSize,
        float prediction,
        float confidence,
        char* explanation,
        uint16_t maxExplanationSize
    );
    
    // Feature importance
    static bool calculateFeatureImportance(
        const float* inputFeatures,
        uint16_t featureSize,
        float* importanceScores,
        uint16_t* topFeatures,
        uint16_t numTopFeatures
    );
    
    // SHAP-like explanations
    static bool calculateSHAP(
        const float* inputFeatures,
        uint16_t featureSize,
        float* shapValues,
        uint16_t* topContributingFeatures,
        uint16_t numTopFeatures
    );
    
    // Root cause analysis
    static bool analyzeRootCause(
        ModelType modelType,
        const float* inputFeatures,
        uint16_t featureSize,
        char* rootCause,
        uint16_t maxRootCauseSize
    );
    
    // Recommendation generation
    static bool generateRecommendations(
        ModelType modelType,
        float prediction,
        float confidence,
        const float* inputFeatures,
        uint16_t featureSize,
        char* recommendations,
        uint16_t maxRecommendationsSize
    );

private:
    // Feature names for explanation
    static const char* featureNames[];
    static const uint16_t numFeatureNames;
    
    // Thresholds for explanations
    static const float thermalRiskThresholds[];
    static const float anomalyScoreThresholds[];
    static const float sohThresholds[];
};

// ==================== GLOBAL INSTANCES ====================
extern ModelInferenceEngine inferenceEngine;
extern FeatureExtractor featureExtractor;
extern ExplainabilityEngine explainabilityEngine;

#endif // MODEL_INFERENCE_H
