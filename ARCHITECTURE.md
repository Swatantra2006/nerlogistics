# NER Logistics Intelligence — System Architecture

## High-Level Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js 14)                      │
│                                                                   │
│  ┌─────────┐ ┌──────────────┐ ┌────────────┐ ┌───────────────┐  │
│  │ Landing  │ │  Dashboard   │ │   Maps     │ │   Analytics   │  │
│  │  Page    │ │  + KPIs      │ │  (Leaflet) │ │  (Recharts)   │  │
│  └────┬─────┘ └──────┬───────┘ └─────┬──────┘ └──────┬────────┘  │
│       │               │               │               │           │
│       └───────────────┴───────────────┴───────────────┘           │
│                               │                                   │
│                    ┌──────────┴──────────┐                        │
│                    │   Module Pages      │                        │
│                    │                     │                        │
│                    │ • Accessibility     │                        │
│                    │ • Route Optimizer   │                        │
│                    │ • Demand Forecast   │                        │
│                    │ • Risk Intelligence │                        │
│                    │ • Logistics Hubs    │                        │
│                    │ • Infrastructure    │                        │
│                    │ • Simulator         │                        │
│                    │ • AI Copilot        │                        │
│                    └──────────┬──────────┘                        │
└───────────────────────────────┼───────────────────────────────────┘
                                │
                    ┌───────────┴───────────┐
                    │    AI/ML Engines      │
                    │   (TypeScript)        │
                    │                       │
                    │ ┌───────────────────┐ │
                    │ │ 1. Accessibility  │ │
                    │ │    Scoring Engine │ │
                    │ │ (Weighted Multi-  │ │
                    │ │  Factor Formula)  │ │
                    │ └───────────────────┘ │
                    │ ┌───────────────────┐ │
                    │ │ 2. Route Optim.   │ │
                    │ │    Engine         │ │
                    │ │ (Dijkstra with    │ │
                    │ │  Priority Weights)│ │
                    │ └───────────────────┘ │
                    │ ┌───────────────────┐ │
                    │ │ 3. Demand Fore-   │ │
                    │ │    casting Engine │ │
                    │ │ (Time-series +   │ │
                    │ │  Seasonal Decomp)│ │
                    │ └───────────────────┘ │
                    │ ┌───────────────────┐ │
                    │ │ 4. Risk Scoring   │ │
                    │ │    Engine         │ │
                    │ │ (Multi-Hazard     │ │
                    │ │  Composite)       │ │
                    │ └───────────────────┘ │
                    │ ┌───────────────────┐ │
                    │ │ 5. Infrastructure │ │
                    │ │    Gap Engine     │ │
                    │ │ (Demand-Supply    │ │
                    │ │  Mismatch)        │ │
                    │ └───────────────────┘ │
                    │ ┌───────────────────┐ │
                    │ │ 6. Scenario       │ │
                    │ │    Simulation     │ │
                    │ │ (What-if Impact   │ │
                    │ │  Analysis)        │ │
                    │ └───────────────────┘ │
                    │ ┌───────────────────┐ │
                    │ │ 7. AI Copilot     │ │
                    │ │ (Intent Parse +   │ │
                    │ │  Data-Driven Resp)│ │
                    │ └───────────────────┘ │
                    └───────────┬───────────┘
                                │
                    ┌───────────┴───────────┐
                    │   Data Layer          │
                    │                       │
                    │ ┌───────────────────┐ │
                    │ │ Seeded Demo Data  │ │
                    │ │ • 8 States        │ │
                    │ │ • 40+ Districts   │ │
                    │ │ • 18 Roads/NHs    │ │
                    │ │ • 10 Hubs         │ │
                    │ │ • 12 Airports     │ │
                    │ │ • 10 Rail Stations│ │
                    │ │ • Risk Events     │ │
                    │ │ • Graph Network   │ │
                    │ └───────────────────┘ │
                    │ ┌───────────────────┐ │
                    │ │ Data Generators   │ │
                    │ │ • Demand History  │ │
                    │ │ • Weather Data    │ │
                    │ │ (Deterministic    │ │
                    │ │  Seeded Random)   │ │
                    │ └───────────────────┘ │
                    └───────────────────────┘
```

## Data Flow

1. **User Interaction** → Frontend React Components
2. **Components** → Call AI/ML Engine functions directly (client-side computation)
3. **AI/ML Engines** → Read from seeded data layer, perform real calculations
4. **Results** → Rendered via Recharts, Leaflet Maps, and custom UI components

## Key Design Decisions

1. **Client-side AI**: All AI/ML computations run in the browser — no backend server needed for demo
2. **Deterministic seeding**: Random data uses seeded PRNG for consistent results across sessions
3. **Real algorithms**: Dijkstra routing, linear regression, weighted scoring — not hardcoded responses
4. **Abstraction ready**: Clean engine interfaces allow easy swap to real API/database backends
5. **Zero dependencies**: No external API keys required — full demo mode out of the box
