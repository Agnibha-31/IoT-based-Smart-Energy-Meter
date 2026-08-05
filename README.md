<div align="center">

# Smart Meter IoT Dashboard

### From connected electrical measurements to live insight, cost awareness, and exportable energy data

[![Code License: Apache-2.0](https://img.shields.io/badge/Code%20License-Apache%202.0-blue.svg)](LICENSE)
[![Dataset License: CC BY 4.0](https://img.shields.io/badge/Dataset%20License-CC%20BY%204.0-green.svg)](DATA_LICENSE.md)
[![React](https://img.shields.io/badge/React-18.2-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Express](https://img.shields.io/badge/Express-4.19-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-active-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![ESP32](https://img.shields.io/badge/ESP32-ready-E7352C?logo=espressif&logoColor=white)](https://www.espressif.com/en/products/socs/esp32)
[![Dataset](https://img.shields.io/badge/Recorded%20dataset-5%2C000%20readings-16A34A)](Smart%20Meter%20Domestic%20Dataset.csv)
[![Last commit](https://img.shields.io/github/last-commit/Agnibha-31/Smart-Meter-IoT)](https://github.com/Agnibha-31/Smart-Meter-IoT/commits/main)

[**Open the live dashboard**](https://iot-based-smart-meter-dashboard.vercel.app) ·
[**See the visual tour**](#dashboard-tour) ·
[**Explore the dataset**](Smart%20Meter%20Domestic%20Dataset.csv) ·
[**View the source**](https://github.com/Agnibha-31/Smart-Meter-IoT)

</div>

---

**Smart Meter IoT** is a full-stack energy-monitoring project that turns time-stamped electrical readings into a clear, responsive dashboard. It helps a user follow voltage, current, power, energy, frequency, power factor, electricity cost, device status, and historical trends from one interface.

The repository brings together the dashboard, REST API, live event stream, PostgreSQL data layer, ESP32 connection workflow, recorded project dataset, export tools, and complete screen gallery.

## Explore in 60 seconds

| 5,000 readings | 1-minute sampling | 20 data fields |
|:---:|:---:|:---:|
| **83 h 19 min** of recorded data | **11** dashboard views | **CSV + XLSX** export |

**Choose your path:**

- Want to understand the idea? Start with [How it works](#how-it-works).
- Want to see the interface? Jump to the [Dashboard tour](#dashboard-tour).
- Want to analyse the measurements? Open the [Recorded dataset](#recorded-project-dataset).
- Want to connect or develop it? Continue to [Live data and ESP32](#live-data-and-esp32) and [Quick start](#quick-start).

## How it works

```mermaid
flowchart TD
    A["Smart meter or ESP32"] -->|"JSON reading + device API key"| B["Express REST API"]
    B --> C["Validation and electrical calculations"]
    C --> D[("PostgreSQL")]
    D --> E["Analytics, cost and exports"]
    B -->|"Server-Sent Event"| F["React dashboard"]
    E --> F
```

Every reading follows the same easy-to-understand journey:

1. **Measure** — a connected device supplies electrical values such as voltage, current, power, energy, frequency, and power factor.
2. **Authenticate** — the backend identifies the device through its `x-api-key`.
3. **Validate and enrich** — input validation and electrical relationships produce a consistent reading.
4. **Store** — PostgreSQL keeps users, devices, readings, and export history.
5. **Update live** — the browser receives a Server-Sent Event without requiring a manual page refresh.
6. **Understand and export** — the dashboard converts readings into trends, summaries, costs, and downloadable files.

## What can the dashboard do?

| Capability | What the user sees |
|---|---|
| **Live overview** | Latest electrical values, device status, summary cards, trends, weather context, and quick navigation |
| **Voltage and current monitoring** | Average, minimum, peak, RMS, variation, load factor, and time-series behaviour |
| **Power analysis** | Real, apparent, and reactive power; power factor; peak demand; distribution; and trend views |
| **Energy intelligence** | Interval and cumulative energy, efficiency indicators, consumption patterns, and time-based comparisons |
| **Cost calculation** | Tariff-aware cost totals, daily/monthly projections, peak-period impact, and saving opportunities |
| **Analytics** | Historical bucketing, selectable periods, summary values, chart exploration, and automated observations |
| **Data management** | Metric selection, date ranges, sampling intervals, preview, CSV/XLSX export, retention, and deletion controls |
| **Device configuration** | Per-user devices, API-key management, endpoint details, sample payloads, and an ESP32 starter sketch |
| **Personalisation** | Theme, refresh rate, notifications, language, currency, time zone, location, tariff, and account preferences |

## Dashboard tour

Every screenshot stored in `Dashboard View/` is embedded below, so the complete interface can be explored without opening image files individually.

### 1. Create an account and enter the dashboard

The entry screen provides a focused registration and sign-in experience before loading user-specific devices, settings, and measurements.

<p align="center">
  <img src="Dashboard%20View/SignUp%20Page.png" alt="Smart Meter IoT account registration and sign-in page" width="900">
</p>

### 2. Understand the system at a glance

The overview brings the most useful information together: live measurements, consumption summaries, trends, device state, and supporting context.

<p align="center">
  <img src="Dashboard%20View/Data%20Overview%20Page.png" alt="Smart Meter IoT data overview dashboard" width="900">
</p>

<table>
  <tr>
    <td width="50%" valign="top">
      <strong>3. Voltage monitoring</strong><br><br>
      Follow average, high, and low voltage behaviour over time and recognise unusual movement quickly.<br><br>
      <img src="Dashboard%20View/Voltage%20Data%20Page.png" alt="Voltage monitoring page with voltage summaries and time-series charts" width="100%">
    </td>
    <td width="50%" valign="top">
      <strong>4. Current monitoring</strong><br><br>
      Explore current demand, RMS behaviour, load factor, peaks, and the way connected loads change over time.<br><br>
      <img src="Dashboard%20View/Current%20Data%20Page.png" alt="Current monitoring page with current and load-factor analytics" width="100%">
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <strong>5. Power analysis</strong><br><br>
      Compare real, apparent, and reactive power together with power factor, demand, and distribution views.<br><br>
      <img src="Dashboard%20View/Power%20Data%20Page.png" alt="Power analysis page with power values, distribution, and trends" width="100%">
    </td>
    <td width="50%" valign="top">
      <strong>6. Energy monitoring</strong><br><br>
      Understand interval consumption, cumulative energy, efficiency, usage patterns, and historical change.<br><br>
      <img src="Dashboard%20View/Energy%20Data%20Page.png" alt="Energy monitoring page with consumption and efficiency charts" width="100%">
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <strong>7. Data analytics</strong><br><br>
      Select periods and metrics, inspect historical patterns, and turn large reading sets into understandable summaries.<br><br>
      <img src="Dashboard%20View/Data%20Analytics%20Page.png" alt="Data analytics page with historical charts and summary metrics" width="100%">
    </td>
    <td width="50%" valign="top">
      <strong>8. Cost calculation</strong><br><br>
      Translate energy use into tariff-aware costs, projections, peak-period impact, and practical saving insight.<br><br>
      <img src="Dashboard%20View/Cost%20Calculation%20Page.png" alt="Electricity cost calculation and projection page" width="100%">
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <strong>9. Data management</strong><br><br>
      Choose metrics, time ranges, and sampling rates; preview the result; then export it as CSV or Excel.<br><br>
      <img src="Dashboard%20View/Data%20Management%20Page.png" alt="Smart-meter data management, preview, and export page" width="100%">
    </td>
    <td width="50%" valign="top">
      <strong>10. Device configuration</strong><br><br>
      Create and manage a meter, obtain its API key, inspect its endpoint, and generate ESP32 connection code.<br><br>
      <img src="Dashboard%20View/Device%20Configuration%20Page.png" alt="ESP32 smart-meter device configuration page" width="100%">
    </td>
  </tr>
</table>

### 11. Personalise the experience

Settings bring language, location, time zone, currency, tariff, display, refresh, notification, retention, and account preferences into one place.

<p align="center">
  <img src="Dashboard%20View/Settings%20Page.png" alt="Smart Meter IoT personal and application settings page" width="900">
</p>

## Recorded project dataset

The repository includes [`Smart Meter Domestic Dataset.csv`](Smart%20Meter%20Domestic%20Dataset.csv), containing **5,000 ordered readings** from project meter `meter-001`. The file covers electrical behaviour, energy accumulation, tariff periods, cost, load state, timestamps, and recording context. Every record contains valid JSON metadata identifying the source as `recorded_system`, together with the single-phase configuration, `IN-WB` location, and 60-second sampling interval.

### Dataset snapshot

| Property | Verified value |
|---|---:|
| Metadata source | `recorded_system` in all 5,000 readings |
| Records | 5,000 |
| Columns | 20 |
| Sampling interval | 60 seconds |
| UTC coverage | 31 July 2026, 17:31 → 4 August 2026, 04:50 |
| IST coverage | 31 July 2026, 23:01 → 4 August 2026, 10:20 |
| Total duration | 83 hours 19 minutes |
| Missing cells | 0 |
| Duplicate complete rows | 0 |
| Duplicate ISO timestamps | 0 |
| Quality flag | `Normal` for all 5,000 readings |
| Sum of interval energy | 64.353517 kWh |
| Sum of interval cost | ₹374.415060 |

### What range does the data cover?

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

```mermaid
pie showData
    title Load-state distribution across 5,000 readings
    "Base Load" : 2762
    "Normal" : 2027
    "High" : 211
```

| Tariff period | Readings | Share |
|---|---:|---:|
| Off-Peak, 20:00–10:00 | 3,179 | 63.58% |
| Shoulder, 10:00–14:00 | 741 | 14.82% |
| Peak, 14:00–20:00 | 1,080 | 21.60% |

<details>
<summary><strong>Open the complete 20-column data dictionary</strong></summary>

| Column | Simple meaning |
|---|---|
| `id` | Sequential reading identifier |
| `device_id` | Meter that produced the reading |
| `captured_at` | Unix timestamp in seconds |
| `iso8601` | UTC timestamp in ISO 8601 format |
| `local_timestamp_ist` | Human-readable Indian Standard Time |
| `voltage` | RMS supply voltage in volts |
| `current` | RMS current in amperes |
| `real_power_kw` | Useful/active power in kilowatts |
| `apparent_power_kva` | Combined apparent power in kilovolt-amperes |
| `reactive_power_kvar` | Reactive component in kilovolt-amperes reactive |
| `energy_kwh` | Energy represented by the current sampling interval |
| `total_energy_kwh` | Running cumulative energy total |
| `frequency` | Supply frequency in hertz |
| `power_factor` | Ratio of real power to apparent power |
| `tariff_period` | Off-peak, shoulder, or peak time band |
| `tariff_inr_per_kwh` | Electricity rate applied to the reading |
| `instant_cost_inr` | Cost associated with that interval |
| `load_state` | Base Load, Normal, or High classification |
| `quality_flag` | Quality/status label for the reading |
| `metadata` | JSON recording context containing the source (`recorded_system`), phase (`single`), location (`IN-WB`), and sampling interval (`60` seconds) |

</details>

<details>
<summary><strong>Open a quick Python analysis example</strong></summary>

```python
import pandas as pd

df = pd.read_csv("Smart Meter Domestic Dataset.csv")
df["time"] = pd.to_datetime(df["iso8601"], utc=True)

print(df.shape)                       # (5000, 20)
print(df[["voltage", "current"]].describe())
print(df.groupby("tariff_period")["instant_cost_inr"].sum())

df.plot(x="time", y=["voltage", "current"], subplots=True)
```

</details>

### Electrical relationships used in the project

The calculations stay transparent and traceable:

| Quantity | Relationship |
|---|---|
| Apparent power | $S = V I / 1000$ kVA |
| Real power | $P = V I \times PF / 1000$ kW |
| Reactive power | $Q = \sqrt{\max(S^2-P^2,0)}$ kVAR |
| Interval energy | $E = P \times \Delta t / 3600$ kWh, with $\Delta t$ in seconds |
| Interval cost | $C = E \times$ tariff rate |

The backend additionally buckets readings by time, calculates averages and peaks, estimates costs, and prepares user-selected export datasets.

## Live data and ESP32

```mermaid
sequenceDiagram
    participant M as Meter / ESP32
    participant A as Express API
    participant P as PostgreSQL
    participant D as Dashboard
    M->>A: POST /api/readings + x-api-key
    A->>A: Validate and complete metrics
    A->>P: Store time-stamped reading
    A-->>D: Publish live SSE update
    D->>A: Request summary or history with JWT
    A->>P: Aggregate requested period
    P-->>D: Return chart and summary data
```

The Device Configuration page generates an ESP32 sketch containing:

- Wi-Fi connection setup;
- the selected device ID and API key;
- an HTTP `POST` request to `/api/readings`;
- an ArduinoJson payload;
- configurable sending intervals; and
- clearly marked sensor-reading functions ready to be connected to the chosen metering hardware.

A generated sketch uses starter reading functions so the communication path can be tested first. Replace those functions with readings from the real metering module used in the final hardware. The included comments use a PZEM-004T as one possible example; other compatible sensing arrangements can use the same API contract.

### Minimal device payload

```http
POST /api/readings
Content-Type: application/json
x-api-key: YOUR_DEVICE_API_KEY
```

```json
{
  "voltage": 230.5,
  "current": 1.23,
  "power": 283.5,
  "energy": 0.14,
  "frequency": 50.0,
  "power_factor": 0.97,
  "metadata": {
    "phase": "single",
    "location": "IN-WB"
  }
}
```

## Application structure

| Layer | Main technologies | Responsibility |
|---|---|---|
| Interface | React, TypeScript, Tailwind CSS, Framer Motion, Recharts | Pages, charts, navigation, settings, forms, and responsive presentation |
| Browser services | Fetch API, EventSource, local storage | REST calls, JWT session state, and live SSE subscription |
| Backend | Node.js, Express, Zod, JWT, bcryptjs | Authentication, validation, device access, readings, analytics, and exports |
| Data | PostgreSQL | Persistent users, devices, readings, indexes, and export history |
| Export | csv-stringify, ExcelJS | Downloadable CSV and XLSX datasets |
| Edge device | ESP32, WiFi, HTTPClient, ArduinoJson | Authenticated measurement delivery over Wi-Fi |
| Deployment | Vercel, Render | Hosted frontend, backend, health checks, and environment configuration |

```text
Smart-Meter-IoT/
├── src/                              # React and TypeScript dashboard source
│   ├── components/                   # Login, layout, settings, pages, and UI elements
│   ├── hooks/                        # Telemetry hooks
│   ├── styles/                       # Dashboard styling
│   └── utils/                        # API, live data, currency, rates, and notifications
├── backend/
│   ├── src/index.js                  # Express entry point and SSE stream
│   ├── src/routes/                   # Auth, devices, readings, analytics, exports, admin
│   ├── src/services/                 # Business and aggregation logic
│   ├── src/db-postgres.js            # Active PostgreSQL adapter and schema setup
│   └── render.yaml                   # Backend and database deployment blueprint
├── scripts/                          # Vite, TypeScript, Tailwind, and Vercel configuration
├── Dashboard View/                   # All 11 dashboard screenshots shown above
├── Smart Meter Domestic Dataset.csv  # 5,000 recorded project readings
└── README.md
```

<details>
<summary><strong>Open implementation-path notes</strong></summary>

- The primary backend path is `backend/src/index.js` → `backend/src/db-postgres.js` → PostgreSQL.
- Earlier SQLite-oriented files and the schema in `backend/models/ReadingModel.js` remain as development-history references; the active server starts with the PostgreSQL adapter.
- The current live frontend helper uses Server-Sent Events through `/api/stream`.
- The CSV is ready for direct analysis, while new online readings enter PostgreSQL through the authenticated API. A historical-import routine can be added whenever the recorded file should seed a deployment database.
- Dashboard analytics use explainable electrical relationships and time aggregation rather than a machine-learning inference model.

</details>

## Quick start

### Fastest ways to explore

1. Open the [hosted dashboard](https://iot-based-smart-meter-dashboard.vercel.app).
2. Browse the [complete visual tour](#dashboard-tour).
3. Download and analyse [`Smart Meter Domestic Dataset.csv`](Smart%20Meter%20Domestic%20Dataset.csv).

### Local requirements

- Git
- Node.js 18 or newer
- npm
- PostgreSQL
- Arduino IDE 2.x when connecting an ESP32

<details>
<summary><strong>1. Start the PostgreSQL backend</strong></summary>

Clone the repository and install the backend packages:

```bash
git clone https://github.com/Agnibha-31/Smart-Meter-IoT.git
cd Smart-Meter-IoT/backend
npm install
```

Create `backend/.env` with deployment-specific values:

```dotenv
PORT=5000
NODE_ENV=development
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/smartmeter
JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRY=12h
CORS_ORIGIN=http://localhost:3000
DEVICE_ID=meter-001
DEVICE_API_KEY=replace_with_a_device_bootstrap_key
BASE_TARIFF_PER_KWH=6.5
BACKEND_URL=http://localhost:5000
```

Create the `smartmeter` PostgreSQL database, then start the server:

```bash
npm run dev
```

The startup routine creates the required tables and indexes. Confirm the API at:

```text
http://localhost:5000/api/health
```

</details>

<details>
<summary><strong>2. Prepare and start the frontend workspace</strong></summary>

The repository snapshot keeps the application source in `/src` and its Vite workspace files in `/scripts`. A convenient local layout is to bring both into one frontend folder:

```bash
cd Smart-Meter-IoT
cp -R scripts frontend
cp -R src frontend/src
cd frontend
npm install
npm install recharts socket.io-client sonner react-hook-form \
  @radix-ui/react-dialog @radix-ui/react-dropdown-menu \
  @radix-ui/react-select @radix-ui/react-tabs
npm install --save-dev @vitejs/plugin-react-swc
```

Create `frontend/.env`:

```dotenv
VITE_API_BASE=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

Start Vite:

```bash
npm run dev
```

Then open `http://localhost:3000` and register the first account.

</details>

<details>
<summary><strong>3. Connect an ESP32</strong></summary>

1. Sign in and open **Device Configuration**.
2. Create or select a meter.
3. Copy the generated sketch.
4. Add the Wi-Fi SSID and password.
5. Connect the sketch's reading functions to the physical sensor library.
6. Keep the generated device ID, endpoint, and API key together.
7. Upload the sketch and monitor the serial console at 115200 baud.
8. Confirm that new readings appear in the dashboard.

Treat device API keys like passwords. Regenerate a key if it is exposed, then update the firmware with the replacement.

</details>

## API at a glance

The API uses two clear authentication paths:

- **User requests:** `Authorization: Bearer <JWT>`
- **Meter ingestion:** `x-api-key: <device-key>`

| Route group | Main endpoints | Purpose |
|---|---|---|
| Health and live data | `GET /api/health`, `GET /api/stream` | Service status and authenticated SSE updates |
| Authentication | `/api/auth/*` | Registration, login, current user, preferences, password, and account management |
| Devices | `/api/devices/*` | Create/list devices, inspect a device, rotate its key, and obtain ESP32 configuration |
| Readings | `/api/readings/*` | Ingest, fetch latest/history, remove selected history, and inspect storage statistics |
| Analytics | `/api/analytics/*` | Summary, voltage history, time buckets, and cost projection |
| Export | `/api/export/*` | Preview selections and download CSV or XLSX files |

<details>
<summary><strong>Open the core endpoint reference</strong></summary>

| Method | Endpoint | Authentication | Result |
|---|---|---|---|
| `GET` | `/api/health` | None | API health and current server time |
| `POST` | `/api/auth/register` | None | New user, JWT, and profile |
| `POST` | `/api/auth/login` | None | JWT and profile |
| `GET` | `/api/auth/me` | Bearer JWT | Current profile |
| `PATCH` | `/api/auth/preferences` | Bearer JWT | Updated settings |
| `GET` | `/api/devices` | Bearer JWT | User-owned devices |
| `POST` | `/api/devices` | Bearer JWT | New device and API key |
| `GET` | `/api/devices/:deviceId` | Bearer JWT | Device details |
| `POST` | `/api/devices/:deviceId/regenerate-key` | Bearer JWT | Replacement device key |
| `GET` | `/api/devices/:deviceId/esp32-config` | Bearer JWT | Endpoint, payload, and generated sketch |
| `POST` | `/api/readings` | Device API key | Stored reading |
| `GET` | `/api/readings/latest` | Bearer JWT | Latest reading |
| `GET` | `/api/readings/history` | Bearer JWT | Bucketed historical series |
| `GET` | `/api/analytics/summary` | Bearer JWT | Period summary |
| `GET` | `/api/analytics/voltage-history` | Bearer JWT | Voltage series |
| `GET` | `/api/analytics/cost` | Bearer JWT | Cost projection |
| `GET` | `/api/export/preview` | Bearer JWT | Export preview |
| `GET` | `/api/export/readings` | Bearer JWT | CSV or XLSX download |
| `GET` | `/api/stream?token=...` | JWT query token | Live SSE connection |

Time-based endpoints accept combinations such as `period`, `from`, `to`, `device_id`, and `interval_seconds`. Export routes also accept metric, format, metadata, and sampling selections.

</details>

## Data model

```mermaid
erDiagram
    USERS ||--o{ DEVICES : owns
    USERS ||--o{ EXPORTS : creates
    DEVICES ||--o{ READINGS : records

    USERS {
        text id PK
        text email UK
        text password_hash
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

The server creates this PostgreSQL structure on startup and adds indexes for user email, user-owned devices, and device/time reading searches.

## Deployment

The included deployment files connect the three main hosted parts:

```mermaid
flowchart LR
    A["Browser"] --> B["Vercel frontend"]
    B --> C["Render Express API"]
    C --> D[("PostgreSQL")]
    E["ESP32 device"] --> C
```

- `scripts/vercel.json` contains the Vite frontend build and API-base configuration.
- `backend/render.yaml` describes the Node backend, PostgreSQL service, health check, and environment values.
- Production secrets such as `JWT_SECRET`, database credentials, reset credentials, and device keys belong in the hosting provider's environment settings.

<details>
<summary><strong>Open the deployment review checklist</strong></summary>

Before a public operational deployment, review these items for the chosen environment:

- keep all secrets and private keys in environment variables;
- restrict maintenance and user-statistics endpoints to authorised administrators;
- avoid printing API keys or personal information in application logs;
- align account deletion and database-statistics operations with the PostgreSQL adapter;
- consolidate the frontend workspace and dependency manifest;
- standardise live delivery on the SSE implementation used by the API;
- add automated API, authentication, analytics, and frontend tests;
- add rate limiting, structured logging, backups, monitoring, and recovery checks;
- validate meter isolation, fusing, enclosure, conductor rating, and installation with a qualified electrical professional.

</details>

## Suggested next steps

 - Add a historical CSV-to-PostgreSQL import command.
 -  Consolidate `/src` and `/scripts` into a single frontend workspace.
 -  Add automated tests and a continuous-integration workflow.
 -  Add per-device alert rules for voltage, current, power, and connection state.
 -  Add calibration and sensor-quality documentation for the selected meter hardware.
 -  Add longer recorded sessions and multi-device comparison views.
 -  Add a Progressive Web App mode for installable mobile use.

## Use, collaboration, and licensing

The Smart Meter IoT Dashboard source code and project documentation are available under the [Apache License 2.0](LICENSE), supporting transparent research, development, modification, and commercial integration while preserving the applicable copyright and attribution notices.

The recorded [`Smart Meter Domestic Dataset.csv`](Smart%20Meter%20Domestic%20Dataset.csv) is separately available under the [Creative Commons Attribution 4.0 International License](DATA_LICENSE.md).

Third-party dependencies and attributed materials remain governed by their respective licenses. For organisation-specific dashboards, commercial integrations, hardware adaptation, deployment support, or customised analytics, enquiries are welcome through the developer contact provided below.

## Developer

### [Agnibha Basak](https://github.com/Agnibha-31)

For custom IoT dashboards, smart-energy platforms, ESP32 integration, data analytics, deployment, or business collaboration, click the address below to open a ready-to-write email: [remix.play31@gmail.com](https://mail.google.com/mail/?view=cm&fs=1&to=remix.play31@gmail.com&su=Smart%20Meter%20IoT%20Dashboard%20Enquiry)
