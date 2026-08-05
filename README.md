# ⚡ Smart Meter IoT Dashboard

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![React](https://img.shields.io/badge/React-18.3.1-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3.3-3178C6?logo=typescript)
![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js)
![Status](https://img.shields.io/badge/status-production-success)

**A production-ready, full-stack IoT dashboard for real-time energy monitoring with ESP32 hardware integration**

[Live Demo](https://iot-based-smart-meter-dashboard.vercel.app) • [Backend API](https://iot-based-smart-meter-dashboard-backend.onrender.com) • [Report Bug](https://github.com/Agnibha-31/IoT-based-Smart-Meter-Dashboard/issues) • [Request Feature](https://github.com/Agnibha-31/IoT-based-Smart-Meter-Dashboard/issues)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Screenshots](#-screenshots)
- [Getting Started](#-getting-started)
- [Configuration](#-configuration)
- [ESP32 Integration](#-esp32-integration)
- [Deployment](#-deployment)
- [API Documentation](#-api-documentation)
- [Internationalization](#-internationalization)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🎯 Overview

The **Smart Meter IoT Dashboard** is a comprehensive, production-ready web application for real-time energy monitoring and analytics. It seamlessly integrates with ESP32 hardware devices to collect, process, and visualize electrical parameters including voltage, current, power, energy consumption, and frequency.

Built with modern web technologies and designed for scalability, this dashboard provides:
- **Real-time monitoring** of electrical parameters via Server-Sent Events (SSE)
- **Advanced analytics** with customizable time ranges and aggregations
- **Multi-language support** with 21 languages for global accessibility
- **Cloud-native architecture** deployed on Vercel (frontend) and Render (backend)
- **Professional UI/UX** with dark/light themes and responsive design
- **Secure authentication** with JWT-based access control
- **Data export** capabilities (CSV, Excel formats)
- **IoT device management** with ESP32 firmware integration

### 🎯 Use Cases

- ✅ Industrial energy monitoring and management
- ✅ Smart home power consumption tracking
- ✅ Renewable energy system monitoring
- ✅ Electrical load analysis and optimization
- ✅ Power quality assessment
- ✅ Energy cost estimation and budgeting

---

## ✨ Features

### 🔐 Authentication & Authorization
- Secure JWT-based authentication system
- Role-based access control (Admin, Operator, Viewer)
- Password hashing with bcrypt (10+ salt rounds)
- Automatic token refresh mechanism
- Session management with secure cookies

### 📊 Real-Time Monitoring
- **Live Data Streaming:** Server-Sent Events (SSE) for instant updates
- **Key Metrics:**
  - Voltage (V) - RMS voltage measurement
  - Current (A) - RMS current measurement
  - Real Power (kW) - Active power consumption
  - Apparent Power (kVA) - Total power
  - Reactive Power (kVAr) - Reactive component
  - Power Factor - Efficiency indicator (0-1)
  - Energy (kWh) - Cumulative consumption
  - Frequency (Hz) - AC frequency (50/60 Hz detection)
- **Visual Indicators:** Real-time charts and gauges
- **Data Refresh:** Configurable intervals (5s, 10s, 30s, 1m, 5m)

### 📈 Advanced Analytics
- **Time-Series Visualization:** Interactive charts powered by Recharts
- **Aggregation Periods:** Hourly, daily, weekly, monthly views
- **Statistical Analysis:**
  - Peak values (maximum consumption periods)
  - Average consumption patterns
  - Minimum usage baselines
  - Load factor calculations
  - Distribution histograms
- **Custom Date Ranges:** Flexible time period selection
- **Trend Analysis:** Identify usage patterns and anomalies

### 💰 Cost Management
- **Real-Time Cost Calculation:** Instant cost estimation based on tariff
- **Configurable Tariff Rates:** Set custom electricity rates per kWh
- **Currency Support:** 150+ currencies with real-time exchange rates
- **Cumulative Billing:** Track costs over various time periods
- **Budget Alerts:** Configurable notifications for spending thresholds

### 📥 Data Export & Reporting
- **Export Formats:**
  - CSV (Comma-Separated Values)
  - Excel (.xlsx) with formatted sheets
- **Customizable Reports:**
  - Select specific time ranges
  - Choose data granularity
  - Filter by device or metric
- **Automated Exports:** Schedule regular report generation
- **Data Retention:** Configurable storage periods (1 week to forever)

### 🌍 Internationalization (i18n)
Complete translation support for **21 languages**:
- 🇺🇸 English (en)
- 🇯🇵 Japanese (ja)
- 🇨🇳 Chinese Simplified (zh)
- 🇪🇸 Spanish (es)
- 🇫🇷 French (fr)
- 🇩🇪 German (de)
- 🇮🇹 Italian (it)
- 🇵🇹 Portuguese (pt)
- 🇷🇺 Russian (ru)
- 🇰🇷 Korean (ko)
- 🇸🇦 Arabic (ar)
- 🇮🇳 Hindi (hi)
- 🇧🇩 Bengali (bn)
- 🇹🇭 Thai (th)
- 🇻🇳 Vietnamese (vi)
- 🇹🇷 Turkish (tr)
- 🇵🇱 Polish (pl)
- 🇳🇱 Dutch (nl)
- 🇸🇪 Swedish (sv)
- 🇩🇰 Danish (da)
- 🇳🇴 Norwegian (no)
- 🇫🇮 Finnish (fi)

### 🎨 User Interface
- **Modern Design:** Clean, professional interface with shadcn/ui components
- **Theme Support:**
  - Dark mode (default)
  - Light mode
  - Auto (system preference)
- **Responsive Layout:** Optimized for mobile, tablet, and desktop
- **Accessibility:** WCAG 2.1 AA compliant
- **Loading States:** Skeleton screens and smooth transitions
- **Error Handling:** User-friendly error messages and recovery

### 🔧 Settings & Customization
- **User Preferences:**
  - Display language
  - Theme selection
  - Timezone configuration
  - Currency selection
  - Tariff rate customization
- **App Preferences:**
  - Auto-save settings
  - Data refresh rate
  - Notification preferences
- **Data Management:**
  - Data retention policies
  - Export history
  - Database cleanup tools

### 🔌 IoT Device Integration
- **ESP32 Support:** Native integration with ESP32 microcontrollers
- **Communication Protocol:** HTTP REST API with JSON payloads
- **Authentication:** API key-based device authentication
- **Data Format:** Standardized sensor data structure
- **Frequency Detection:** Automatic 50Hz/60Hz AC frequency detection
- **Error Handling:** Retry logic and connection recovery
- **Remote Monitoring:** Cloud-based access from any network

### 🛡️ Security Features
- **Password Security:** bcrypt hashing with 10+ salt rounds
- **JWT Tokens:** Short-lived access tokens (15min) + refresh tokens (7 days)
- **CORS Protection:** Whitelist-based cross-origin requests
- **Rate Limiting:** Protection against brute force attacks
- **Input Validation:** Zod schema validation for all inputs
- **SQL Injection Prevention:** Parameterized queries via SQL.js
- **XSS Protection:** Sanitized user inputs
- **HTTPS Only:** Enforced SSL/TLS in production

---

## 🛠️ Tech Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 18.3.1 | UI framework |
| **TypeScript** | 5.3.3 | Type safety |
| **Vite** | 6.0.0 | Build tool & dev server |
| **Tailwind CSS** | 3.4.1 | Utility-first styling |
| **shadcn/ui** | Latest | Component library |
| **Radix UI** | Latest | Headless UI primitives |
| **Recharts** | 2.15.2 | Data visualization |
| **Framer Motion** | 11.0.0 | Animations |
| **Socket.io Client** | 4.8.1 | Real-time communication |
| **Sonner** | 2.0.3 | Toast notifications |
| **Lucide React** | 0.487.0 | Icon library |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | 20+ | Runtime environment |
| **Express** | 4.19.2 | Web framework |
| **SQL.js** | 1.10.3 | SQLite database (WASM) |
| **JWT** | 9.0.2 | Authentication tokens |
| **bcryptjs** | 2.4.3 | Password hashing |
| **Zod** | 3.22.4 | Schema validation |
| **ExcelJS** | 4.4.0 | Excel export |
| **csv-stringify** | 6.5.0 | CSV export |
| **Luxon** | 3.4.4 | Date/time handling |
| **Morgan** | 1.10.0 | HTTP logging |
| **CORS** | 2.8.5 | Cross-origin requests |

### IoT Hardware
| Component | Specification |
|-----------|---------------|
| **Microcontroller** | ESP32 Dev Module |
| **Voltage Sensor** | ZMPT101B (AC voltage module) |
| **Current Sensor** | SCT-013 (Current transformer) |
| **Libraries** | EmonLib, HTTPClient, WiFi, Blynk |
| **Communication** | WiFi (2.4GHz) + HTTPS |

### Cloud Infrastructure
| Service | Platform | Purpose |
|---------|----------|---------|
| **Frontend Hosting** | Vercel | Static site deployment |
| **Backend Hosting** | Render.com | Node.js server (750hrs/month free) |
| **Database** | SQLite (SQL.js) | Persistent storage (1GB disk) |
| **CDN** | Vercel Edge Network | Global content delivery |
| **SSL/TLS** | Auto-provisioned | HTTPS encryption |

### Development Tools
| Tool | Purpose |
|------|---------|
| **Git & GitHub** | Version control |
| **ESLint** | Code linting |
| **Prettier** | Code formatting |
| **TypeScript Compiler** | Type checking |
| **Nodemon** | Backend hot reload |
| **Vite Dev Server** | Frontend hot reload |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                          │
│  (React + TypeScript + Tailwind CSS + shadcn/ui)              │
│                                                                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐         │
│  │Dashboard │ │Analytics │ │ Settings │ │  Export  │         │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS + SSE
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND API SERVER                         │
│              (Express + Node.js + SQL.js)                      │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ REST API Endpoints                                        │ │
│  │  • /api/auth/*     - Authentication                       │ │
│  │  • /api/readings/* - Sensor data CRUD                     │ │
│  │  • /api/analytics/*- Aggregations & stats                 │ │
│  │  • /api/export/*   - CSV/Excel generation                 │ │
│  │  • /api/devices/*  - Device management                    │ │
│  │  • /api/stream     - Server-Sent Events                   │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ Middleware                                                │ │
│  │  • JWT Authentication                                     │ │
│  │  • CORS Protection                                        │ │
│  │  • Input Validation (Zod)                                 │ │
│  │  • Rate Limiting                                          │ │
│  │  • Error Handling                                         │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ Services                                                  │ │
│  │  • authService     - User management                      │ │
│  │  • readingService  - Data processing                      │ │
│  │  • analyticsService- Aggregations                         │ │
│  │  • deviceService   - IoT device management                │ │
│  └──────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ SQL Queries
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      SQLite DATABASE                            │
│                    (SQL.js - WASM-based)                       │
│                                                                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐         │
│  │  users   │ │ devices  │ │ readings │ │ exports  │         │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘         │
│                                                                 │
│  Size: 128 KB → Auto-grows to TB range                        │
│  Mode: WAL (Write-Ahead Logging)                              │
└─────────────────────────────────────────────────────────────────┘
                              ▲
                              │ HTTPS POST
                              │ (JSON payload)
┌─────────────────────────────────────────────────────────────────┐
│                      ESP32 IoT DEVICE                           │
│              (ESP32 + EmonLib + Sensors)                       │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ Sensors                                                   │ │
│  │  • ZMPT101B (Voltage)  → Pin 34                          │ │
│  │  • SCT-013 (Current)   → Pin 35                          │ │
│  │  • Frequency Detection → Zero-crossing                   │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ Data Processing                                           │ │
│  │  • Voltage RMS calculation                                │ │
│  │  • Current RMS calculation                                │ │
│  │  • Power = V × I                                          │ │
│  │  • Energy accumulation                                    │ │
│  │  • Frequency: 50Hz/60Hz detection                         │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                 │
│  Transmission: Every 5 seconds via WiFi                       │
│  Authentication: x-api-key header                             │
└─────────────────────────────────────────────────────────────────┘

DATA FLOW:
1. ESP32 reads sensors → Calculates metrics → Sends JSON via HTTPS
2. Backend validates → Stores in database → Broadcasts via SSE
3. Frontend receives → Updates UI → Displays real-time data
```

### Database Schema

```sql
-- Users table (authentication)
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT,
  role TEXT DEFAULT 'operator',
  timezone TEXT DEFAULT 'UTC',
  language TEXT DEFAULT 'en',
  currency TEXT DEFAULT 'USD',
  location TEXT DEFAULT 'US-NY',
  base_tariff REAL DEFAULT 6.5,
  theme TEXT DEFAULT 'dark',
  notifications TEXT,
  autosave INTEGER DEFAULT 0,
  refresh_rate INTEGER DEFAULT 5,
  data_retention TEXT DEFAULT '1year',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Devices table (IoT device registry)
CREATE TABLE devices (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  api_key TEXT UNIQUE NOT NULL,
  timezone TEXT DEFAULT 'UTC',
  location TEXT DEFAULT 'US-NY',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  last_seen INTEGER
);

-- Readings table (sensor data)
CREATE TABLE readings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  device_id TEXT NOT NULL,
  captured_at INTEGER NOT NULL,
  voltage REAL,
  current REAL,
  real_power_kw REAL,
  apparent_power_kva REAL,
  reactive_power_kvar REAL,
  energy_kwh REAL,
  total_energy_kwh REAL,
  frequency REAL,
  power_factor REAL,
  metadata TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (device_id) REFERENCES devices(id)
);

-- Exports table (data export tracking)
CREATE TABLE exports (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  format TEXT NOT NULL,
  device_id TEXT,
  from_epoch INTEGER,
  to_epoch INTEGER,
  status TEXT DEFAULT 'pending',
  file_path TEXT,
  file_size INTEGER,
  created_at INTEGER NOT NULL,
  completed_at INTEGER,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Indexes for performance
CREATE INDEX idx_readings_device_time ON readings(device_id, captured_at);
```

---

## 📸 Screenshots

### Dashboard Home
![Dashboard](https://via.placeholder.com/800x450?text=Dashboard+Screenshot)
*Real-time monitoring of all electrical parameters with live charts*

### Analytics Page
![Analytics](https://via.placeholder.com/800x450?text=Analytics+Screenshot)
*Advanced time-series analysis with customizable date ranges*

### Settings Page
![Settings](https://via.placeholder.com/800x450?text=Settings+Screenshot)
*Comprehensive user preferences and system configuration*

### Mobile Responsive
![Mobile](https://via.placeholder.com/400x800?text=Mobile+Screenshot)
*Fully responsive design for mobile devices*

---

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v20 or higher) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js) or **yarn**
- **Git** - [Download](https://git-scm.com/)
- **Code Editor** - VS Code recommended

Optional for ESP32 integration:
- **Arduino IDE** (v2.0+) - [Download](https://www.arduino.cc/en/software)
- **ESP32 Board Package** installed in Arduino IDE

### Installation

#### 1️⃣ Clone the Repository

```bash
git clone https://github.com/Agnibha-31/IoT-based-Smart-Meter-Dashboard.git
cd IoT-based-Smart-Meter-Dashboard
```

#### 2️⃣ Install Frontend Dependencies

```bash
# Install frontend packages
npm install
```

#### 3️⃣ Install Backend Dependencies

```bash
# Navigate to backend folder
cd backend

# Install backend packages
npm install

# Return to root directory
cd ..
```

#### 4️⃣ Configure Environment Variables

**Frontend (.env):**
```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your settings
nano .env
```

```env
# Frontend Environment Variables
VITE_API_BASE=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
VITE_OPENWEATHER_API_KEY=your_openweather_api_key_here
```

**Backend (backend/.env):**
```bash
# Navigate to backend
cd backend

# Copy example environment file
cp .env.example .env

# Edit backend/.env
nano .env
```

```env
# Backend Environment Variables
PORT=5000
BACKEND_PORT=5000
CORS_ORIGIN=*

# JWT Configuration
JWT_SECRET=your_super_secure_jwt_secret_here
JWT_EXPIRY=12h

# Database Configuration
DB_FILE=./storage/smartmeter.sqlite

# Device Configuration
DEVICE_ID=meter-001
DEVICE_API_KEY=your_secure_device_api_key_here

# Tariff Configuration
BASE_TARIFF_PER_KWH=6.5
```

#### 5️⃣ Run the Application

**Development Mode (Both Frontend + Backend):**

Open two terminal windows:

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```
Backend will start at `http://localhost:5000`

**Terminal 2 - Frontend:**
```bash
npm run dev
```
Frontend will start at `http://localhost:3000`

**Production Build:**

```bash
# Build frontend
npm run build

# Build creates optimized production files in dist/

# Start backend in production mode
cd backend
npm start
```

#### 6️⃣ Access the Application

Open your browser and navigate to:
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000/api/health

### First-Time Setup

1. **Create Admin Account:**
   - Navigate to the registration page
   - Create your first user account (first user becomes admin)

2. **Login:**
   - Use your email and password to log in

3. **Configure Settings:**
   - Go to Settings page
   - Set your timezone, language, currency
   - Configure tariff rate for cost calculations

4. **Test with Sample Data:**
   - Backend includes seed script for demo data
   ```bash
   cd backend
   npm run seed
   ```

---

## ⚙️ Configuration

### Frontend Configuration

**Vite Configuration (vite.config.ts):**
```typescript
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    target: 'esnext',
    outDir: 'dist',
  },
  server: {
    port: 3000,
    open: true,
  },
});
```

**TypeScript Configuration (tsconfig.json):**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "jsx": "react-jsx",
    "strict": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### Backend Configuration

**Environment Variables:**

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PORT` | Server port | 5000 | No |
| `BACKEND_PORT` | Alternative port variable | 5000 | No |
| `CORS_ORIGIN` | Allowed CORS origins | `*` | No |
| `JWT_SECRET` | Secret for JWT signing | - | **Yes** |
| `JWT_EXPIRY` | Token expiration time | 12h | No |
| `DB_FILE` | SQLite database path | ./storage/smartmeter.sqlite | No |
| `DEVICE_ID` | Default device ID | meter-001 | No |
| `DEVICE_API_KEY` | Device authentication key | - | **Yes** |
| `BASE_TARIFF_PER_KWH` | Default electricity tariff | 6.5 | No |

**Security Best Practices:**

⚠️ **Before Production Deployment:**

1. **Generate Secure JWT Secret:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

2. **Generate Secure Device API Key:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

3. **Update CORS Origin:**
```env
CORS_ORIGIN=https://your-frontend-domain.com
```

4. **Use Strong Passwords:**
   - Minimum 8 characters
   - Mix of uppercase, lowercase, numbers, special characters

---

## 🔌 ESP32 Integration

### Hardware Setup

**Required Components:**
- ESP32 Dev Module
- ZMPT101B AC Voltage Sensor Module
- SCT-013 Current Transformer (30A/100A)
- Jumper wires
- Breadboard
- 5V Power supply

**Wiring Diagram:**

```
ESP32              ZMPT101B           SCT-013
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Pin 34 ←────────── VOUT               
Pin 35 ←───────────────────────────── VOUT
GND    ←────────── GND                GND
3.3V   ←────────── VCC                
                   
AC Input ─────────► AC IN (ZMPT101B)
AC Line ──────────► Through SCT-013 core
```

### Firmware Configuration

**Arduino Libraries Required:**
```cpp
// Install via Arduino Library Manager
- EmonLib (by OpenEnergyMonitor)
- WiFi (ESP32 built-in)
- HTTPClient (ESP32 built-in)
- BlynkSimpleEsp32 (optional, for Blynk integration)
```

**ESP32 Code Configuration:**

1. Open `IOTSmartMeter_new.ino` in Arduino IDE

2. Update WiFi credentials:
```cpp
const char* ssid = "Your_WiFi_SSID";
const char* password = "Your_WiFi_Password";
```

3. Update server URL:
```cpp
// For local testing
const char* serverURL = "http://192.168.x.x:5000/api/readings";

// For production (cloud deployment)
const char* serverURL = "https://iot-based-smart-meter-dashboard-backend.onrender.com/api/readings";
```

4. Update device API key:
```cpp
const char* deviceAPIKey = "your_device_api_key_from_backend_env";
```

5. Calibrate sensors (optional):
```cpp
// Adjust based on your sensor accuracy
const float vCalibration = 290.0;  // Voltage calibration (220-290)
const float currCalibration = 0.17; // Current calibration (0.11-0.2)
```

### Uploading Firmware

1. Connect ESP32 to computer via USB
2. Select board: **Tools > Board > ESP32 Dev Module**
3. Select port: **Tools > Port > COMx** (Windows) or **/dev/ttyUSBx** (Linux)
4. Click **Upload** button
5. Open **Serial Monitor** (115200 baud) to view logs

**Expected Serial Output:**
```
Connecting to WiFi...
Connected to WiFi
IP address: 192.168.1.100
Sending: {"voltage":230.5,"current":2.3,"power":530,"energy":0.53,"frequency":50}
✅ Response: 201
✅ Data successfully saved to database!
```

### Data Format

ESP32 sends data every 5 seconds in JSON format:

```json
{
  "voltage": 230.5,      // RMS voltage in volts
  "current": 2.3,        // RMS current in amperes
  "power": 530,          // Power in watts
  "energy": 0.53,        // Energy in kWh
  "frequency": 50        // Frequency in Hz (50 or 60)
}
```

Backend automatically calculates derived metrics:
- Apparent Power (kVA) = (V × I) / 1000
- Power Factor = Real Power / Apparent Power
- Reactive Power (kVAr) = √(Apparent² - Real²)

### Troubleshooting ESP32

**WiFi Connection Issues:**
```cpp
// Add more connection attempts
int retries = 0;
while (WiFi.status() != WL_CONNECTED && retries < 20) {
  delay(500);
  Serial.print(".");
  retries++;
}
```

**HTTP POST Failures:**
- ✅ Verify backend is running
- ✅ Check firewall settings
- ✅ Ensure device API key matches backend
- ✅ Verify network connectivity

**Sensor Reading Errors:**
- ✅ Check sensor wiring
- ✅ Verify power supply (3.3V/5V)
- ✅ Adjust calibration values
- ✅ Test sensors individually

---

## 🌐 Deployment

### Frontend Deployment (Vercel)

**Method 1: Vercel Dashboard (Recommended)**

1. **Sign up for Vercel:** https://vercel.com/signup
2. **Import Git Repository:**
   - Click "New Project"
   - Import from GitHub: `Agnibha-31/IoT-based-Smart-Meter-Dashboard`
3. **Configure Build Settings:**
   - Framework Preset: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`
4. **Add Environment Variables:**
   ```env
   VITE_API_BASE=https://your-backend-url.onrender.com
   VITE_SOCKET_URL=https://your-backend-url.onrender.com
   VITE_OPENWEATHER_API_KEY=your_api_key
   ```
5. **Deploy:** Click "Deploy"

**Method 2: Vercel CLI**

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel

# Production deployment
vercel --prod
```

**Custom Domain (Optional):**
1. Go to Project Settings > Domains
2. Add your custom domain
3. Update DNS records (Vercel provides instructions)

### Backend Deployment (Render.com)

**Method 1: Render Dashboard (Recommended)**

1. **Sign up for Render:** https://render.com/signup
2. **Create New Web Service:**
   - Click "New +" > "Web Service"
   - Connect GitHub repository
3. **Configure Service:**
   - Name: `smart-meter-backend`
   - Environment: **Node**
   - Region: **Oregon** (or closest to you)
   - Branch: **main**
   - Build Command: `npm install`
   - Start Command: `npm start`
4. **Add Environment Variables:**
   ```env
   NODE_ENV=production
   PORT=5000
   CORS_ORIGIN=https://your-frontend-url.vercel.app
   JWT_SECRET=<generate secure secret>
   JWT_EXPIRY=12h
   DEVICE_ID=meter-001
   DEVICE_API_KEY=<generate secure key>
   DB_FILE=/opt/render/project/src/storage/smartmeter.sqlite
   BASE_TARIFF_PER_KWH=6.5
   ```
5. **Add Persistent Disk:**
   - Go to "Disks" tab
   - Click "Add Disk"
   - Name: `smart-meter-storage`
   - Mount Path: `/opt/render/project/src/storage`
   - Size: 1 GB (free tier)
6. **Deploy:** Click "Create Web Service"

**Method 2: Using render.yaml**

The project includes `backend/render.yaml` for automatic configuration:

```yaml
services:
  - type: web
    name: smart-meter-backend
    env: node
    region: oregon
    plan: free
    buildCommand: npm install
    startCommand: npm start
    healthCheckPath: /api/health
    disk:
      name: smart-meter-storage
      mountPath: /opt/render/project/src/storage
      sizeGB: 1
```

Push to GitHub and connect repository in Render dashboard.

### Database Considerations

**SQLite with SQL.js:**
- ✅ No external database service needed
- ✅ Automatic backups (Render persistent disk)
- ✅ Suitable for small to medium deployments (< 100,000 readings)
- ✅ Free tier compatible

**Scaling Options:**

For larger deployments, consider:
- **PostgreSQL** (Supabase free tier: 500MB)
- **MongoDB Atlas** (free tier: 512MB)
- **PlanetScale** (MySQL-compatible, free tier: 5GB)

### Post-Deployment Checklist

- [ ] Frontend accessible via HTTPS
- [ ] Backend API health check passes
- [ ] User registration works
- [ ] Login/logout functions
- [ ] ESP32 can send data to cloud backend
- [ ] Real-time data updates on frontend
- [ ] Data export (CSV/Excel) works
- [ ] All 21 languages display correctly
- [ ] Theme switching works
- [ ] Analytics page loads data
- [ ] Settings save properly

### Monitoring & Maintenance

**Uptime Monitoring:**
- Use [UptimeRobot](https://uptimerobot.com/) (free)
- Monitor endpoint: `https://your-backend.onrender.com/api/health`

**Error Tracking:**
- Integrate [Sentry](https://sentry.io/) (5k errors/month free)
- Add to frontend and backend

**Analytics:**
- Google Analytics for frontend usage
- Morgan logs in backend for API monitoring

**Backup Strategy:**
- Render persistent disks are backed up automatically
- Export database weekly: `cp backend/storage/smartmeter.sqlite backup-$(date +%Y%m%d).sqlite`

---

## 📚 API Documentation

### Base URL

**Local Development:**
```
http://localhost:5000/api
```

**Production:**
```
https://iot-based-smart-meter-dashboard-backend.onrender.com/api
```

### Authentication

All authenticated endpoints require a JWT token in the Authorization header:

```http
Authorization: Bearer <your_jwt_token>
```

Device endpoints require an API key:

```http
x-api-key: <your_device_api_key>
```

### Endpoints

#### Authentication

**Register User**
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "John Doe"
}

Response: 201 Created
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "operator"
  }
}
```

**Login**
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}

Response: 200 OK
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { ... }
}
```

**Get Current User**
```http
GET /api/auth/me
Authorization: Bearer <token>

Response: 200 OK
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "operator",
    "timezone": "UTC",
    "language": "en",
    "currency": "USD"
  }
}
```

#### Readings (IoT Data)

**Create Reading (ESP32)**
```http
POST /api/readings
x-api-key: <device_api_key>
Content-Type: application/json

{
  "voltage": 230.5,
  "current": 2.3,
  "power": 530,
  "energy": 0.53,
  "frequency": 50
}

Response: 201 Created
{
  "reading": {
    "id": 1,
    "device_id": "meter-001",
    "voltage": 230.5,
    "current": 2.3,
    "real_power_kw": 0.53,
    "apparent_power_kva": 0.53,
    "power_factor": 1.0,
    "reactive_power_kvar": 0.0,
    "energy_kwh": 0.53,
    "frequency": 50,
    "captured_at": 1732234567
  }
}
```

**Get Latest Reading**
```http
GET /api/readings/latest?device_id=meter-001
Authorization: Bearer <token>

Response: 200 OK
{
  "reading": { ... }
}
```

**Get Readings in Range**
```http
GET /api/readings?device_id=meter-001&from=1732000000&to=1732234567&limit=100
Authorization: Bearer <token>

Response: 200 OK
{
  "readings": [ ... ],
  "pagination": {
    "total": 1000,
    "page": 1,
    "limit": 100
  }
}
```

#### Analytics

**Get Summary Statistics**
```http
GET /api/analytics/summary?device_id=meter-001&range=7d
Authorization: Bearer <token>

Response: 200 OK
{
  "summary": {
    "peak_power": 2.5,
    "avg_power": 1.2,
    "min_power": 0.3,
    "total_energy": 50.5,
    "total_cost": 329.25,
    "load_factor": 0.48
  }
}
```

**Get Time-Series Data**
```http
GET /api/analytics?device_id=meter-001&range=24h&granularity=1h
Authorization: Bearer <token>

Response: 200 OK
{
  "data": [
    {
      "timestamp": 1732200000,
      "avg_voltage": 230.2,
      "avg_current": 2.1,
      "avg_power": 1.5,
      "total_energy": 1.5
    },
    ...
  ]
}
```

#### Export

**Export CSV**
```http
GET /api/export/csv?device_id=meter-001&from=1732000000&to=1732234567
Authorization: Bearer <token>

Response: 200 OK
Content-Type: text/csv
Content-Disposition: attachment; filename="readings-20251122.csv"

timestamp,voltage,current,power,energy,frequency
1732234567,230.5,2.3,530,0.53,50
...
```

**Export Excel**
```http
GET /api/export/excel?device_id=meter-001&from=1732000000&to=1732234567
Authorization: Bearer <token>

Response: 200 OK
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
Content-Disposition: attachment; filename="readings-20251122.xlsx"

[Excel file binary data]
```

#### Real-Time Streaming

**Server-Sent Events**
```http
GET /api/stream?token=<jwt_token>

Response: 200 OK
Content-Type: text/event-stream

: connected

data: {"id":1,"voltage":230.5,"current":2.3,...}

data: {"id":2,"voltage":231.0,"current":2.4,...}
```

### Error Responses

**400 Bad Request**
```json
{
  "error": "Validation failed",
  "details": [
    "voltage must be a number",
    "current must be positive"
  ]
}
```

**401 Unauthorized**
```json
{
  "error": "Invalid or expired token"
}
```

**403 Forbidden**
```json
{
  "error": "Insufficient permissions"
}
```

**404 Not Found**
```json
{
  "error": "Resource not found"
}
```

**500 Internal Server Error**
```json
{
  "error": "Internal server error",
  "message": "Database connection failed"
}
```

---

## 🌍 Internationalization

The application supports **21 languages** with complete translations for all UI elements.

### Available Languages

| Language | Code | Status | Coverage |
|----------|------|--------|----------|
| English | `en` | ✅ Complete | 100% |
| Japanese | `ja` | ✅ Complete | 100% |
| Chinese (Simplified) | `zh` | ✅ Complete | 100% |
| Spanish | `es` | ✅ Complete | 100% |
| French | `fr` | ✅ Complete | 100% |
| German | `de` | ✅ Complete | 100% |
| Italian | `it` | ✅ Complete | 100% |
| Portuguese | `pt` | ✅ Complete | 100% |
| Russian | `ru` | ✅ Complete | 100% |
| Korean | `ko` | ✅ Complete | 100% |
| Arabic | `ar` | ✅ Complete | 100% |
| Hindi | `hi` | ✅ Complete | 100% |
| Bengali | `bn` | ✅ Complete | 100% |
| Thai | `th` | ✅ Complete | 100% |
| Vietnamese | `vi` | ✅ Complete | 100% |
| Turkish | `tr` | ✅ Complete | 100% |
| Polish | `pl` | ✅ Complete | 100% |
| Dutch | `nl` | ✅ Complete | 100% |
| Swedish | `sv` | ✅ Complete | 100% |
| Danish | `da` | ✅ Complete | 100% |
| Norwegian | `no` | ✅ Complete | 100% |
| Finnish | `fi` | ✅ Complete | 100% |

### Adding a New Language

1. Open `src/components/translations.tsx`

2. Add new language object:
```typescript
export const translations = {
  // ... existing languages
  
  // New language
  'xx': { // ISO 639-1 language code
    // Copy all keys from 'en' and translate
    'dashboard': 'Your Translation',
    'voltage': 'Your Translation',
    // ... all 200+ keys
  }
};
```

3. Test language switching in Settings page

4. Submit pull request with new translations

### Translation Keys

Total: **200+ keys** covering:
- Navigation menu items
- Dashboard labels
- Analytics terms
- Settings options
- Error messages
- Success notifications
- Form labels
- Button texts
- Tooltips
- Time intervals
- Data retention periods

---

## 🤝 Contributing

We welcome contributions from the community! Here's how you can help:

### Ways to Contribute

- 🐛 **Report Bugs:** Open an issue with detailed reproduction steps
- ✨ **Suggest Features:** Share your ideas for new features
- 📝 **Improve Documentation:** Fix typos, add examples, clarify instructions
- 🌍 **Add Translations:** Add support for new languages
- 💻 **Submit Code:** Fix bugs, implement features, improve performance
- 🎨 **Improve UI/UX:** Suggest design improvements, create mockups

### Development Workflow

1. **Fork the repository**
2. **Create a feature branch:** `git checkout -b feature/amazing-feature`
3. **Make your changes**
4. **Test thoroughly:** Ensure all features work
5. **Commit with clear messages:** `git commit -m 'Add amazing feature'`
6. **Push to your fork:** `git push origin feature/amazing-feature`
7. **Open a Pull Request:** Describe your changes in detail

### Code Style Guidelines

- **TypeScript/JavaScript:** Follow ESLint rules
- **React Components:** Use functional components with hooks
- **Naming:** camelCase for variables/functions, PascalCase for components
- **Comments:** Explain WHY, not WHAT
- **File Structure:** Keep files under 300 lines

### Testing

Before submitting a PR:
- [ ] All existing tests pass
- [ ] New features have tests
- [ ] Manual testing completed
- [ ] No TypeScript errors
- [ ] No console errors

### Pull Request Template

```markdown
## Description
[Brief description of changes]

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tested locally
- [ ] Added new tests
- [ ] All tests pass

## Screenshots (if applicable)
[Add screenshots here]
```

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2025 Agnibha Basak

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 🙏 Acknowledgments

### Technologies & Libraries
- [React](https://react.dev/) - UI framework
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Vite](https://vitejs.dev/) - Build tool
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [shadcn/ui](https://ui.shadcn.com/) - Component library
- [Recharts](https://recharts.org/) - Data visualization
- [Express](https://expressjs.com/) - Backend framework
- [SQL.js](https://sql.js.org/) - SQLite in WASM
- [Vercel](https://vercel.com/) - Frontend hosting
- [Render](https://render.com/) - Backend hosting

### Hardware
- [ESP32](https://www.espressif.com/en/products/socs/esp32) - Microcontroller
- [OpenEnergyMonitor](https://openenergymonitor.org/) - EmonLib library

### Inspiration
- Open Energy Monitor project
- Home Assistant
- Grafana dashboards

---

## 📞 Support & Contact

### Get Help

- 📖 **Documentation:** [Wiki](https://github.com/Agnibha-31/IoT-based-Smart-Meter-Dashboard/wiki)
- 🐛 **Report Bugs:** [Issues](https://github.com/Agnibha-31/IoT-based-Smart-Meter-Dashboard/issues)
- 💬 **Discussions:** [GitHub Discussions](https://github.com/Agnibha-31/IoT-based-Smart-Meter-Dashboard/discussions)
- ✉️ **Email:** agnibha.dev@gmail.com

### Quick Links

- 🌐 **Live Demo:** https://iot-based-smart-meter-dashboard.vercel.app
- 📊 **Backend API:** https://iot-based-smart-meter-dashboard-backend.onrender.com
- 🐙 **GitHub Repository:** https://github.com/Agnibha-31/IoT-based-Smart-Meter-Dashboard
- 📚 **API Documentation:** [API Docs](https://github.com/Agnibha-31/IoT-based-Smart-Meter-Dashboard/blob/main/API.md)

---

## 🗺️ Roadmap

### Version 1.1 (Planned)
- [ ] Push notifications for alerts
- [ ] Email notifications for daily/weekly reports
- [ ] Advanced forecasting with ML
- [ ] Multiple device support in single dashboard
- [ ] Mobile apps (React Native)

### Version 1.2 (Planned)
- [ ] Integration with solar panels
- [ ] Battery monitoring support
- [ ] Smart home device control
- [ ] Automation rules (IFTTT-style)
- [ ] Public API for third-party integrations

### Version 2.0 (Future)
- [ ] Time-series database (TimescaleDB/InfluxDB)
- [ ] Advanced machine learning for anomaly detection
- [ ] Predictive maintenance alerts
- [ ] Multi-tenant architecture
- [ ] White-label solution

---

## 📊 Project Stats

![GitHub stars](https://img.shields.io/github/stars/Agnibha-31/IoT-based-Smart-Meter-Dashboard?style=social)
![GitHub forks](https://img.shields.io/github/forks/Agnibha-31/IoT-based-Smart-Meter-Dashboard?style=social)
![GitHub issues](https://img.shields.io/github/issues/Agnibha-31/IoT-based-Smart-Meter-Dashboard)
![GitHub pull requests](https://img.shields.io/github/issues-pr/Agnibha-31/IoT-based-Smart-Meter-Dashboard)
![GitHub last commit](https://img.shields.io/github/last-commit/Agnibha-31/IoT-based-Smart-Meter-Dashboard)

---

<div align="center">

**Built with ❤️ by [Agnibha Basak](https://github.com/Agnibha-31)**

⭐ **Star this repo** if you find it helpful!

[⬆ Back to Top](#-smart-meter-iot-dashboard)

</div>
