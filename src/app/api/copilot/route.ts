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
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(geminiKey)}`;

        // Build system instruction with strict grounding rules
        let systemInstruction = `You are the NER Logistics AI Copilot, an expert operational decision assistant for freight logistics across India's 8 North Eastern States (Assam, Arunachal Pradesh, Manipur, Meghalaya, Mizoram, Nagaland, Sikkim, Tripura).

CRITICAL RULES YOU MUST ALWAYS FOLLOW:
1. Always answer the user's CURRENT question. Never reuse a previous query's route or locations.
2. NEVER substitute, alter, or confuse the user's requested origin or destination with unrelated cities.
3. If the user asks about a specific route (e.g., Dibrugarh to Anini), your ENTIRE response must be about that exact route. Do NOT mention Guwahati→Silchar or any other route unless the user specifically asks.
4. Use the verified structured data provided below whenever available. Do not invent distances, travel times, or highway numbers.
5. If data is unavailable for a query, explicitly state that rather than fabricating information.
6. Clearly distinguish verified database/grounded facts from general advisories.
7. Format responses with clear bold headers, bullet points, and structured sections.
8. Keep responses focused, actionable, and logistics-grade professional.`;

        // Add grounded route context if available
        if (groundedRoute) {
          systemInstruction += `

VERIFIED ROUTE DATA FOR THIS SPECIFIC QUERY (USE THIS DATA):
- Origin: ${groundedRoute.origin.name} (${groundedRoute.origin.stateName})
- Destination: ${groundedRoute.destination.name} (${groundedRoute.destination.stateName})
- Total Road Distance: ${groundedRoute.totalDistanceKm} km
- Estimated Travel Time: ~${groundedRoute.estimatedTimeHours} hours (light commercial) / ~${groundedRoute.heavyTruckTimeHours} hours (heavy freight >12t)
- Highway Corridors: ${groundedRoute.highways.join(' → ')}
- Waypoints: ${groundedRoute.waypoints.join(' ➔ ')}
- Terrain Profile: ${groundedRoute.terrainSummary}
- Composite Risk Score: ${groundedRoute.riskScore}/100 (${groundedRoute.riskLevel} Hazard Severity)
- Active Hazards: ${groundedRoute.hazards.join('; ')}
- Key Staging Checkpoints: ${groundedRoute.keyCheckpoints.join('; ')}

MANDATORY: Your response MUST be specifically about the route from ${groundedRoute.origin.name} to ${groundedRoute.destination.name}. Use the exact distances, travel times, and highways listed above.`;
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

        // Build conversation contents
        const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

        // PHASE 5 & 13: ANTI-CONTAMINATION MEMORY PRUNING
        // When a user provides a new explicit origin and destination, do NOT pass old route dialogues
        // to prevent Gemini from copying previous route answers (like Guwahati to Silchar).
        const isNewExplicitRoute = Boolean(parsed.origin && parsed.destination);
        if (!isNewExplicitRoute) {
          const recentHistory = history.slice(-4);
          for (const msg of recentHistory) {
            contents.push({
              role: msg.role === 'user' ? 'user' : 'model',
              parts: [{ text: msg.content }],
            });
          }
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
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': geminiKey,
          },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          const data = await response.json();
          const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

          if (candidateText) {
            // PHASE 11: AI RESPONSE RELEVANCE VALIDATION LAYER
            const isValid = validateResponseRelevance(candidateText, parsed);

            if (isValid) {
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
            } else {
              console.warn('Gemini response failed relevance validation. Using grounded fallback engine.');
              const groundedResponse = RoutingService.generateGroundedResponse(parsed, query);
              return NextResponse.json(groundedResponse);
            }
          }
        } else {
          const errText = await response.text();
          console.error('Gemini API error response:', response.status, errText);

          // Phase 16: If Gemini API fails, do NOT show a random demo response
          if (groundedRoute) {
            const groundedResponse = RoutingService.generateGroundedResponse(parsed, query);
            groundedResponse.metrics = [
              { label: 'Origin', value: groundedRoute.origin.name },
              { label: 'Destination', value: groundedRoute.destination.name },
              { label: 'Total Distance', value: `${groundedRoute.totalDistanceKm} km` },
              { label: 'Travel Time', value: `~${groundedRoute.estimatedTimeHours} hrs` },
              { label: 'Engine', value: 'NER Spatial Grounding' },
            ];
            return NextResponse.json(groundedResponse);
          } else {
            return NextResponse.json({
              role: 'assistant',
              content: 'AI service is temporarily unavailable. Please try again.',
              timestamp: new Date().toISOString(),
              metrics: [{ label: 'Status', value: 'AI Unavailable' }],
              recommendations: [
                'Try asking: "What is the route between Dibrugarh and Anini?"',
                'Try asking: "How accessible is Aizawl?"',
              ],
            });
          }
        }
      } catch (geminiErr) {
        console.error('Gemini API request failed:', geminiErr);
        if (groundedRoute) {
          const groundedResponse = RoutingService.generateGroundedResponse(parsed, query);
          return NextResponse.json(groundedResponse);
        } else {
          return NextResponse.json({
            role: 'assistant',
            content: 'AI service is temporarily unavailable. Please try again.',
            timestamp: new Date().toISOString(),
            metrics: [{ label: 'Status', value: 'AI Unavailable' }],
            recommendations: [
              'Try asking: "What is the route between Dibrugarh and Anini?"',
              'Try asking: "What is the route from Guwahati to Silchar?"',
            ],
          });
        }
      }
    }

    // -------------------------------------------------------------
    // STEP 4: VERIFIED GROUNDED ENGINE (when no Gemini key is set)
    // -------------------------------------------------------------
    const groundedResponse = RoutingService.generateGroundedResponse(parsed, query);
    return NextResponse.json(groundedResponse);

  } catch (error) {
    console.error('Copilot API handler error:', error);
    return NextResponse.json(
      {
        role: 'assistant',
        content: 'AI service is temporarily unavailable. Please try again.',
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

/**
 * PHASE 11: Validation layer before returning LLM response
 * Checks that response is relevant to the extracted entities and not contaminated
 */
function validateResponseRelevance(responseText: string, parsed: ParsedQuery): boolean {
  if (!responseText || responseText.trim().length < 30) return false;
  const lower = responseText.toLowerCase();

  // If explicit origin and destination
  if (parsed.origin && parsed.destination) {
    const orig = parsed.origin.name.toLowerCase();
    const dest = parsed.destination.name.toLowerCase();

    const mentionsOrig = lower.includes(orig) || lower.includes(parsed.origin.id.toLowerCase());
    const mentionsDest = lower.includes(dest) || lower.includes(parsed.destination.id.toLowerCase());

    // Response must mention at least one of the endpoints
    if (!mentionsOrig && !mentionsDest) {
      console.warn(`Validation failed: Neither ${orig} nor ${dest} found in response.`);
      return false;
    }

    // Contamination check: If query is NOT about Guwahati -> Silchar, ensure response doesn't hallucinate Guwahati -> Silchar
    if (parsed.origin.id !== 'guwahati' && parsed.destination.id !== 'silchar') {
      if (lower.includes('guwahati to silchar') || lower.includes('guwahati → silchar') || lower.includes('guwahati-silchar')) {
        console.warn(`Validation failed: Response contaminated with Guwahati-Silchar for query ${orig} → ${dest}.`);
        return false;
      }
    }
  }

  // If target location specified (e.g., Aizawl)
  if (parsed.targetLocation && !parsed.destination) {
    const target = parsed.targetLocation.name.toLowerCase();
    if (!lower.includes(target) && !lower.includes(parsed.targetLocation.id.toLowerCase())) {
      console.warn(`Validation failed: Target location ${target} not mentioned.`);
      return false;
    }
  }

  return true;
}
