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

    // If follow-up question and destination/origin missing, inspect previous user message for context
    if (parsed.intent === 'route_analysis' && (!parsed.origin || !parsed.destination) && history.length >= 2) {
      const lastUserMsg = [...history].reverse().find(m => m.role === 'user');
      if (lastUserMsg) {
        const lastParsed = RoutingService.parseRouteQuery(lastUserMsg.content);
        if (!parsed.origin && lastParsed.origin) parsed.origin = lastParsed.origin;
        if (!parsed.destination && lastParsed.destination) parsed.destination = lastParsed.destination;
      }
    }

    // Step 2: Retrieve Grounded Logistics / Routing Data
    let groundedRoute: GroundedRouteData | null = null;
    if (parsed.origin && parsed.destination) {
      groundedRoute = RoutingService.calculateRoute(parsed.origin, parsed.destination, parsed.priority);
    }

    // Determine API Key
    const geminiKey = userApiKey || process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    const openAiKey = process.env.OPENAI_API_KEY;

    // -------------------------------------------------------------
    // STEP 3: CALL GOOGLE GEMINI 1.5 FLASH WITH STRICT GROUNDED CONTEXT
    // -------------------------------------------------------------
    if (geminiKey) {
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;

        // Construct strict system grounding prompt
        let groundedContext = `You are the NER Logistics AI Copilot, an operational decision assistant for the 8 North Eastern States of India (Assam, Arunachal Pradesh, Manipur, Meghalaya, Mizoram, Nagaland, Sikkim, Tripura).\n\n`;

        if (groundedRoute) {
          groundedContext += `STRICT ROUTE GROUNDING FOR THIS USER'S SPECIFIC QUESTION:
- Origin: ${groundedRoute.origin.name} (${groundedRoute.origin.stateName})
- Destination: ${groundedRoute.destination.name} (${groundedRoute.destination.stateName})
- Total Road Distance: ${groundedRoute.totalDistanceKm} km
- Estimated Travel Time: ~${groundedRoute.estimatedTimeHours} hours (light vehicle) / ~${groundedRoute.heavyTruckTimeHours} hours (commercial freight >12t)
- Highway Corridors: ${groundedRoute.highways.join(' → ')}
- Waypoints: ${groundedRoute.waypoints.join(' ➔ ')}
- Terrain Profile: ${groundedRoute.terrainSummary}
- Composite Risk Score: ${groundedRoute.riskScore}/100 (${groundedRoute.riskLevel} Hazard Severity)
- Specific Active Hazards: ${groundedRoute.hazards.join('; ')}
- Key Staging Checkpoints: ${groundedRoute.keyCheckpoints.join('; ')}

MANDATORY RULES:
1. You MUST answer specifically about the route from ${groundedRoute.origin.name} to ${groundedRoute.destination.name}.
2. NEVER replace, alter, or confuse the origin or destination with Guwahati, Silchar, Tawang, or any other unrelated cities.
3. Use the verified distance (${groundedRoute.totalDistanceKm} km) and highways (${groundedRoute.highways.join(', ')}) given above.
4. Provide structured, actionable logistics guidance formatted with bold headers and bullet points.`;
        } else if (parsed.targetLocation) {
          groundedContext += `GROUNDED TARGET ENTITY:
- Location: ${parsed.targetLocation.name} (${parsed.targetLocation.stateName})
- Terrain: ${parsed.targetLocation.terrain || 'Mountainous / Hilly'}
- Answer specifically regarding ${parsed.targetLocation.name}. Do NOT substitute with another city.`;
        } else {
          groundedContext += `Answer the user's specific North Eastern Region logistics question. Do not hallucinate or use unrelated canned examples.`;
        }

        const payload = {
          contents: [
            {
              parts: [
                {
                  text: `${groundedContext}\n\nUser Question: ${query}`
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 900,
          }
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
              { label: 'AI Engine', value: 'Gemini 1.5 Flash (Live)' },
              { label: 'Grounding', value: 'NER Spatial Service' },
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
          console.warn('Gemini API returned error, falling back to grounded routing service:', errText);
        }
      } catch (geminiErr) {
        console.warn('Gemini request failed, falling back to grounded routing service:', geminiErr);
      }
    }

    // -------------------------------------------------------------
    // STEP 4: CALL OPENAI IF CONFIGURED (ALTERNATIVE LLM)
    // -------------------------------------------------------------
    if (openAiKey) {
      try {
        const openAiUrl = 'https://api.openai.com/v1/chat/completions';
        let promptSystem = `You are the NER Logistics AI Copilot. Always answer specifically for the user's requested North Eastern Region corridor without location substitution.\n`;
        if (groundedRoute) {
          promptSystem += `Verified Route: ${groundedRoute.origin.name} to ${groundedRoute.destination.name} (${groundedRoute.totalDistanceKm} km, via ${groundedRoute.highways.join(', ')}).`;
        }

        const response = await fetch(openAiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openAiKey}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: promptSystem },
              { role: 'user', content: query }
            ],
            temperature: 0.2,
            max_tokens: 800,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const reply = data?.choices?.[0]?.message?.content;
          if (reply) {
            return NextResponse.json({
              role: 'assistant',
              content: reply,
              timestamp: new Date().toISOString(),
              metrics: groundedRoute ? [
                { label: 'Origin', value: groundedRoute.origin.name },
                { label: 'Destination', value: groundedRoute.destination.name },
                { label: 'Distance', value: `${groundedRoute.totalDistanceKm} km` },
              ] : [{ label: 'AI Engine', value: 'OpenAI GPT-4o-mini' }],
              recommendations: groundedRoute?.strategicRecommendations || ['Cross-reference live routes with Route Optimizer']
            });
          }
        }
      } catch (openAiErr) {
        console.warn('OpenAI request failed:', openAiErr);
      }
    }

    // -------------------------------------------------------------
    // STEP 5: VERIFIED GROUNDED ENGINE (NO HALLUCINATION, NO CANNED GUWAHATI/SILCHAR)
    // -------------------------------------------------------------
    const groundedResponse = RoutingService.generateGroundedResponse(parsed, query);
    return NextResponse.json(groundedResponse);

  } catch (error) {
    console.error('Copilot API handler error:', error);
    return NextResponse.json(
      {
        role: 'assistant',
        content: 'I could not process that logistics query. Please specify an origin and destination within the 8 North Eastern States.',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
