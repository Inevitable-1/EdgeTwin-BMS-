/**
 * OTA Manager Implementation
 * EdgeTwin-BMS+ ESP32 Firmware
 */

#include "ota_manager.h"
#include <HTTPClient.h>
#include <ArduinoJson.h>

// ==================== GLOBAL INSTANCE ====================
OTAManager otaManager;

// ==================== CONSTRUCTOR/DESTRUCTOR ====================
OTAManager::OTAManager() {
    enabled = false;
    serverRunning = false;
    currentState = OTA_IDLE;
    progress = 0;
    lastCheckTime = 0;
    updateStartTime = 0;
    otaServer = nullptr;
    progressCallback = nullptr;
    completeCallback = nullptr;
    
    memset(statusMessage, 0, sizeof(statusMessage));
    memset(currentVersion, 0, sizeof(currentVersion));
    memset(availableVersion, 0, sizeof(availableVersion));
    memset(lastError, 0, sizeof(lastError));
}

OTAManager::~OTAManager() {
    stopOTAServer();
}

// ==================== INITIALIZATION ====================
bool OTAManager::initialize(const char* version) {
    Serial.println("[OTA] Initializing OTA Manager...");
    
    if (version) {
        strncpy(currentVersion, version, sizeof(currentVersion) - 1);
    } else {
        strncpy(currentVersion, CURRENT_VERSION, sizeof(currentVersion) - 1);
    }
    
    // Configure ArduinoOTA
    #if OTA_ENABLE
    ArduinoOTA.setHostname("edgetwin-bms");
    ArduinoOTA.setPassword(OTA_PASSWORD);
    
    ArduinoOTA.onStart([this]() {
        String type;
        if (ArduinoOTA.getCommand() == U_FLASH) {
            type = "sketch";
        } else {
            type = "filesystem";
        }
        Serial.println("[OTA] Start updating " + type);
        setState(OTA_INSTALLING, "Installing firmware...");
    });
    
    ArduinoOTA.onEnd([this]() {
        Serial.println("\n[OTA] Update complete");
        setState(OTA_SUCCESS, "Update successful");
        notifyComplete(true, "Firmware updated successfully");
    });
    
    ArduinoOTA.onProgress([this](unsigned int progress, unsigned int total) {
        this->progress = (float)progress / total * 100;
        notifyProgress();
    });
    
    ArduinoOTA.onError([this](ota_error_t error) {
        Serial.printf("[OTA] Error[%u]: ", error);
        const char* errorMsg;
        switch (error) {
            case OTA_AUTH_ERROR:
                errorMsg = "Authentication failed";
                break;
            case OTA_BEGIN_ERROR:
                errorMsg = "Begin failed";
                break;
            case OTA_CONNECT_ERROR:
                errorMsg = "Connect failed";
                break;
            case OTA_RECEIVE_ERROR:
                errorMsg = "Receive failed";
                break;
            case OTA_END_ERROR:
                errorMsg = "End failed";
                break;
            default:
                errorMsg = "Unknown error";
        }
        setError(errorMsg);
        setState(OTA_FAILED, errorMsg);
        notifyComplete(false, errorMsg);
    });
    
    ArduinoOTA.begin();
    #endif
    
    enabled = true;
    Serial.printf("[OTA] Initialized (version: %s)\n", currentVersion);
    return true;
}

void OTAManager::enable() {
    enabled = true;
    Serial.println("[OTA] Enabled");
}

void OTAManager::disable() {
    enabled = false;
    stopOTAServer();
    Serial.println("[OTA] Disabled");
}

bool OTAManager::isEnabled() {
    return enabled;
}

// ==================== UPDATE CHECK ====================
bool OTAManager::checkForUpdate() {
    if (!enabled) {
        return false;
    }
    
    Serial.println("[OTA] Checking for updates...");
    setState(OTA_CHECKING, "Checking for updates...");
    
    if (!downloadVersionInfo()) {
        setState(OTA_FAILED, "Failed to check for updates");
        return false;
    }
    
    if (isNewerVersion(availableVersion)) {
        Serial.printf("[OTA] New version available: %s\n", availableVersion);
        setState(OTA_IDLE, "Update available");
        return true;
    }
    
    Serial.println("[OTA] Already up to date");
    setState(OTA_IDLE, "Up to date");
    return false;
}

bool OTAManager::downloadVersionInfo() {
    HTTPClient http;
    http.begin(VERSION_CHECK_URL);
    http.setTimeout(10000);
    
    int httpCode = http.GET();
    
    if (httpCode != 200) {
        Serial.printf("[OTA] Version check failed, HTTP %d\n", httpCode);
        http.end();
        return false;
    }
    
    String payload = http.getString();
    http.end();
    
    return parseVersionInfo(payload.c_str());
}

bool OTAManager::parseVersionInfo(const char* json) {
    StaticJsonDocument<256> doc;
    DeserializationError error = deserializeJson(doc, json);
    
    if (error) {
        Serial.printf("[OTA] JSON parse error: %s\n", error.c_str());
        return false;
    }
    
    const char* version = doc["version"];
    const char* url = doc["url"];
    const char* checksum = doc["checksum"];
    
    if (version) {
        strncpy(availableVersion, version, sizeof(availableVersion) - 1);
    }
    
    // Store URL and checksum for later use
    // In a real implementation, these would be class members
    
    return true;
}

// ==================== FIRMWARE UPDATE ====================
bool OTAManager::startUpdate(const char* firmwareUrl) {
    if (!enabled || !firmwareUrl) {
        return false;
    }
    
    Serial.printf("[OTA] Starting update from: %s\n", firmwareUrl);
    setState(OTA_DOWNLOADING, "Downloading firmware...");
    
    HTTPClient http;
    http.begin(firmwareUrl);
    http.setTimeout(OTA_TIMEOUT_MS);
    
    int httpCode = http.GET();
    
    if (httpCode != 200) {
        Serial.printf("[OTA] Download failed, HTTP %d\n", httpCode);
        setError("Download failed");
        setState(OTA_FAILED, "Download failed");
        http.end();
        return false;
    }
    
    int contentLength = http.getSize();
    if (contentLength <= 0) {
        setError("Invalid content length");
        setState(OTA_FAILED, "Invalid firmware");
        http.end();
        return false;
    }
    
    Serial.printf("[OTA] Firmware size: %d bytes\n", contentLength);
    
    // Start update
    if (!Update.begin(contentLength)) {
        setError("Not enough space");
        setState(OTA_FAILED, "Insufficient space");
        http.end();
        return false;
    }
    
    // Download and write firmware
    WiFiClient* stream = http.getStreamPtr();
    uint8_t buffer[1024];
    int written = 0;
    
    while (http.connected() && written < contentLength) {
        size_t size = stream->available();
        
        if (size) {
            int bytesRead = stream->readBytes(buffer, min(size, sizeof(buffer)));
            size_t bytesWritten = Update.write(buffer, bytesRead);
            
            if (bytesWritten != bytesRead) {
                Serial.printf("[OTA] Write error: %d != %d\n", bytesWritten, bytesRead);
                setError("Write error");
                setState(OTA_FAILED, "Write failed");
                Update.abort();
                http.end();
                return false;
            }
            
            written += bytesWritten;
            progress = (float)written / contentLength * 100;
            notifyProgress();
        }
        
        yield();
    }
    
    http.end();
    
    if (written != contentLength) {
        setError("Incomplete download");
        setState(OTA_FAILED, "Download incomplete");
        Update.abort();
        return false;
    }
    
    // Finalize update
    if (!Update.end(true)) {
        setError("Finalization failed");
        setState(OTA_FAILED, "Finalize failed");
        return false;
    }
    
    Serial.println("[OTA] Update successful");
    setState(OTA_SUCCESS, "Update complete");
    notifyComplete(true, "Firmware updated successfully");
    
    // Reboot after successful update
    delay(2000);
    ESP.restart();
    
    return true;
}

bool OTAManager::startUpdateFromBuffer(const uint8_t* firmwareData, size_t dataSize) {
    if (!enabled || !firmwareData || dataSize == 0) {
        return false;
    }
    
    Serial.printf("[OTA] Starting update from buffer (%d bytes)\n", dataSize);
    setState(OTA_INSTALLING, "Installing firmware...");
    
    // Verify firmware header
    if (!verifyFirmwareHeader(firmwareData, dataSize)) {
        setError("Invalid firmware header");
        setState(OTA_FAILED, "Invalid firmware");
        return false;
    }
    
    // Start update
    if (!Update.begin(dataSize)) {
        setError("Not enough space");
        setState(OTA_FAILED, "Insufficient space");
        return false;
    }
    
    // Write firmware
    size_t bytesWritten = Update.write(firmwareData, dataSize);
    
    if (bytesWritten != dataSize) {
        Serial.printf("[OTA] Write error: %d != %d\n", bytesWritten, dataSize);
        setError("Write error");
        setState(OTA_FAILED, "Write failed");
        Update.abort();
        return false;
    }
    
    progress = 100;
    notifyProgress();
    
    // Finalize update
    if (!Update.end(true)) {
        setError("Finalization failed");
        setState(OTA_FAILED, "Finalize failed");
        return false;
    }
    
    Serial.println("[OTA] Update successful");
    setState(OTA_SUCCESS, "Update complete");
    notifyComplete(true, "Firmware updated successfully");
    
    // Reboot after successful update
    delay(2000);
    ESP.restart();
    
    return true;
}

// ==================== OTA SERVER ====================
void OTAManager::startOTAServer() {
    if (serverRunning) {
        return;
    }
    
    otaServer = new WebServer(OTA_PORT);
    setupWebServer();
    otaServer->begin();
    serverRunning = true;
    
    Serial.printf("[OTA] Web server started on port %d\n", OTA_PORT);
}

void OTAManager::stopOTAServer() {
    if (otaServer) {
        otaServer->stop();
        delete otaServer;
        otaServer = nullptr;
    }
    serverRunning = false;
}

bool OTAManager::isServerRunning() {
    return serverRunning;
}

void OTAManager::setupWebServer() {
    if (!otaServer) return;
    
    // Root page
    otaServer->on("/", HTTP_GET, [this]() {
        handleRoot();
    });
    
    // Version check endpoint
    otaServer->on("/version", HTTP_GET, [this]() {
        handleVersionCheck();
    });
    
    // Update endpoint
    otaServer->on("/update", HTTP_POST, [this]() {
        handleUpdateEnd();
    }, [this]() {
        handleUpdateProcess();
    });
    
    // Progress endpoint
    otaServer->on("/progress", HTTP_GET, [this]() {
        handleProgress();
    });
    
    // Handle 404
    otaServer->onNotFound([]() {
        String message = "File Not Found\n\n";
        message += "URI: ";
        message += otaServer->uri();
        message += "\nMethod: ";
        message += (otaServer->method() == HTTP_GET) ? "GET" : "POST";
        message += "\nArguments: ";
        message += otaServer->args();
        message += "\n";
        otaServer->send(404, "text/plain", message);
    });
}

void OTAManager::handleRoot() {
    if (!otaServer) return;
    
    char html[2048];
    snprintf(html, sizeof(html), OTA_HTML, currentVersion, statusMessage);
    otaServer->send(200, "text/html", html);
}

void OTAManager::handleVersionCheck() {
    if (!otaServer) return;
    
    StaticJsonDocument<128> doc;
    doc["current_version"] = currentVersion;
    doc["available_version"] = availableVersion;
    doc["update_available"] = isNewerVersion(availableVersion);
    
    String response;
    serializeJson(doc, response);
    otaServer->send(200, "application/json", response);
}

void OTAManager::handleUpdateProcess() {
    HTTPUpload& upload = otaServer->upload();
    
    if (upload.status == UPLOAD_FILE_START) {
        Serial.printf("[OTA] Update Start: %s\n", upload.filename.c_str());
        setState(OTA_INSTALLING, "Installing firmware...");
        
        if (!Update.begin(UPDATE_SIZE_UNKNOWN)) {
            Update.printError(Serial);
            setState(OTA_FAILED, "Begin failed");
        }
    }
    else if (upload.status == UPLOAD_FILE_WRITE) {
        if (Update.write(upload.buf, upload.currentSize) != upload.currentSize) {
            Update.printError(Serial);
            setState(OTA_FAILED, "Write failed");
            return;
        }
        
        progress = (float)upload.currentSize / upload.totalSize * 100;
        notifyProgress();
    }
    else if (upload.status == UPLOAD_FILE_END) {
        if (Update.end(true)) {
            Serial.printf("[OTA] Update Success: %u bytes\n", upload.totalSize);
            setState(OTA_SUCCESS, "Update complete");
        } else {
            Update.printError(Serial);
            setState(OTA_FAILED, "End failed");
        }
    }
}

void OTAManager::handleUpdateEnd() {
    if (!otaServer) return;
    
    if (Update.hasError()) {
        otaServer->send(500, "text/plain", "UPDATE FAILED");
        notifyComplete(false, "Update failed");
    } else {
        otaServer->send(200, "text/plain", "OK");
        notifyComplete(true, "Update successful");
        
        delay(1000);
        ESP.restart();
    }
}

void OTAManager::handleProgress() {
    if (!otaServer) return;
    
    StaticJsonDocument<128> doc;
    doc["progress"] = progress;
    doc["state"] = currentState;
    doc["status"] = statusMessage;
    
    String response;
    serializeJson(doc, response);
    otaServer->send(200, "application/json", response);
}

// ==================== STATE MANAGEMENT ====================
OTAState OTAManager::getState() {
    return currentState;
}

float OTAManager::getProgress() {
    return progress;
}

const char* OTAManager::getStatusMessage() {
    return statusMessage;
}

const char* OTAManager::getCurrentVersion() {
    return currentVersion;
}

const char* OTAManager::getAvailableVersion() {
    return availableVersion;
}

const char* OTAManager::getLastError() {
    return lastError;
}

void OTAManager::clearError() {
    memset(lastError, 0, sizeof(lastError));
}

// ==================== VERSION MANAGEMENT ====================
bool OTAManager::setCurrentVersion(const char* version) {
    if (!version) return false;
    strncpy(currentVersion, version, sizeof(currentVersion) - 1);
    return true;
}

bool OTAManager::compareVersions(const char* v1, const char* v2) {
    if (!v1 || !v2) return false;
    
    int v1Major, v1Minor, v1Patch;
    int v2Major, v2Minor, v2Patch;
    
    sscanf(v1, "%d.%d.%d", &v1Major, &v1Minor, &v1Patch);
    sscanf(v2, "%d.%d.%d", &v2Major, &v2Minor, &v2Patch);
    
    if (v1Major != v2Major) return v1Major > v2Major;
    if (v1Minor != v2Minor) return v1Minor > v2Minor;
    return v1Patch > v2Patch;
}

bool OTAManager::isNewerVersion(const char* newVersion) {
    if (!newVersion || strlen(newVersion) == 0) {
        return false;
    }
    return compareVersions(newVersion, currentVersion);
}

// ==================== CALLBACKS ====================
void OTAManager::onProgress(OTAProgressCallback callback) {
    progressCallback = callback;
}

void OTAManager::onComplete(OTACallback callback) {
    completeCallback = callback;
}

// ==================== INTERNAL METHODS ====================
void OTAManager::setState(OTAState newState, const char* message) {
    currentState = newState;
    if (message) {
        strncpy(statusMessage, message, sizeof(statusMessage) - 1);
    }
    Serial.printf("[OTA] State: %d, Message: %s\n", newState, statusMessage);
}

void OTAManager::setError(const char* error) {
    if (error) {
        strncpy(lastError, error, sizeof(lastError) - 1);
        Serial.printf("[OTA] Error: %s\n", error);
    }
}

void OTAManager::notifyProgress() {
    if (progressCallback) {
        progressCallback(progress, currentState);
    }
}

void OTAManager::notifyComplete(bool success, const char* message) {
    if (completeCallback) {
        completeCallback(success, message);
    }
}

bool OTAManager::verifyFirmwareHeader(const uint8_t* data, size_t size) {
    if (size < sizeof(FirmwareHeader)) {
        return false;
    }
    
    const FirmwareHeader* header = (const FirmwareHeader*)data;
    
    // Check magic number
    if (header->magic != FIRMWARE_MAGIC) {
        Serial.println("[OTA] Invalid firmware magic");
        return false;
    }
    
    // Check if firmware size matches
    if (header->size != size - sizeof(FirmwareHeader)) {
        Serial.println("[OTA] Firmware size mismatch");
        return false;
    }
    
    return true;
}

bool OTAManager::verifyFirmwareChecksum(const uint8_t* data, size_t size, const char* expectedChecksum) {
    // Simple CRC32 verification
    // In production, use a proper cryptographic checksum
    
    uint32_t crc = 0xFFFFFFFF;
    for (size_t i = 0; i < size; i++) {
        crc ^= data[i];
        for (int j = 0; j < 8; j++) {
            crc = (crc >> 1) ^ (0xEDB88320 & -(crc & 1));
        }
    }
    crc ^= 0xFFFFFFFF;
    
    // Convert to hex string
    char calculatedChecksum[16];
    snprintf(calculatedChecksum, sizeof(calculatedChecksum), "%08X", crc);
    
    return strcmp(calculatedChecksum, expectedChecksum) == 0;
}

// ==================== MAIN UPDATE FUNCTION ====================
void OTAManager::update() {
    if (!enabled) {
        return;
    }
    
    // Handle ArduinoOTA
    #if OTA_ENABLE
    ArduinoOTA.handle();
    #endif
    
    // Handle web server
    if (serverRunning && otaServer) {
        otaServer->handleClient();
    }
    
    // Periodic update check
    if (millis() - lastCheckTime >= OTA_CHECK_INTERVAL_MS) {
        checkForUpdate();
        lastCheckTime = millis();
    }
}

// ==================== ROLLBACK ====================
bool OTAManager::rollback() {
    Serial.println("[OTA] Rolling back to previous firmware...");
    setState(OTA_ROLLBACK, "Rolling back...");
    
    // ESP32 has a built-in rollback mechanism
    // The partition table should have two app partitions
    // If the new firmware fails to boot, it will automatically
    // rollback to the previous one
    
    // Force rollback by marking current firmware as invalid
    if (Update.rollback()) {
        Serial.println("[OTA] Rollback initiated");
        delay(1000);
        ESP.restart();
        return true;
    }
    
    setError("Rollback failed");
    setState(OTA_FAILED, "Rollback failed");
    return false;
}
