/*
 * IoT Smart Meter - ESP32 Code
 * Sends real-time readings to your Smart Meter Dashboard
 * 
 * Hardware: ESP32 + EmonLib sensors
 * Backend API: http://your-ip:5000
 */

#define BLYNK_TEMPLATE_ID "TMPL3pH2O7bem"
#define BLYNK_TEMPLATE_NAME "IOT SMART METER"
#define BLYNK_PRINT Serial

#include <HTTPClient.h> 
#include "EmonLib.h"   // https://github.com/openenergymonitor/EmonLib
#include <WiFi.h>
#include <WiFiClient.h>
#include <BlynkSimpleEsp32.h>
 
EnergyMonitor emon;

// ===== CALIBRATION SETTINGS =====
#define vCalibration 290      // increase => voltage value increases, decreases => voltage value decreases [220-290]
#define currCalibration 0.17  // increase => current value increases, decreases => current value decreases [0.11-0.2]

// ===== WiFi CREDENTIALS =====
char ssid[] = "AGNIBHA";              // Your WiFi network name
char pass[] = "basak31122003";        // Your WiFi password

// ===== BLYNK CREDENTIALS =====
char auth[] = "Urv1KvBvI7sIfqSaOQNBo0yJGLrL-cFd";  // Blynk auth token

// ===== BACKEND API CONFIGURATION =====
// Cloud Backend - Accessible from anywhere in the world!
const char* serverURL = "https://iot-based-smart-meter-dashboard-backend.onrender.com/api/readings";
const char* deviceAPIKey = "d78ef9ae-358d-48eb-a341-0943be046efe";  // From backend .env

// Alternative: Local Testing (when ESP32 and laptop on same network)
// const char* serverURL = "http://192.168.0.10:5000/api/readings";  // Local IP

// ===== TIMING CONFIGURATION =====
const unsigned long SEND_INTERVAL = 5000;  // Send data every 5 seconds
unsigned long lastSendTime = 0;

// ===== ENERGY TRACKING =====
float kWh = 0.0;
unsigned long lastmillis = 0;

// ===== BLYNK TIMER =====
BlynkTimer timer;

// ===== FREQUENCY CALCULATION (50Hz/60Hz detection) =====
float measuredFrequency = 50.0;  // Default 50Hz


float calculateFrequency() {
  // Measure zero-crossings to determine frequency (50Hz or 60Hz)
  unsigned long startTime = micros();
  int zeroCrossings = 0;
  float lastVoltage = 0;
  
  for (int i = 0; i < 100; i++) {
    float voltage = analogRead(34);
    if ((lastVoltage < 2048 && voltage >= 2048) || (lastVoltage >= 2048 && voltage < 2048)) {
      zeroCrossings++;
    }
    lastVoltage = voltage;
    delayMicroseconds(100);
  }
  
  unsigned long duration = micros() - startTime;
  if (zeroCrossings > 2) {
    float freq = (zeroCrossings / 2.0) * 1000000.0 / duration;
    // Sanity check: frequency should be between 45-65 Hz
    if (freq > 45 && freq < 65) {
      return freq;
    }
  }
  return 50.0;  // Default fallback
}

void sendToBackend(float vrms, float irms, float power, float energy) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("❌ WiFi not connected");
    return;
  }

  // Calculate frequency
  measuredFrequency = calculateFrequency();

  HTTPClient http;
  http.begin(serverURL);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-api-key", deviceAPIKey);  // Device authentication header
  http.setTimeout(5000);  // 5 second timeout

  // Prepare JSON payload
  // Backend automatically calculates: apparent_power, reactive_power, power_factor
  String payload = "{";
  payload += "\"voltage\":" + String(vrms, 2) + ",";
  payload += "\"current\":" + String(irms, 4) + ",";
  payload += "\"power\":" + String(power, 2) + ",";
  payload += "\"energy\":" + String(energy, 5) + ",";
  payload += "\"frequency\":" + String(measuredFrequency, 1) + ",";
  payload += "\"timestamp\":" + String(millis() / 1000);
  payload += "}";

  Serial.println("\n📤 Sending to Backend:");
  Serial.println(payload);

  int httpCode = http.POST(payload);
  
  if (httpCode > 0) {
    Serial.printf("✅ Response: %d\n", httpCode);
    if (httpCode == 201) {
      Serial.println("✅ Data successfully saved to database!");
      String response = http.getString();
      Serial.println("📥 Server Response: " + response);
    } else {
      Serial.println("⚠️ Unexpected response code");
      Serial.println("📥 Response: " + http.getString());
    }
  } else {
    Serial.printf("❌ HTTP Error: %s\n", http.errorToString(httpCode).c_str());
    Serial.println("💡 Check if backend server is running on port 5000");
    Serial.println("💡 Verify your computer's IP address in serverURL");
  }
  
  http.end();
}

void myTimerEvent() {
  // Calculate voltage and current (20 half wavelengths, 5000ms timeout)
  emon.calcVI(20, 5000);

  // Get measurements
  float vrms = emon.Vrms;
  float irms = emon.Irms;
  float power = emon.apparentPower;
  
  // Calculate cumulative energy (kWh)
  unsigned long currentMillis = millis();
  if (lastmillis > 0) {
    kWh += power * (currentMillis - lastmillis) / 3600000000.0;
  }
  lastmillis = currentMillis;

  // Display on Serial Monitor
  Serial.println("\n========== METER READINGS ==========");
  Serial.printf("⚡ Voltage:    %.2f V\n", vrms);
  Serial.printf("🔌 Current:    %.4f A\n", irms);
  Serial.printf("💡 Power:      %.2f W\n", power);
  Serial.printf("📊 Energy:     %.5f kWh\n", kWh);
  Serial.printf("📈 Frequency:  %.1f Hz\n", measuredFrequency);
  Serial.println("====================================\n");

  // Send to Blynk (for mobile app monitoring)
  Blynk.virtualWrite(V0, vrms);
  Blynk.virtualWrite(V1, irms);
  Blynk.virtualWrite(V2, power);
  Blynk.virtualWrite(V3, kWh);

  // Send to Dashboard Backend (every 5 seconds to avoid overload)
  if (currentMillis - lastSendTime >= SEND_INTERVAL) {
    sendToBackend(vrms, irms, power, kWh);
    lastSendTime = currentMillis;
  }
}

void setup() {
  Serial.begin(115200);
  delay(100);
  
  Serial.println("\n\n");
  Serial.println("╔════════════════════════════════════════╗");
  Serial.println("║   IoT Smart Meter - ESP32 Starting     ║");
  Serial.println("╚════════════════════════════════════════╝");
  
  // Initialize EmonLib
  Serial.println("\n🔧 Initializing sensors...");
  emon.voltage(34, vCalibration, 1.7);  // Voltage: pin 34, calibration, phase_shift
  emon.current(35, currCalibration);     // Current: pin 35, calibration
  Serial.println("✅ Sensors initialized");
  
  // Connect to WiFi
  Serial.println("\n📡 Connecting to WiFi...");
  Serial.print("   SSID: ");
  Serial.println(ssid);
  WiFi.begin(ssid, pass);
  
  int wifiAttempts = 0;
  while (WiFi.status() != WL_CONNECTED && wifiAttempts < 20) {
    delay(500);
    Serial.print(".");
    wifiAttempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✅ WiFi Connected!");
    Serial.print("   IP Address: ");
    Serial.println(WiFi.localIP());
    Serial.print("   Signal: ");
    Serial.print(WiFi.RSSI());
    Serial.println(" dBm");
  } else {
    Serial.println("\n❌ WiFi Connection Failed!");
    Serial.println("   Device will retry automatically...");
  }
  
  // Connect to Blynk
  Serial.println("\n📱 Connecting to Blynk...");
  Blynk.begin(auth, ssid, pass);
  Serial.println("✅ Blynk Connected!");
  
  // Setup timer (reads sensor every 5 seconds)
  timer.setInterval(5000L, myTimerEvent);
  
  // Display Backend Configuration
  Serial.println("\n🌐 Backend Configuration:");
  Serial.print("   Server URL: ");
  Serial.println(serverURL);
  Serial.print("   Device ID: meter-001\n");
  Serial.println("   Authentication: API Key");
  
  Serial.println("\n✅ Smart Meter Ready!");
  Serial.println("📊 Starting measurements...\n");
  
  lastmillis = millis();
}
 
void loop() {
  // Check WiFi connection
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("⚠️ WiFi disconnected, reconnecting...");
    WiFi.begin(ssid, pass);
    delay(5000);
    return;
  }
  
  // Run Blynk and timer
  Blynk.run();
  timer.run();
}