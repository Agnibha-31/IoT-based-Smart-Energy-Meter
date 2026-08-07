<div align="center">

# Smart Meter IoT

### ESP32-based electrical monitoring, full-stack analytics, recorded data, and open PCB fabrication outputs

[![Code License: Apache-2.0](https://img.shields.io/badge/Code%20License-Apache%202.0-blue.svg)](LICENSE)
[![Data License: CC BY 4.0](https://img.shields.io/badge/Data%20License-CC%20BY%204.0-green.svg)](LICENSE-DATA)
[![Hardware License: CERN-OHL-S-2.0](https://img.shields.io/badge/Hardware-CERN--OHL--S--2.0-orange.svg)](LICENSE-HARDWARE)
[![React](https://img.shields.io/badge/React-18.2-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![Express](https://img.shields.io/badge/Express-4.19-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-required-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![ESP32](https://img.shields.io/badge/Device-ESP32-E7352C?logo=espressif&logoColor=white)](https://www.espressif.com/en/products/socs/esp32)
[![Dataset](https://img.shields.io/badge/Dataset-5%2C000%20readings-16A34A)](Smart%20Meter%20Domestic%20Dataset.csv)

[**Open the hosted frontend**](https://iot-based-smart-meter-dashboard.vercel.app) ·
[**See the hardware**](#hardware-circuit-and-pcb) ·
[**Tour the dashboard**](#dashboard-tour) ·
[**Explore the dataset**](#recorded-project-dataset) ·
[**Run locally**](#local-setup)

</div>

---

Smart Meter IoT is an end-to-end prototype for measuring, transmitting, storing, visualising, and exporting single-phase electrical data. The repository combines an ESP32 firmware sketch, ACS712 current sensing, ZMPT101B voltage sensing, an optional I2C LCD, a React dashboard, an Express API, PostgreSQL storage, a recorded 5,000-row dataset, circuit illustrations, and PCB fabrication outputs.

This README uses simple language and shows every image stored in the repository inline. It also clearly separates:

- what is implemented;
- what has been verified from the files;
- what still needs correction before reliable hardware or production deployment; and
- which license applies to software, data, and hardware.

> [!IMPORTANT]
> This repository is a research and engineering prototype. It is not a certified electricity meter, billing instrument, protective device, or safety-approved consumer product.

> [!CAUTION]
> The circuit illustration includes direct 220 V AC wiring. Mains electricity can cause fatal shock, fire, and equipment damage. Do not build, probe, power, or install the mains section unless a suitably qualified electrical professional has reviewed the complete design and provides suitable isolation, fusing, enclosure, earthing, conductor sizing, creepage, clearance, strain relief, and regulatory compliance.

## Project at a glance

| Area | Included in this repository |
|---|---|
| Edge device | ESP32 firmware in `System Code.ino` |
| Sensors | ACS712 current module and ZMPT101B voltage module |
| Local display | 16×2 I2C LCD shown in the circuit illustration |
| Connectivity | Wi-Fi, HTTP POST, device API key, and optional Blynk reporting |
| Backend | Node.js, Express, JWT, Zod, PostgreSQL, analytics, SSE, CSV, and XLSX |
| Frontend | React, TypeScript, Tailwind CSS, Recharts, Framer Motion, and responsive pages |
| Recorded data | 5,000 readings, 20 columns, exact 60-second spacing |
| Hardware release | PCB render, schematic image, wiring image, Gerbers, drills, and Gerber job file |
| Visual documentation | 3 hardware images and 11 complete dashboard screenshots |

## What the project demonstrates

The project investigates a complete smart-meter information path:

1. **Sense** voltage and current at the edge.
2. **Calculate** electrical values such as power, energy, frequency, and power factor.
3. **Transmit** readings from an ESP32 over Wi-Fi.
4. **Authenticate** each device with an API key.
5. **Store** user, device, and reading data in PostgreSQL.
6. **Stream** new readings to authenticated browser sessions.
7. **Analyse** trends, peaks, averages, cost, load behaviour, and time periods.
8. **Export** selected data to CSV or Excel.
9. **Document** the physical circuit and release PCB manufacturing outputs.

The dashboard uses explainable equations and time aggregation. It does not contain a machine-learning prediction model.

## End-to-end architecture

```mermaid
flowchart LR
    A["AC supply and load"] --> B["ACS712 + ZMPT101B"]
    B --> C["ESP32 firmware"]
    C -->|"Wi-Fi: JSON + x-api-key"| D["Express API"]
    C -->|"Optional virtual pins"| E["Blynk"]
    D --> F[("PostgreSQL")]
    F --> G["Analytics and export services"]
    D -->|"Authenticated SSE"| H["React dashboard"]
    G --> H
```

## Hardware, circuit, and PCB

### Complete connection illustration

The following image shows the intended physical idea: an ESP32 reads a current module and a voltage module, drives a 16×2 I2C LCD, and reports measurements over Wi-Fi.

<p align="center">
  <img src="Circuit%20Image.png" alt="Complete Smart Meter IoT connection illustration with ESP32, LCD, ACS712, ZMPT101B, supply, and load" width="900">
</p>

### Main hardware

| Part | Role in the system | Important note |
|---|---|---|
| ESP32 development board | ADC sampling, calculations, Wi-Fi, HTTP, Blynk, and timing | GPIO34 and GPIO35 are input-only ADC pins and suit analogue sensor outputs |
| ACS712 module | Measures load current through a Hall-effect sensor | Module range and calibration must match the expected current |
| ZMPT101B module | Produces an isolated analogue signal related to AC voltage | Its trimmer and calibration must be set against a trusted reference |
| 16×2 LCD with I2C backpack | Local display in the connection illustration | SDA is shown on GPIO21 and SCL on GPIO22; the current sketch does not drive the LCD |
| Regulated power source and protection | Supplies safe low-voltage electronics | Do not power the ESP32 directly from mains |

### Schematic image

The schematic represents the low-voltage carrier-board connections included in the Gerbers.

<p align="center">
  <img src="Circuit%20Scematic.png" alt="Smart Meter IoT schematic showing ACS712, ZMPT101B, and ESP32 connections" width="900">
</p>

> The repository filename is `Circuit Scematic.png`, with “Scematic” in the actual filename. The encoded path above is intentionally exact so GitHub renders it correctly.

### Verified pin mapping and an important mismatch

The uploaded materials do not all use the same two ADC assignments.

| Source | Current signal | Voltage signal |
|---|---:|---:|
| `Circuit Scematic.png` | GPIO34 | GPIO35 |
| Gerber copper nets | GPIO34 | GPIO35 |
| `Circuit Image.png` | GPIO35 | GPIO34 |
| Current `System Code.ino` | GPIO35 | GPIO34 |

This means the firmware matches the connection illustration, but it does **not** match the schematic or fabricated PCB routing.

Before using the PCB, choose one mapping and make every artifact agree. The least disruptive PCB-based correction is:

```cpp
constexpr uint8_t CURRENT_PIN = 34;  // ACS712 OUT on schematic/Gerber
constexpr uint8_t VOLTAGE_PIN = 35;  // ZMPT101B OUT on schematic/Gerber

emon.voltage(VOLTAGE_PIN, vCalibration, 1.7);
emon.current(CURRENT_PIN, currCalibration);

// calculateFrequency() must also sample VOLTAGE_PIN.
```

If the breadboard wiring in `Circuit Image.png` is kept instead, the schematic and PCB must be changed rather than the firmware. Do not mix the two versions.

### Sensor supply-voltage check

The Gerber nets connect both sensor `VDD` pins to the ESP32 `3V3` pin. Many commonly sold ACS712 and ZMPT101B breakout modules are designed around a 5 V supply, and their analogue outputs may not be directly compatible with a 3.3 V ADC without signal conditioning.

Before assembly:

- identify the exact sensor-module manufacturer and variant;
- read its supply and output specifications;
- confirm the output can never exceed the ESP32 ADC limit;
- confirm the ACS712 operates correctly at the selected supply;
- confirm the ZMPT101B bias and waveform remain inside the ADC range; and
- add conditioning, clamping, or a suitable divider if the verified design requires it.

Do not assume two visually similar breakout boards have the same electrical limits.

### PCB render

The board render shows a through-hole carrier for the two sensor modules and a 30-pin ESP32 development board. The ESP32 antenna end is labelled to help keep the antenna away from unnecessary copper or obstructions.

<p align="center">
  <img src="PCB.png" alt="Smart Meter IoT PCB render with ACS712, ZMPT101B, ESP32, and antenna area" width="900">
</p>

The PCB does not include a dedicated LCD connector. The LCD in the connection illustration is therefore wired directly to the ESP32.

### Fabrication package

The `PCB Fabrication/` folder now contains a consistent Smart Meter IoT job generated by KiCad Pcbnew 10.0.2.

| Verified property | Value |
|---|---:|
| Project identifier | `Smart Meter IoT` |
| Generated | 8 August 2026 |
| Board size | 60.05 mm × 48.05 mm |
| Copper layers | 2 |
| Nominal board thickness | 1.6 mm |
| Base material | FR4 |
| Minimum listed line width | 0.20 mm |
| Minimum listed pad/track/track spacing | 0.20 mm |
| Plated component holes | 38 |
| PTH drill diameters | 0.80 mm and 0.90 mm |
| Non-plated holes | None listed |
| Surface finish | Not specified (`None` in the job file) |
| Revision | Not assigned (`rev?` in the job file) |

| File | Manufacturing function |
|---|---|
| [`Smart Meter IoT-F_Cu.gbr`](PCB%20Fabrication/Smart%20Meter%20IoT-F_Cu.gbr) | Top copper |
| [`Smart Meter IoT-B_Cu.gbr`](PCB%20Fabrication/Smart%20Meter%20IoT-B_Cu.gbr) | Bottom copper |
| [`Smart Meter IoT-F_Mask.gbr`](PCB%20Fabrication/Smart%20Meter%20IoT-F_Mask.gbr) | Top solder mask |
| [`Smart Meter IoT-B_Mask.gbr`](PCB%20Fabrication/Smart%20Meter%20IoT-B_Mask.gbr) | Bottom solder mask |
| [`Smart Meter IoT-F_Silkscreen.gbr`](PCB%20Fabrication/Smart%20Meter%20IoT-F_Silkscreen.gbr) | Top legend/silkscreen |
| [`Smart Meter IoT-Edge_Cuts.gbr`](PCB%20Fabrication/Smart%20Meter%20IoT-Edge_Cuts.gbr) | Board profile |
| [`Smart Meter IoT-PTH.drl`](PCB%20Fabrication/Smart%20Meter%20IoT-PTH.drl) | Plated drill file |
| [`Smart Meter IoT-NPTH.drl`](PCB%20Fabrication/Smart%20Meter%20IoT-NPTH.drl) | Non-plated drill file; currently contains no holes |
| [`Smart Meter IoT-job.gbrjob`](PCB%20Fabrication/Smart%20Meter%20IoT-job.gbrjob) | Gerber job metadata |
| [`Smart Meter IoT.kicad_prl`](PCB%20Fabrication/Smart%20Meter%20IoT.kicad_prl) | KiCad local project settings; not the PCB design source |

### Manufacturing-readiness status

The Gerber names, job identifier, components, and nets now correspond to the smart-meter carrier. However, do not place a fabrication order as an unreviewed one-click action.

Complete these checks first:

- resolve the GPIO34/GPIO35 mismatch;
- verify sensor supply voltages and ADC levels;
- assign a real hardware revision;
- select a board finish with the manufacturer;
- run electrical-rule and design-rule checks in the editable source;
- inspect every Gerber layer and drill alignment in a Gerber viewer;
- verify the exact ESP32, ACS712, and ZMPT101B header footprints;
- decide whether mounting holes are required;
- add a bill of materials and assembly drawing;
- confirm the ESP32 antenna keep-out;
- review all mains-side module connections independently; and
- obtain a qualified electrical safety review.

The repository does not currently contain `.kicad_pcb` or `.kicad_sch` files. Gerbers are suitable for viewing and fabrication, but they are not the preferred editable design source. Add the original KiCad PCB and schematic files before calling the hardware fully reproducible open hardware.

## ESP32 firmware

The included [`System Code.ino`](System%20Code.ino) is a single ESP32 sketch that:

- reads RMS voltage and current through EmonLib;
- calculates apparent power;
- accumulates an in-memory kWh value;
- estimates line frequency;
- writes four values to Blynk virtual pins `V0`–`V3`;
- sends JSON to the dashboard backend every five seconds;
- authenticates with the `x-api-key` header; and
- prints status and readings at 115200 baud.

### Firmware dependencies

Install these before compiling:

- ESP32 board support for Arduino IDE;
- [EmonLib](https://github.com/openenergymonitor/EmonLib);
- [Blynk](https://github.com/Blynk-Technologies/blynk-library);
- WiFi, WiFiClient, and HTTPClient from the ESP32 Arduino core.

The third-party libraries are not stored in this repository. Their upstream licenses still apply to compiled firmware and redistribution. Read [NOTICE](NOTICE) before distributing a firmware binary.

### Values that must be configured

All private values in the committed sketch are masked with `********`.

| Firmware setting | What to enter |
|---|---|
| `BLYNK_TEMPLATE_ID` | Template ID from the user's own Blynk project |
| `BLYNK_TEMPLATE_NAME` | Blynk template name |
| `ssid` / `pass` | Wi-Fi network credentials |
| `auth` | Blynk device authentication token |
| `serverURL` | Full HTTPS or local URL ending in `/api/readings` |
| `deviceAPIKey` | API key shown for the selected dashboard device |
| `vCalibration` | Voltage calibration obtained from a trusted reference |
| `currCalibration` | Current calibration obtained from a trusted reference |

Never commit real Wi-Fi passwords, Blynk tokens, JWT secrets, or device keys.

### Firmware corrections required before dependable use

1. **ADC pins:** the sketch uses voltage on GPIO34 and current on GPIO35, while the PCB uses the opposite mapping.
2. **Timestamp:** the sketch sends `millis()/1000`. This is seconds since boot, not Unix epoch time. The backend stores it as an absolute timestamp, which can create 1970-era records and break history queries. Omit `timestamp` so the server supplies current time, or synchronise the ESP32 with NTP and send a true epoch value.
3. **Power meaning:** `emon.apparentPower` is sent as `power`. The backend interprets `power` as real power in watts. Use `emon.realPower` for `power`, and send apparent power and power factor separately.
4. **Energy persistence:** `kWh` resets to zero after reboot. Store an energy checkpoint in non-volatile storage or reconstruct it safely on reconnect if a persistent total is required.
5. **Energy field meaning:** the backend currently stores the received `energy` value in both interval and cumulative energy columns. Decide whether the API carries an interval or a cumulative total and make the schema and firmware consistent.
6. **Frequency window:** the current 100-sample loop covers only about 10 ms before overhead, which is too short for robust 50/60 Hz estimation. Use a longer, timer-based zero-crossing measurement and calibrated midpoint.
7. **LCD:** the LCD is present in the circuit illustration but no LCD library or display code exists in `System Code.ino`.
8. **Calibration:** the committed calibration constants are project-specific starting values, not universal constants.

### Recommended payload contract

`power` should be real power in watts. `apparent_power` should be in kVA because that is the unit expected by the current backend implementation.

```http
POST /api/readings
Content-Type: application/json
x-api-key: YOUR_DEVICE_API_KEY
```

```json
{
  "voltage": 230.5,
  "current": 1.23,
  "power": 274.3,
  "apparent_power": 0.2835,
  "power_factor": 0.968,
  "energy": 0.14,
  "frequency": 50.0,
  "metadata": {
    "phase": "single",
    "location": "IN-WB",
    "firmware": "custom-revision"
  }
}
```

No `timestamp` is shown above, so the backend uses server time.

## Dashboard capabilities

| Page | Main purpose |
|---|---|
| Overview | Latest readings, status, live session charts, and quick metric cards |
| Voltage | Live and historical voltage, high/low/average values, and time ranges |
| Current | RMS current, peaks, load factor, trends, and distribution |
| Power | Real, apparent, and reactive power, power factor, and demand views |
| Energy | Consumption, cumulative energy, time comparisons, and efficiency indicators |
| Analytics | Period selection, aggregated metrics, charts, performance, and insights |
| Cost | Tariff-aware cost totals, projections, rate bands, and cost trends |
| Data management | Range/metric selection, preview, sampling, CSV, and XLSX |
| Device configuration | Device creation, API-key viewing/rotation, and generated ESP32 starter code |
| Settings | Language, location, time zone, currency, tariffs, theme, refresh, and notifications |

## Dashboard tour

All 11 images in `Dashboard View/` are displayed below.

### 1. Sign up and sign in

<p align="center">
  <img src="Dashboard%20View/SignUp%20Page.png" alt="Smart Meter IoT sign-up and sign-in page" width="900">
</p>

### 2. Data overview

<p align="center">
  <img src="Dashboard%20View/Data%20Overview%20Page.png" alt="Smart Meter IoT overview page" width="900">
</p>

### 3. Voltage monitoring

<p align="center">
  <img src="Dashboard%20View/Voltage%20Data%20Page.png" alt="Voltage monitoring page" width="900">
</p>

### 4. Current monitoring

<p align="center">
  <img src="Dashboard%20View/Current%20Data%20Page.png" alt="Current monitoring page" width="900">
</p>

### 5. Power analysis

<p align="center">
  <img src="Dashboard%20View/Power%20Data%20Page.png" alt="Power analysis page" width="900">
</p>

### 6. Energy management

<p align="center">
  <img src="Dashboard%20View/Energy%20Data%20Page.png" alt="Energy management page" width="900">
</p>

### 7. Advanced analytics

<p align="center">
  <img src="Dashboard%20View/Data%20Analytics%20Page.png" alt="Advanced smart-meter analytics page" width="900">
</p>

### 8. Cost calculation

<p align="center">
  <img src="Dashboard%20View/Cost%20Calculation%20Page.png" alt="Electricity cost calculation page" width="900">
</p>

### 9. Data management and export

<p align="center">
  <img src="Dashboard%20View/Data%20Management%20Page.png" alt="Data preview, management, CSV, and Excel export page" width="900">
</p>

### 10. Device configuration

<p align="center">
  <img src="Dashboard%20View/Device%20Configuration%20Page.png" alt="ESP32 device configuration and API-key page" width="900">
</p>

### 11. Settings

<p align="center">
  <img src="Dashboard%20View/Settings%20Page.png" alt="Smart Meter IoT settings page" width="900">
</p>

## Recorded project dataset

The repository contains [`Smart Meter Domestic Dataset.csv`](Smart%20Meter%20Domestic%20Dataset.csv). Its metadata labels every row as `recorded_system` from a single-phase meter at location `IN-WB`.

The following values were recalculated directly from the current CSV.

### Dataset quality and coverage

| Property | Verified value |
|---|---:|
| Rows | 5,000 |
| Columns | 20 |
| Device | `meter-001` in every row |
| Sampling interval | Exactly 60 seconds for all 4,999 gaps |
| UTC coverage | 31 July 2026 17:31:00 → 4 August 2026 04:50:00 |
| IST coverage | 31 July 2026 23:01:00 → 4 August 2026 10:20:00 |
| Elapsed duration | 83 hours 19 minutes |
| Missing cells | 0 |
| Duplicate complete rows | 0 |
| Duplicate timestamps | 0 |
| Quality flag | `Normal` in all rows |
| Sum of interval energy | 64.353517 kWh |
| Cumulative energy | 31.057919 → 95.400000 kWh |
| Sum of interval cost | ₹374.415060 |

### Measurement ranges

| Measurement | Minimum | Mean | Maximum |
|---|---:|---:|---:|
| Voltage | 207.209 V | 232.584 V | 248.230 V |
| Current | 0.542 A | 3.548 A | 10.639 A |
| Real power | 0.1187 kW | 0.7722 kW | 2.2059 kW |
| Apparent power | 0.1263 kVA | 0.8232 kVA | 2.4640 kVA |
| Reactive power | 0.0425 kVAR | 0.2762 kVAR | 1.1033 kVAR |
| Frequency | 49.952 Hz | 49.999 Hz | 50.045 Hz |
| Power factor | 0.8846 | 0.9478 | 0.9829 |
| Tariff | ₹4.23/kWh | ₹5.70/kWh | ₹9.49/kWh |
| Interval cost | ₹0.008368 | ₹0.074883 | ₹0.335917 |

### Load and tariff distribution

```mermaid
pie showData
    title Load-state distribution across 5,000 readings
    "Base Load" : 2762
    "Normal" : 2027
    "High" : 211
```

| Tariff period | Rows | Share |
|---|---:|---:|
| Off-Peak, 20:00–10:00 | 3,179 | 63.58% |
| Shoulder, 10:00–14:00 | 741 | 14.82% |
| Peak, 14:00–20:00 | 1,080 | 21.60% |

### Complete data dictionary

| Column | Meaning |
|---|---|
| `id` | Sequential row identifier |
| `device_id` | Meter that produced the reading |
| `captured_at` | Unix timestamp in seconds |
| `iso8601` | UTC time in ISO 8601 format |
| `local_timestamp_ist` | Human-readable Indian Standard Time |
| `voltage` | RMS voltage in volts |
| `current` | RMS current in amperes |
| `real_power_kw` | Active/real power in kilowatts |
| `apparent_power_kva` | Apparent power in kilovolt-amperes |
| `reactive_power_kvar` | Reactive power in kilovolt-amperes reactive |
| `energy_kwh` | Energy represented by the current one-minute interval |
| `total_energy_kwh` | Running cumulative energy |
| `frequency` | Supply frequency in hertz |
| `power_factor` | Real power divided by apparent power |
| `tariff_period` | Off-peak, shoulder, or peak band |
| `tariff_inr_per_kwh` | Applied rate in Indian rupees per kWh |
| `instant_cost_inr` | Cost assigned to the interval |
| `load_state` | Base Load, Normal, or High label |
| `quality_flag` | Data-quality/status label |
| `metadata` | JSON with source, phase, location, and sample interval |

### Quick analysis example

```python
import pandas as pd
import matplotlib.pyplot as plt

df = pd.read_csv("Smart Meter Domestic Dataset.csv")
df["time"] = pd.to_datetime(df["iso8601"], utc=True)

print(df.shape)  # (5000, 20)
print(df[["voltage", "current", "real_power_kw"]].describe())
print(df.groupby("tariff_period")["instant_cost_inr"].sum())

df.plot(
    x="time",
    y=["voltage", "current"],
    subplots=True,
    figsize=(12, 7),
    title=["Voltage", "Current"],
)
plt.tight_layout()
plt.show()
```

The CSV is not automatically imported into PostgreSQL by the current startup routine. It is ready for independent analysis, while online readings enter the database through the API.

## Electrical relationships

The dataset and backend use standard relationships:

| Quantity | Relationship |
|---|---|
| Apparent power | `S = V × I / 1000` kVA |
| Real power | `P = V × I × PF / 1000` kW |
| Reactive power | `Q = sqrt(max(S² - P², 0))` kVAR |
| Interval energy | `E = P × Δt / 3600` kWh when `P` is kW and `Δt` is seconds |
| Interval cost | `C = E × tariff rate` |

## Software architecture

| Layer | Technology | Responsibility |
|---|---|---|
| Frontend | React, TypeScript, Vite, Tailwind CSS | Pages, charts, account UI, settings, and exports |
| Live browser data | Fetch API and EventSource | JWT-protected REST requests and SSE updates |
| API | Node.js, Express, Zod | Validation, routes, errors, and HTTP responses |
| Security | JWT, bcryptjs, per-device API keys | User sessions and device ingestion |
| Data | PostgreSQL through `pg` | Users, devices, readings, and export history |
| Analytics | JavaScript services and Luxon | Time ranges, buckets, summaries, insights, and costs |
| Export | csv-stringify and ExcelJS | CSV and XLSX downloads |
| Edge | ESP32, EmonLib, HTTPClient, Blynk | Measurement and telemetry submission |

### Repository layout

```text
Smart-Meter-IoT/
├── Circuit Image.png
├── Circuit Scematic.png
├── PCB.png
├── PCB Fabrication/
│   ├── Smart Meter IoT-F_Cu.gbr
│   ├── Smart Meter IoT-B_Cu.gbr
│   ├── Smart Meter IoT-F_Mask.gbr
│   ├── Smart Meter IoT-B_Mask.gbr
│   ├── Smart Meter IoT-F_Silkscreen.gbr
│   ├── Smart Meter IoT-Edge_Cuts.gbr
│   ├── Smart Meter IoT-PTH.drl
│   ├── Smart Meter IoT-NPTH.drl
│   ├── Smart Meter IoT-job.gbrjob
│   └── Smart Meter IoT.kicad_prl
├── System Code.ino
├── Smart Meter Domestic Dataset.csv
├── Dashboard View/
│   └── 11 dashboard screenshots
├── src/
│   ├── components/
│   ├── hooks/
│   ├── styles/
│   └── utils/
├── scripts/
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── vercel.json
├── backend/
│   ├── src/index.js
│   ├── src/db-postgres.js
│   ├── src/routes/
│   ├── src/services/
│   └── render.yaml
├── LICENSE
├── LICENSE-DATA
├── LICENSE-HARDWARE
├── NOTICE
└── README.md
```

## Local setup

### Requirements

- Git
- Node.js 18 or newer
- npm
- PostgreSQL
- Arduino IDE 2.x for ESP32 firmware
- Python 3 with pandas and Matplotlib only if using the dataset example

### 1. Clone the repository

```bash
git clone https://github.com/Agnibha-31/Smart-Meter-IoT.git
cd Smart-Meter-IoT
```

### 2. Start PostgreSQL and the backend

Create a database named `smartmeter`, then install the backend:

```bash
cd backend
npm install
```

Create `backend/.env`:

```dotenv
PORT=5000
NODE_ENV=development
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/smartmeter
JWT_SECRET=replace_with_at_least_32_random_characters
JWT_EXPIRY=12h
CORS_ORIGIN=http://localhost:3000
BASE_TARIFF_PER_KWH=6.5
BACKEND_URL=http://localhost:5000
```

Start the API:

```bash
npm run dev
```

Check:

```text
http://localhost:5000/api/health
```

The server creates its PostgreSQL tables and indexes on startup.

> Do not use the built-in fallback `smart-meter-secret` in a real deployment. Do not expose `ADMIN_RESET_KEY` or a device API key.

### 3. Prepare the current frontend layout

The repository currently keeps application source in root `src/` and its Vite workspace in `scripts/`. Vite expects the source inside its workspace. The following temporary consolidation was build-tested against the audited snapshot:

```bash
cd ..
cp -R scripts frontend
cp -R src frontend/src
cd frontend
npm install
```

The committed frontend package manifest is missing dependencies imported by the source. Install them before building:

```bash
npm install \
  @vitejs/plugin-react-swc \
  react-hook-form recharts socket.io-client sonner \
  class-variance-authority cmdk embla-carousel-react input-otp \
  next-themes react-day-picker react-resizable-panels vaul \
  @radix-ui/react-accordion \
  @radix-ui/react-alert-dialog \
  @radix-ui/react-aspect-ratio \
  @radix-ui/react-avatar \
  @radix-ui/react-checkbox \
  @radix-ui/react-collapsible \
  @radix-ui/react-context-menu \
  @radix-ui/react-dialog \
  @radix-ui/react-dropdown-menu \
  @radix-ui/react-hover-card \
  @radix-ui/react-label \
  @radix-ui/react-menubar \
  @radix-ui/react-navigation-menu \
  @radix-ui/react-popover \
  @radix-ui/react-progress \
  @radix-ui/react-radio-group \
  @radix-ui/react-scroll-area \
  @radix-ui/react-select \
  @radix-ui/react-separator \
  @radix-ui/react-slider \
  @radix-ui/react-slot \
  @radix-ui/react-switch \
  @radix-ui/react-tabs \
  @radix-ui/react-toggle \
  @radix-ui/react-toggle-group \
  @radix-ui/react-tooltip
```

Create `frontend/.env`:

```dotenv
VITE_API_BASE=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
VITE_OPENWEATHER_API_KEY=your_optional_openweathermap_key
```

Run:

```bash
npm run dev
```

Open `http://localhost:3000`.

For a permanent repository fix, move `src/` into the Vite workspace, rename the package, add all imported dependencies to one `package.json`, regenerate the lock file, and update the Vercel root directory.

### 4. Register, create a device, and copy its key

1. Register an account.
2. Open **Device Configuration**.
3. Select the automatically created device or create another one.
4. Copy the device API key.
5. Put that key into `System Code.ino`.
6. Set `serverURL` to `http://YOUR_COMPUTER_LAN_IP:5000/api/readings` for local testing.

The ESP32 and computer must be able to reach each other on the network. `localhost` inside the ESP32 does not refer to the computer.

### 5. Correct and upload the firmware

Before flashing:

- resolve the ADC-pin mapping;
- correct timestamp and power semantics;
- verify the exact sensor supply voltages;
- enter Wi-Fi, Blynk, URL, and device-key values;
- calibrate with trusted instruments; and
- keep the mains side disconnected during low-voltage communication tests.

Select the correct ESP32 board and serial port, compile, upload, and open the serial monitor at 115200 baud.

## API reference

The API uses:

- `Authorization: Bearer <JWT>` for user routes; and
- `x-api-key: <device-key>` for meter ingestion.

| Method | Endpoint | Authentication | Purpose |
|---|---|---|---|
| GET | `/api/health` | None | Health and server time |
| GET | `/api/stream?token=...` | JWT query token | Live SSE readings |
| GET | `/api/auth/check-first-user` | None | Test whether users exist |
| POST | `/api/auth/check-email` | None | Check email availability |
| POST | `/api/auth/register` | None | Create account and default device |
| POST | `/api/auth/login` | None | Return JWT and profile |
| GET | `/api/auth/me` | Bearer JWT | Current profile |
| PATCH | `/api/auth/preferences` | Bearer JWT | Update profile/settings |
| POST | `/api/auth/change-password` | Bearer JWT | Change password |
| DELETE | `/api/auth/delete-account` | Bearer JWT | Delete account; see limitations |
| GET | `/api/auth/user-stats` | Admin JWT | User statistics |
| GET | `/api/devices` | Bearer JWT | List owned devices |
| POST | `/api/devices` | Bearer JWT | Create device |
| GET | `/api/devices/:deviceId` | Bearer JWT | Device details |
| POST | `/api/devices/:deviceId/regenerate-key` | Bearer JWT | Rotate device key |
| GET | `/api/devices/:deviceId/esp32-config` | Bearer JWT | Generate starter sketch |
| POST | `/api/readings` | Device API key | Store a reading |
| GET | `/api/readings/latest` | Bearer JWT | Latest reading |
| GET | `/api/readings/history` | Bearer JWT | Time-bucketed history |
| DELETE | `/api/readings/history` | Bearer JWT | Delete older readings |
| GET | `/api/readings/stats` | Bearer JWT | Storage statistics; see limitations |
| GET | `/api/analytics/summary` | Bearer JWT | Aggregated summary |
| GET | `/api/analytics/voltage-history` | Bearer JWT | Voltage series |
| GET | `/api/analytics/cost` | Bearer JWT | Cost projection |
| GET | `/api/export/preview` | Bearer JWT | Preview selected export |
| GET | `/api/export/readings` | Bearer JWT | Download CSV or XLSX |

Time-based routes accept combinations of `period`, `from`, `to`, `device_id`, and `interval_seconds`. Export routes also accept metric, format, metadata, and sampling options.

## Database model

```mermaid
erDiagram
    USERS ||--o{ DEVICES : owns
    USERS ||--o{ EXPORTS : creates
    DEVICES ||--o{ READINGS : records

    USERS {
        text id PK
        text email UK
        text password_hash
        text role
        text timezone
        text currency
        decimal base_tariff
    }
    DEVICES {
        text id PK
        text user_id FK
        text api_key UK
        text name
        bigint last_seen
    }
    READINGS {
        serial id PK
        text device_id FK
        bigint captured_at
        decimal voltage
        decimal current
        decimal real_power_kw
        decimal energy_kwh
    }
    EXPORTS {
        text id PK
        text user_id FK
        text format
        bigint range_from
        bigint range_to
    }
```

## Current limitations and corrections

This section is intentionally direct so another developer does not mistake a public prototype for a production-ready release.

| Priority | Finding | Required action |
|---|---|---|
| Critical | Firmware/circuit image use voltage GPIO34 and current GPIO35; schematic/Gerbers use the reverse | Make code, wiring, schematic, and PCB agree before powering |
| Critical | Sensor VDD nets are tied to 3.3 V without module-specific evidence | Verify module supply/output limits and redesign conditioning if required |
| Critical | The illustrated system handles 220 V AC | Obtain professional mains-safety and regulatory review |
| High | Firmware sends boot uptime as Unix timestamp | Omit it or use NTP epoch time |
| High | Firmware sends apparent power in the real-power field | Send `emon.realPower` as watts and report apparent power separately |
| High | New accounts receive a random device ID, while several frontend calls omit `device_id` and the API falls back to `meter-001` | Add a selected-device context and pass the user's device ID to every query |
| High | `/api/auth/delete-account` and `/api/readings/stats` import the legacy SQLite adapter while the active deployment uses PostgreSQL | Convert both routes to `db-postgres.js` and PostgreSQL-compatible queries |
| High | `/api/admin/reset-users` uses a body key, has an unsafe fallback, and calls a nonexistent PostgreSQL `persist()` method | Remove it or protect it with administrator JWT, no fallback, and a PostgreSQL transaction |
| High | The frontend source and Vite workspace are split; `scripts/package.json` is incomplete and misnamed | Consolidate the workspace and commit a corrected package manifest/lock |
| High | The backend dependency snapshot reports known security advisories | Update and retest dependencies before Internet-facing deployment |
| Medium | Root `Dashboard.tsx` starts a Socket.IO client, but the backend implements SSE and no Socket.IO server | Remove the unused Socket.IO path or implement one consistent live transport |
| Medium | SSE JWT appears in the URL query string | Prefer a short-lived stream token or cookie-based authenticated stream |
| Medium | CORS `allowedHeaders` omits `X-API-Key` | Add it if browser-based device ingestion is required |
| Medium | The seed script contains public demo credentials and its empty-database device path is inconsistent | Require seed credentials from environment and repair seed ordering |
| Medium | LCD wiring is illustrated but firmware has no display implementation | Add and test the selected I2C LCD library |
| Medium | Frequency detection, energy persistence, and interval/cumulative semantics need refinement | Rework and validate against calibrated instruments |
| Medium | Editable KiCad PCB/schematic source, BOM, and assembly documentation are absent | Add release-controlled design sources |
| Medium | No automated tests or CI workflow are present | Add backend, frontend, firmware, and data-validation tests |

During the 8 August 2026 audit, the hosted frontend returned HTTP 200, while the configured Render backend health URL did not return within 45 seconds. The hosted interface therefore should not be treated as proof that registration, storage, or live ingestion is currently available. Free hosting can sleep, but deployment logs and `/api/health` should be checked.

## Deployment notes

The intended hosted layout is:

```mermaid
flowchart LR
    A["Browser"] --> B["Vercel frontend"]
    B --> C["Render Express API"]
    C --> D[("Render PostgreSQL")]
    E["ESP32"] --> C
```

- `backend/render.yaml` defines the API and PostgreSQL services.
- `scripts/vercel.json` points the frontend to the hosted backend.
- The frontend folder/dependency problem must be fixed before relying on an automatic rebuild from this repository.
- Keep `JWT_SECRET`, database credentials, admin keys, weather keys, Blynk credentials, and device keys in environment settings.
- Add rate limiting, request-size limits, backups, monitoring, structured logs, dependency scanning, and recovery testing.
- Restrict CORS to the real frontend origins.
- Never publish live customer measurements without consent and an appropriate retention policy.

## Licensing

This is a multi-license repository because software, a dataset, and hardware designs need different legal treatment.

| Material | License | File |
|---|---|---|
| Original software, firmware, configuration, and documentation | Apache License 2.0 | [`LICENSE`](LICENSE) |
| `Smart Meter Domestic Dataset.csv` | Creative Commons Attribution 4.0 International | [`LICENSE-DATA`](LICENSE-DATA) |
| Original circuit/PCB design content, PCB render, and `PCB Fabrication/` | CERN Open Hardware Licence v2, Strongly Reciprocal | [`LICENSE-HARDWARE`](LICENSE-HARDWARE) |
| Scope, attribution, and third-party information | Informational notice | [`NOTICE`](NOTICE) |

Suggested dataset attribution:

> “Smart Meter Domestic Dataset,” Agnibha Basak, Smart Meter IoT, 2026, licensed under CC BY 4.0. https://github.com/Agnibha-31/Smart-Meter-IoT

Third-party libraries and attributed materials keep their own licenses. The repository licenses do not grant rights the author does not own and do not imply endorsement by CERN, Creative Commons, Blynk, OpenEnergyMonitor, Espressif, or any other third party.

`Circuit Image.png` appears to combine photographs or renders of commercial modules. If those source images were not created by the repository author, document their source/license or replace them with original visuals. The CERN hardware license can only cover rights the licensor actually owns. Apply the same ownership check to the dataset before publishing it under CC BY 4.0.

The licensing files are not a safety certificate and do not remove the user's responsibility to comply with electrical, data-protection, export, product, and local regulatory requirements.

## Suggested citation

```bibtex
@software{basak_smart_meter_iot_2026,
  author  = {Agnibha Basak},
  title   = {Smart Meter IoT},
  year    = {2026},
  url     = {https://github.com/Agnibha-31/Smart-Meter-IoT}
}
```

## Responsible contribution

Contributions are welcome for:

- consistent hardware pin mapping;
- editable KiCad source, BOM, and assembly files;
- safer sensor-interface design;
- firmware timestamp, power, energy, frequency, and LCD corrections;
- frontend workspace consolidation;
- PostgreSQL-only route cleanup;
- selected-device state;
- automated tests and CI;
- security hardening; and
- clearer calibration and validation reports.

For changes involving hardware, describe the exact board revision and attach design-rule/electrical-rule results. For software changes, avoid committing secrets and explain how the change was tested.

## Developer

### [Agnibha Basak](https://github.com/Agnibha-31)

For custom IoT dashboards, smart-energy platforms, ESP32 integration, data analytics, deployment, or business collaboration, mail at: [remix.play31@gmail.com](https://mail.google.com/mail/?view=cm&fs=1&to=remix.play31@gmail.com&su=Smart%20Meter%20IoT%20Dashboard%20Enquiry)

---

If this repository helps your research or development, please retain the applicable license notices and cite the project and dataset.
