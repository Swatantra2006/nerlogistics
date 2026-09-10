# Architectural Implementation Plan: Truly Dynamic, Data-Grounded NER AI Copilot

## Objective
Transform the NER Logistics AI Copilot from a system with pre-indexed location tables into an **open, dynamic, data-grounded logistics intelligence system** that accepts **arbitrary locations across the entire North Eastern Region** (cities, towns, villages, railway stations, airports, landmarks, or user GPS coordinates), computes **real OpenStreetMap/OSRM road geometry & routing**, enriches routes with **NER Intelligence Engines** (Risk, Accessibility, Infrastructure Gaps, Hubs), and utilizes **Gemini 2.0 Flash** strictly as an explanation/reasoning layer with post-generation validation.

---

## 1. Audit of Current Implementation

### 1.1 Current Architecture
1. **Frontend (`src/app/dashboard/copilot/page.tsx`):** Captures text query and sends to `/api/copilot` via `api.askCopilot()`.
2. **API Layer (`src/app/api/copilot/route.ts` & `src/lib/routing-service.ts`):** Parses user query with regex and maps tokens against a static dictionary (`NER_LOCATIONS_MAP`).
3. **Routing Engine:** Runs Dijkstra over a fixed 28-node graph (`graphNodes` / `graphEdges`) in `ner-data.ts`, with fallback to Haversine * winding multiplier for unindexed locations.
4. **Gemini Integration:** Server-side call to `gemini-2.0-flash` with system instruction containing the matched route data.
5. **Where Hardcoded / Demo Data Exists:**
   - `NER_LOCATIONS_MAP`: Static dictionary of ~50 locations in `routing-service.ts`.
   - `graphNodes` & `graphEdges`: 29 nodes in `ner-data.ts`.
   - `LIVE_CONVOYS` in `src/modules/copilot/engine.ts` and `backend/app/routers/realtime.py`: Labeled with strings like `"GPS Ping: 16:30"` giving the illusion of live satellite telemetry.
   - Example routes like "Guwahati to Silchar", "Dibrugarh to Anini", "Tawang" hardcoded as fallbacks or recommendations.

---

## 2. Proposed Architecture: Real-World Dynamic Logistics System

```
                      ┌────────────────────────────────────────┐
                      │              USER QUERY                │
                      │  "Route from my current location to    │
                      │   Pelling" / "Dibrugarh to Anini"      │
                      └───────────────────┬────────────────────┘
                                          │
                        ┌─────────────────▼──────────────────┐
                        │   Browser Geolocation (Optional)   │
                        │ navigator.geolocation.getCurrentPos│
                        └─────────────────┬──────────────────┘
                                          │
      ┌───────────────────────────────────▼───────────────────────────────────┐
      │               DYNAMIC QUERY & ENTITY PARSER                           │
      │  - Extracts Origin & Destination (or coordinates if GPS)              │
      │  - Detects priority (fastest, safest, economical)                     │
      └───────────────────────────────────┬───────────────────────────────────┘
                                          │
      ┌───────────────────────────────────▼───────────────────────────────────┐
      │          DYNAMIC GEOCODING (OSM Nominatim + Spatial Cache)            │
      │  - Queries OpenStreetMap Nominatim with India/NER bounding box        │
      │  - Resolves arbitrary towns, villages, stations, landmarks            │
      │  - Caches results locally for low latency and zero rate-limit issues  │
      │  - Graceful fallback to local NER district/hub index if offline       │
      └───────────────────────────────────┬───────────────────────────────────┘
                                          │
      ┌───────────────────────────────────▼───────────────────────────────────┐
      │                REAL ROAD ROUTING (OSRM Engine)                        │
      │  - Real road network routing via Open Source Routing Machine (OSRM)   │
      │  - Returns: Real driving distance (km), duration (hrs), road names,   │
      │    turn-by-turn highway steps (NH-37, NH-115, NH-313, etc.),          │
      │    waypoints, and alternatives                                        │
      │  - Local Dijkstra graph acts as offline fallback                      │
      └───────────────────────────────────┬───────────────────────────────────┘
                                          │
      ┌───────────────────────────────────▼───────────────────────────────────┐
      │                NER LOGISTICS INTELLIGENCE ENRICHMENT                  │
      │  - Accessibility Engine: scores origin & destination accessibility   │
      │  - Risk Engine: terrain classification, mountain pass hazard mapping, │
      │    seismic index, active monsoon weather overlays                     │
      │  - Spatial Proximity: identifies nearest logistics hubs and depots    │
      │  - Infrastructure Gaps: identifies bottlenecks on the corridor        │
      └───────────────────────────────────┬───────────────────────────────────┘
                                          │
      ┌───────────────────────────────────▼───────────────────────────────────┐
      │            STRUCTURED CONTEXT INJECTION TO GEMINI 2.0 FLASH           │
      │  - Gemini receives verified JSON: distance, time, highways, hazards,  │
      │    accessibility, nearby hubs                                         │
      │  - Gemini explains & analyzes; strictly prohibited from inventing facts│
      └───────────────────────────────────┬───────────────────────────────────┘
                                          │
      ┌───────────────────────────────────▼───────────────────────────────────┐
      │                     RESPONSE VALIDATION LAYER                         │
      │  - Confirms origin and destination match the user request             │
      │  - Checks that hazards belong to the real corridor (no Sela Pass on   │
      │    Dibrugarh-Anini, no Sonapur Tunnel on Sikkim routes)               │
      └───────────────────────────────────┬───────────────────────────────────┘
                                          │
                                          ▼
                             Rich, Accurate Response to User
```

---

## 3. User Review Required

> [!IMPORTANT]
> **OpenStreetMap (Nominatim) & OSRM Routing APIs:**
> - Nominatim (`nominatim.openstreetmap.org`) is free and open-source, requiring a custom `User-Agent`. We will add in-memory caching and request throttling so repeated queries for the same town are instant and avoid rate limits.
> - OSRM (`router.project-osrm.org`) is a public driving router that calculates exact road distances and highway steps across India's road network.
> - If network connectivity to OSM is blocked or unavailable, the system automatically falls back to our local NER geospatial dataset so the system never crashes.

> [!IMPORTANT]
> **Browser Geolocation:**
> - We will add an interactive "📍 Use My Current Location" button in the Copilot UI input area.
> - Clicking it triggers standard `navigator.geolocation.getCurrentPosition()`.
> - If granted, it populates the query with the user's location (or sends coordinates) so queries like *"Route from my current location to Anini"* resolve seamlessly.
> - Precise coordinates are kept strictly client-side and only used to compute the route.

> [!NOTE]
> **Honest Telemetry Labeling:**
> - Real-time vehicle convoy tracking will be clearly designated as **"Fleet Simulation / Demonstration Stream"** rather than claiming live GPS satellite pings, per Rule #10 and Rule #14.

---

## 4. Proposed Changes

### Component 1: Dynamic Geocoding & Routing Service
#### [MODIFY] [`src/lib/routing-service.ts`](file:///c:/Users/dell/Desktop/SIH_2026/src/lib/routing-service.ts)
- Replace static map lookup with **Dynamic Geocoding via Nominatim**:
  - `geocodeLocation(query: string)`: Searches OSM within the North Eastern Region bounding box (`lat: 21.5 - 29.5, lng: 88.0 - 97.5`).
  - Supports GPS coordinate inputs (e.g. `26.14, 91.73`).
  - In-memory cache for fast repeated lookups.
- Integrate **Real Road Routing via OSRM**:
  - `fetchOSRMRoute(originCoords, destCoords)`: Calls OSRM route API.
  - Extracts exact distance, duration, road steps (highways), and route geometry.
- Connect **NER Intelligence Engines**:
  - Enriches the OSRM route with terrain hazards, elevation differences, nearby logistics hubs, accessibility scores, and infrastructure recommendations.

---

### Component 2: Serverless API Route
#### [MODIFY] [`src/app/api/copilot/route.ts`](file:///c:/Users/dell/Desktop/SIH_2026/src/app/api/copilot/route.ts)
- Accept optional `originCoords` and `destinationCoords` from browser GPS.
- Dynamically resolve locations using Nominatim + OSRM.
- Ground Gemini 2.0 Flash with real OSRM route metrics.
- Validate response relevance and corridor-specific hazards before returning.

---

### Component 3: Frontend Copilot UI & Geolocation
#### [MODIFY] [`src/app/dashboard/copilot/page.tsx`](file:///c:/Users/dell/Desktop/SIH_2026/src/app/dashboard/copilot/page.tsx)
- Add "📍 Use My Location" button in the query box.
- Implement `navigator.geolocation.getCurrentPosition()` with graceful permission handling.
- When user asks "Route from my current location to [destination]", automatically inject the retrieved GPS coordinates.
- Ensure all existing UI styling, responsive layouts, and animations remain 100% intact.

---

### Component 4: Honest Labeling of Demonstration Data
#### [MODIFY] [`src/modules/copilot/engine.ts`](file:///c:/Users/dell/Desktop/SIH_2026/src/modules/copilot/engine.ts)
- Update fleet tracking text: Replace misleading "Live GPS Ping" claims with **"Demonstration Fleet Simulation"** and **"Simulated Logistics Telemetry"**.

---

## 5. Verification Plan

### Automated / Scripted Tests
1. **Dynamic Geocoding Test:** Test resolution of arbitrary remote towns (e.g., *Pelling*, *Khonoma*, *Mawlynnong*, *Zunheboto*, *Dawki*, *Anini*, *Churachandpur*).
2. **OSRM Real Routing Test:** Test real road routing between arbitrary pairs (e.g., *Guwahati → Pelling*, *Dibrugarh → Anini*, *Agartala → Shillong*), verifying realistic distances, travel times, and real highway names.
3. **GPS Origin Test:** Test route calculation with coordinate origin (e.g., `26.14, 91.73` → *Anini*).
4. **Contamination & Hazard Integrity Test:** Verify that unrelated mountain passes (e.g. Sela Pass) are NEVER injected into routes in Meghalaya, Mizoram, Tripura, or Dibrugarh–Anini.
5. **Build & Typecheck:** Run Next.js build verification to ensure zero regressions.
