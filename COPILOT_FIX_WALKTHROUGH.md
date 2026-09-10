# AI Copilot Fix — Walkthrough

## Root Cause Analysis

The AI Copilot was returning incorrect responses (e.g., "Guwahati → Silchar" for a "Dibrugarh → Anini" query) due to a **broken API call priority chain** in the live Vercel deployment.

### How the Bug Manifested

The `api.ts` client tried to reach the FastAPI backend at `localhost:8000` **first** with a 3.5 second timeout. On Vercel, this address doesn't exist, so:

1. **Every single query wasted 3.5 seconds** waiting for a dead connection to timeout
2. Only THEN did it try the working Next.js serverless route (`/api/copilot`)
3. If the serverless route also failed (e.g., due to the delayed response chain or a stale build), it fell through to the client-side engine — which was correct but didn't use Gemini

Additionally:
- **No Gemini API key** was configured on Vercel (`AI_PROVIDER=demo`), so even the serverless route's Gemini call was skipped
- The old Gemini API call used `gemini-1.5-flash` with the system prompt stuffed into the user message (less effective than proper `systemInstruction`)
- Conversation history was being sent with the current query duplicated

## Changes Made

### 1. `src/lib/api.ts` — API Call Priority Fix (Critical)
- **Before:** Tried `localhost:8000` first (3.5s dead timeout on Vercel), then serverless route
- **After:** Tries Next.js serverless `/api/copilot` route FIRST, then FastAPI backend as fallback
- Passes conversation history to both backends properly

### 2. `src/app/api/copilot/route.ts` — Serverless Route Overhaul (Critical)
- Upgraded to **Gemini 2.0 Flash** model
- Uses proper `systemInstruction` field (separate from `contents`) per Gemini REST API spec
- Passes conversation history as multi-turn messages (user/model roles)
- Stronger system prompt with mandatory grounding rules
- Broadened follow-up context: handles both `route_analysis` and `risk_inquiry` intents
- Walks backward through all user messages (not just the last one) for context
- Explicit error logging instead of silent fallthrough
- Removed OpenAI fallback path (simplifies the flow; can be re-added if needed)

### 3. `src/lib/routing-service.ts` — Intent Detection Broadened
- Added `safest route`, `fastest route`, `what about` as route_analysis triggers
- Added `commodity_inquiry` intent detection for tea, medicine, fuel, etc.
- This ensures follow-up questions like "What about Dibrugarh to Anini?" are correctly classified

### 4. `src/app/dashboard/copilot/page.tsx` — Frontend Fixes
- Fixed conversation history to exclude the current user message (avoiding duplicate in Gemini context)
- Sends last 6 messages (3 turns) instead of last 4
- Updated engine status label to reflect Gemini 2.0 Flash

### 5. `.env.local` — Environment Configuration
- Changed `AI_PROVIDER` from `demo` to `gemini`
- Changed `NEXT_PUBLIC_DEMO_MODE` from `true` to `false`
- Added `GEMINI_API_KEY=` placeholder with instructions

### 6. `.env.example` — Deployment Documentation
- Added clear instructions for Vercel environment variable setup
- Documented that GEMINI_API_KEY is server-side only

## Files Changed

| File | Type | Description |
|------|------|-------------|
| `src/lib/api.ts` | Modified | API call priority order reversed |
| `src/app/api/copilot/route.ts` | Rewritten | Complete serverless route overhaul |
| `src/lib/routing-service.ts` | Modified | Broader intent detection |
| `src/app/dashboard/copilot/page.tsx` | Modified | History dedup, label update |
| `.env.local` | Modified | AI provider config |
| `.env.example` | Modified | Deployment docs |

## What Was NOT Changed

- **No frontend redesign** — UI structure, styling, and layout are untouched
- **No data changes** — ner-data.ts graph nodes/edges are unchanged
- **No backend Python changes** — The FastAPI backend is a secondary path
- **No routing algorithm changes** — Dijkstra and RoutingService work correctly

## Deployment Steps

### For Vercel (Auto-deploy from GitHub):

1. **Set environment variable on Vercel:**
   - Go to Vercel Dashboard → Project Settings → Environment Variables
   - Add: `GEMINI_API_KEY` = `your-gemini-api-key`
   - Ensure it's available for Production, Preview, and Development

2. **Push changes to GitHub:**
   ```bash
   git add -A
   git commit -m "fix: AI Copilot - fix API priority, Gemini grounding, conversation memory"
   git push
   ```

3. **Vercel will auto-deploy** the new build

### For Local Testing:

1. **Add your Gemini API key to `.env.local`:**
   ```
   GEMINI_API_KEY=AIzaSy...your-key-here
   ```

2. **Run the dev server:**
   ```bash
   npm run dev
   ```

3. **Test the copilot at:** `http://localhost:3000/dashboard/copilot`

## Test Matrix

| Query | Expected Origin | Expected Destination | Status |
|-------|----------------|---------------------|--------|
| "What is the route between Dibrugarh and Anini?" | Dibrugarh | Anini | Ready to verify |
| "What is the route from Guwahati to Silchar?" | Guwahati | Silchar | Ready to verify |
| "How can I reach Tawang from Guwahati?" | Guwahati | Tawang | Ready to verify |
| "What are the risks between Dibrugarh and Anini?" | Dibrugarh | Anini | Ready to verify |
| "Which route is better from Imphal to Kohima?" | Imphal | Kohima | Ready to verify |
| "How accessible is Aizawl?" | — | Aizawl (target) | Ready to verify |
| "What logistics hubs are near Guwahati?" | — | Guwahati (target) | Ready to verify |
| Follow-up after Q1: "What about Guwahati to Silchar?" | Guwahati | Silchar | Ready to verify |
