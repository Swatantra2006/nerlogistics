/**
 * NER Logistics Intelligence — Unified Copilot Intelligence Engine
 * 
 * Bridges all existing platform datasets and calculation engines:
 * - 40+ Districts & 8 States (ner-data.ts)
 * - Mountain Passes, Valleys, Roads, Towns & Strategic Checkpoints (Geographic Feature Registry)
 * - Accessibility Engine (accessibility/engine.ts)
 * - Demand Forecasting Engine (demand/engine.ts)
 * - Multi-Hazard Risk Scoring Engine (risk/engine.ts)
 * - Infrastructure Gap Analysis Engine (infrastructure/engine.ts)
 * - Dijkstra & OSRM Routing Engine (routing/engine.ts & routing-service.ts)
 * - Logistics Hubs, Airports & Rail Terminals (ner-data.ts)
 * 
 * Strict architectural rules:
 * 1. REAL DATA > REAL CALCULATIONS > DYNAMIC LOCATION SUPPORT > LLM EXPLANATION
 * 2. Non-district locations (passes, valleys, towns, roads) map to their parent district with explicit proxy disclosure.
 * 3. Never fall back to generic regional summary when a meaningful geographic match exists.
 */

import { District, State, LogisticsHub, Airport, RailwayStation, RiskEvent, InfrastructureGap, OptimizedRoute, CopilotMessage } from '@/types';
import {
  districts,
  states,
  logisticsHubs,
  airports,
  railwayStations,
  riskEvents,
  roads,
  graphNodes,
  graphEdges,
} from '@/data/ner-data';
import { computeAccessibility, computeAllAccessibility, AccessibilityBreakdown } from '@/modules/accessibility/engine';
import { forecastDemand, getTopDemandDistricts, forecastAllDistricts } from '@/modules/demand/engine';
import { assessDistrictRisk, assessAllRisks, getActiveAlerts, RiskAssessment } from '@/modules/risk/engine';
import { analyzeInfrastructureGaps, getTopGaps, getGapsByState } from '@/modules/infrastructure/engine';
import { optimizeRoutes } from '@/modules/routing/engine';
import { RoutingService, GroundedRouteData, ParsedQuery } from '@/lib/routing-service';

export interface StrategicGeographicFeature {
  id: string;
  name: string;
  category: 'pass' | 'valley' | 'town' | 'road' | 'strategic';
  parentDistrictId: string;
  parentStateId: string;
  elevation?: number;
  lat: number;
  lng: number;
  description: string;
  aliases: string[];
}

export interface LocationResolutionResult {
  found: boolean;
  type: 'district' | 'state' | 'city' | 'town' | 'pass' | 'valley' | 'road' | 'strategic' | 'hub' | 'custom_coords' | 'unknown';
  district?: District;
  state?: State;
  cityNode?: typeof graphNodes[0];
  hub?: LogisticsHub;
  lat?: number;
  lng?: number;
  matchedName: string;
  normalizedQuery: string;
  isProxy?: boolean;
  proxyParentName?: string;
  proxyNotice?: string;
  description?: string;
  elevation?: number;
}

export interface ExtractedCargo {
  weightTons?: number;
  weightKg?: number;
  commodity?: string;
  isPerishable?: boolean;
  isEmergency?: boolean;
}

export interface CopilotParsedIntent {
  rawQuery: string;
  intents: ('route' | 'accessibility' | 'demand' | 'risk' | 'infrastructure' | 'hub' | 'comparison' | 'state' | 'general')[];
  primaryIntent: 'route' | 'accessibility' | 'demand' | 'risk' | 'infrastructure' | 'hub' | 'comparison' | 'state' | 'general';
  locations: LocationResolutionResult[];
  unknownLocationStrings: string[];
  cargo?: ExtractedCargo;
  priority: 'fastest' | 'cheapest' | 'safest' | 'balanced';
  sortOrder?: 'worst' | 'best' | 'highest' | 'lowest';
}

export interface StructuredFactsResult {
  intent: string;
  locationsFound: string[];
  sources: string[];
  factsText: string;
  metrics: { label: string; value: string }[];
  recommendations: string[];
  rawRoute?: GroundedRouteData | null;
  dijkstraRoute?: OptimizedRoute | null;
}

export class CopilotIntelligence {
  // ============================================================
  // STRATEGIC GEOGRAPHIC FEATURE CATALOG
  // Passes, Valleys, Strategic Border Checkposts, Highways, and Towns
  // ============================================================
  private static readonly STRATEGIC_FEATURES: StrategicGeographicFeature[] = [
    // ============================================================
    // 1. HIGH-ALTITUDE MOUNTAIN PASSES
    // ============================================================
    {
      id: 'sela-pass',
      name: 'Sela Pass',
      category: 'pass',
      parentDistrictId: 'west-kameng',
      parentStateId: 'arunachal',
      elevation: 4170,
      lat: 27.503,
      lng: 92.105,
      description: 'High-altitude strategic pass at 4,170m elevation on NH-13, connecting West Kameng and Tawang; critical chokepoint prone to winter blizzards and monsoon landslides.',
      aliases: ['sela pass', 'sela', 'sela mountain pass', 'sela top', 'sela ridge'],
    },
    {
      id: 'sela-tunnel',
      name: 'Sela Tunnel',
      category: 'strategic',
      parentDistrictId: 'west-kameng',
      parentStateId: 'arunachal',
      elevation: 3000,
      lat: 27.495,
      lng: 92.112,
      description: 'Twin-tube all-weather tunnel bypassing Sela Pass on the Balipara-Charduar-Tawang corridor, securing year-round freight connectivity to Tawang.',
      aliases: ['sela tunnel', 'sela twin tunnel', 'sela bypass', 'sela pass tunnel'],
    },
    {
      id: 'mayodia-pass',
      name: 'Mayodia Pass',
      category: 'pass',
      parentDistrictId: 'lower-dibang',
      parentStateId: 'arunachal',
      elevation: 2655,
      lat: 28.232,
      lng: 95.914,
      description: 'High-altitude pass at 2,655m on the Roing-Anini Highway (NH-313), prone to severe snowfall and monsoon debris slides cutting off Dibang Valley.',
      aliases: ['mayodia pass', 'mayodia', 'mayodiya', 'mayodiya pass', 'mayodia ridge', 'mayodia top'],
    },
    {
      id: 'nathu-la',
      name: 'Nathu La Pass',
      category: 'pass',
      parentDistrictId: 'east-sikkim',
      parentStateId: 'sikkim',
      elevation: 4310,
      lat: 27.386,
      lng: 88.831,
      description: 'Himalayan Silk Route mountain pass at 4,310m on the India-China border in East Sikkim, connected via Jawaharlal Nehru Road from Gangtok.',
      aliases: ['nathu la', 'nathula', 'nathula pass', 'natu la', 'nathu la pass', 'nula pass'],
    },
    {
      id: 'jelep-la',
      name: 'Jelep La Pass',
      category: 'pass',
      parentDistrictId: 'east-sikkim',
      parentStateId: 'sikkim',
      elevation: 4267,
      lat: 27.360,
      lng: 88.880,
      description: 'High Himalayan pass at 4,267m linking Sikkim to Lhasa, Tibet, traversing the Chumbi Valley gateway.',
      aliases: ['jelep la', 'jelepla', 'jelep pass', 'jelep la pass'],
    },
    {
      id: 'bum-la',
      name: 'Bum La Pass',
      category: 'pass',
      parentDistrictId: 'tawang',
      parentStateId: 'arunachal',
      elevation: 4633,
      lat: 27.720,
      lng: 91.870,
      description: 'High-altitude Indo-China border pass at 4,633m located 37 km north of Tawang, subject to severe alpine weather conditions.',
      aliases: ['bum la', 'bumla', 'bumla pass', 'bum la pass'],
    },
    {
      id: 'pangsau-pass',
      name: 'Pangsau Pass',
      category: 'pass',
      parentDistrictId: 'changlang',
      parentStateId: 'arunachal',
      elevation: 1136,
      lat: 27.248,
      lng: 96.147,
      description: 'Historic pass across the Patkai Hills at 1,136m on the Stilwell (Ledo) Road, linking northeastern India with northern Myanmar.',
      aliases: ['pangsau pass', 'pangsau', 'stilwell pass', 'ledo road pass'],
    },
    {
      id: 'diphu-pass',
      name: 'Diphu Pass',
      category: 'pass',
      parentDistrictId: 'lohit',
      parentStateId: 'arunachal',
      elevation: 1380,
      lat: 28.150,
      lng: 97.400,
      description: 'Strategic tri-junction pass linking India (Arunachal Pradesh), Myanmar, and China on the eastern Himalayan ridge.',
      aliases: ['diphu pass', 'diphu mountain pass', 'arunachal trijunction'],
    },
    {
      id: 'cho-la',
      name: 'Cho La Pass',
      category: 'pass',
      parentDistrictId: 'east-sikkim',
      parentStateId: 'sikkim',
      elevation: 4420,
      lat: 27.420,
      lng: 88.800,
      description: 'High Himalayan pass at 4,420m connecting Sikkim with Tibet Chumbi Valley north of Nathu La.',
      aliases: ['cho la', 'chola pass', 'cho la pass'],
    },
    {
      id: 'dongkha-la',
      name: 'Dongkha La Pass',
      category: 'pass',
      parentDistrictId: 'north-sikkim',
      parentStateId: 'sikkim',
      elevation: 5534,
      lat: 27.980,
      lng: 88.750,
      description: 'Ultra-high elevation pass at 5,534m in North Sikkim connecting Lachung basin with the Tibetan plateau.',
      aliases: ['dongkha la', 'dongkiala', 'donkia pass', 'dongkha la pass'],
    },
    {
      id: 'kupup-pass',
      name: 'Kupup Pass (Elephant Lake)',
      category: 'pass',
      parentDistrictId: 'east-sikkim',
      parentStateId: 'sikkim',
      elevation: 4000,
      lat: 27.360,
      lng: 88.820,
      description: 'Historic high-altitude Silk Route transit point at 4,000m elevation near Elephant Lake and Baba Mandir.',
      aliases: ['kupup', 'kupup pass', 'elephant lake', 'baba mandir pass'],
    },
    {
      id: 'zuluk-pass',
      name: 'Zuluk Loops & Pass',
      category: 'pass',
      parentDistrictId: 'east-sikkim',
      parentStateId: 'sikkim',
      elevation: 2865,
      lat: 27.250,
      lng: 88.780,
      description: 'Historic 32-hairpin turn mountain corridor on the Old Silk Route connecting Rongli and Gnathang Valley.',
      aliases: ['zuluk', 'dzuluk', 'zuluk pass', 'zuluk loops', 'old silk route sikkim'],
    },
    {
      id: 'tse-la',
      name: 'Tse La Pass',
      category: 'pass',
      parentDistrictId: 'tawang',
      parentStateId: 'arunachal',
      elevation: 4500,
      lat: 27.650,
      lng: 91.950,
      description: 'High mountain saddle between Tawang and Mago Chuna border sectors.',
      aliases: ['tse la', 'tsela pass', 'tse la pass'],
    },

    // ============================================================
    // 2. REGIONAL VALLEYS & NATURAL CORRIDORS
    // ============================================================
    {
      id: 'dibang-valley-feat',
      name: 'Dibang Valley',
      category: 'valley',
      parentDistrictId: 'dibang-valley',
      parentStateId: 'arunachal',
      elevation: 1968,
      lat: 28.790,
      lng: 95.900,
      description: 'Remote eastern Himalayan valley bordering Tibet, characterized by extremely rugged gorges, deep river basins, and single-corridor road access via NH-313.',
      aliases: ['dibang valley', 'dibang basin', 'dibang river valley', 'dibang gorge'],
    },
    {
      id: 'brahmaputra-valley',
      name: 'Brahmaputra Valley',
      category: 'valley',
      parentDistrictId: 'kamrup-metro',
      parentStateId: 'assam',
      elevation: 55,
      lat: 26.200,
      lng: 92.500,
      description: 'Central economic and logistics spine of Assam containing National Waterway 2 (NW-2), NH-27, and primary broad-gauge railheads.',
      aliases: ['brahmaputra valley', 'brahmaputra basin', 'assam valley', 'brahmaputra river valley'],
    },
    {
      id: 'barak-valley',
      name: 'Barak Valley',
      category: 'valley',
      parentDistrictId: 'silchar',
      parentStateId: 'assam',
      elevation: 30,
      lat: 24.833,
      lng: 92.778,
      description: 'Southern Assam valley anchored at Silchar, serving as the sole overland transit gateway to Mizoram, Tripura, and western Manipur.',
      aliases: ['barak valley', 'barak basin', 'cachar valley', 'barak river valley', 'surma barak valley'],
    },
    {
      id: 'dzukou-valley',
      name: 'Dzukou Valley',
      category: 'valley',
      parentDistrictId: 'kohima',
      parentStateId: 'nagaland',
      elevation: 2452,
      lat: 25.560,
      lng: 94.060,
      description: 'High-altitude valley sanctuary at 2,452m on the Nagaland-Manipur border with rugged, non-motorable approaches from Viswema and Jakhama.',
      aliases: ['dzukou valley', 'dzuko valley', 'dzukou', 'dzkou', 'dzukou basin'],
    },
    {
      id: 'yumthang-valley',
      name: 'Yumthang Valley',
      category: 'valley',
      parentDistrictId: 'north-sikkim',
      parentStateId: 'sikkim',
      elevation: 3564,
      lat: 27.790,
      lng: 88.690,
      description: 'Valley of Flowers in North Sikkim at 3,564m, accessed via Lachung; highly vulnerable to winter freeze and monsoon flash floods.',
      aliases: ['yumthang valley', 'yumthang', 'valley of flowers sikkim', 'yumthang basin'],
    },
    {
      id: 'ziro-valley',
      name: 'Ziro Valley (Apatani Plateau)',
      category: 'valley',
      parentDistrictId: 'lower-subansiri',
      parentStateId: 'arunachal',
      elevation: 1572,
      lat: 27.530,
      lng: 93.830,
      description: 'Elevated pine-clad plateau in Lower Subansiri linked via the Potin-Ziro section of NH-13.',
      aliases: ['ziro valley', 'apatani plateau', 'ziro plateau', 'apatani valley'],
    },
    {
      id: 'mechuka-valley',
      name: 'Mechuka Valley',
      category: 'valley',
      parentDistrictId: 'east-siang',
      parentStateId: 'arunachal',
      elevation: 1829,
      lat: 28.600,
      lng: 94.130,
      description: 'Pristine high-altitude valley along the Yargyap Chu river near the Tibetan border, served by an Advanced Landing Ground (ALG).',
      aliases: ['mechuka valley', 'mechuka', 'menchuka', 'menchukha', 'menchuka valley'],
    },
    {
      id: 'sangti-valley',
      name: 'Sangti Valley',
      category: 'valley',
      parentDistrictId: 'west-kameng',
      parentStateId: 'arunachal',
      elevation: 1500,
      lat: 27.380,
      lng: 92.280,
      description: 'Fertile mountain valley near Dirang on the western Arunachal transit route towards Tawang.',
      aliases: ['sangti valley', 'sangti', 'dirang valley'],
    },
    {
      id: 'gnathang-valley',
      name: 'Gnathang Valley',
      category: 'valley',
      parentDistrictId: 'east-sikkim',
      parentStateId: 'sikkim',
      elevation: 4100,
      lat: 27.300,
      lng: 88.820,
      description: 'High-altitude cold alpine plateau at 4,100m on the historic Silk Route in East Sikkim.',
      aliases: ['gnathang valley', 'gnathang', 'nathang valley', 'nathang'],
    },
    {
      id: 'lachen-valley',
      name: 'Lachen Valley',
      category: 'valley',
      parentDistrictId: 'north-sikkim',
      parentStateId: 'sikkim',
      elevation: 2750,
      lat: 27.720,
      lng: 88.550,
      description: 'Rugged northern Himalayan river valley leading to Thangu and Gurudongmar Lake along the Lachen Chu.',
      aliases: ['lachen valley', 'lachen river valley'],
    },
    {
      id: 'lachung-valley',
      name: 'Lachung Valley',
      category: 'valley',
      parentDistrictId: 'north-sikkim',
      parentStateId: 'sikkim',
      elevation: 2700,
      lat: 27.690,
      lng: 88.740,
      description: 'Glacial valley corridor flanking the Lachung Chu river, serving as the sole gateway to Yumthang and Zero Point.',
      aliases: ['lachung valley', 'lachung river valley'],
    },
    {
      id: 'tenga-valley',
      name: 'Tenga Valley',
      category: 'valley',
      parentDistrictId: 'west-kameng',
      parentStateId: 'arunachal',
      elevation: 1200,
      lat: 27.180,
      lng: 92.450,
      description: 'Strategic military and logistics staging valley on the Bhalukpong-Bomdila corridor along the Tenga River.',
      aliases: ['tenga valley', 'tenga', 'tenga cantonment'],
    },
    {
      id: 'imphal-valley',
      name: 'Imphal Valley',
      category: 'valley',
      parentDistrictId: 'imphal-west',
      parentStateId: 'manipur',
      elevation: 786,
      lat: 24.810,
      lng: 93.940,
      description: 'Central oval plain of Manipur surrounded by nine hill ranges; dense population center and trade focal point for Asian Highway 1.',
      aliases: ['imphal valley', 'manipur valley', 'manipur plain'],
    },
    {
      id: 'jatinga-valley',
      name: 'Jatinga Valley',
      category: 'valley',
      parentDistrictId: 'silchar',
      parentStateId: 'assam',
      elevation: 900,
      lat: 25.120,
      lng: 93.040,
      description: 'Hill valley in Dima Hasao along the Jatinga River, linking Lumding rail lines and NH-54/NH-27 with Silchar.',
      aliases: ['jatinga valley', 'jatinga', 'dima hasao valley'],
    },
    {
      id: 'surma-valley',
      name: 'Surma Valley',
      category: 'valley',
      parentDistrictId: 'silchar',
      parentStateId: 'assam',
      elevation: 25,
      lat: 24.850,
      lng: 92.600,
      description: 'Lowland riverine flood basin encompassing the western Barak Valley adjoining Sylhet, Bangladesh.',
      aliases: ['surma valley', 'surma basin'],
    },

    // ============================================================
    // 3. STRATEGIC CHECKPOSTS, BORDERS, BRIDGES & PORTS
    // ============================================================
    {
      id: 'moreh-icp',
      name: 'Moreh Integrated Checkpost',
      category: 'strategic',
      parentDistrictId: 'imphal-west',
      parentStateId: 'manipur',
      elevation: 160,
      lat: 24.240,
      lng: 94.300,
      description: 'India-Myanmar border trade capital on Asian Highway 1 (AH-1), principal overland gateway for the India-Myanmar-Thailand Trilateral Highway.',
      aliases: ['moreh', 'moreh icp', 'moreh border', 'moreh town', 'moreh checkpost'],
    },
    {
      id: 'dawki-icp',
      name: 'Dawki Border Checkpost & Port',
      category: 'strategic',
      parentDistrictId: 'east-khasi',
      parentStateId: 'meghalaya',
      elevation: 85,
      lat: 25.190,
      lng: 92.020,
      description: 'International border crossing to Tamabil, Bangladesh on the Umngot River, handling major coal, stone aggregate, and limestone export freight.',
      aliases: ['dawki', 'tamabil', 'dawki border', 'dawki port', 'dawki checkpost', 'dawki icp'],
    },
    {
      id: 'sabroom-icp',
      name: 'Sabroom (Maitri Setu)',
      category: 'strategic',
      parentDistrictId: 'south-tripura',
      parentStateId: 'tripura',
      elevation: 25,
      lat: 23.000,
      lng: 91.730,
      description: 'Strategic border terminal connected via the Feni River Maitri Setu bridge, providing the shortest transit link (75 km) to Bangladesh’s Chittagong Port.',
      aliases: ['sabroom', 'maitri setu', 'feni bridge', 'sabroom border', 'sabroom icp', 'feni river bridge'],
    },
    {
      id: 'srimantapur-icp',
      name: 'Srimantapur ICP',
      category: 'strategic',
      parentDistrictId: 'west-tripura',
      parentStateId: 'tripura',
      elevation: 20,
      lat: 23.470,
      lng: 91.240,
      description: 'Inland water transport and overland border terminal in Sonamura linking to Daudkandi (Bangladesh).',
      aliases: ['srimantapur', 'sonamura port', 'srimantapur icp', 'sonamura icp'],
    },
    {
      id: 'akhaura-icp',
      name: 'Akhaura Integrated Checkpost (Agartala)',
      category: 'strategic',
      parentDistrictId: 'west-tripura',
      parentStateId: 'tripura',
      elevation: 25,
      lat: 23.850,
      lng: 91.260,
      description: 'Second largest land port on the Indo-Bangladesh border, featuring the Agartala-Akhaura international railway link.',
      aliases: ['akhaura', 'akhaura icp', 'akhaura border', 'agartala border post'],
    },
    {
      id: 'bogibeel-bridge',
      name: 'Bogibeel Rail-Road Bridge',
      category: 'strategic',
      parentDistrictId: 'dibrugarh',
      parentStateId: 'assam',
      elevation: 108,
      lat: 27.400,
      lng: 94.750,
      description: 'India\'s longest 4.94 km rail-cum-road bridge over the Brahmaputra connecting Dibrugarh with Dhemaji and eastern Arunachal Pradesh.',
      aliases: ['bogibeel bridge', 'bogibeel', 'bogibil bridge', 'bogibeel rail road bridge'],
    },
    {
      id: 'dhola-sadiya',
      name: 'Bhupen Hazarika Setu (Dhola-Sadiya Bridge)',
      category: 'strategic',
      parentDistrictId: 'tinsukia',
      parentStateId: 'assam',
      elevation: 120,
      lat: 27.780,
      lng: 95.660,
      description: '9.15 km bridge spanning the Lohit River, providing unbroken overland heavy freight access between Upper Assam and Roing/Anini/Tezu.',
      aliases: ['dhola sadiya', 'bhupen hazarika setu', 'dhola sadiya bridge', 'sadiya bridge', 'lohit bridge'],
    },
    {
      id: 'jogighopa-mmlp',
      name: 'Jogighopa Multi-Modal Logistics Park',
      category: 'strategic',
      parentDistrictId: 'barpeta',
      parentStateId: 'assam',
      elevation: 40,
      lat: 26.190,
      lng: 90.580,
      description: 'Premier 317-acre multi-modal logistics terminal integrating broad-gauge rail, 4-lane highway, National Waterway 2, and air freight.',
      aliases: ['jogighopa', 'jogighopa mmlp', 'jogighopa logistics park', 'jogighopa multimodal park'],
    },
    {
      id: 'pandu-port',
      name: 'Pandu River Port (Guwahati)',
      category: 'strategic',
      parentDistrictId: 'kamrup-metro',
      parentStateId: 'assam',
      elevation: 55,
      lat: 26.160,
      lng: 91.700,
      description: 'Principal multi-modal river port on the Brahmaputra (National Waterway 2) with fixed Ro-Ro jetties and direct broad-gauge rail links.',
      aliases: ['pandu port', 'pandu river port', 'pandu terminal', 'pandu river terminal', 'guwahati river port'],
    },
    {
      id: 'siliguri-corridor',
      name: 'Siliguri Corridor (Chicken\'s Neck)',
      category: 'strategic',
      parentDistrictId: 'siliguri-hub',
      parentStateId: 'sikkim',
      elevation: 122,
      lat: 26.720,
      lng: 88.420,
      description: 'Strategic 22 km wide land bridge connecting the 8 North Eastern States to mainland India; 85% of regional inbound freight transits this corridor.',
      aliases: ['siliguri corridor', 'chickens neck', 'chicken neck', "chicken's neck", 'siliguri choke point'],
    },
    {
      id: 'mao-gate',
      name: 'Mao Gate (Interstate Checkpost)',
      category: 'strategic',
      parentDistrictId: 'imphal-west',
      parentStateId: 'manipur',
      elevation: 1780,
      lat: 25.480,
      lng: 94.130,
      description: 'Strategic interstate boundary gate on NH-2 between Nagaland and Manipur, critical transit chokepoint for goods entering Imphal Valley.',
      aliases: ['mao gate', 'mao checkpost', 'mao border', 'nagaland manipur border'],
    },
    {
      id: 'churaibari-gate',
      name: 'Churaibari Commercial Checkpost',
      category: 'strategic',
      parentDistrictId: 'north-tripura',
      parentStateId: 'tripura',
      elevation: 30,
      lat: 24.520,
      lng: 92.240,
      description: 'Chief overland freight entry gate on NH-8 connecting Assam (Karimganj) into Tripura.',
      aliases: ['churaibari', 'churaibari checkpost', 'churaibari gate', 'tripura border gate'],
    },
    {
      id: 'vairengte-gate',
      name: 'Vairengte Interstate Gate',
      category: 'strategic',
      parentDistrictId: 'aizawl-dist',
      parentStateId: 'mizoram',
      elevation: 280,
      lat: 24.500,
      lng: 92.750,
      description: 'Primary commercial entry checkpost on NH-306 connecting Cachar, Assam with Mizoram.',
      aliases: ['vairengte', 'vairengte gate', 'vairengte checkpost', 'mizoram border gate'],
    },
    {
      id: 'zokhawthar-border',
      name: 'Zokhawthar Border Checkpoint',
      category: 'strategic',
      parentDistrictId: 'champhai',
      parentStateId: 'mizoram',
      elevation: 850,
      lat: 23.370,
      lng: 93.420,
      description: 'Border trade post on the Tiau River connecting eastern Mizoram (Champhai) with Rihkhawdar, Chin State, Myanmar.',
      aliases: ['zokhawthar', 'zokhawthar border', 'zokhawthar trade post', 'tiau river bridge'],
    },
    {
      id: 'kibithu',
      name: 'Kibithu Forward Logistics Post',
      category: 'strategic',
      parentDistrictId: 'lohit',
      parentStateId: 'arunachal',
      elevation: 1300,
      lat: 28.290,
      lng: 97.020,
      description: 'Easternmost motorable roadhead in India on the Lohit River near the LAC, accessed via the Walong highway.',
      aliases: ['kibithu', 'kibithoo', 'easternmost point india', 'kibithu border post'],
    },
    {
      id: 'walong',
      name: 'Walong Logistics Staging Post',
      category: 'strategic',
      parentDistrictId: 'lohit',
      parentStateId: 'arunachal',
      elevation: 1090,
      lat: 28.130,
      lng: 97.010,
      description: 'Historic battle site and vital logistics depot in Anjaw district on the Tezu-Hawai-Kibithu axis with an operational helipad.',
      aliases: ['walong', 'walong helipad', 'walong town'],
    },
    {
      id: 'kaho-village',
      name: 'Kaho (First Village of India)',
      category: 'strategic',
      parentDistrictId: 'lohit',
      parentStateId: 'arunachal',
      elevation: 1350,
      lat: 28.310,
      lng: 97.030,
      description: 'India\'s first village on the LAC along the Lohit River, terminus for the easternmost freight corridor.',
      aliases: ['kaho', 'kaho village', 'first village of india'],
    },
    {
      id: 'tuting',
      name: 'Tuting Forward Staging Post',
      category: 'strategic',
      parentDistrictId: 'east-siang',
      parentStateId: 'arunachal',
      elevation: 640,
      lat: 28.990,
      lng: 94.900,
      description: 'Advanced logistics and landing ground where the Tsangpo river enters India as the Siang.',
      aliases: ['tuting', 'tuting alg', 'siang entry post'],
    },
    {
      id: 'geling',
      name: 'Geling Border Post',
      category: 'strategic',
      parentDistrictId: 'east-siang',
      parentStateId: 'arunachal',
      elevation: 750,
      lat: 29.070,
      lng: 94.940,
      description: 'Northernmost settlement along the Siang River valley on the Mcmahon line border.',
      aliases: ['geling', 'geling border', 'geling village'],
    },
    {
      id: 'belonia-border',
      name: 'Belonia Border Terminal',
      category: 'strategic',
      parentDistrictId: 'south-tripura',
      parentStateId: 'tripura',
      elevation: 25,
      lat: 23.250,
      lng: 91.450,
      description: 'Important land trade station on the Muhuri River linking South Tripura with Feni, Bangladesh.',
      aliases: ['belonia', 'belonia border', 'belonia checkpost', 'belonia port'],
    },
    {
      id: 'jagiroad-cluster',
      name: 'Jagiroad Logistics & Semiconductor Complex',
      category: 'strategic',
      parentDistrictId: 'nagaon',
      parentStateId: 'assam',
      elevation: 65,
      lat: 26.120,
      lng: 92.210,
      description: 'Fast-developing high-tech manufacturing and logistics hub on NH-27, 50 km east of Guwahati.',
      aliases: ['jagiroad', 'jagi road', 'jagiroad cluster', 'tata semiconductor jagiroad'],
    },
    {
      id: 'numaligarh-terminal',
      name: 'Numaligarh Logistics & Energy Terminal',
      category: 'strategic',
      parentDistrictId: 'jorhat',
      parentStateId: 'assam',
      elevation: 100,
      lat: 26.580,
      lng: 93.750,
      description: 'Central crude and petroleum distribution terminal in Golaghat near the Brahmaputra river port at Silghat.',
      aliases: ['numaligarh', 'numaligarh refinery', 'nrl terminal', 'numaligarh depot'],
    },
    {
      id: 'bairabi-depot',
      name: 'Bairabi Railhead Freight Depot',
      category: 'strategic',
      parentDistrictId: 'aizawl-dist',
      parentStateId: 'mizoram',
      elevation: 60,
      lat: 24.190,
      lng: 92.530,
      description: 'Primary broad-gauge rail freight terminal linking Mizoram to the national railway network; transshipment point for Aizawl.',
      aliases: ['bairabi', 'bhairabi', 'bairabi depot', 'bairabi railway station'],
    },
    {
      id: 'pakyong-airport-terminal',
      name: 'Pakyong Airport Freight Terminal',
      category: 'strategic',
      parentDistrictId: 'east-sikkim',
      parentStateId: 'sikkim',
      elevation: 1399,
      lat: 27.225,
      lng: 88.584,
      description: 'High-altitude table-top greenfield airport in East Sikkim engineered with an 80m reinforced soil embankment.',
      aliases: ['pakyong', 'pakyong airport', 'pakyong terminal', 'pyg'],
    },

    // ============================================================
    // 4. STRATEGIC HIGHWAYS & FREIGHT CORRIDORS
    // ============================================================
    {
      id: 'nh-13-feat',
      name: 'NH-13 (Trans-Arunachal Highway)',
      category: 'road',
      parentDistrictId: 'itanagar',
      parentStateId: 'arunachal',
      lat: 27.200,
      lng: 93.500,
      description: 'Primary 1,559 km arterial highway traversing Arunachal Pradesh from Bhalukpong/Tawang to Pasighat, Roing, and Wakro.',
      aliases: ['nh 13', 'nh-13', 'nh13', 'trans arunachal highway', 'trans-arunachal highway'],
    },
    {
      id: 'nh-10-feat',
      name: 'NH-10 (Sikkim Lifeline Highway)',
      category: 'road',
      parentDistrictId: 'east-sikkim',
      parentStateId: 'sikkim',
      lat: 27.100,
      lng: 88.500,
      description: 'Sole lifeline highway connecting Siliguri and Gangtok along the Teesta River gorge; highly prone to monsoon rockfalls and landslides.',
      aliases: ['nh 10', 'nh-10', 'nh10', 'sikkim highway', 'teesta highway', 'gangtok siliguri road'],
    },
    {
      id: 'nh-717a-feat',
      name: 'NH-717A (Alternative Sikkim Highway)',
      category: 'road',
      parentDistrictId: 'east-sikkim',
      parentStateId: 'sikkim',
      lat: 27.150,
      lng: 88.620,
      description: 'Alternative all-weather highway corridor connecting Bagrakote through Pakyong to Gangtok, engineered to bypass landslide-prone Teesta sections on NH-10.',
      aliases: ['nh 717a', 'nh-717a', 'nh717a', 'alternative sikkim highway', 'bagrakote pakyong highway'],
    },
    {
      id: 'nh-6-feat',
      name: 'NH-6 (GS Road / Meghalaya Lifeline)',
      category: 'road',
      parentDistrictId: 'east-khasi',
      parentStateId: 'meghalaya',
      lat: 25.600,
      lng: 91.900,
      description: 'Arterial highway running from Jorabat (Guwahati) through Shillong and Jowai to Badarpur/Silchar.',
      aliases: ['nh 6', 'nh-6', 'nh6', 'gs road', 'guwahati shillong road', 'shillong silchar highway'],
    },
    {
      id: 'nh-27-feat',
      name: 'NH-27 (East-West Highway)',
      category: 'road',
      parentDistrictId: 'kamrup-metro',
      parentStateId: 'assam',
      lat: 26.300,
      lng: 91.500,
      description: '4-lane East-West Corridor connecting mainland India through North Bengal and Lower Assam to Guwahati, Nagaon, and Dibrugarh.',
      aliases: ['nh 27', 'nh-27', 'nh27', 'east west corridor', 'east-west highway', 'nh 37 east west'],
    },
    {
      id: 'nh-29-feat',
      name: 'NH-29 (Nagaland Lifeline)',
      category: 'road',
      parentDistrictId: 'dimapur',
      parentStateId: 'nagaland',
      lat: 25.800,
      lng: 93.900,
      description: 'Arterial highway connecting the Dimapur rail gateway to the capital Kohima; vulnerable to land subsidence near Paglapahar.',
      aliases: ['nh 29', 'nh-29', 'nh29', 'dimapur kohima road', 'kohima highway'],
    },
    {
      id: 'nh-2-feat',
      name: 'NH-2 (Imphal Highway / AH-1)',
      category: 'road',
      parentDistrictId: 'imphal-west',
      parentStateId: 'manipur',
      lat: 25.200,
      lng: 94.000,
      description: 'Interstate highway running from Dimapur through Kohima and Mao Gate into the Imphal Valley, forming part of Asian Highway 1.',
      aliases: ['nh 2', 'nh-2', 'nh2', 'imphal road', 'asian highway 1', 'ah 1', 'ah1'],
    },
    {
      id: 'nh-102-feat',
      name: 'NH-102 (Imphal-Moreh Trilateral Corridor)',
      category: 'road',
      parentDistrictId: 'imphal-west',
      parentStateId: 'manipur',
      lat: 24.500,
      lng: 94.100,
      description: 'International transit highway running from Imphal through Thoubal and Tengnoupal to the Moreh border crossing.',
      aliases: ['nh 102', 'nh-102', 'nh102', 'imphal moreh highway', 'trilateral highway section'],
    },
    {
      id: 'nh-306-feat',
      name: 'NH-306 (Aizawl Lifeline Highway)',
      category: 'road',
      parentDistrictId: 'aizawl-dist',
      parentStateId: 'mizoram',
      lat: 24.100,
      lng: 92.700,
      description: 'Sole national highway linking Silchar (Assam) via Vairengte and Kolasib to Aizawl (Mizoram); single/intermediate lane prone to monsoon degradation.',
      aliases: ['nh 306', 'nh-306', 'nh306', 'aizawl highway', 'silchar aizawl highway'],
    },
    {
      id: 'nh-8-feat',
      name: 'NH-8 (Tripura Lifeline Highway)',
      category: 'road',
      parentDistrictId: 'west-tripura',
      parentStateId: 'tripura',
      lat: 24.100,
      lng: 91.800,
      description: 'Vital national highway linking Silchar and Karimganj in Assam through Churaibari, Ambassa, and Agartala to Sabroom.',
      aliases: ['nh 8', 'nh-8', 'nh8', 'tripura highway', 'agartala highway', 'assam tripura road'],
    },
    {
      id: 'nh-313-feat',
      name: 'NH-313 (Roing-Anini Highway)',
      category: 'road',
      parentDistrictId: 'dibang-valley',
      parentStateId: 'arunachal',
      lat: 28.500,
      lng: 95.900,
      description: '225 km mountain highway passing through Hunli and Mayodia Pass to connect Roing with the remote headquarters of Anini.',
      aliases: ['nh 313', 'nh-313', 'nh313', 'roing anini highway', 'anini road'],
    },
    {
      id: 'nh-37-feat',
      name: 'NH-37 (Assam Trunk Corridor)',
      category: 'road',
      parentDistrictId: 'kamrup-metro',
      parentStateId: 'assam',
      lat: 26.500,
      lng: 93.000,
      description: 'Historic arterial trunk highway traversing Assam along the south bank of the Brahmaputra through Kaziranga, Jorhat, and Dibrugarh.',
      aliases: ['nh 37', 'nh-37', 'nh37', 'assam trunk road', 'at road'],
    },
    {
      id: 'nh-15-feat',
      name: 'NH-15 (North Bank Trunk Highway)',
      category: 'road',
      parentDistrictId: 'sonitpur',
      parentStateId: 'assam',
      lat: 26.800,
      lng: 93.200,
      description: 'High-capacity northern highway running from Baihata Chariali through Tezpur and North Lakhimpur to Pasighat.',
      aliases: ['nh 15', 'nh-15', 'nh15', 'north bank highway', 'nh 52 new'],
    },
    {
      id: 'nh-510-feat',
      name: 'NH-510 (West Sikkim Highway)',
      category: 'road',
      parentDistrictId: 'west-sikkim',
      parentStateId: 'sikkim',
      lat: 27.250,
      lng: 88.300,
      description: 'State arterial road linking Singtam and Rabongla with Legship, Gyalshing, and Pelling in West Sikkim.',
      aliases: ['nh 510', 'nh-510', 'nh510', 'pelling highway', 'rabongla legship road'],
    },
    {
      id: 'nh-54-feat',
      name: 'NH-54 (Central Mizoram Highway)',
      category: 'road',
      parentDistrictId: 'lunglei',
      parentStateId: 'mizoram',
      lat: 23.000,
      lng: 92.800,
      description: 'Longitudinal mountain road extending from Aizawl southward through Serchhip and Lunglei towards Tuipang.',
      aliases: ['nh 54', 'nh-54', 'nh54', 'aizawl lunglei highway'],
    },
    {
      id: 'kaladan-corridor',
      name: 'Kaladan Multi-Modal Transit Corridor',
      category: 'road',
      parentDistrictId: 'lunglei',
      parentStateId: 'mizoram',
      lat: 22.400,
      lng: 92.900,
      description: 'Strategic international freight corridor linking Sittwe Port in Myanmar to southern Mizoram at Zorinpui and Lawngtlai.',
      aliases: ['kaladan', 'kaladan corridor', 'kaladan project', 'kaladan multi modal', 'zorinpui road'],
    },

    // ============================================================
    // 5. REGIONAL TOWNS, HUBS & CENTERS (MAPPED TO PARENT DISTRICTS)
    // ============================================================
    // --- ARUNACHAL PRADESH ---
    { id: 'tezpur', name: 'Tezpur', category: 'town', parentDistrictId: 'sonitpur', parentStateId: 'assam', elevation: 48, lat: 26.63, lng: 92.78, description: 'Historic logistics staging center on the north bank of the Brahmaputra.', aliases: ['tezpur', 'tezpore'] },
    { id: 'bomdila', name: 'Bomdila', category: 'town', parentDistrictId: 'west-kameng', parentStateId: 'arunachal', elevation: 2217, lat: 27.27, lng: 92.42, description: 'Headquarters of West Kameng and key high-altitude staging post on the route to Tawang.', aliases: ['bomdila', 'bomdilla'] },
    { id: 'dirang', name: 'Dirang', category: 'town', parentDistrictId: 'west-kameng', parentStateId: 'arunachal', elevation: 1560, lat: 27.35, lng: 92.24, description: 'Valley settlement on the Bhalukpong-Tawang highway.', aliases: ['dirang'] },
    { id: 'bhalukpong', name: 'Bhalukpong', category: 'town', parentDistrictId: 'west-kameng', parentStateId: 'arunachal', elevation: 213, lat: 27.01, lng: 92.65, description: 'Entry border gate to western Arunachal Pradesh on the Kameng River.', aliases: ['bhalukpong', 'bhalukpung'] },
    { id: 'rupa', name: 'Rupa', category: 'town', parentDistrictId: 'west-kameng', parentStateId: 'arunachal', elevation: 1450, lat: 27.20, lng: 92.40, description: 'Township in West Kameng on the Tenga River.', aliases: ['rupa'] },
    { id: 'lumla', name: 'Lumla', category: 'town', parentDistrictId: 'tawang', parentStateId: 'arunachal', elevation: 2400, lat: 27.53, lng: 91.71, description: 'Subdivisional town west of Tawang near the Bhutan border.', aliases: ['lumla'] },
    { id: 'jang', name: 'Jang', category: 'town', parentDistrictId: 'tawang', parentStateId: 'arunachal', elevation: 2100, lat: 27.57, lng: 91.98, description: 'Gateway town near Nuranang Falls between Sela Pass and Tawang.', aliases: ['jang', 'nuranang'] },
    { id: 'zemithang', name: 'Zemithang', category: 'town', parentDistrictId: 'tawang', parentStateId: 'arunachal', elevation: 2300, lat: 27.70, lng: 91.72, description: 'Forward border circle in northwestern Tawang along the Nyamjang Chu.', aliases: ['zemithang', 'zimithang'] },
    { id: 'ziro', name: 'Ziro', category: 'town', parentDistrictId: 'lower-subansiri', parentStateId: 'arunachal', elevation: 1572, lat: 27.53, lng: 93.83, description: 'Headquarters of Lower Subansiri district in the Apatani plateau.', aliases: ['ziro', 'hapoli'] },
    { id: 'daporijo', name: 'Daporijo', category: 'town', parentDistrictId: 'lower-subansiri', parentStateId: 'arunachal', elevation: 600, lat: 27.98, lng: 94.22, description: 'Headquarters of Upper Subansiri on the Subansiri River.', aliases: ['daporijo', 'daporizo'] },
    { id: 'koloriang', name: 'Koloriang', category: 'town', parentDistrictId: 'lower-subansiri', parentStateId: 'arunachal', elevation: 1040, lat: 27.90, lng: 93.35, description: 'Hilly headquarters town in Kurung Kumey district.', aliases: ['koloriang'] },
    { id: 'seppa', name: 'Seppa', category: 'town', parentDistrictId: 'west-kameng', parentStateId: 'arunachal', elevation: 363, lat: 27.35, lng: 93.03, description: 'Headquarters of East Kameng on the Kameng River.', aliases: ['seppa'] },
    { id: 'roing', name: 'Roing', category: 'town', parentDistrictId: 'lower-dibang', parentStateId: 'arunachal', elevation: 390, lat: 28.14, lng: 95.83, description: 'Strategic gateway town for the Dibang Valley and Anini corridor.', aliases: ['roing'] },
    { id: 'anini', name: 'Anini', category: 'town', parentDistrictId: 'dibang-valley', parentStateId: 'arunachal', elevation: 1968, lat: 28.79, lng: 95.90, description: 'Remote high-altitude headquarters of Dibang Valley district.', aliases: ['anini'] },
    { id: 'hunli', name: 'Hunli', category: 'town', parentDistrictId: 'dibang-valley', parentStateId: 'arunachal', elevation: 1250, lat: 28.45, lng: 95.96, description: 'Midway mountain staging settlement on the Roing-Anini road (NH-313).', aliases: ['hunli'] },
    { id: 'tezu', name: 'Tezu', category: 'town', parentDistrictId: 'lohit', parentStateId: 'arunachal', elevation: 210, lat: 27.91, lng: 96.16, description: 'Commercial center and headquarters of Lohit district.', aliases: ['tezu'] },
    { id: 'pasighat', name: 'Pasighat', category: 'town', parentDistrictId: 'east-siang', parentStateId: 'arunachal', elevation: 155, lat: 28.07, lng: 95.33, description: 'Oldest town in Arunachal Pradesh on the Siang River with Advanced Landing Ground (ALG).', aliases: ['pasighat'] },
    { id: 'aalo', name: 'Aalo (Along)', category: 'town', parentDistrictId: 'east-siang', parentStateId: 'arunachal', elevation: 619, lat: 28.17, lng: 94.80, description: 'Commercial hub of West Siang on the Siyom River.', aliases: ['aalo', 'along', 'aalo along'] },
    { id: 'namsai', name: 'Namsai', category: 'town', parentDistrictId: 'lohit', parentStateId: 'arunachal', elevation: 156, lat: 27.67, lng: 95.86, description: 'Agricultural trading hub in eastern Arunachal Pradesh.', aliases: ['namsai'] },
    { id: 'khonsa', name: 'Khonsa', category: 'town', parentDistrictId: 'changlang', parentStateId: 'arunachal', elevation: 1215, lat: 26.99, lng: 95.50, description: 'Hilly headquarters town in Tirap district.', aliases: ['khonsa'] },
    { id: 'miao', name: 'Miao', category: 'town', parentDistrictId: 'changlang', parentStateId: 'arunachal', elevation: 213, lat: 27.49, lng: 96.20, description: 'Subdivisional center near Namdapha National Park.', aliases: ['miao'] },
    { id: 'jairampur', name: 'Jairampur', category: 'town', parentDistrictId: 'changlang', parentStateId: 'arunachal', elevation: 250, lat: 27.35, lng: 96.05, description: 'Gateway town on the historic Stilwell Road.', aliases: ['jairampur'] },

    // --- SIKKIM ---
    { id: 'pelling', name: 'Pelling', category: 'town', parentDistrictId: 'west-sikkim', parentStateId: 'sikkim', elevation: 2150, lat: 27.317, lng: 88.233, description: 'High-altitude mountain town in West Sikkim, connected via NH-510 from Gangtok.', aliases: ['pelling', 'peling'] },
    { id: 'gyalshing', name: 'Gyalshing', category: 'town', parentDistrictId: 'west-sikkim', parentStateId: 'sikkim', elevation: 1800, lat: 27.28, lng: 88.25, description: 'Headquarters of West Sikkim district.', aliases: ['gyalshing', 'gezing', 'gelling'] },
    { id: 'yuksom', name: 'Yuksom', category: 'town', parentDistrictId: 'west-sikkim', parentStateId: 'sikkim', elevation: 1780, lat: 27.37, lng: 88.22, description: 'Historic first capital of Sikkim and trailhead for Kanchenjunga expeditions.', aliases: ['yuksom', 'yuksoma'] },
    { id: 'ravangla', name: 'Ravangla', category: 'town', parentDistrictId: 'south-sikkim', parentStateId: 'sikkim', elevation: 2100, lat: 27.306, lng: 88.363, description: 'Mountain transit town in South Sikkim on the Gangtok-Pelling road.', aliases: ['ravangla', 'rabongla', 'rabangla'] },
    { id: 'namchi', name: 'Namchi', category: 'town', parentDistrictId: 'south-sikkim', parentStateId: 'sikkim', elevation: 1315, lat: 27.16, lng: 88.36, description: 'Headquarters of South Sikkim district.', aliases: ['namchi'] },
    { id: 'jorethang', name: 'Jorethang', category: 'town', parentDistrictId: 'south-sikkim', parentStateId: 'sikkim', elevation: 300, lat: 27.12, lng: 88.30, description: 'Major commercial distribution and transit town on the Rangeet River.', aliases: ['jorethang'] },
    { id: 'melli', name: 'Melli', category: 'town', parentDistrictId: 'south-sikkim', parentStateId: 'sikkim', elevation: 250, lat: 27.08, lng: 88.45, description: 'Key border checkpoint town between West Bengal and Sikkim on the Teesta.', aliases: ['melli'] },
    { id: 'singtam', name: 'Singtam', category: 'town', parentDistrictId: 'east-sikkim', parentStateId: 'sikkim', elevation: 350, lat: 27.23, lng: 88.50, description: 'Central commercial intersection in Sikkim where NH-10 meets NH-510.', aliases: ['singtam'] },
    { id: 'rangpo', name: 'Rangpo', category: 'town', parentDistrictId: 'east-sikkim', parentStateId: 'sikkim', elevation: 300, lat: 27.18, lng: 88.53, description: 'Primary gateway town and railhead entry post to Sikkim.', aliases: ['rangpo'] },
    { id: 'pakyong', name: 'Pakyong', category: 'town', parentDistrictId: 'east-sikkim', parentStateId: 'sikkim', elevation: 1399, lat: 27.24, lng: 88.59, description: 'Subdivisional hub and airport center in East Sikkim.', aliases: ['pakyong', 'pakyong town'] },
    { id: 'mangan', name: 'Mangan', category: 'town', parentDistrictId: 'north-sikkim', parentStateId: 'sikkim', elevation: 956, lat: 27.50, lng: 88.53, description: 'Headquarters of North Sikkim district on NH-10 extension.', aliases: ['mangan'] },
    { id: 'chungthang', name: 'Chungthang', category: 'town', parentDistrictId: 'north-sikkim', parentStateId: 'sikkim', elevation: 1790, lat: 27.60, lng: 88.65, description: 'Strategic fork town where the routes to Lachen and Lachung diverge.', aliases: ['chungthang', 'chungtang'] },
    { id: 'lachung', name: 'Lachung', category: 'town', parentDistrictId: 'north-sikkim', parentStateId: 'sikkim', elevation: 2700, lat: 27.69, lng: 88.74, description: 'High-altitude mountain village leading to Yumthang Valley.', aliases: ['lachung'] },
    { id: 'lachen', name: 'Lachen', category: 'town', parentDistrictId: 'north-sikkim', parentStateId: 'sikkim', elevation: 2750, lat: 27.72, lng: 88.55, description: 'High mountain settlement leading to Gurudongmar Lake.', aliases: ['lachen'] },
    { id: 'gurudongmar', name: 'Gurudongmar Lake Post', category: 'strategic', parentDistrictId: 'north-sikkim', parentStateId: 'sikkim', elevation: 5183, lat: 28.02, lng: 88.71, description: 'Ultra high-altitude sacred lake and border staging post in northern Sikkim.', aliases: ['gurudongmar', 'gurudongmar lake'] },

    // --- MEGHALAYA ---
    { id: 'cherrapunji', name: 'Cherrapunji (Sohra)', category: 'town', parentDistrictId: 'east-khasi', parentStateId: 'meghalaya', elevation: 1430, lat: 25.27, lng: 91.73, description: 'High rainfall plateau in East Khasi Hills, prone to extreme monsoon weather.', aliases: ['cherrapunji', 'sohra', 'cherrapunjee'] },
    { id: 'mawsynram', name: 'Mawsynram', category: 'town', parentDistrictId: 'east-khasi', parentStateId: 'meghalaya', elevation: 1400, lat: 25.30, lng: 91.58, description: 'Wettest inhabited place on Earth with critical monsoon road vulnerability.', aliases: ['mawsynram'] },
    { id: 'mawlynnong-feat', name: 'Mawlynnong', category: 'town', parentDistrictId: 'east-khasi', parentStateId: 'meghalaya', elevation: 490, lat: 25.201, lng: 91.916, description: 'Border township in the southern East Khasi Hills near the Bangladesh plains, accessed via Pynursla road.', aliases: ['mawlynnong', 'cleanest village'] },
    { id: 'jowai', name: 'Jowai', category: 'town', parentDistrictId: 'east-khasi', parentStateId: 'meghalaya', elevation: 1380, lat: 25.45, lng: 92.20, description: 'Commercial center of West Jaintia Hills on NH-6.', aliases: ['jowai'] },
    { id: 'khliehriat', name: 'Khliehriat', category: 'town', parentDistrictId: 'east-khasi', parentStateId: 'meghalaya', elevation: 1200, lat: 25.35, lng: 92.36, description: 'Commercial mining and cement hub in East Jaintia Hills on NH-6.', aliases: ['khliehriat'] },
    { id: 'nongpoh', name: 'Nongpoh', category: 'town', parentDistrictId: 'ri-bhoi', parentStateId: 'meghalaya', elevation: 485, lat: 25.90, lng: 91.88, description: 'Midway staging point on the Guwahati-Shillong corridor (GS Road).', aliases: ['nongpoh'] },
    { id: 'byrnihat', name: 'Byrnihat Industrial Corridor', category: 'strategic', parentDistrictId: 'ri-bhoi', parentStateId: 'meghalaya', elevation: 100, lat: 26.05, lng: 91.87, description: 'Key export-import industrial processing hub on the Assam-Meghalaya border.', aliases: ['byrnihat', 'burnihat'] },
    { id: 'tura', name: 'Tura', category: 'town', parentDistrictId: 'west-garo', parentStateId: 'meghalaya', elevation: 380, lat: 25.52, lng: 90.22, description: 'Commercial capital of the Garo Hills region in western Meghalaya.', aliases: ['tura'] },
    { id: 'baghmara', name: 'Baghmara', category: 'town', parentDistrictId: 'south-garo', parentStateId: 'meghalaya', elevation: 450, lat: 25.28, lng: 90.62, description: 'Headquarters of South Garo Hills on the Someshwari River.', aliases: ['baghmara'] },
    { id: 'williamnagar', name: 'Williamnagar', category: 'town', parentDistrictId: 'west-garo', parentStateId: 'meghalaya', elevation: 340, lat: 25.60, lng: 90.60, description: 'Headquarters of East Garo Hills on the Simsang River.', aliases: ['williamnagar'] },
    { id: 'nongstoin', name: 'Nongstoin', category: 'town', parentDistrictId: 'east-khasi', parentStateId: 'meghalaya', elevation: 1400, lat: 25.52, lng: 91.27, description: 'Headquarters of West Khasi Hills district.', aliases: ['nongstoin'] },
    { id: 'mairang', name: 'Mairang', category: 'town', parentDistrictId: 'east-khasi', parentStateId: 'meghalaya', elevation: 1564, lat: 25.56, lng: 91.64, description: 'Headquarters of Eastern West Khasi Hills district on Shillong-Nongstoin road.', aliases: ['mairang'] },

    // --- MIZORAM ---
    { id: 'kolasib', name: 'Kolasib', category: 'town', parentDistrictId: 'aizawl-dist', parentStateId: 'mizoram', elevation: 610, lat: 24.22, lng: 92.68, description: 'Northern gateway town of Mizoram on the Silchar-Aizawl highway (NH-306).', aliases: ['kolasib'] },
    { id: 'serchhip', name: 'Serchhip', category: 'town', parentDistrictId: 'aizawl-dist', parentStateId: 'mizoram', elevation: 880, lat: 23.31, lng: 92.83, description: 'Central agricultural town in central Mizoram.', aliases: ['serchhip'] },
    { id: 'lawngtlai', name: 'Lawngtlai', category: 'town', parentDistrictId: 'lunglei', parentStateId: 'mizoram', elevation: 760, lat: 22.52, lng: 92.89, description: 'Southern town in Mizoram near the Kaladan Multi-Modal Transit project corridor.', aliases: ['lawngtlai'] },
    { id: 'saiha', name: 'Saiha', category: 'town', parentDistrictId: 'lunglei', parentStateId: 'mizoram', elevation: 729, lat: 22.48, lng: 92.97, description: 'Southernmost district headquarters in Mizoram (Mara Autonomous Region).', aliases: ['saiha', 'siaha'] },
    { id: 'mamit', name: 'Mamit', category: 'town', parentDistrictId: 'aizawl-dist', parentStateId: 'mizoram', elevation: 718, lat: 23.93, lng: 92.49, description: 'Headquarters of Mamit district in western Mizoram.', aliases: ['mamit'] },
    { id: 'lengpui', name: 'Lengpui', category: 'town', parentDistrictId: 'aizawl-dist', parentStateId: 'mizoram', elevation: 420, lat: 23.84, lng: 92.62, description: 'Airport township servicing the capital Aizawl.', aliases: ['lengpui'] },

    // --- NAGALAND ---
    { id: 'mokokchung', name: 'Mokokchung', category: 'town', parentDistrictId: 'kohima', parentStateId: 'nagaland', elevation: 1325, lat: 26.32, lng: 94.52, description: 'Cultural and logistics hub of central Nagaland.', aliases: ['mokokchung'] },
    { id: 'wokha', name: 'Wokha', category: 'town', parentDistrictId: 'kohima', parentStateId: 'nagaland', elevation: 1313, lat: 26.10, lng: 94.26, description: 'Agricultural trade town on the Kohima-Mokokchung route.', aliases: ['wokha'] },
    { id: 'zunheboto', name: 'Zunheboto', category: 'town', parentDistrictId: 'kohima', parentStateId: 'nagaland', elevation: 1800, lat: 26.01, lng: 94.52, description: 'High-altitude central town in Nagaland.', aliases: ['zunheboto'] },
    { id: 'phek', name: 'Phek', category: 'town', parentDistrictId: 'kohima', parentStateId: 'nagaland', elevation: 1400, lat: 25.68, lng: 94.50, description: 'Headquarters of Phek district in southeastern Nagaland.', aliases: ['phek'] },
    { id: 'pfutsero', name: 'Pfütsero', category: 'town', parentDistrictId: 'kohima', parentStateId: 'nagaland', elevation: 2133, lat: 25.68, lng: 94.32, description: 'Highest altitude township in Nagaland, known for cold-climate agriculture.', aliases: ['pfutsero', 'pfütsero'] },
    { id: 'chumoukedima', name: 'Chümoukedima', category: 'town', parentDistrictId: 'dimapur', parentStateId: 'nagaland', elevation: 220, lat: 25.79, lng: 93.77, description: 'Major administrative and educational corridor adjoining Dimapur on NH-29.', aliases: ['chumoukedima', 'chumukedima'] },
    { id: 'kiphire', name: 'Kiphire', category: 'town', parentDistrictId: 'tuensang', parentStateId: 'nagaland', elevation: 896, lat: 25.87, lng: 94.78, description: 'Eastern border district headquarters near Mount Saramati.', aliases: ['kiphire'] },
    { id: 'longleng', name: 'Longleng', category: 'town', parentDistrictId: 'mon', parentStateId: 'nagaland', elevation: 1066, lat: 26.47, lng: 94.81, description: 'Headquarters of Longleng district in northeastern Nagaland.', aliases: ['longleng'] },
    { id: 'peren', name: 'Peren', category: 'town', parentDistrictId: 'kohima', parentStateId: 'nagaland', elevation: 1445, lat: 25.51, lng: 93.73, description: 'Headquarters of Peren district in southwestern Nagaland.', aliases: ['peren', 'jalukie'] },

    // --- TRIPURA ---
    { id: 'dharmanagar', name: 'Dharmanagar', category: 'town', parentDistrictId: 'north-tripura', parentStateId: 'tripura', elevation: 21, lat: 24.38, lng: 92.16, description: 'Major broad-gauge freight railhead and commercial gateway to Tripura.', aliases: ['dharmanagar'] },
    { id: 'kailashahar', name: 'Kailashahar', category: 'town', parentDistrictId: 'north-tripura', parentStateId: 'tripura', elevation: 25, lat: 24.32, lng: 92.02, description: 'Historic border town on the Manu River.', aliases: ['kailashahar'] },
    { id: 'kumarghat', name: 'Kumarghat', category: 'town', parentDistrictId: 'north-tripura', parentStateId: 'tripura', elevation: 30, lat: 24.16, lng: 92.03, description: 'Key railway junction and fruit processing freight depot in Unakoti.', aliases: ['kumarghat'] },
    { id: 'ambassa', name: 'Ambassa', category: 'town', parentDistrictId: 'dhalai', parentStateId: 'tripura', elevation: 50, lat: 23.92, lng: 91.85, description: 'Centrally located district headquarters of Dhalai on NH-8.', aliases: ['ambassa'] },
    { id: 'udaipur', name: 'Udaipur (Tripura)', category: 'town', parentDistrictId: 'south-tripura', parentStateId: 'tripura', elevation: 25, lat: 23.53, lng: 91.48, description: 'Major commercial town on the Gumti River in southern Tripura.', aliases: ['udaipur', 'radhakishorepur'] },
    { id: 'belonia-town', name: 'Belonia', category: 'town', parentDistrictId: 'south-tripura', parentStateId: 'tripura', elevation: 25, lat: 23.25, lng: 91.45, description: 'Headquarters of South Tripura district on the Muhuri River.', aliases: ['belonia'] },
    { id: 'khowai', name: 'Khowai', category: 'town', parentDistrictId: 'west-tripura', parentStateId: 'tripura', elevation: 23, lat: 24.06, lng: 91.60, description: 'District center along the Khowai River near the Bangladesh border.', aliases: ['khowai'] },
    { id: 'teliamura', name: 'Teliamura', category: 'town', parentDistrictId: 'west-tripura', parentStateId: 'tripura', elevation: 28, lat: 23.84, lng: 91.63, description: 'Important commercial road junction on NH-8 connecting Dhalai with Agartala.', aliases: ['teliamura'] },
    { id: 'jampui-hills', name: 'Jampui Hills', category: 'town', parentDistrictId: 'north-tripura', parentStateId: 'tripura', elevation: 930, lat: 23.90, lng: 92.27, description: 'Highest hill range in Tripura on the Mizoram border, known for orange and horticultural freight.', aliases: ['jampui', 'jampui hills', 'vanghmun'] },

    // --- ASSAM ---
    { id: 'sivasagar', name: 'Sivasagar', category: 'town', parentDistrictId: 'jorhat', parentStateId: 'assam', elevation: 95, lat: 26.98, lng: 94.63, description: 'Major oil and tea trade town in Upper Assam.', aliases: ['sivasagar', 'sibasagar'] },
    { id: 'golaghat', name: 'Golaghat', category: 'town', parentDistrictId: 'jorhat', parentStateId: 'assam', elevation: 95, lat: 26.52, lng: 93.97, description: 'Commercial center near the Numaligarh Refinery.', aliases: ['golaghat'] },
    { id: 'digboi', name: 'Digboi', category: 'town', parentDistrictId: 'tinsukia', parentStateId: 'assam', elevation: 152, lat: 27.38, lng: 95.63, description: 'Historic oil town and petroleum distribution hub in Upper Assam.', aliases: ['digboi'] },
    { id: 'margherita', name: 'Margherita', category: 'town', parentDistrictId: 'tinsukia', parentStateId: 'assam', elevation: 162, lat: 27.28, lng: 95.68, description: 'Coal and timber freight center on the Dihing River.', aliases: ['margherita'] },
    { id: 'haflong', name: 'Haflong', category: 'town', parentDistrictId: 'silchar', parentStateId: 'assam', elevation: 966, lat: 25.18, lng: 93.02, description: 'Sole hill station in Assam, connecting central Assam to Barak Valley via broad-gauge hill railway.', aliases: ['haflong', 'dima hasao'] },
    { id: 'diphu', name: 'Diphu', category: 'town', parentDistrictId: 'nagaon', parentStateId: 'assam', elevation: 186, lat: 25.84, lng: 93.43, description: 'Headquarters of Karbi Anglong on the broad-gauge main line.', aliases: ['diphu', 'karbi anglong'] },
    { id: 'karimganj', name: 'Karimganj', category: 'town', parentDistrictId: 'silchar', parentStateId: 'assam', elevation: 18, lat: 24.87, lng: 92.35, description: 'Important river port and border town in the Barak Valley.', aliases: ['karimganj'] },
    { id: 'badarpur', name: 'Badarpur', category: 'town', parentDistrictId: 'silchar', parentStateId: 'assam', elevation: 16, lat: 24.90, lng: 92.60, description: 'Premier railway junction and fuel transshipment depot in southern Assam.', aliases: ['badarpur'] },
    { id: 'dhubri', name: 'Dhubri', category: 'town', parentDistrictId: 'barpeta', parentStateId: 'assam', elevation: 34, lat: 26.02, lng: 89.97, description: 'Historic river port on National Waterway 2 near the Bangladesh border.', aliases: ['dhubri'] },
    { id: 'bongaigaon', name: 'Bongaigaon', category: 'town', parentDistrictId: 'barpeta', parentStateId: 'assam', elevation: 54, lat: 26.50, lng: 90.55, description: 'Major petrochemical and railway junction in western Assam.', aliases: ['bongaigaon', 'new bongaigaon'] },
    { id: 'north-lakhimpur', name: 'North Lakhimpur', category: 'town', parentDistrictId: 'sonitpur', parentStateId: 'assam', elevation: 101, lat: 27.23, lng: 94.10, description: 'Commercial center on the north bank of the Brahmaputra.', aliases: ['north lakhimpur', 'lakhimpur'] },
    { id: 'dhemaji', name: 'Dhemaji', category: 'town', parentDistrictId: 'dibrugarh', parentStateId: 'assam', elevation: 91, lat: 27.48, lng: 94.58, description: 'North bank terminus connected to Dibrugarh via Bogibeel Bridge.', aliases: ['dhemaji'] },
    { id: 'sadiya', name: 'Sadiya', category: 'town', parentDistrictId: 'tinsukia', parentStateId: 'assam', elevation: 120, lat: 27.83, lng: 95.67, description: 'Historic frontier township on the north bank of the Lohit River.', aliases: ['sadiya', 'chapakhowa'] },
    { id: 'bokajan', name: 'Bokajan', category: 'town', parentDistrictId: 'nagaon', parentStateId: 'assam', elevation: 138, lat: 26.02, lng: 93.78, description: 'Major cement manufacturing and heavy railhead hub in Karbi Anglong.', aliases: ['bokajan'] },
    { id: 'morigaon', name: 'Morigaon', category: 'town', parentDistrictId: 'nagaon', parentStateId: 'assam', elevation: 56, lat: 26.25, lng: 92.34, description: 'Commercial district center on the southern bank of the Brahmaputra.', aliases: ['morigaon'] },
  ];

  /**
   * Fast Levenshtein distance for fuzzy matching of place names
   */
  private static levenshtein(a: string, b: string): number {
    if (a === b) return 0;
    if (!a.length) return b.length;
    if (!b.length) return a.length;
    const v0: number[] = [];
    const v1: number[] = [];
    for (let i = 0; i <= b.length; i++) v0[i] = i;
    for (let i = 0; i < a.length; i++) {
      v1[0] = i + 1;
      for (let j = 0; j < b.length; j++) {
        const cost = a[i] === b[j] ? 0 : 1;
        v1[j + 1] = Math.min(v1[j] + 1, v0[j + 1] + 1, v0[j] + cost);
      }
      for (let j = 0; j <= b.length; j++) v0[j] = v1[j];
    }
    return v0[b.length];
  }

  /**
   * Resolve any place name into an existing platform district, state, city, hub, or strategic feature.
   * If a non-district location is matched (pass, valley, road, town), it maps it to its parent district
   * and attaches a clear proxy disclosure notice.
   * Never falls back to generic regional summary when a meaningful match exists.
   */
  public static resolveLocation(rawInput: string, contextHint?: string): LocationResolutionResult {
    const query = (rawInput || '').trim().toLowerCase();
    if (!query) {
      return { found: false, type: 'unknown', matchedName: rawInput, normalizedQuery: query };
    }

    // 1. Clean query of conversational filler words and administrative prefixes
    const clean = query
      .replace(/\b(what is the|tell me about|how is|how accessible is|what are the risks at|risks at|risk at|forecast for|demand in|demand for|accessibility of|route from|route between|find route|nearest hub to|logistics in|logistics on|about|in|near|at|of|to|from|for|please|can you|give me)\b/gi, '')
      .replace(/\b(district|dist|city|town|junction|hub|depot|terminal|railway station|airport|state|pass|valley|highway|road)\b/gi, '')
      .replace(/[,\-_.]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const searchKey = clean.length >= 2 ? clean : query;

    // 2. CHECK STRATEGIC GEOGRAPHIC FEATURE CATALOG (Passes, Valleys, Strategic Points, Highways, Towns)
    for (const feat of this.STRATEGIC_FEATURES) {
      const match = feat.aliases.some(alias => {
        const aClean = alias.replace(/[,\-_.]/g, ' ').replace(/\s+/g, ' ').trim();
        return (
          query === alias ||
          clean === aClean ||
          query.includes(alias) ||
          clean.includes(aClean) ||
          (aClean.length >= 4 && query.includes(aClean)) ||
          (clean.length >= 4 && aClean.includes(clean))
        );
      });

      if (match) {
        const parentDist = districts.find(d => d.id === feat.parentDistrictId) || districts[0];
        const parentSt = states.find(s => s.id === feat.parentStateId) || states[0];

        const categoryLabel =
          feat.category === 'pass' ? 'High-Altitude Mountain Pass' :
          feat.category === 'valley' ? 'Regional Valley & Natural Corridor' :
          feat.category === 'road' ? 'Arterial Highway Corridor' :
          feat.category === 'strategic' ? 'Strategic Border / Multi-Modal Terminal' :
          'Regional Township';

        return {
          found: true,
          type: feat.category,
          district: parentDist,
          state: parentSt,
          lat: feat.lat,
          lng: feat.lng,
          matchedName: feat.name,
          normalizedQuery: clean,
          isProxy: true,
          proxyParentName: `${parentDist.name} (${parentSt.name})`,
          proxyNotice: `*(Note: Location '${feat.name}' is categorized as a ${categoryLabel}. Operational data is anchored using its administrative parent district: ${parentDist.name}, ${parentSt.name}${feat.elevation ? ` at ~${feat.elevation}m elevation` : ''})*`,
          description: feat.description,
          elevation: feat.elevation,
        };
      }
    }

    // 3. CHECK STATES DIRECTLY
    const matchedState = states.find(s =>
      s.id === searchKey ||
      s.name.toLowerCase() === searchKey ||
      s.name.toLowerCase().includes(searchKey) ||
      searchKey.includes(s.name.toLowerCase())
    );
    if (matchedState && (searchKey === matchedState.name.toLowerCase() || searchKey === matchedState.id || ['nagaland', 'arunachal', 'assam', 'meghalaya', 'mizoram', 'manipur', 'tripura', 'sikkim'].some(st => searchKey.includes(st)))) {
      return {
        found: true,
        type: 'state',
        state: matchedState,
        matchedName: matchedState.name,
        normalizedQuery: searchKey,
        lat: matchedState.lat,
        lng: matchedState.lng,
      };
    }

    // 4. CHECK DISTRICTS (EXACT, SUBSTRING, AND ALIASES)
    const matchedDistrict = districts.find(d => {
      const dName = d.name.toLowerCase();
      const dId = d.id.toLowerCase();
      return (
        dName === searchKey ||
        dId === searchKey ||
        dName.startsWith(searchKey) ||
        searchKey.startsWith(dName) ||
        (searchKey.length >= 4 && dName.includes(searchKey)) ||
        (searchKey.length >= 4 && searchKey.includes(dName))
      );
    });
    if (matchedDistrict) {
      const s = states.find(item => item.id === matchedDistrict.stateId);
      return {
        found: true,
        type: 'district',
        district: matchedDistrict,
        state: s,
        lat: matchedDistrict.lat,
        lng: matchedDistrict.lng,
        matchedName: matchedDistrict.name,
        normalizedQuery: searchKey,
      };
    }

    // 5. CHECK GRAPH NODES (WITH EXPLICIT PARENT DISTRICT MAPPING)
    const matchedNode = graphNodes.find(n => {
      const nName = n.name.toLowerCase();
      const nId = n.id.toLowerCase();
      return nName === searchKey || nId === searchKey || nName.includes(searchKey) || searchKey.includes(nName);
    });
    if (matchedNode) {
      const s = states.find(item => item.id === matchedNode.stateId);
      // Map node to exact district
      let parentD = districts.find(d => d.id === matchedNode.id || d.name.toLowerCase().includes(matchedNode.name.toLowerCase()));
      if (!parentD) {
        if (matchedNode.id === 'bomdila') parentD = districts.find(d => d.id === 'west-kameng');
        else if (matchedNode.id === 'pelling') parentD = districts.find(d => d.id === 'west-sikkim');
        else if (matchedNode.id === 'ziro') parentD = districts.find(d => d.id === 'lower-subansiri');
        else if (matchedNode.id === 'anini') parentD = districts.find(d => d.id === 'dibang-valley');
        else if (matchedNode.id === 'roing') parentD = districts.find(d => d.id === 'lower-dibang');
        else if (matchedNode.id === 'tezu') parentD = districts.find(d => d.id === 'lohit');
        else if (matchedNode.id === 'pasighat') parentD = districts.find(d => d.id === 'east-siang');
        else if (matchedNode.id === 'tura') parentD = districts.find(d => d.id === 'west-garo');
        else if (matchedNode.id === 'lumding') parentD = districts.find(d => d.id === 'nagaon');
        else if (matchedNode.id === 'siliguri') parentD = districts.find(d => d.id === 'east-sikkim') || districts[0];
      }
      const isProxyNode = parentD && parentD.id !== matchedNode.id;

      return {
        found: true,
        type: 'city',
        cityNode: matchedNode,
        district: parentD,
        state: s,
        lat: matchedNode.lat,
        lng: matchedNode.lng,
        matchedName: matchedNode.name,
        normalizedQuery: searchKey,
        isProxy: isProxyNode,
        proxyParentName: parentD ? `${parentD.name} (${s?.name || ''})` : matchedNode.name,
        proxyNotice: isProxyNode ? `*(Note: Location '${matchedNode.name}' is categorized as a Regional Urban Node. Operational data is anchored using its administrative parent district: ${parentD?.name || 'NER'}, ${s?.name || 'NER'})*` : undefined,
      };
    }

    // 6. CHECK LOGISTICS HUBS
    const matchedHub = logisticsHubs.find(h => {
      const hName = h.name.toLowerCase();
      const hCity = h.city.toLowerCase();
      return hName.includes(searchKey) || hCity === searchKey || searchKey.includes(hCity);
    });
    if (matchedHub) {
      const s = states.find(item => item.id === matchedHub.stateId);
      const d = districts.find(dist => dist.name.toLowerCase().includes(matchedHub.city.toLowerCase())) || districts[0];
      return {
        found: true,
        type: 'hub',
        hub: matchedHub,
        district: d,
        state: s,
        lat: matchedHub.lat,
        lng: matchedHub.lng,
        matchedName: matchedHub.name,
        normalizedQuery: searchKey,
      };
    }

    // 7. CHECK AIRPORTS & RAILWAY STATIONS
    const matchedAirport = airports.find(a => a.name.toLowerCase().includes(searchKey) || a.city.toLowerCase() === searchKey || a.code.toLowerCase() === searchKey);
    if (matchedAirport) {
      const s = states.find(item => item.id === matchedAirport.stateId);
      const d = districts.find(dist => dist.name.toLowerCase().includes(matchedAirport.city.toLowerCase())) || districts[0];
      return {
        found: true,
        type: 'strategic',
        district: d,
        state: s,
        lat: matchedAirport.lat,
        lng: matchedAirport.lng,
        matchedName: `${matchedAirport.name} (${matchedAirport.code})`,
        normalizedQuery: searchKey,
        isProxy: true,
        proxyParentName: `${d.name} (${s?.name || ''})`,
        proxyNotice: `*(Note: Air cargo facility '${matchedAirport.name}' is anchored using administrative parent district: ${d.name}, ${s?.name || ''})*`,
      };
    }

    const matchedRail = railwayStations.find(r => r.name.toLowerCase().includes(searchKey) || r.city.toLowerCase() === searchKey);
    if (matchedRail) {
      const s = states.find(item => item.id === matchedRail.stateId);
      const d = districts.find(dist => dist.name.toLowerCase().includes(matchedRail.city.toLowerCase())) || districts[0];
      return {
        found: true,
        type: 'strategic',
        district: d,
        state: s,
        lat: matchedRail.lat,
        lng: matchedRail.lng,
        matchedName: `${matchedRail.name} Railway Station`,
        normalizedQuery: searchKey,
        isProxy: true,
        proxyParentName: `${d.name} (${s?.name || ''})`,
        proxyNotice: `*(Note: Railhead facility '${matchedRail.name}' is anchored using administrative parent district: ${d.name}, ${s?.name || ''})*`,
      };
    }

    // 8. FUZZY LEVENSHTEIN MATCHING FOR TYPOS (e.g. Aizwal -> Aizawl, Shilong -> Shillong, Guwhati -> Guwahati)
    if (searchKey.length >= 4) {
      // Check districts fuzzy
      for (const d of districts) {
        const dClean = d.name.toLowerCase().replace(/[^a-z]/g, '');
        const qClean = searchKey.replace(/[^a-z]/g, '');
        const dist = this.levenshtein(qClean, dClean);
        if (dist <= 2 && Math.abs(qClean.length - dClean.length) <= 2) {
          const s = states.find(item => item.id === d.stateId);
          return {
            found: true,
            type: 'district',
            district: d,
            state: s,
            lat: d.lat,
            lng: d.lng,
            matchedName: d.name,
            normalizedQuery: searchKey,
          };
        }
      }

      // Check strategic features fuzzy
      for (const feat of this.STRATEGIC_FEATURES) {
        for (const alias of feat.aliases) {
          const aClean = alias.replace(/[^a-z]/g, '');
          const qClean = searchKey.replace(/[^a-z]/g, '');
          const dist = this.levenshtein(qClean, aClean);
          if (dist <= 2 && Math.abs(qClean.length - aClean.length) <= 2) {
            const parentDist = districts.find(d => d.id === feat.parentDistrictId) || districts[0];
            const parentSt = states.find(s => s.id === feat.parentStateId) || states[0];
            return {
              found: true,
              type: feat.category,
              district: parentDist,
              state: parentSt,
              lat: feat.lat,
              lng: feat.lng,
              matchedName: feat.name,
              normalizedQuery: searchKey,
              isProxy: true,
              proxyParentName: `${parentDist.name} (${parentSt.name})`,
              proxyNotice: `*(Note: Location '${feat.name}' was matched via phonetic similarity. Operational data is anchored using parent district: ${parentDist.name}, ${parentSt.name})*`,
              description: feat.description,
              elevation: feat.elevation,
            };
          }
        }
      }
    }

    // 9. DYNAMIC PARENT DISTRICT PROXY FOR UNINDEXED SUB-LOCATIONS
    // When a non-district location isn't directly indexed, detect if a parent state or district is mentioned in query/hint
    const fullText = `${query} ${contextHint || ''}`.toLowerCase();
    const detectedDistrict = districts.find(d => fullText.includes(d.name.toLowerCase()) || fullText.includes(d.id.toLowerCase()));
    const detectedState = states.find(s => fullText.includes(s.name.toLowerCase()) || fullText.includes(s.id.toLowerCase()));

    if (detectedDistrict) {
      const s = states.find(st => st.id === detectedDistrict.stateId);
      const cleanName = rawInput.replace(/\b(in|near|around|district|dist|circle|block)\b/gi, '').trim() || rawInput;
      return {
        found: true,
        type: 'town',
        district: detectedDistrict,
        state: s,
        lat: detectedDistrict.lat,
        lng: detectedDistrict.lng,
        matchedName: cleanName,
        normalizedQuery: clean,
        isProxy: true,
        proxyParentName: `${detectedDistrict.name} (${s?.name || ''})`,
        proxyNotice: `*(Note: Location '${cleanName}' is not directly indexed in the regional database. Operational data is dynamically anchored using its administrative territory: ${detectedDistrict.name}, ${s?.name || 'NER'} as a district-level proxy.)*`,
        description: `Subordinate settlement/feature within the administrative boundaries of ${detectedDistrict.name}.`,
      };
    }

    if (detectedState) {
      const capitalDistrict = districts.find(d => d.stateId === detectedState.id) || districts[0];
      const cleanName = rawInput.replace(/\b(in|near|around|state)\b/gi, '').trim() || rawInput;
      return {
        found: true,
        type: 'town',
        district: capitalDistrict,
        state: detectedState,
        lat: capitalDistrict.lat,
        lng: capitalDistrict.lng,
        matchedName: cleanName,
        normalizedQuery: clean,
        isProxy: true,
        proxyParentName: `${capitalDistrict.name} (${detectedState.name})`,
        proxyNotice: `*(Note: Location '${cleanName}' is not directly indexed in the regional database. Operational data is dynamically anchored using its parent state capital district: ${capitalDistrict.name}, ${detectedState.name} as a proxy.)*`,
        description: `Subordinate settlement/feature in ${detectedState.name}.`,
      };
    }

    return {
      found: false,
      type: 'unknown',
      matchedName: rawInput,
      normalizedQuery: clean,
    };
  }

  /**
   * Comprehensive intent & multi-phase entity parser
   * Extracts cargo, priorities, multi-intents, and resolves all geographic locations
   */
  public static parseQuery(
    rawQuery: string,
    userLocation?: { lat: number; lng: number }
  ): CopilotParsedIntent {
    const lower = rawQuery.toLowerCase();
    const intents: CopilotParsedIntent['intents'] = [];

    // --- 1. Extract Cargo & Weight details ---
    const cargo: ExtractedCargo = {};
    const weightMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:tonnes|tonne|tons|ton|t\b|metric tons|kg\b|kilos)/i);
    if (weightMatch) {
      const val = parseFloat(weightMatch[1]);
      if (lower.includes('kg')) {
        cargo.weightKg = val;
        cargo.weightTons = val / 1000;
      } else {
        cargo.weightTons = val;
        cargo.weightKg = val * 1000;
      }
    }

    if (lower.includes('medicine') || lower.includes('pharma') || lower.includes('vaccine') || lower.includes('medical') || lower.includes('hospital')) {
      cargo.commodity = 'Pharmaceuticals / Cold-Chain Medicines';
      cargo.isPerishable = true;
    } else if (lower.includes('tea')) {
      cargo.commodity = 'Assam Orthodox & CTC Tea';
    } else if (lower.includes('grain') || lower.includes('pds') || lower.includes('food') || lower.includes('rice') || lower.includes('wheat')) {
      cargo.commodity = 'PDS Essential Food Grains';
    } else if (lower.includes('cement') || lower.includes('steel') || lower.includes('construction') || lower.includes('iron') || lower.includes('rebar')) {
      cargo.commodity = 'Heavy Construction Materials';
    } else if (lower.includes('fuel') || lower.includes('petrol') || lower.includes('diesel') || lower.includes('pol')) {
      cargo.commodity = 'Petroleum, Oil & Lubricants (POL)';
    }

    if (lower.includes('emergency') || lower.includes('relief') || lower.includes('urgent') || lower.includes('critical cargo')) {
      cargo.isEmergency = true;
    }

    // --- 2. Determine Priority ---
    let priority: 'fastest' | 'cheapest' | 'safest' | 'balanced' = 'balanced';
    if (lower.includes('safest') || lower.includes('lowest risk') || lower.includes('safe route') || lower.includes('secure') || lower.includes('hazard avoid')) {
      priority = 'safest';
    } else if (lower.includes('fastest') || lower.includes('quickest') || lower.includes('fast route') || lower.includes('shortest time') || lower.includes('speed')) {
      priority = 'fastest';
    } else if (lower.includes('cheapest') || lower.includes('economical') || lower.includes('lowest cost') || lower.includes('cheaper')) {
      priority = 'cheapest';
    }

    // --- 3. Multi-Phase Location Extraction ---
    const locations: LocationResolutionResult[] = [];
    const unknownStrings: string[] = [];

    // Phase 3A: Check explicit route / travel patterns
    // e.g. "from A to B", "between A and B", "A to B", "A -> B", "reach B from A", "compare A and B"
    let origCandidate: string | null = null;
    let destCandidate: string | null = null;

    // Pattern 1: "reach [Dest] from [Orig]"
    const reachFromMatch = rawQuery.match(/(?:how to reach|travel to|go to|transport to|deliver to|ship to)\s+([a-zA-Z0-9\s.-]+?)\s+(?:from|starting from)\s+([a-zA-Z0-9\s.-]+?)(?:\s+for|\s+with|\s+considering|\s*\?|$)/i);
    if (reachFromMatch && reachFromMatch[1] && reachFromMatch[2]) {
      destCandidate = reachFromMatch[1].trim();
      origCandidate = reachFromMatch[2].trim();
    }

    // Pattern 2: "from [Orig] to [Dest]" or "between [Orig] and [Dest]"
    if (!origCandidate || !destCandidate) {
      const fromToMatch = rawQuery.match(/(?:route|path|travel|transport|distance|corridor|shipment)?\s*(?:from|between)\s+([a-zA-Z0-9\s.-]+?)\s+(?:to|and|-->|->)\s+([a-zA-Z0-9\s.-]+?)(?:\s+for|\s+with|\s+considering|\s*\?|$)/i);
      if (fromToMatch && fromToMatch[1] && fromToMatch[2]) {
        origCandidate = fromToMatch[1].replace(/\b(what is the|find the|best|safest|fastest|route|path|corridor)\b/gi, '').trim();
        destCandidate = fromToMatch[2].replace(/\b(route|road|highway|safely|considering|risks|hazards)\b/gi, '').trim();
      }
    }

    // Pattern 3: Simple "[Orig] to [Dest]" or "[Orig] -> [Dest]"
    if (!origCandidate || !destCandidate) {
      const directArrowMatch = rawQuery.match(/\b([A-Za-z0-9\s.-]{3,30})\s*(?:-->|->|\bto\b)\s*([A-Za-z0-9\s.-]{3,30})\b/i);
      if (directArrowMatch && directArrowMatch[1] && directArrowMatch[2]) {
        const c1 = directArrowMatch[1].replace(/\b(what is the|find the|best|safest|fastest|route|path|from|how to reach)\b/gi, '').trim();
        const c2 = directArrowMatch[2].replace(/\b(route|road|highway|safely|considering|risks|hazards|for|with)\b/gi, '').trim();
        if (c1.length >= 3 && c2.length >= 3 && !['access', 'reach', 'transport'].includes(c1.toLowerCase())) {
          origCandidate = c1;
          destCandidate = c2;
        }
      }
    }

    // Pattern 4: Comparison "[Loc1] and [Loc2]" or "[Loc1] vs [Loc2]"
    if (!origCandidate || !destCandidate) {
      const compMatch = rawQuery.match(/(?:compare|difference between|versus|\bvs\b)\s+([a-zA-Z0-9\s.-]+?)\s+(?:and|with|to|\bvs\b)\s+([a-zA-Z0-9\s.-]+?)(?:\s+for|\s+logistics|\s+accessibility|\s*\?|$)/i);
      if (compMatch && compMatch[1] && compMatch[2]) {
        origCandidate = compMatch[1].replace(/\b(can you|please|tell me|compare)\b/gi, '').trim();
        destCandidate = compMatch[2].replace(/\b(logistics|connectivity|accessibility|data)\b/gi, '').trim();
      }
    }

    // Resolve candidates if found
    if (origCandidate && destCandidate) {
      // Check user location as origin
      if (/my (?:current )?location|here|current gps/i.test(origCandidate) && userLocation) {
        locations.push({
          found: true,
          type: 'custom_coords',
          lat: userLocation.lat,
          lng: userLocation.lng,
          matchedName: `Current Location (${userLocation.lat.toFixed(2)}°N, ${userLocation.lng.toFixed(2)}°E)`,
          normalizedQuery: 'my location',
        });
      } else {
        const res1 = this.resolveLocation(origCandidate, rawQuery);
        if (res1.found) locations.push(res1);
        else unknownStrings.push(origCandidate);
      }

      if (/my (?:current )?location|here|current gps/i.test(destCandidate) && userLocation) {
        locations.push({
          found: true,
          type: 'custom_coords',
          lat: userLocation.lat,
          lng: userLocation.lng,
          matchedName: `Current Location (${userLocation.lat.toFixed(2)}°N, ${userLocation.lng.toFixed(2)}°E)`,
          normalizedQuery: 'my location',
        });
      } else {
        const res2 = this.resolveLocation(destCandidate, rawQuery);
        if (res2.found) locations.push(res2);
        else unknownStrings.push(destCandidate);
      }
    }

    // Phase 3B: Exhaustive direct substring scanning across catalog if fewer than 2 locations resolved
    if (locations.length < 2) {
      interface SpanMatch {
        start: number;
        end: number;
        length: number;
        loc: LocationResolutionResult;
      }
      const foundSpans: SpanMatch[] = [];

      // Scan Strategic Features
      for (const feat of this.STRATEGIC_FEATURES) {
        for (const alias of feat.aliases) {
          const regex = new RegExp(`\\b${alias.replace(/[-]/g, '[- ]')}\\b`, 'i');
          const m = regex.exec(rawQuery);
          if (m) {
            const start = m.index;
            const end = start + m[0].length;
            const parentDist = districts.find(d => d.id === feat.parentDistrictId) || districts[0];
            const parentSt = states.find(s => s.id === feat.parentStateId) || states[0];
            foundSpans.push({
              start,
              end,
              length: m[0].length,
              loc: {
                found: true,
                type: feat.category,
                district: parentDist,
                state: parentSt,
                lat: feat.lat,
                lng: feat.lng,
                matchedName: feat.name,
                normalizedQuery: feat.name.toLowerCase(),
                isProxy: true,
                proxyParentName: `${parentDist.name} (${parentSt.name})`,
                proxyNotice: `*(Note: Location '${feat.name}' is categorized as a ${feat.category.toUpperCase()}. Operational data is anchored using administrative parent district: ${parentDist.name}, ${parentSt.name}${feat.elevation ? ` at ~${feat.elevation}m elevation` : ''})*`,
                description: feat.description,
                elevation: feat.elevation,
              },
            });
          }
        }
      }

      // Scan States
      for (const s of states) {
        const regex = new RegExp(`\\b${s.name.replace(/[-]/g, '[- ]')}\\b`, 'i');
        const m = regex.exec(rawQuery);
        if (m) {
          foundSpans.push({
            start: m.index,
            end: m.index + m[0].length,
            length: m[0].length,
            loc: {
              found: true,
              type: 'state',
              state: s,
              lat: s.lat,
              lng: s.lng,
              matchedName: s.name,
              normalizedQuery: s.name.toLowerCase(),
            },
          });
        }
      }

      // Scan Districts
      for (const d of districts) {
        const regex = new RegExp(`\\b${d.name.replace(/[-]/g, '[- ]')}\\b`, 'i');
        const m = regex.exec(rawQuery);
        if (m) {
          const s = states.find(st => st.id === d.stateId);
          foundSpans.push({
            start: m.index,
            end: m.index + m[0].length,
            length: m[0].length,
            loc: {
              found: true,
              type: 'district',
              district: d,
              state: s,
              lat: d.lat,
              lng: d.lng,
              matchedName: d.name,
              normalizedQuery: d.name.toLowerCase(),
            },
          });
        }
      }

      // Sort spans by position in the sentence (left to right)
      foundSpans.sort((a, b) => a.start - b.start || b.length - a.length);

      // Add non-overlapping spans
      const usedRanges: [number, number][] = [];
      for (const span of foundSpans) {
        const overlaps = usedRanges.some(([s, e]) => Math.max(span.start, s) < Math.min(span.end, e));
        if (!overlaps) {
          usedRanges.push([span.start, span.end]);
          if (!locations.some(l => l.matchedName.toLowerCase() === span.loc.matchedName.toLowerCase())) {
            locations.push(span.loc);
          }
        }
      }
    }

    // Phase 3C: User GPS coordinates handling
    if ((lower.includes('my location') || lower.includes('where i am') || lower.includes('current location') || lower.includes('current gps')) && userLocation) {
      if (!locations.some(l => l.type === 'custom_coords')) {
        locations.unshift({
          found: true,
          type: 'custom_coords',
          lat: userLocation.lat,
          lng: userLocation.lng,
          matchedName: `Current Location (${userLocation.lat.toFixed(2)}°N, ${userLocation.lng.toFixed(2)}°E)`,
          normalizedQuery: 'my location',
        });
      }
    }

    // --- 4. Intent Detection ---
    let sortOrder: 'worst' | 'best' | 'highest' | 'lowest' | undefined;
    if (lower.includes('worst') || lower.includes('lowest') || lower.includes('least') || lower.includes('poor')) {
      sortOrder = 'worst';
    } else if (lower.includes('best') || lower.includes('highest') || lower.includes('top') || lower.includes('most')) {
      sortOrder = 'best';
    }

    // Check ROUTE intent
    if (
      locations.length >= 2 ||
      ['route', 'path', 'how to reach', 'directions', 'transport', 'deliver', 'how should i transport', 'distance from', 'to reach'].some(k => lower.includes(k)) ||
      /\b(?:from|between)\s+[a-z0-9\s]+\s+(?:to|and)\b/i.test(lower)
    ) {
      intents.push('route');
    }

    // Check ACCESSIBILITY intent
    if (['accessibility', 'accessible', 'connectivity', 'access score', 'how accessible'].some(k => lower.includes(k))) {
      intents.push('accessibility');
    }

    // Check DEMAND intent
    if (['demand', 'forecast', 'predicted demand', 'consumption', 'goods required', 'volume'].some(k => lower.includes(k))) {
      intents.push('demand');
    }

    // Check RISK intent
    if (['risk', 'hazard', 'safest', 'vulnerability', 'flood', 'landslide', 'earthquake', 'disaster', 'danger', 'alert'].some(k => lower.includes(k))) {
      intents.push('risk');
    }

    // Check INFRASTRUCTURE intent
    if (['infrastructure', 'gap', 'invest', 'investment', 'upgrade', 'road quality', 'where should a', 'need road', 'capex'].some(k => lower.includes(k))) {
      intents.push('infrastructure');
    }

    // Check HUB intent
    if (['hub', 'warehouse', 'depot', 'storage', 'distribution center', 'fulfillment', 'nearest hub', 'closest hub'].some(k => lower.includes(k))) {
      intents.push('hub');
    }

    // Check COMPARISON intent
    if (
      (locations.length >= 2 && !intents.includes('route')) ||
      ['compare', 'versus', ' vs ', 'difference between', 'which is better', 'which one is'].some(k => lower.includes(k))
    ) {
      intents.push('comparison');
    }

    // Check STATE intent
    if (locations.some(l => l.type === 'state') && !intents.includes('route') && !intents.includes('comparison')) {
      intents.push('state');
    }

    // Default intent
    if (intents.length === 0) {
      intents.push('general');
    }

    // Primary intent priority hierarchy
    let primaryIntent: CopilotParsedIntent['primaryIntent'] = 'general';
    if (intents.includes('route')) primaryIntent = 'route';
    else if (intents.includes('comparison')) primaryIntent = 'comparison';
    else if (intents.includes('accessibility')) primaryIntent = 'accessibility';
    else if (intents.includes('demand')) primaryIntent = 'demand';
    else if (intents.includes('infrastructure')) primaryIntent = 'infrastructure';
    else if (intents.includes('risk')) primaryIntent = 'risk';
    else if (intents.includes('hub')) primaryIntent = 'hub';
    else if (intents.includes('state')) primaryIntent = 'state';

    return {
      rawQuery,
      intents,
      primaryIntent,
      locations,
      unknownLocationStrings: unknownStrings,
      cargo,
      priority,
      sortOrder,
    };
  }

  // ============================================================
  // INTERNAL TOOL IMPLEMENTATIONS
  // ============================================================

  /**
   * TOOL: Accessibility Intelligence
   */
  public static getAccessibilityFact(loc?: LocationResolutionResult, sort?: 'worst' | 'best'): {
    factText: string;
    metrics: { label: string; value: string }[];
    recommendations: string[];
    sources: string[];
  } {
    const all = computeAllAccessibility(districts);

    if (!loc || (!loc.district && loc.type !== 'district')) {
      // Ranking query: worst or best
      const isWorst = sort === 'worst' || !sort;
      const sorted = isWorst ? all.slice().reverse() : all;
      const top5 = sorted.slice(0, 5);

      const listStr = top5.map((d, i) =>
        `${i + 1}. **${d.districtName}** (${states.find(s => s.id === d.stateId)?.name || 'NER'}): **${d.overallScore}/100** (${d.level}) — Road Connectivity: ${d.factors.roadConnectivity.score}/100, Hub Distance: ${districts.find(item => item.id === d.districtId)?.nearestHubDistance || 0} km`
      ).join('\n');

      return {
        factText: `**Logistics Accessibility Analysis (${isWorst ? 'Lowest / Most Critical' : 'Highest / Best Accessible'}):**\n\n${listStr}\n\n• **Core Constraining Factors:** Mountain elevation, high distance to multi-modal railheads, and extreme seasonal rainfall penalisations.`,
        metrics: top5.slice(0, 4).map(d => ({ label: d.districtName, value: `${d.overallScore}/100` })),
        recommendations: top5[0]?.recommendations || [
          'Establish regional staging hubs in remote mountain corridors',
          'Deploy cold-chain storage for critical medical supplies',
        ],
        sources: ['Accessibility Intelligence Engine', 'NER District Spatial Dataset'],
      };
    }

    const district = loc.district!;
    const breakdown = computeAccessibility(district);
    const s = states.find(item => item.id === district.stateId);

    const proxyHeader = loc.isProxy && loc.proxyNotice
      ? `> 📍 **Geographic Resolution Notice:** ${loc.proxyNotice}\n\n`
      : '';

    const strategicDesc = loc.description
      ? `• **Strategic Significance:** ${loc.description}\n`
      : '';

    const factText = `### Accessibility Profile: ${loc.matchedName} (${s?.name || 'NER'})\n` +
      proxyHeader +
      strategicDesc +
      `• **Overall Accessibility Score:** **${breakdown.overallScore}/100** (${breakdown.level})\n` +
      `• **Road Connectivity:** ${district.roadConnectivity}/100\n` +
      `• **Rail Access Score:** ${district.railConnectivity}/100\n` +
      `• **Airport Accessibility:** ${district.airportAccess}/100\n` +
      `• **Average Freight Delivery Time:** ${district.avgDeliveryTime} hours (Travel Time: ~${district.avgTravelTime}h)\n` +
      `• **Nearest Logistics Hub Distance:** ${district.nearestHubDistance} km\n` +
      `• **Infrastructure Quality Index:** ${district.infrastructureQuality}/100\n` +
      `• **Terrain:** ${district.terrain.toUpperCase()}${loc.elevation ? ` (Feature Elevation: ${loc.elevation}m)` : ` (Elevation: ${district.elevation}m)`}`;

    return {
      factText,
      metrics: [
        { label: 'Accessibility', value: `${breakdown.overallScore}/100` },
        { label: 'Road Score', value: `${district.roadConnectivity}/100` },
        { label: 'Nearest Hub', value: `${district.nearestHubDistance} km` },
        { label: 'Delivery Time', value: `${district.avgDeliveryTime}h` },
      ],
      recommendations: breakdown.recommendations,
      sources: ['Accessibility Intelligence Engine', 'NER Spatial Data', loc.isProxy ? 'Strategic Geographic Registry' : 'District Database'],
    };
  }

  /**
   * TOOL: Demand Forecasting Intelligence
   */
  public static getDemandFact(loc?: LocationResolutionResult, sort?: 'highest' | 'lowest'): {
    factText: string;
    metrics: { label: string; value: string }[];
    recommendations: string[];
    sources: string[];
  } {
    if (!loc || !loc.district) {
      const top5 = getTopDemandDistricts(5);
      const listStr = top5.map((f, i) =>
        `${i + 1}. **${f.districtName}**: Current **${f.currentDemand} t/day**, 7-Day Forecast: **${f.forecast7Day} t/day** (${f.trend.toUpperCase()} by ${f.trendPercentage > 0 ? '+' : ''}${f.trendPercentage}%) | Confidence: ${f.confidence}%`
      ).join('\n');

      return {
        factText: `**NER Regional Freight Demand Forecast (Top Centers):**\n\n${listStr}\n\n• **Seasonal Trend Model:** 180-day regression with monsoon surge adjustments for essential commodities.`,
        metrics: top5.slice(0, 4).map(f => ({ label: f.districtName, value: `${f.currentDemand} t/d` })),
        recommendations: [
          'Pre-position 30-day buffer stocks at Guwahati and Silchar regional hubs',
          'Increase fleet allocation along rising demand corridors',
        ],
        sources: ['Demand Forecasting Engine (Time-Series & Regression)', 'NER Production & Inflow Data'],
      };
    }

    const district = loc.district;
    const forecast = forecastDemand(district.id);

    const proxyHeader = loc.isProxy && loc.proxyNotice
      ? `> 📍 **Geographic Resolution Notice:** ${loc.proxyNotice}\n\n`
      : '';

    const factText = `### Demand Forecast Analysis: ${loc.matchedName}\n` +
      proxyHeader +
      `• **Current Freight Inflow Demand:** **${forecast.currentDemand} tons/day**\n` +
      `• **7-Day Projected Demand:** **${forecast.forecast7Day} tons/day**\n` +
      `• **30-Day Projected Demand:** **${forecast.forecast30Day} tons/day**\n` +
      `• **Demand Trend:** **${forecast.trend.toUpperCase()}** (${forecast.trendPercentage > 0 ? '+' : ''}${forecast.trendPercentage}%)\n` +
      `• **Model Confidence:** ${forecast.confidence}%\n` +
      `• **Seasonal Pattern:** ${forecast.seasonalPattern}`;

    return {
      factText,
      metrics: [
        { label: 'Current Demand', value: `${forecast.currentDemand} t/d` },
        { label: '7-Day Forecast', value: `${forecast.forecast7Day} t/d` },
        { label: 'Trend', value: `${forecast.trend} (${forecast.trendPercentage}%)` },
        { label: 'Confidence', value: `${forecast.confidence}%` },
      ],
      recommendations: [
        `Ensure staging warehouse capacity at ${district.name} can accommodate ${forecast.forecast7Day} t/day`,
        'Coordinate with FCI and essential goods distributors ahead of seasonal shifts',
      ],
      sources: ['Demand Forecasting Engine (180-Day Seasonal Regression)', 'Historical Inflow Telemetry'],
    };
  }

  /**
   * TOOL: Multi-Hazard Risk Intelligence
   */
  public static getRiskFact(loc?: LocationResolutionResult): {
    factText: string;
    metrics: { label: string; value: string }[];
    recommendations: string[];
    sources: string[];
  } {
    if (!loc || !loc.district) {
      const allRisks = assessAllRisks();
      const highRisks = allRisks.filter(r => r.level === 'CRITICAL' || r.level === 'HIGH').slice(0, 5);
      const alerts = getActiveAlerts().slice(0, 3);

      const listStr = highRisks.map((r, i) =>
        `${i + 1}. **${r.districtName}**: Composite Risk **${r.overallRisk}/100** [${r.level}] — Landslide: ${r.factors.landslideRisk}/100, Flood: ${r.factors.floodRisk}/100, Weather: ${r.factors.weatherRisk}/100`
      ).join('\n');

      const alertsStr = alerts.length > 0
        ? `\n\n**Active Environmental Alerts:**\n` + alerts.map(a => `• ⚠️ **${a.location}** (${a.severity.toUpperCase()}): ${a.description}`).join('\n')
        : '';

      return {
        factText: `**NER Multi-Hazard Risk Overview:**\n\n${listStr}${alertsStr}`,
        metrics: highRisks.slice(0, 4).map(r => ({ label: r.districtName, value: `${r.overallRisk}/100 (${r.level})` })),
        recommendations: [
          'Mandate daytime mountain transit across high landslide corridors',
          'Deploy IoT geotechnical slope monitors along NH-10 and NH-13',
        ],
        sources: ['Multi-Hazard Risk Scoring Engine', 'Active Regional Alert Registry'],
      };
    }

    const district = loc.district;
    const risk = assessDistrictRisk(district.id);

    const proxyHeader = loc.isProxy && loc.proxyNotice
      ? `> 📍 **Geographic Resolution Notice:** ${loc.proxyNotice}\n\n`
      : '';

    const strategicDesc = loc.description
      ? `• **Corridor Vulnerability:** ${loc.description}\n`
      : '';

    const factText = `### Multi-Hazard Risk Assessment: ${loc.matchedName}\n` +
      proxyHeader +
      strategicDesc +
      `• **Composite Risk Score:** **${risk.overallRisk}/100** (Severity: **${risk.level}**)\n` +
      `• **Landslide Risk Factor:** ${risk.factors.landslideRisk}/100\n` +
      `• **Flood Inundation Risk:** ${risk.factors.floodRisk}/100\n` +
      `• **Earthquake Vulnerability:** ${risk.factors.earthquakeRisk}/100 (Seismic Zone V)\n` +
      `• **Infrastructure Fragility:** ${risk.factors.infrastructureRisk}/100\n` +
      `• **Connectivity Isolation Risk:** ${risk.factors.connectivityRisk}/100\n` +
      `• **Operational Recommendation:** ${risk.recommendation}`;

    return {
      factText,
      metrics: [
        { label: 'Overall Risk', value: `${risk.overallRisk}/100` },
        { label: 'Severity Level', value: risk.level },
        { label: 'Landslide Risk', value: `${risk.factors.landslideRisk}/100` },
        { label: 'Flood Risk', value: `${risk.factors.floodRisk}/100` },
      ],
      recommendations: [
        risk.recommendation,
        `Maintain 72-hour emergency stock buffer for ${loc.matchedName}`,
      ],
      sources: ['Multi-Hazard Risk Scoring Engine', 'District Topography & Rainfall Data'],
    };
  }

  /**
   * TOOL: Infrastructure Gap Intelligence
   */
  public static getInfrastructureFact(loc?: LocationResolutionResult): {
    factText: string;
    metrics: { label: string; value: string }[];
    recommendations: string[];
    sources: string[];
  } {
    const gaps = analyzeInfrastructureGaps();

    if (!loc || !loc.district) {
      const top5 = getTopGaps(5);
      const totalCost = top5.reduce((s, g) => s + g.estimatedCost, 0);

      const listStr = top5.map((g, i) =>
        `**#${i + 1}: ${g.districtName}** (${g.stateName})\n• Priority: **${g.priority.toUpperCase()}** | Gap Score: **${g.gapScore}/100**\n• Accessibility Deficit: ${g.accessibilityDeficit}/100 | Demand Pressure: ${g.demandPressure}/100\n• Recommended Intervention: ${g.recommendedIntervention}\n• Estimated Capex: **₹${g.estimatedCost} Crores**`
      ).join('\n\n');

      return {
        factText: `**Infrastructure Investment & Gap Priorities:**\n\n${listStr}\n\n**Total Capital Requirement (Top 5):** ₹${totalCost} Crores.`,
        metrics: [
          { label: '#1 Priority', value: `${top5[0]?.districtName || 'N/A'}` },
          { label: 'Gap Score', value: `${top5[0]?.gapScore || 0}/100` },
          { label: 'Priority Level', value: `${top5[0]?.priority.toUpperCase() || 'HIGH'}` },
          { label: 'Est. Cost', value: `₹${top5[0]?.estimatedCost || 0} Cr` },
        ],
        recommendations: top5.map(g => `${g.districtName}: ${g.recommendedIntervention}`),
        sources: ['Infrastructure Gap Analysis Engine', 'Multi-Criteria Capex Model'],
      };
    }

    const district = loc.district;
    const g = gaps.find(item => item.districtId === district.id);
    if (!g) {
      return {
        factText: `Infrastructure gap data currently unavailable for ${loc.matchedName}.`,
        metrics: [],
        recommendations: [],
        sources: ['Infrastructure Gap Analysis Engine'],
      };
    }

    const proxyHeader = loc.isProxy && loc.proxyNotice
      ? `> 📍 **Geographic Resolution Notice:** ${loc.proxyNotice}\n\n`
      : '';

    const factText = `### Infrastructure Gap Assessment: ${loc.matchedName} (${g.stateName})\n` +
      proxyHeader +
      `• **Composite Infrastructure Gap Score:** **${g.gapScore}/100** (Priority: **${g.priority.toUpperCase()}**)\n` +
      `• **Accessibility Deficit:** ${g.accessibilityDeficit}/100\n` +
      `• **Demand Pressure:** ${g.demandPressure}/100\n` +
      `• **Population Importance Factor:** ${g.populationImportance}/100\n` +
      `• **Nearest Hub Distance:** ${g.nearestHubDistance} km\n` +
      `• **Recommended Infrastructure Intervention:** ${g.recommendedIntervention}\n` +
      `• **Estimated Project Cost:** **₹${g.estimatedCost} Crores**`;

    return {
      factText,
      metrics: [
        { label: 'Gap Score', value: `${g.gapScore}/100` },
        { label: 'Priority', value: g.priority.toUpperCase() },
        { label: 'Intervention Cost', value: `₹${g.estimatedCost} Cr` },
        { label: 'Deficit', value: `${g.accessibilityDeficit}%` },
      ],
      recommendations: [
        g.recommendedIntervention,
        `Include ${loc.matchedName} in the PM GatiShakti North-East Logistics Master Plan`,
      ],
      sources: ['Infrastructure Gap Analysis Engine', 'Regional Logistics Capex Estimates'],
    };
  }

  /**
   * TOOL: Logistics Hub Intelligence (Programmatic Haversine Distance)
   */
  public static getHubFact(lat: number, lng: number, locName: string, proxyNotice?: string): {
    factText: string;
    metrics: { label: string; value: string }[];
    recommendations: string[];
    sources: string[];
  } {
    // Calculate exact geometric distance to each hub
    const sorted = logisticsHubs.map(h => {
      const dLat = ((h.lat - lat) * Math.PI) / 180;
      const dLng = ((h.lng - lng) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat * Math.PI) / 180) * Math.cos((h.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
      const dist = Math.round(6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
      return { ...h, distanceKm: dist };
    }).sort((a, b) => a.distanceKm - b.distanceKm);

    const nearest = sorted[0];
    const top3 = sorted.slice(0, 3);

    const proxyHeader = proxyNotice ? `> 📍 **Geographic Resolution Notice:** ${proxyNotice}\n\n` : '';

    const listStr = top3.map((h, i) =>
      `${i + 1}. **${h.name}** (${h.city}): **${h.distanceKm} km** away | Capacity: ${h.capacity.toLocaleString()} tons | Utilization: ${h.currentUtilization}% (${(h.storageAvailable / 1000).toFixed(1)}k t free)`
    ).join('\n');

    const factText = `### Logistics Hub Intelligence for ${locName}:\n\n` +
      proxyHeader +
      `The **closest logistics hub** is **${nearest.name}** in **${nearest.city}**, located approximately **${nearest.distanceKm} km** straight-line distance away.\n\n` +
      `**Top 3 Accessible Logistics Hubs:**\n${listStr}\n\n` +
      `• **Multi-Modal Connectivity:** ${nearest.hasRailAccess ? 'Direct Railhead Access Available' : 'Road Transport Only'}; ${nearest.hasAirAccess ? 'Dedicated Air Cargo Access' : 'No Direct Airport'}.`;

    return {
      factText,
      metrics: [
        { label: 'Closest Hub', value: nearest.city },
        { label: 'Distance', value: `${nearest.distanceKm} km` },
        { label: 'Utilization', value: `${nearest.currentUtilization}%` },
        { label: 'Available Space', value: `${(nearest.storageAvailable / 1000).toFixed(1)}k tons` },
      ],
      recommendations: [
        `Route freight destined for ${locName} through the ${nearest.name}`,
        nearest.distanceKm > 200
          ? `High hub distance (${nearest.distanceKm} km) indicates an urgent need for an intermediate satellite depot closer to ${locName}.`
          : `Current hub distance of ${nearest.distanceKm} km enables reasonable turnaround within local staging limits.`,
      ],
      sources: ['Logistics Hub Geospatial Dataset', 'Programmatic Haversine Distance Engine'],
    };
  }

  /**
   * TOOL: Location Comparison (Side-by-side programmatic comparison)
   */
  public static compareLocationsFact(loc1: LocationResolutionResult, loc2: LocationResolutionResult): {
    factText: string;
    metrics: { label: string; value: string }[];
    recommendations: string[];
    sources: string[];
  } {
    const d1 = loc1.district || districts.find(d => d.name.toLowerCase().includes(loc1.matchedName.toLowerCase())) || districts[0];
    const d2 = loc2.district || districts.find(d => d.name.toLowerCase().includes(loc2.matchedName.toLowerCase())) || districts[1];

    const acc1 = computeAccessibility(d1);
    const acc2 = computeAccessibility(d2);
    const risk1 = assessDistrictRisk(d1.id);
    const risk2 = assessDistrictRisk(d2.id);
    const dem1 = forecastDemand(d1.id);
    const dem2 = forecastDemand(d2.id);

    let notices = '';
    if (loc1.isProxy) notices += `> 📍 **Notice for ${loc1.matchedName}:** ${loc1.proxyNotice}\n`;
    if (loc2.isProxy) notices += `> 📍 **Notice for ${loc2.matchedName}:** ${loc2.proxyNotice}\n`;
    if (notices) notices += '\n';

    const factText = `### Comparative Logistics Dossier: ${loc1.matchedName} vs ${loc2.matchedName}\n\n` +
      notices +
      `| Indicator | **${loc1.matchedName}** | **${loc2.matchedName}** | Advantage |\n` +
      `| :--- | :--- | :--- | :--- |\n` +
      `| **Accessibility Score** | **${acc1.overallScore}/100** (${acc1.level}) | **${acc2.overallScore}/100** (${acc2.level}) | ${acc1.overallScore >= acc2.overallScore ? loc1.matchedName : loc2.matchedName} |\n` +
      `| **Multi-Hazard Risk** | **${risk1.overallRisk}/100** (${risk1.level}) | **${risk2.overallRisk}/100** (${risk2.level}) | ${risk1.overallRisk <= risk2.overallRisk ? loc1.matchedName + ' (Lower Risk)' : loc2.matchedName + ' (Lower Risk)'} |\n` +
      `| **Road Connectivity** | ${d1.roadConnectivity}/100 | ${d2.roadConnectivity}/100 | ${d1.roadConnectivity >= d2.roadConnectivity ? loc1.matchedName : loc2.matchedName} |\n` +
      `| **Daily Freight Demand** | ${dem1.currentDemand} t/day (${dem1.trend}) | ${dem2.currentDemand} t/day (${dem2.trend}) | ${dem1.currentDemand >= dem2.currentDemand ? loc1.matchedName : loc2.matchedName} |\n` +
      `| **Nearest Hub Distance** | ${d1.nearestHubDistance} km | ${d2.nearestHubDistance} km | ${d1.nearestHubDistance <= d2.nearestHubDistance ? loc1.matchedName : loc2.matchedName} |\n` +
      `| **Average Delivery Time** | ${d1.avgDeliveryTime} hours | ${d2.avgDeliveryTime} hours | ${d1.avgDeliveryTime <= d2.avgDeliveryTime ? loc1.matchedName : loc2.matchedName} |\n` +
      `| **Terrain & Elevation** | ${d1.terrain} (${loc1.elevation || d1.elevation}m) | ${d2.terrain} (${loc2.elevation || d2.elevation}m) | — |\n\n` +
      `**Operational Assessment:**\n` +
      (acc1.overallScore >= acc2.overallScore
        ? `**${loc1.matchedName}** is currently the stronger and more accessible logistics location due to superior arterial road connectivity and lower transit penalties.`
        : `**${loc2.matchedName}** offers superior logistics accessibility and more reliable transport throughput compared to ${loc1.matchedName}.`);

    return {
      factText,
      metrics: [
        { label: `${loc1.matchedName} Acc`, value: `${acc1.overallScore}/100` },
        { label: `${loc2.matchedName} Acc`, value: `${acc2.overallScore}/100` },
        { label: `${loc1.matchedName} Risk`, value: `${risk1.overallRisk}/100` },
        { label: `${loc2.matchedName} Risk`, value: `${risk2.overallRisk}/100` },
      ],
      recommendations: [
        `Prioritize high-volume hub staging in ${acc1.overallScore >= acc2.overallScore ? loc1.matchedName : loc2.matchedName}`,
        `Deploy specialized hill-climb vehicles when servicing the ${loc1.elevation || d1.elevation >= (loc2.elevation || d2.elevation) ? loc1.matchedName : loc2.matchedName} sector`,
      ],
      sources: ['Accessibility Intelligence Engine', 'Multi-Hazard Risk Scoring Engine', 'Demand Forecasting Engine'],
    };
  }

  /**
   * TOOL: State Logistics Intelligence
   */
  public static getStateFact(state: State): {
    factText: string;
    metrics: { label: string; value: string }[];
    recommendations: string[];
    sources: string[];
  } {
    const stateDistricts = districts.filter(d => d.stateId === state.id);
    const avgAcc = Math.round(stateDistricts.reduce((s, d) => s + d.accessibilityScore, 0) / (stateDistricts.length || 1));
    const avgRisk = Math.round(stateDistricts.reduce((s, d) => s + d.riskScore, 0) / (stateDistricts.length || 1));
    const totalPop = stateDistricts.reduce((s, d) => s + d.population, 0);
    const stateHubs = logisticsHubs.filter(h => h.stateId === state.id);
    const stateAirports = airports.filter(a => a.stateId === state.id);
    const stateRailways = railwayStations.filter(r => r.stateId === state.id);

    const factText = `**State Logistics Dossier: ${state.name}**\n\n` +
      `• **Average State Accessibility:** **${avgAcc}/100**\n` +
      `• **Average Multi-Hazard Risk:** **${avgRisk}/100**\n` +
      `• **Indexed Districts:** ${stateDistricts.length} (${stateDistricts.map(d => d.name).join(', ')})\n` +
      `• **Total Population:** ${totalPop.toLocaleString()}\n` +
      `• **Logistics Hubs:** ${stateHubs.length > 0 ? stateHubs.map(h => `${h.name} (${h.capacity.toLocaleString()}t capacity)`).join(', ') : 'No Tier-1 Multi-Modal Hub directly within state borders (serviced via neighboring regional hubs)'}\n` +
      `• **Air Cargo / Airports:** ${stateAirports.map(a => `${a.name} (${a.code})`).join(', ') || 'No major commercial airport'}\n` +
      `• **Railhead Freight Facilities:** ${stateRailways.map(r => r.name).join(', ') || 'Limited/No broad-gauge freight railhead currently operational in state'}\n\n` +
      `**Strategic Lifeline Corridors:**\n` +
      `Logistics in ${state.name} depends critically on high-altitude arterial highways connecting back through Assam and the Siliguri corridor. Pre-monsoon buffer storage of 45-60 days is recommended for high-altitude sectors.`;

    return {
      factText,
      metrics: [
        { label: 'Avg Accessibility', value: `${avgAcc}/100` },
        { label: 'Avg Risk', value: `${avgRisk}/100` },
        { label: 'Districts', value: `${stateDistricts.length}` },
        { label: 'Hubs', value: `${stateHubs.length}` },
      ],
      recommendations: [
        `Pre-position essential buffer stocks in ${state.capital || state.name} ahead of seasonal rains`,
        'Upgrade primary arterial highways to disaster-resilient double-lane standards',
      ],
      sources: ['State Geospatial Dataset', 'Regional Transport & Connectivity Matrix'],
    };
  }

  /**
   * TOOL: Dynamic Route Calculation (Dijkstra + OSRM)
   */
  public static async getRouteFact(
    originLoc: LocationResolutionResult,
    destLoc: LocationResolutionResult,
    priority: 'fastest' | 'cheapest' | 'safest' | 'balanced',
    cargo?: ExtractedCargo
  ): Promise<{
    factText: string;
    metrics: { label: string; value: string }[];
    recommendations: string[];
    sources: string[];
    groundedRoute?: GroundedRouteData | null;
  }> {
    // 1. Prepare graph node IDs for Dijkstra
    let startNodeId = originLoc.cityNode?.id || originLoc.district?.id || originLoc.hub?.id;
    let endNodeId = destLoc.cityNode?.id || destLoc.district?.id || destLoc.hub?.id;

    // Normalization helper to match graphNodes
    const mapToGraphId = (loc: LocationResolutionResult): string | undefined => {
      const q = loc.normalizedQuery;
      const found = graphNodes.find(n => n.id === q || n.name.toLowerCase() === q || q.includes(n.id) || n.id.includes(q));
      if (found) return found.id;
      if (loc.district) {
        const foundD = graphNodes.find(n => n.id === loc.district?.id || loc.district?.name.toLowerCase().includes(n.id));
        if (foundD) return foundD.id;
      }
      return undefined;
    };

    startNodeId = startNodeId || mapToGraphId(originLoc);
    endNodeId = endNodeId || mapToGraphId(destLoc);

    // 2. Try OSRM Road Routing + Local Graph Routing via RoutingService
    let grounded: GroundedRouteData | null = null;
    try {
      const origResolved = {
        id: startNodeId || originLoc.matchedName.toLowerCase().replace(/\s+/g, '-'),
        name: originLoc.matchedName,
        lat: originLoc.lat || 26.14,
        lng: originLoc.lng || 91.73,
        stateName: originLoc.state?.name || 'Assam',
      };
      const destResolved = {
        id: endNodeId || destLoc.matchedName.toLowerCase().replace(/\s+/g, '-'),
        name: destLoc.matchedName,
        lat: destLoc.lat || 27.47,
        lng: destLoc.lng || 94.91,
        stateName: destLoc.state?.name || 'Arunachal Pradesh',
      };

      grounded = await RoutingService.calculateRouteAsync(origResolved, destResolved, priority);
    } catch (err) {
      console.warn('Dynamic route calculation failed:', err);
    }

    // 3. Run Dijkstra with cargo weights if both are graph nodes
    let dijkstraResult = null;
    if (startNodeId && endNodeId && graphNodes.some(n => n.id === startNodeId) && graphNodes.some(n => n.id === endNodeId)) {
      try {
        const routes = optimizeRoutes({
          origin: startNodeId,
          destination: endNodeId,
          cargoWeight: cargo?.weightKg || 8000,
          cargoType: cargo?.commodity || 'General Freight',
          vehicleType: 'Heavy Truck (16t)',
          priority,
        });
        if (routes && routes.length > 0) {
          dijkstraResult = routes[0];
        }
      } catch (dErr) {
        console.warn('Dijkstra optimization failed:', dErr);
      }
    }

    const sources = ['Route Optimization Engine (Dijkstra)'];
    if (grounded?.provider === 'osrm') {
      sources.push('OpenStreetMap OSRM Live Road Network');
    }
    sources.push('Multi-Hazard Risk Registry', 'Logistics Hub Dataset');

    const distanceKm = grounded?.totalDistanceKm || dijkstraResult?.distance || 0;
    const timeHrs = grounded?.estimatedTimeHours || dijkstraResult?.estimatedTime || 0;
    const heavyHrs = grounded?.heavyTruckTimeHours || Math.round(timeHrs * 1.35 * 10) / 10;
    const highways = grounded?.highways.join(' → ') || dijkstraResult?.segments.map(s => s.roadName).filter(Boolean).join(' → ') || 'National Highway Network';
    const waypoints = grounded?.waypoints.join(' ➔ ') || dijkstraResult?.path.join(' ➔ ') || `${originLoc.matchedName} ➔ ${destLoc.matchedName}`;
    const riskScore = grounded?.riskScore || dijkstraResult?.riskScore || 50;

    let proxyDisclosures = '';
    if (originLoc.isProxy && originLoc.proxyNotice) {
      proxyDisclosures += `> 📍 **Origin Notice:** ${originLoc.proxyNotice}\n`;
    }
    if (destLoc.isProxy && destLoc.proxyNotice) {
      proxyDisclosures += `> 📍 **Destination Notice:** ${destLoc.proxyNotice}\n`;
    }
    if (proxyDisclosures) proxyDisclosures += '\n';

    let cargoNotice = '';
    if (cargo?.weightTons) {
      cargoNotice = `\n• **Cargo Specified:** ${cargo.weightTons} tons of ${cargo.commodity || 'freight'}.\n  *(The current route engine evaluates cost/risk weighting based on ${cargo.weightTons}t cargo rather than strict axle-load road bridge bans.)*`;
    }

    const factText = `**Route Intelligence: ${originLoc.matchedName} → ${destLoc.matchedName}**\n\n` +
      proxyDisclosures +
      `• **Driving Distance:** **${distanceKm} km**\n` +
      `• **Estimated Travel Time:** **~${timeHrs} hours** (Standard/Light Commercial) / **~${heavyHrs} hours** (Heavy Truck >12t)\n` +
      `• **Optimization Criterion:** ${priority.toUpperCase()}\n` +
      `• **Highway Corridors:** ${highways}\n` +
      `• **Transshipment Corridor / Waypoints:** ${waypoints}\n` +
      `• **Route Hazard Risk Index:** **${riskScore}/100**\n` +
      `• **Terrain Profile:** ${grounded?.terrainSummary || 'Rugged Mountain & Plain Transshipment Corridors'}` +
      cargoNotice + `\n\n` +
      `**Active Route Advisories:**\n` +
      (grounded?.hazards?.length ? grounded.hazards.map(h => `• ${h}`).join('\n') : '• Monitor mountain pass weather and enforce vehicle spacing.');

    const metrics = [
      { label: 'Total Distance', value: `${distanceKm} km` },
      { label: 'Travel Time', value: `~${timeHrs} hrs` },
      { label: 'Heavy Truck ETA', value: `~${heavyHrs} hrs` },
      { label: 'Risk Factor', value: `${riskScore}/100` },
      { label: 'Routing Engine', value: grounded?.provider === 'osrm' ? 'OSRM Live Road' : 'Dijkstra Network' },
    ];

    const recommendations = grounded?.strategicRecommendations || [
      'Carry mandatory mechanical spares for steep hill climbs',
      'Verify fuel stops and staging depot availability at intermediate waypoints',
    ];

    return {
      factText,
      metrics,
      recommendations,
      sources,
      groundedRoute: grounded,
    };
  }

  // ============================================================
  // MASTER QUERY EXECUTION PIPELINE
  // ============================================================

  /**
   * Execute query dynamically across all real engines and return structured facts
   */
  public static async executeQuery(
    rawQuery: string,
    options?: { userLocation?: { lat: number; lng: number } }
  ): Promise<StructuredFactsResult> {
    const parsed = this.parseQuery(rawQuery, options?.userLocation);

    // If query has unknown locations outside NER and zero locations were matched
    if (parsed.unknownLocationStrings.length > 0 && parsed.locations.length === 0) {
      const unknown = parsed.unknownLocationStrings[0];
      return {
        intent: 'unknown_location',
        locationsFound: [],
        sources: ['NER Regional Boundary Registry'],
        factsText: `I couldn't find "**${unknown}**" in the platform's indexed logistics dataset.\n\nThe system currently covers India's **8 North Eastern States** (Assam, Arunachal Pradesh, Manipur, Meghalaya, Mizoram, Nagaland, Sikkim, Tripura) including all 40+ districts, strategic passes (*Sela Pass, Mayodia Pass, Nathu La*), valleys (*Dibang, Barak, Dzukou*), highways (*NH-13, NH-10, NH-6, NH-27*), and border checkposts (*Moreh, Dawki, Sabroom*).\n\nPlease verify the location name or try an indexed center.`,
        metrics: [{ label: 'Status', value: 'Unindexed Location' }],
        recommendations: [
          'Try: "What is the accessibility of Sela Pass?"',
          'Try: "What are the risks at Mayodia Pass?"',
          'Try: "Find best route from Agartala to Aizawl"',
        ],
      };
    }

    // ----------------------------------------------------
    // CASE 1: ROUTE ANALYSIS
    // ----------------------------------------------------
    if (parsed.primaryIntent === 'route') {
      if (parsed.locations.length >= 2) {
        const origin = parsed.locations[0];
        const dest = parsed.locations[1];
        const routeData = await this.getRouteFact(origin, dest, parsed.priority, parsed.cargo);

        // Multi-intent: also include risk breakdown or infrastructure if asked
        let extraFacts = '';
        if (parsed.intents.includes('risk')) {
          const origRisk = origin.district ? assessDistrictRisk(origin.district.id) : null;
          const destRisk = dest.district ? assessDistrictRisk(dest.district.id) : null;
          extraFacts += `\n\n**Hazard & Risk Details for Route Endpoints:**\n`;
          if (origRisk) extraFacts += `• **${origin.matchedName}:** ${origRisk.overallRisk}/100 Risk (${origRisk.recommendation})\n`;
          if (destRisk) extraFacts += `• **${dest.matchedName}:** ${destRisk.overallRisk}/100 Risk (${destRisk.recommendation})\n`;
        }

        if (parsed.intents.includes('infrastructure')) {
          const origGap = origin.district ? analyzeInfrastructureGaps().find(g => g.districtId === origin.district?.id) : null;
          const destGap = dest.district ? analyzeInfrastructureGaps().find(g => g.districtId === dest.district?.id) : null;
          if (origGap || destGap) {
            extraFacts += `\n\n**Infrastructure Corridor Context:**\n`;
            if (origGap) extraFacts += `• **${origin.matchedName} Capex Need:** ₹${origGap.estimatedCost} Cr (${origGap.recommendedIntervention})\n`;
            if (destGap) extraFacts += `• **${dest.matchedName} Capex Need:** ₹${destGap.estimatedCost} Cr (${destGap.recommendedIntervention})\n`;
          }
        }

        return {
          intent: 'route_analysis',
          locationsFound: [origin.matchedName, dest.matchedName],
          sources: routeData.sources,
          factsText: routeData.factText + extraFacts,
          metrics: routeData.metrics,
          recommendations: routeData.recommendations,
          rawRoute: routeData.groundedRoute,
        };
      } else if (parsed.locations.length === 1) {
        const loc = parsed.locations[0];
        return {
          intent: 'route_analysis',
          locationsFound: [loc.matchedName],
          sources: ['Route Engine'],
          factsText: `You mentioned **${loc.matchedName}**, but route planning requires both an origin and a destination.\n\nPlease specify your full journey (e.g. *"Route from ${loc.matchedName} to Imphal"* or *"Route from Guwahati to ${loc.matchedName}"*).`,
          metrics: [{ label: 'Location', value: loc.matchedName }],
          recommendations: [
            `Try: "Find best route from ${loc.matchedName} to Guwahati"`,
            `Try: "What is the nearest logistics hub to ${loc.matchedName}?"`,
          ],
        };
      }
    }

    // ----------------------------------------------------
    // CASE 2: COMPARISON
    // ----------------------------------------------------
    if (parsed.primaryIntent === 'comparison' && parsed.locations.length >= 2) {
      const comp = this.compareLocationsFact(parsed.locations[0], parsed.locations[1]);
      return {
        intent: 'comparison',
        locationsFound: [parsed.locations[0].matchedName, parsed.locations[1].matchedName],
        sources: comp.sources,
        factsText: comp.factText,
        metrics: comp.metrics,
        recommendations: comp.recommendations,
      };
    }

    // ----------------------------------------------------
    // CASE 3: ACCESSIBILITY
    // ----------------------------------------------------
    if (parsed.primaryIntent === 'accessibility') {
      const targetLoc = parsed.locations[0];
      const fact = this.getAccessibilityFact(targetLoc, parsed.sortOrder);
      return {
        intent: 'accessibility_analysis',
        locationsFound: targetLoc ? [targetLoc.matchedName] : [],
        sources: fact.sources,
        factsText: fact.factText,
        metrics: fact.metrics,
        recommendations: fact.recommendations,
      };
    }

    // ----------------------------------------------------
    // CASE 4: DEMAND FORECAST
    // ----------------------------------------------------
    if (parsed.primaryIntent === 'demand') {
      const targetLoc = parsed.locations[0];
      const fact = this.getDemandFact(targetLoc, parsed.sortOrder === 'worst' ? 'lowest' : 'highest');
      return {
        intent: 'demand_forecast',
        locationsFound: targetLoc ? [targetLoc.matchedName] : [],
        sources: fact.sources,
        factsText: fact.factText,
        metrics: fact.metrics,
        recommendations: fact.recommendations,
      };
    }

    // ----------------------------------------------------
    // CASE 5: RISK & HAZARDS
    // ----------------------------------------------------
    if (parsed.primaryIntent === 'risk') {
      const targetLoc = parsed.locations[0];
      const fact = this.getRiskFact(targetLoc);
      return {
        intent: 'risk_analysis',
        locationsFound: targetLoc ? [targetLoc.matchedName] : [],
        sources: fact.sources,
        factsText: fact.factText,
        metrics: fact.metrics,
        recommendations: fact.recommendations,
      };
    }

    // ----------------------------------------------------
    // CASE 6: INFRASTRUCTURE GAP
    // ----------------------------------------------------
    if (parsed.primaryIntent === 'infrastructure') {
      const targetLoc = parsed.locations[0];
      const fact = this.getInfrastructureFact(targetLoc);
      return {
        intent: 'infrastructure_gap',
        locationsFound: targetLoc ? [targetLoc.matchedName] : [],
        sources: fact.sources,
        factsText: fact.factText,
        metrics: fact.metrics,
        recommendations: fact.recommendations,
      };
    }

    // ----------------------------------------------------
    // CASE 7: LOGISTICS HUBS
    // ----------------------------------------------------
    if (parsed.primaryIntent === 'hub') {
      const loc = parsed.locations[0];
      const lat = loc?.lat || options?.userLocation?.lat || 26.14;
      const lng = loc?.lng || options?.userLocation?.lng || 91.73;
      const name = loc?.matchedName || (options?.userLocation ? 'Your Current Location' : 'Guwahati');

      const fact = this.getHubFact(lat, lng, name, loc?.isProxy ? loc.proxyNotice : undefined);
      return {
        intent: 'hub_intelligence',
        locationsFound: loc ? [loc.matchedName] : [],
        sources: fact.sources,
        factsText: fact.factText,
        metrics: fact.metrics,
        recommendations: fact.recommendations,
      };
    }

    // ----------------------------------------------------
    // CASE 8: STATE-LEVEL LOGISTICS
    // ----------------------------------------------------
    if (parsed.primaryIntent === 'state' || (parsed.locations.length === 1 && parsed.locations[0].type === 'state')) {
      const s = parsed.locations[0]?.state || states[0];
      const fact = this.getStateFact(s);
      return {
        intent: 'state_logistics',
        locationsFound: [s.name],
        sources: fact.sources,
        factsText: fact.factText,
        metrics: fact.metrics,
        recommendations: fact.recommendations,
      };
    }

    // ----------------------------------------------------
    // CASE 9: SINGLE LOCATION DOSSIER (Districts, Passes, Valleys, Towns, Roads)
    // NEVER FALL BACK TO GENERIC REGIONAL SUMMARY WHEN A LOCATION MATCH EXISTS!
    // ----------------------------------------------------
    if (parsed.locations.length >= 1) {
      const loc = parsed.locations[0];
      const d = loc.district || districts[0];
      const acc = computeAccessibility(d);
      const risk = assessDistrictRisk(d.id);
      const dem = forecastDemand(d.id);
      const gap = analyzeInfrastructureGaps().find(g => g.districtId === d.id);
      const s = loc.state || states.find(item => item.id === d.stateId);

      const proxyHeader = loc.isProxy && loc.proxyNotice
        ? `> 📍 **Geographic Resolution Notice:** ${loc.proxyNotice}\n\n`
        : '';

      const strategicDesc = loc.description
        ? `• **Strategic Significance:** ${loc.description}\n`
        : '';

      const factsText = `### Logistics Intelligence Dossier: ${loc.matchedName} (${s?.name || 'NER'})\n\n` +
        proxyHeader +
        strategicDesc +
        `• **Accessibility Rating:** **${acc.overallScore}/100** (${acc.level})\n` +
        `• **Multi-Hazard Risk Index:** **${risk.overallRisk}/100** (${risk.level} - ${risk.factors.landslideRisk} Landslide, ${risk.factors.floodRisk} Flood)\n` +
        `• **Current Freight Inflow Demand:** **${dem.currentDemand} t/day** (7-day forecast: ${dem.forecast7Day} t/day, ${dem.trend})\n` +
        `• **Nearest Major Logistics Hub:** **${d.nearestHubDistance} km** away\n` +
        `• **Infrastructure Quality Index:** ${d.infrastructureQuality}/100 (Gap Score: ${gap ? `${gap.gapScore}/100 - ${gap.priority.toUpperCase()}` : 'Monitored'})\n` +
        `• **Recommended Infrastructure Action:** ${gap?.recommendedIntervention || 'Maintain all-weather road clearance'}\n` +
        `• **Terrain:** ${d.terrain.toUpperCase()}${loc.elevation ? ` (Elevation: ~${loc.elevation}m)` : ` (Elevation: ${d.elevation}m)`}`;

      return {
        intent: 'location_dossier',
        locationsFound: [loc.matchedName],
        sources: [
          'Strategic Geographic Feature Catalog',
          'Accessibility Engine',
          'Hazard Risk Model',
          'Demand Forecast Engine',
        ],
        factsText,
        metrics: [
          { label: 'Accessibility', value: `${acc.overallScore}/100` },
          { label: 'Risk Factor', value: `${risk.overallRisk}/100` },
          { label: 'Daily Demand', value: `${dem.currentDemand} t/d` },
          { label: 'Hub Distance', value: `${d.nearestHubDistance} km` },
        ],
        recommendations: [
          risk.recommendation,
          `Enforce special mountain transit protocols when operating near ${loc.matchedName}`,
        ],
      };
    }

    // ----------------------------------------------------
    // CASE 10: DEFAULT GENERAL SUMMARY ONLY WHEN NO LOCATION WAS MENTIONED
    // ----------------------------------------------------
    const allAcc = computeAllAccessibility(districts);
    const avgScore = Math.round(allAcc.reduce((s, a) => s + a.overallScore, 0) / allAcc.length);
    const highRisks = assessAllRisks().filter(r => r.level === 'CRITICAL' || r.level === 'HIGH').length;
    const totalGaps = analyzeInfrastructureGaps().filter(g => g.priority === 'critical').length;

    return {
      intent: 'general_overview',
      locationsFound: [],
      sources: ['NER Spatial Database', 'Platform Analytics KPI Aggregator'],
      factsText: `**NER Logistics Intelligence — Operational Data Summary:**\n\n` +
        `• **Coverage:** 8 North Eastern States, 40+ districts, high-altitude passes (*Sela Pass, Mayodia, Nathu La*), valleys (*Dibang, Barak, Dzukou*), highways (*NH-13, NH-10, NH-6*), and strategic border posts (*Moreh, Dawki, Sabroom*)\n` +
        `• **Regional Average Accessibility:** **${avgScore}/100**\n` +
        `• **High-Risk Disruption Sectors:** **${highRisks} districts** requiring monsoon monitoring\n` +
        `• **Critical Infrastructure Gaps:** **${totalGaps} priority bottlenecks** identified\n` +
        `• **Siliguri Corridor Dependency:** 85% of bulk inbound goods transit the 22 km bottleneck\n\n` +
        `**You can ask me specific questions such as:**\n` +
        `1. *"How accessible is Sela Pass?"*\n` +
        `2. *"What are the risks at Mayodia Pass?"*\n` +
        `3. *"Compare Sela Pass and Nathu La."*\n` +
        `4. *"Tell me about logistics on NH-10."*\n` +
        `5. *"What is the nearest hub to Moreh?"*\n` +
        `6. *"Which district has the worst accessibility?"*\n` +
        `7. *"Find the best route from Agartala to Aizawl."*`,
      metrics: [
        { label: 'States', value: '8' },
        { label: 'Districts', value: `${districts.length}` },
        { label: 'Avg Accessibility', value: `${avgScore}/100` },
        { label: 'High Risk Zones', value: `${highRisks}` },
      ],
      recommendations: [
        'Ask about any mountain pass, valley, highway, district, or border post across NER',
        'Compare logistics accessibility between any two locations',
      ],
    };
  }
}
