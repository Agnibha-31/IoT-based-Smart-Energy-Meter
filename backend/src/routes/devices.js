import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { requireAuth } from '../middleware/auth.js';
import { listDevices, createDevice, getDeviceByIdAndUser, regenerateDeviceApiKey } from '../services/deviceService.js';
import config from '../config.js';

const router = Router();

router.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const devices = await listDevices(req.user.id);
    res.json({ devices });
  }),
);

const createSchema = z.object({
  name: z.string().min(3),
  timezone: z.string().optional(),
  location: z.string().optional(),
});

router.post(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const payload = createSchema.parse(req.body);
    const device = await createDevice({ ...payload, userId: req.user.id });
    res.status(201).json({ device });
  }),
);

// Get single device details with API key
router.get(
  '/:deviceId',
  requireAuth,
  asyncHandler(async (req, res) => {
    const device = await getDeviceByIdAndUser(req.params.deviceId, req.user.id);
    if (!device) {
      return res.status(404).json({ error: 'Device not found or access denied' });
    }
    res.json({ device });
  }),
);

// Regenerate device API key
router.post(
  '/:deviceId/regenerate-key',
  requireAuth,
  asyncHandler(async (req, res) => {
    console.log('📡 [API] Regenerate API key request for device:', req.params.deviceId);
    const device = await getDeviceByIdAndUser(req.params.deviceId, req.user.id);
    if (!device) {
      console.log('❌ [API] Device not found or access denied');
      return res.status(404).json({ error: 'Device not found or access denied' });
    }
    console.log('✅ [API] Device found, proceeding with regeneration');
    const updatedDevice = await regenerateDeviceApiKey(req.params.deviceId);
    console.log('📤 [API] Sending response with api_key:', updatedDevice.api_key);
    res.json({ 
      device: updatedDevice,
      message: 'API key regenerated successfully. Update your ESP32 firmware with the new key.' 
    });
  }),
);

// Get ESP32 connection instructions
router.get(
  '/:deviceId/esp32-config',
  requireAuth,
  asyncHandler(async (req, res) => {
    const device = await getDeviceByIdAndUser(req.params.deviceId, req.user.id);
    if (!device) {
      return res.status(404).json({ error: 'Device not found or access denied' });
    }
    
    // Determine backend URL
    const backendUrl = process.env.NODE_ENV === 'production'
      ? process.env.BACKEND_URL || 'https://iot-based-smart-meter-dashboard-backend.onrender.com'
      : `http://localhost:${config.port}`;
    
    const esp32Code = `/*
 * ESP32 Smart Meter Data Logger
 * Device: ${device.name}
 * Generated: ${new Date().toISOString()}
 * 
 * Required Libraries (Install via Arduino Library Manager):
 * - WiFi (Built-in)
 * - HTTPClient (Built-in)
 * - ArduinoJson by Benoit Blanchon (v6.x)
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// ===== CONFIGURATION =====
const char* ssid = "YOUR_WIFI_SSID";        // Replace with your WiFi SSID
const char* password = "YOUR_WIFI_PASSWORD"; // Replace with your WiFi password

const char* serverURL = "${backendUrl}/api/readings";
const char* deviceAPIKey = "${device.api_key}";
const char* deviceID = "${device.id}";

const unsigned long sendInterval = 5000; // Send data every 5 seconds
unsigned long lastSendTime = 0;

// ===== SETUP =====
void setup() {
  Serial.begin(115200);
  Serial.println("\n=== ESP32 Smart Meter Starting ===");
  
  // Connect to WiFi
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  
  Serial.println("\n✓ WiFi Connected!");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());
  Serial.print("Device ID: ");
  Serial.println(deviceID);
}

// ===== MAIN LOOP =====
void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    if (millis() - lastSendTime >= sendInterval) {
      sendReading();
      lastSendTime = millis();
    }
  } else {
    Serial.println("⚠ WiFi disconnected. Reconnecting...");
    WiFi.reconnect();
    delay(5000);
  }
}

// ===== SEND READING TO SERVER =====
void sendReading() {
  // TODO: Replace with actual sensor readings from PZEM-004T or similar
  float voltage = readVoltage();     // Example: 230.5V
  float current = readCurrent();     // Example: 1.23A
  float power = readPower();         // Example: 283.5W
  float energy = readEnergy();       // Example: 0.14 kWh
  float frequency = readFrequency(); // Example: 50.0 Hz
  
  // Create JSON document
  StaticJsonDocument<256> doc;
  doc["voltage"] = voltage;
  doc["current"] = current;
  doc["power"] = power;
  doc["energy"] = energy;
  doc["frequency"] = frequency;
  
  String jsonPayload;
  serializeJson(doc, jsonPayload);
  
  // Send HTTP POST request
  HTTPClient http;
  http.begin(serverURL);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-api-key", deviceAPIKey);
  
  int httpResponseCode = http.POST(jsonPayload);
  
  if (httpResponseCode > 0) {
    Serial.print("✓ Data sent successfully! Response: ");
    Serial.println(httpResponseCode);
    Serial.print("Payload: ");
    Serial.println(jsonPayload);
  } else {
    Serial.print("✗ Error sending data. Code: ");
    Serial.println(httpResponseCode);
    Serial.print("Error: ");
    Serial.println(http.errorToString(httpResponseCode));
  }
  
  http.end();
}

// ===== SENSOR READING FUNCTIONS =====
// Replace these with actual sensor reading code
// Example: Using PZEM-004T with ModbusMaster library

float readVoltage() {
  // TODO: Implement actual voltage reading from sensor
  // Example: return pzem.voltage();
  return 230.0 + random(-50, 50) / 10.0; // Simulated: 225-235V
}

float readCurrent() {
  // TODO: Implement actual current reading from sensor
  // Example: return pzem.current();
  return 1.0 + random(0, 50) / 100.0; // Simulated: 1.0-1.5A
}

float readPower() {
  // TODO: Implement actual power reading from sensor
  // Example: return pzem.power();
  return 200.0 + random(0, 100); // Simulated: 200-300W
}

float readEnergy() {
  // TODO: Implement actual energy reading from sensor
  // Example: return pzem.energy();
  return random(100, 500) / 1000.0; // Simulated: 0.1-0.5 kWh
}

float readFrequency() {
  // TODO: Implement actual frequency reading from sensor
  // Example: return pzem.frequency();
  return 50.0 + random(-5, 5) / 10.0; // Simulated: 49.5-50.5 Hz
}

/*
 * NOTES:
 * 1. Install ArduinoJson library: Sketch -> Include Library -> Manage Libraries
 * 2. For real sensor integration, use PZEM-004T module with ModbusMaster library
 * 3. Connect PZEM-004T: TX->GPIO16, RX->GPIO17 (or any available GPIO)
 * 4. Monitor serial output (115200 baud) to verify operation
 * 5. Data is sent every 5 seconds (configurable via sendInterval)
 * 6. API key is required for authentication (x-api-key header)
 */`;
    
    res.json({ 
      device: {
        id: device.id,
        name: device.name,
        api_key: device.api_key
      },
      config: {
        endpoint: `${backendUrl}/api/readings`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': device.api_key
        },
        samplePayload: {
          voltage: 230.5,
          current: 1.23,
          power: 283.5,
          energy: 0.14,
          frequency: 50.0
        }
      },
      esp32Code
    });
  }),
);

export default router;

