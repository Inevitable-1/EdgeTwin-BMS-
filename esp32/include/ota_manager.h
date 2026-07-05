#ifndef OTA_MANAGER_H
#define OTA_MANAGER_H

#include <Arduino.h>
#include <WiFi.h>
#include <Update.h>
#include <WebServer.h>
#include <ArduinoOTA.h>

// ==================== OTA CONFIGURATION ====================
#define OTA_ENABLE true
#define OTA_PASSWORD "EdgeTwin-OTA-2024!"
#define OTA_PORT 8266
#define OTA_CHECK_INTERVAL_MS 3600000  // Check every hour
#define OTA_TIMEOUT_MS 300000          // 5 minute timeout

// ==================== FIRMWARE VERSION ====================
#define CURRENT_VERSION "1.0.0"
#define VERSION_CHECK_URL "http://firmware.edgetwin.com/version.json"

// ==================== OTA STATES ====================
enum OTAState {
    OTA_IDLE,
    OTA_CHECKING,
    OTA_DOWNLOADING,
    OTA_INSTALLING,
    OTA_SUCCESS,
    OTA_FAILED,
    OTA_ROLLBACK
};

// ==================== OTA MANAGER CLASS ====================
class OTAManager {
public:
    OTAManager();
    ~OTAManager();
    
    // Initialization
    bool initialize(const char* currentVersion);
    void enable();
    void disable();
    bool isEnabled();
    
    // Manual update check
    bool checkForUpdate();
    bool startUpdate(const char* firmwareUrl);
    bool startUpdateFromBuffer(const uint8_t* firmwareData, size_t dataSize);
    
    // OTA server
    void startOTAServer();
    void stopOTAServer();
    bool isServerRunning();
    
    // Progress tracking
    OTAState getState();
    float getProgress();
    const char* getStatusMessage();
    const char* getCurrentVersion();
    const char* getAvailableVersion();
    
    // Error handling
    const char* getLastError();
    void clearError();
    bool rollback();
    
    // Version management
    bool setCurrentVersion(const char* version);
    bool compareVersions(const char* v1, const char* v2);
    bool isNewerVersion(const char* newVersion);
    
    // Callbacks
    typedef void (*OTAProgressCallback)(float progress, OTAState state);
    typedef void (*OTACallback)(bool success, const char* message);
    
    void onProgress(OTAProgressCallback callback);
    void onComplete(OTACallback callback);
    
    // Main loop (call in loop())
    void update();

private:
    // State
    bool enabled;
    bool serverRunning;
    OTAState currentState;
    float progress;
    char statusMessage[128];
    char currentVersion[32];
    char availableVersion[32];
    char lastError[256];
    
    // Timing
    unsigned long lastCheckTime;
    unsigned long updateStartTime;
    
    // OTA server
    WebServer* otaServer;
    
    // Callbacks
    OTAProgressCallback progressCallback;
    OTACallback completeCallback;
    
    // Internal methods
    void setupWebServer();
    void handleUpdateStart();
    void handleUpdateProcess();
    void handleUpdateEnd();
    void handleUpdateError();
    void handleRoot();
    void handleVersionCheck();
    void handleProgress();
    
    // Firmware verification
    bool verifyFirmwareHeader(const uint8_t* data, size_t size);
    bool verifyFirmwareChecksum(const uint8_t* data, size_t size, const char* expectedChecksum);
    
    // Version checking
    bool downloadVersionInfo();
    bool parseVersionInfo(const char* json);
    
    // Utility
    void setState(OTAState newState, const char* message);
    void setError(const char* error);
    void notifyProgress();
    void notifyComplete(bool success, const char* message);
};

// ==================== FIRMWARE HEADER STRUCTURE ====================
struct FirmwareHeader {
    uint32_t magic;           // Magic number for validation
    uint32_t version;         // Version number
    uint32_t size;            // Firmware size
    uint32_t checksum;        // CRC32 checksum
    uint32_t timestamp;       // Build timestamp
    char versionString[16];   // Human-readable version
    char buildInfo[64];       // Build information
};

// ==================== CONSTANTS ====================
static const uint32_t FIRMWARE_MAGIC = 0xED54494E;  // "EDTIN"
static const char* OTA_HTML = R"rawliteral(
<!DOCTYPE html>
<html>
<head>
    <title>EdgeTwin-BMS+ OTA Update</title>
    <style>
        body { font-family: Arial; background: #12121e; color: white; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; }
        h1 { color: #3b82f6; }
        .status { padding: 15px; background: #1a1a2e; border-radius: 8px; margin: 10px 0; }
        .progress { width: 100%; height: 20px; background: #2a2a3a; border-radius: 10px; overflow: hidden; }
        .progress-bar { height: 100%; background: #3b82f6; transition: width 0.3s; }
        input[type="file"] { margin: 20px 0; }
        button { background: #3b82f6; color: white; border: none; padding: 10px 20px; 
                 border-radius: 5px; cursor: pointer; }
        button:hover { background: #2563eb; }
    </style>
</head>
<body>
    <div class="container">
        <h1>EdgeTwin-BMS+ OTA Update</h1>
        <div class="status">
            <p>Current Version: %s</p>
            <p>Status: %s</p>
        </div>
        <div class="progress">
            <div class="progress-bar" id="progress" style="width: 0%%"></div>
        </div>
        <form id="uploadForm">
            <input type="file" name="firmware" accept=".bin">
            <button type="submit">Upload Firmware</button>
        </form>
    </div>
    <script>
        const form = document.getElementById('uploadForm');
        const progressBar = document.getElementById('progress');
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            
            const xhr = new XMLHttpRequest();
            xhr.open('POST', '/update');
            
            xhr.upload.onprogress = (e) => {
                if (e.lengthComputable) {
                    const percent = (e.loaded / e.total) * 100;
                    progressBar.style.width = percent + '%%';
                }
            };
            
            xhr.onload = () => {
                if (xhr.status === 200) {
                    alert('Update successful! Rebooting...');
                } else {
                    alert('Update failed: ' + xhr.responseText);
                }
            };
            
            xhr.send(formData);
        });
    </script>
</body>
</html>
)rawliteral";

// ==================== GLOBAL INSTANCE ====================
extern OTAManager otaManager;

#endif // OTA_MANAGER_H
