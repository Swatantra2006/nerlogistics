# 🚀 NER Logistics Intelligence — Complete Deployment Guide

> **Smart India Hackathon 2026 | PS 26002**  
> AI-Based Smart Logistics and Accessibility Intelligence Platform for the North Eastern Region

This guide walks through deploying the **Frontend (Next.js 14)** with built-in **Serverless Gemini AI** to Vercel, and optionally deploying the **FastAPI Geospatial Backend** to Render or Railway.

---

## ⚡ Deployment Architecture

```
                                  End Users / Evaluators
                                             │
                        ┌────────────────────┴────────────────────┐
                        ▼                                         ▼
           [Vercel Web Deployment]                   [AI Settings in Browser]
         • Next.js 14 UI + Interactive Leaflet        • Paste Gemini API Key
         • Built-in Serverless AI (/api/copilot)      • Persisted in localStorage
                        │
                        ▼ (Optional REST Sync)
           [Render / Railway Backend]
         • FastAPI REST + Geospatial Engine (port 8000)
         • SQLite / PostgreSQL Database
         • 5 AI/ML Analytical Engines
```

---

## Option 1: Frontend Deployment on Vercel (Recommended & Instant)

The frontend is fully self-contained! It has a built-in serverless API route (`/api/copilot`) that connects directly to Google Gemini and includes fallback neural models for all 8 NER states.

### Step 1: Push Code to GitHub
Ensure all changes are committed and pushed to your GitHub repository:
```bash
git add .
git commit -m "feat: enable full AI copilot with Gemini 1.5 and deployment readiness"
git push origin main
```

### Step 2: Import into Vercel
1. Log in to [vercel.com](https://vercel.com).
2. Click **"Add New..."** → **"Project"**.
3. Select your GitHub repository (`SIH_2026` or `ner_logistics`).
4. Framework Preset will auto-detect as **Next.js**.
5. Root Directory: `./` (leave default).

### Step 3: Configure Environment Variables in Vercel
In the Vercel project configuration, add the following environment variables:

| Key | Value | Description |
|---|---|---|
| `GEMINI_API_KEY` | `AIzaSy...` | *(Recommended)* Your Google Gemini API Key |
| `NEXT_PUBLIC_MAP_TILE_URL` | `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png` | Free OpenStreetMap tiles |
| `NEXT_PUBLIC_DEMO_MODE` | `true` | Enables deterministic data seeding |

> 💡 **Tip**: Even without a `GEMINI_API_KEY` in Vercel, the platform's Neural Engine runs automatically, and judges/evaluators can enter a key directly in the web UI using the **"Configure Gemini Key"** button!

### Step 4: Click Deploy
Click **Deploy**. Your app will be live in ~60 seconds at `https://<your-project>.vercel.app`.

---

## Option 2: Backend Deployment on Render (Optional)

If you want the dedicated Python FastAPI backend hosted in the cloud:

### Step 1: Create a Web Service on Render
1. Log in to [render.com](https://render.com).
2. Click **"New +"** → **"Web Service"**.
3. Connect your GitHub repository.
4. Configure service settings:
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

### Step 2: Add Environment Variables in Render
- `DATABASE_URL`: `sqlite:///./ner_logistics.db`
- `AI_PROVIDER`: `gemini`
- `GEMINI_API_KEY`: *(Your Gemini API key)*
- `CORS_ORIGINS`: `https://<your-vercel-app>.vercel.app,http://localhost:3000`

### Step 3: Connect Frontend to Backend
Once your Render backend is live (e.g. `https://ner-backend.onrender.com`), go to Vercel → Project Settings → Environment Variables and add:
- `NEXT_PUBLIC_API_URL`: `https://ner-backend.onrender.com`

Redeploy the frontend to link them together!

---

## 🔑 How to Get a Free Google Gemini API Key

1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Sign in with your Google Account.
3. Click **"Create API Key"**.
4. Copy the key starting with `AIzaSy...`.
5. You can use this key either:
   - In `.env.local` for local development:
     ```env
     GEMINI_API_KEY=AIzaSy...
     ```
   - In Vercel Environment Variables for production.
   - Directly in the web application by clicking **"Configure Gemini Key"** on the AI Copilot page.

---

## 🎯 Verification Checklist for Hackathon Presentation

- [x] **Zero Cold-Start Lag**: Built-in Turbopack optimization.
- [x] **Live AI Working**: Ask *"What is the safest route from Guwahati to Tawang?"* or *"Where are moving trucks right now?"*
- [x] **Interactive Maps**: Check the 8-state logistics overlay with interactive pins and routes.
- [x] **Scenario Simulator**: Simulate a corridor closure on NH-10 or Sela Pass and verify recalculations.
- [x] **Judges Key Switcher**: Click "Configure Gemini Key" on the Copilot page to demonstrate live API integration on the spot.
