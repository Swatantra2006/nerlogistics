import { NextRequest, NextResponse } from 'next/server';
import { CopilotMessage } from '@/types';
import { RoutingService, GroundedRouteData, ParsedQuery } from '@/lib/routing-service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const query: string = (body.query || '').trim();
    const userApiKey: string | undefined = body.apiKey;
    const history: Array<{ role: 'user' | 'assistant'; content: string }> = body.conversationHistory || [];

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      );
    }

    // Step 1: Parse User Intent & Extract Exact Entities (Origin, Destination, Target)
    const parsed: ParsedQuery = RoutingService.parseRouteQuery(query);

    // If follow-up question and origin/destination missing, inspect previous user messages for context
    const needsContext = ['route_analysis', 'risk_inquiry'].includes(parsed.intent);
    if (needsContext && (!parsed.origin || !parsed.destination) && history.length >= 2) {
      // Walk backward through user messages to find the most recent one with locations
      for (let i = history.length - 1; i >= 0; i--) {
        if (history[i].role === 'user') {
          const lastParsed = RoutingService.parseRouteQuery(history[i].content);
          if (!parsed.origin && lastParsed.origin) parsed.origin = lastParsed.origin;
          if (!parsed.destination && lastParsed.destination) parsed.destination = lastParsed.destination;
          if (parsed.origin && parsed.destination) break;
        }
      }
    }

    // Step 2: Retrieve Grounded Logistics / Routing Data
    let groundedRoute: GroundedRouteData | null = null;
    if (parsed.origin && parsed.destination) {
      groundedRoute = RoutingService.calculateRoute(parsed.origin, parsed.destination, parsed.priority);
    }

    // Determine API Key — server-side only, never exposed to browser
    const geminiKey = userApiKey || process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    // -------------------------------------------------------------
    // STEP 3: CALL GOOGLE GEMINI WITH STRICT GROUNDED CONTEXT
    // -------------------------------------------------------------
    if (geminiKey) {
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`;

        // Build system instruction with strict grounding rules
        let systemInstruction = `You are the NER Logistics AI Copilot, an expert operational decision assistant for freight logistics across India's 8 North Eastern States (Assam, Arunachal Pradesh, Manipur, Meghalaya, Mizoram, Nagaland, Sikkim, Tripura).

CRITICAL RULES YOU MUST ALWAYS FOLLOW:
1. Always answer the user's CURRENT question. Never reuse a previous query's route or locations.
2. NEVER substitute, alter, or confuse the user's requested origin or destination with unrelated cities.
3. If the user asks about a specific route (e.g., Dibrugarh to Anini), your ENTIRE response must be about that exact route. Do NOT mention Guwahati→Silchar or any other route unless the user specifically asks.
4. Use the verified structured data provided below whenever available. Do not invent distances, travel times, or highway numbers.
5. If data is unavailable for a query, explicitly state that rather than fabricating information.
6. Format responses with clear bold headers, bullet points, and structured sections.
7. Keep responses focused, actionable, and logistics-grade professional.`;

        // Add grounded route context if available
        if (groundedRoute) {
          systemInstruction += `

VERIFIED ROUTE DATA FOR THIS SPECIFIC QUERY (USE THIS DATA):
- Origin: ${groundedRoute.origin.name} (${groundedRoute.origin.stateName})
- Destination: ${groundedRoute.destination.name} (${groundedRoute.destination.stateName})
- Total Road Distance: ${groundedRoute.totalDistanceKm} km
- Estimated Travel Time: ~${groundedRoute.estimatedTimeHours} hours (light vehicle) / ~${groundedRoute.heavyTruckTimeHours} hours (heavy freight >12t)
- Highway Corridors: ${groundedRoute.highways.join(' → ')}
- Waypoints: ${groundedRoute.waypoints.join(' ➔ ')}
- Terrain Profile: ${groundedRoute.terrainSummary}
- Composite Risk Score: ${groundedRoute.riskScore}/100 (${groundedRoute.riskLevel} Hazard Severity)
- Active Hazards: ${groundedRoute.hazards.join('; ')}
- Key Staging Checkpoints: ${groundedRoute.keyCheckpoints.join('; ')}

MANDATORY: Your response MUST be about the route from ${groundedRoute.origin.name} to ${groundedRoute.destination.name}. Use the exact distances and highways listed above.`;
        } else if (parsed.targetLocation) {
          systemInstruction += `

VERIFIED LOCATION DATA FOR THIS QUERY:
- Location: ${parsed.targetLocation.name} (${parsed.targetLocation.stateName})
- Terrain: ${parsed.targetLocation.terrain || 'Mountainous / Hilly'}
- Elevation: ${parsed.targetLocation.elevation ? parsed.targetLocation.elevation + 'm' : 'High altitude'}

MANDATORY: Your response must be specifically about ${parsed.targetLocation.name}. Do NOT substitute with another city.`;
        } else if (parsed.targetState) {
          systemInstruction += `

TARGET STATE: ${parsed.targetState}
Answer specifically about logistics infrastructure and operations in ${parsed.targetState}.`;
        }

        // Build conversation contents — include recent history for context
        const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

        // Add recent conversation history (last 3 turns max for context window efficiency)
        const recentHistory = history.slice(-6); // last 3 pairs of user/assistant
        for (const msg of recentHistory) {
          contents.push({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }],
          });
        }

        // Add current user query
        contents.push({
          role: 'user',
          parts: [{ text: query }],
        });

        const payload = {
          systemInstruction: {
            parts: [{ text: systemInstruction }],
          },
          contents,
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 1200,
          },
        };

        const response = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          const data = await response.json();
          const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

          if (candidateText) {
            const metrics = groundedRoute ? [
              { label: 'Origin', value: groundedRoute.origin.name },
              { label: 'Destination', value: groundedRoute.destination.name },
              { label: 'Total Distance', value: `${groundedRoute.totalDistanceKm} km` },
              { label: 'Est. Travel Time', value: `~${groundedRoute.estimatedTimeHours} hrs` },
              { label: 'Risk Factor', value: `${groundedRoute.riskScore}/100 (${groundedRoute.riskLevel})` },
            ] : [
              { label: 'AI Engine', value: 'Gemini 2.0 Flash (Live)' },
              { label: 'Grounding', value: 'NER Spatial Database' },
            ];

            return NextResponse.json({
              role: 'assistant',
              content: candidateText,
              timestamp: new Date().toISOString(),
              metrics,
              recommendations: groundedRoute ? groundedRoute.strategicRecommendations : [
                'View alternative corridors in Route Optimizer',
                'Simulate network choke-point impacts in Scenario Simulator',
              ]
            });
          }
        } else {
          const errText = await response.text();
          console.error('Gemini API error response:', response.status, errText);
        }
      } catch (geminiErr) {
        console.error('Gemini API request failed:', geminiErr);
      }
    }

    // -------------------------------------------------------------
    // STEP 4: VERIFIED GROUNDED ENGINE (fallback when Gemini is unavailable)
    // This engine uses the exact same RoutingService with Dijkstra pathfinding
    // and NER location data — no hallucination, no canned responses.
    // -------------------------------------------------------------
    const groundedResponse = RoutingService.generateGroundedResponse(parsed, query);
    return NextResponse.json(groundedResponse);

  } catch (error) {
    console.error('Copilot API handler error:', error);
    return NextResponse.json(
      {
        role: 'assistant',
        content: 'I encountered an error processing your logistics query. Please try again, or rephrase your question with specific locations in the North Eastern Region.',
        timestamp: new Date().toISOString(),
        metrics: [
          { label: 'Status', value: 'Error' },
        ],
        recommendations: [
          'Try asking: "What is the route between Dibrugarh and Anini?"',
          'Try asking: "How accessible is Aizawl?"',
        ],
      },
      { status: 500 }
    );
  }
}
