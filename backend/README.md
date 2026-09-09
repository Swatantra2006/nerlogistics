# PS 26002 — NER Logistics Intelligence Backend API

> **AI-Based Smart Logistics and Accessibility Intelligence Platform for the North Eastern Region (NER)**  
> High-performance FastAPI backend providing geospatial analytics, multi-criteria route optimization, hazard risk intelligence, predictive demand forecasting, infrastructure deficit analysis, and interactive AI decision support.

---

## 🌟 Architecture Overview

```
                          Frontend (Next.js 14)
                   https://nerlogistics.vercel.app
                                 │
                     API Client (src/lib/api.ts)
                                 │
                   REST + Geospatial API (Port 8000)
                                 │
        ┌────────────────────────┼────────────────────────┐
        │                        │                        │
  Spatial Queries          AI/ML Engines           ORM & Database
  • Haversine              • Dijkstra Routing      • SQLite (Zero-config)
  • Radius Search          • Multi-Hazard Risk     • PostgreSQL / PostGIS
  • Bounding Box           • Demand Forecasting    • Automatic Seed Data
  • Distance Matrix        • AI Copilot & Scenario
```

---

## 🚀 Quick Start (Zero-Config SQLite)

### 1. Set up Python Environment
```bash
cd backend
python -m venv venv

# Windows:
.\venv\Scripts\activate

# Linux/macOS:
source venv/bin/activate

# Install dependencies:
pip install -r requirements.txt
```

### 2. Run the Server
```bash
python run.py
```
The server will start at `http://localhost:8000`.
- **Interactive Swagger Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc:** [http://localhost:8000/redoc](http://localhost:8000/redoc)
- **Health Check:** [http://localhost:8000/api/health](http://localhost:8000/api/health)

*Note: Database tables and comprehensive NER datasets (8 states, 24 districts, hubs, roads, multimodal transit, risk events, demand histories) are automatically verified and seeded on first startup.*

---

## 🐳 Docker Deployment (PostgreSQL + PostGIS)

To launch both PostgreSQL with PostGIS extension and the FastAPI backend:
```bash
cd backend
docker-compose up -d --build
```

---

## 📡 API Endpoints Reference

### 1. Geospatial & Spatial Queries (`/api/spatial`)
- `GET /api/spatial/nearest-hubs?lat=27.58&lng=91.86&limit=5` — Find nearest hubs to any coordinate using Haversine formula.
- `GET /api/spatial/radius-search?lat=26.14&lng=91.73&radius_km=150` — Find all hubs, airports, rail terminals, and districts within a radius.
- `GET /api/spatial/bbox?min_lat=24.0&min_lng=91.0&max_lat=28.0&max_lng=96.0` — Query infrastructure within geographic bounding box.
- `POST /api/spatial/distance-matrix` — Pairwise distance matrix computation between sets of coordinates.

### 2. Route Optimization (`/api/routing`)
- `POST /api/routing/optimize` — Multi-criteria Dijkstra optimization considering distance, travel time, cost, terrain risk, and accessibility:
```json
{
  "origin": "guwahati",
  "destination": "tawang",
  "priority": "safest",
  "cargoWeight": 2500,
  "avoidRisks": true
}
```
- `GET /api/routing/graph` — Multimodal graph topology with nodes, edge weights, and route waypoints.

### 3. Accessibility Intelligence (`/api/accessibility`)
- `GET /api/accessibility/districts` — Multi-factor weighted accessibility scores for all 24 NER districts.
- `GET /api/accessibility/districts/{id}` — In-depth breakdown (road connectivity, rail access, airport proximity, travel time, hub distance, risk penalty).
- `GET /api/accessibility/summary` — Regional summary KPIs and score distributions.

### 4. Risk Intelligence & Hazard Monitoring (`/api/risk`)
- `GET /api/risk/districts` — Comprehensive multi-hazard risk assessment (floods, landslides, seismic activity, weather disruptions).
- `GET /api/risk/events` — Active and historical alerts (Sela Pass landslide, Brahmaputra floods, road blockages).
- `GET /api/risk/weather/{district_id}` — 30-day synthetic meteorological simulation (rainfall, temperature, humidity, hazard risk).

### 5. Demand Forecasting (`/api/demand`)
- `GET /api/demand/forecasts` — 7-day and 30-day predictive freight volume with trend analysis.
- `GET /api/demand/forecasts/{district_id}` — Historical 30-day trend + 14-day forward predictions with confidence intervals.
- `GET /api/demand/top` — Top high-demand freight centers ranked by tonnage.

### 6. Infrastructure Gap Analysis (`/api/infrastructure`)
- `GET /api/infrastructure/gaps` — Composite deficit scores, prioritized bottlenecks, and specific intervention recommendations.
- `GET /api/infrastructure/by-state` — Aggregated investment estimates (₹ Crores) per state.

### 7. Scenario Simulator (`/api/scenario`)
- `POST /api/scenario/simulate` — What-if cascade simulation for road closures, landslides, flash floods, demand surges, or new logistics hubs.
- `GET /api/scenario/presets` — Curated realistic disruption presets (e.g., NH-13 Tawang closure, NH-10 Sikkim highway blockage).

### 8. AI Copilot (`/api/copilot`)
- `POST /api/copilot/query` — Natural language intent classification and real-time analytical responses.
- `GET /api/copilot/suggestions` — Sample queries and decision prompt templates.

### 9. Multi-Modal Logistics Assets (`/api/logistics`)
- `GET /api/logistics/hubs` — All regional and central logistics hubs with capacity and utilization.
- `GET /api/logistics/roads` — Operational status and highway specifications.
- `GET /api/logistics/airports` — Commercial and cargo airstrips.
- `GET /api/logistics/railway-stations` — Rail freight terminals and junctions.
- `GET /api/logistics/kpis` — High-level regional dashboard KPIs.

---

## 🔐 Default Authentication Credentials

| Role | Username | Password | Access Level |
|------|----------|----------|--------------|
| **Administrator** | `admin` | `admin123` | Full system administration |
| **Operator** | `operator` | `operator123` | Route optimization & alerts dispatch |
| **Viewer** | `viewer` | `user123` | Analytics and dashboard read-only |

---

## 🔗 Connecting to the Existing Frontend

The frontend at `nerlogistics.vercel.app` connects to this backend via [src/lib/api.ts](file:///c:/Users/dell/Desktop/SIH_2026/src/lib/api.ts).

To configure the API endpoint in the frontend:
Create or edit `.env.local` in the project root:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```
When `NEXT_PUBLIC_API_URL` is set, all frontend components fetch live computed data from the backend, with automatic fallback to client-side data if the backend is offline.
