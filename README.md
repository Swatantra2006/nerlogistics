# NER Logistics Intelligence Platform

## AI-Powered Smart Logistics & Accessibility Intelligence Platform for North Eastern Region

**Problem Statement: PS 26002 — Smart India Hackathon 2026**

---

## 🎯 Problem Statement

India's North Eastern Region faces significant logistics challenges due to difficult terrain, limited infrastructure, weather-related disruptions, and geographic isolation. This platform uses AI/ML to provide actionable logistics intelligence for the 8 NE states.

## 💡 Solution

An AI-powered intelligence platform that converts geographic, infrastructure, demand, and risk data into **actionable logistics decisions**. The platform features:

- **5 Real AI/ML Engines** — Not chatbot wrappers, but actual computation engines
- **Interactive NER Map** — Multi-layer geographic intelligence
- **Route Optimization** — Dijkstra-based weighted routing algorithm
- **Demand Forecasting** — Time-series seasonal decomposition
- **Risk Intelligence** — Multi-hazard composite assessment
- **Scenario Simulation** — What-if impact analysis
- **AI Copilot** — Data-driven query answering

## 🏗️ Features

| Module | Description |
|--------|-------------|
| Dashboard | 7 KPI cards, interactive map, alerts, state overview |
| Accessibility Intelligence | Multi-factor scoring for 40+ districts |
| AI Route Optimizer | Dijkstra routing with priority weights |
| Demand Forecasting | Time-series with confidence intervals |
| Risk Intelligence | Multi-hazard assessment, active alerts |
| Logistics Hubs | Capacity monitoring, utilization tracking |
| Infrastructure Gaps | Demand-supply mismatch detection |
| Scenario Simulator | Road closure, flood, demand surge simulation |
| Regional Analytics | 6 interactive charts and visualizations |
| NER AI Copilot | Intelligent query-based analytics |

## 🧠 AI/ML Approach

### Model 1: Accessibility Scoring
- **Algorithm**: Weighted multi-factor formula
- **Factors**: Road (22%), Rail (15%), Airport (13%), Travel Time (15%), Hub Proximity (15%), Infrastructure (10%), Risk (-10%)
- **Output**: 0-100 score with level classification

### Model 2: Route Optimization
- **Algorithm**: Dijkstra's shortest path with weighted edges
- **Edge weights**: Distance, time, cost, risk, accessibility
- **Priority modes**: Fastest, cheapest, safest, balanced
- **Output**: Multiple routes with scores and explanations

### Model 3: Demand Forecasting
- **Algorithm**: Linear regression + seasonal decomposition
- **Features**: Trend analysis, seasonality (monsoon), day-of-week patterns
- **Output**: 7-day and 30-day forecasts with confidence intervals

### Model 4: Risk Assessment
- **Algorithm**: Multi-hazard composite scoring
- **Factors**: Flood, landslide, earthquake, infrastructure, weather, connectivity
- **Output**: 0-100 risk score with severity levels

### Model 5: Infrastructure Gap Analysis
- **Algorithm**: Demand-supply mismatch with priority ranking
- **Formula**: Gap = Demand × Population × Accessibility Deficit × Risk
- **Output**: Priority rankings with intervention recommendations

## 📊 Dataset

| Data | Source | Type |
|------|--------|------|
| States & Districts | Real NER geography | Real coordinates/names |
| Population | Census-based estimates | Approximate real |
| Road Network | Real NH numbers | Real identifiers |
| Logistics Demand | Seeded synthetic | Consistent via deterministic seed |
| Weather | Seasonal patterns | Realistic synthetic |
| Risk Events | NER hazard profiles | Realistic synthetic |
| Hub Locations | Real logistics centers | Based on real locations |

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, TypeScript, React, Tailwind CSS
- **Maps**: Leaflet + OpenStreetMap
- **Charts**: Recharts
- **AI/ML**: TypeScript-based computation engines
- **Routing**: Dijkstra algorithm implementation
- **Icons**: Lucide React

## 🚀 Installation

```bash
# Clone the repository
cd SIH_2026

# Install dependencies
npm install

# Start development server
npm run dev

# Open in browser
# http://localhost:3000
```

## 🔧 Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

The platform runs fully in **demo mode** without any API keys.

| Variable | Required | Description |
|----------|----------|-------------|
| `AI_PROVIDER` | No | AI provider (default: demo) |
| `AI_API_KEY` | No | LLM API key for enhanced copilot |
| `NEXT_PUBLIC_MAP_TILE_URL` | No | Map tile provider URL |
| `NEXT_PUBLIC_DEMO_MODE` | No | Enable demo mode (default: true) |

## 🎬 Demo Flow (3-5 minutes)

1. **Landing Page** → Click "Explore NER Intelligence"
2. **Dashboard** → Show KPIs, explore NER map with layers
3. **Accessibility** → Click Tawang (score: 22) → See factor breakdown
4. **Route Optimizer** → Guwahati → Tawang, 500kg, Safest → Compare routes
5. **Risk Intelligence** → View monsoon alerts on NH-13
6. **Scenario Simulator** → Close NH-13 → See cascade impact
7. **AI Copilot** → "What is the best intervention for Tawang?" → Evidence-based response

## 📁 Project Structure

```
src/
├── app/                          # Next.js pages
│   ├── page.tsx                  # Landing page
│   ├── layout.tsx                # Root layout
│   ├── globals.css               # Global styles
│   └── dashboard/                # Dashboard pages
│       ├── page.tsx              # Main dashboard
│       ├── layout.tsx            # Dashboard layout
│       ├── accessibility/        # Accessibility module
│       ├── route-optimizer/      # Route optimization
│       ├── demand/               # Demand forecasting
│       ├── risk/                 # Risk intelligence
│       ├── hubs/                 # Logistics hubs
│       ├── infrastructure/       # Infrastructure gaps
│       ├── simulator/            # Scenario simulator
│       ├── analytics/            # Regional analytics
│       └── copilot/              # AI Copilot
├── components/
│   ├── layout/Sidebar.tsx        # Navigation sidebar
│   └── maps/NERMap.tsx           # Interactive map
├── data/
│   └── ner-data.ts               # Seeded demo dataset
├── lib/
│   └── utils.ts                  # Utility functions
├── modules/
│   ├── accessibility/engine.ts   # Accessibility scoring
│   ├── routing/engine.ts         # Route optimization
│   ├── demand/engine.ts          # Demand forecasting
│   ├── risk/engine.ts            # Risk assessment
│   ├── infrastructure/engine.ts  # Gap analysis
│   ├── scenario/engine.ts        # Scenario simulation
│   └── copilot/engine.ts         # AI copilot
└── types/
    └── index.ts                  # Type definitions
```

## ⚠️ Real vs. Demo Data

- ✅ **Real computation**: All AI/ML algorithms run actual calculations
- ✅ **Real geography**: State/district names, coordinates, and relationships
- ⚡ **Synthetic data**: Demand history, weather, risk events (seeded for consistency)
- 🔧 **Configurable**: LLM API integration via environment variables

## 🔮 Future Improvements

- [ ] PostgreSQL database with real-time data ingestion
- [ ] Live weather API integration
- [ ] Real traffic data from Google/MapmyIndia
- [ ] Authentication and role-based access
- [ ] Mobile-responsive PWA
- [ ] PDF/Excel report generation
- [ ] WebSocket real-time alerts
- [ ] Multi-language support (Hindi, Assamese, etc.)
- [ ] Integration with government logistics APIs

---

**Built for Smart India Hackathon 2026 | PS 26002**
