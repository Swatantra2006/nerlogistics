// ============================================================
// NER Logistics Intelligence — Seeded Realistic Demo Data
// Complete dataset for 8 NE states with real geography
// ============================================================

import { State, District, Road, LogisticsHub, Airport, RailwayStation, RiskEvent, WeatherEvent } from '@/types';

// ===== STATES =====
export const states: State[] = [
  { id: 'assam', name: 'Assam', capital: 'Dispur', lat: 26.2006, lng: 92.9376, area: 78438, population: 35607039, accessibilityScore: 72, riskScore: 55, demandLevel: 'very-high' },
  { id: 'arunachal', name: 'Arunachal Pradesh', capital: 'Itanagar', lat: 27.0844, lng: 93.6053, area: 83743, population: 1570000, accessibilityScore: 34, riskScore: 72, demandLevel: 'low' },
  { id: 'manipur', name: 'Manipur', capital: 'Imphal', lat: 24.8170, lng: 93.9368, area: 22327, population: 3092000, accessibilityScore: 48, riskScore: 62, demandLevel: 'medium' },
  { id: 'meghalaya', name: 'Meghalaya', capital: 'Shillong', lat: 25.5788, lng: 91.8933, area: 22429, population: 3772000, accessibilityScore: 58, riskScore: 52, demandLevel: 'medium' },
  { id: 'mizoram', name: 'Mizoram', capital: 'Aizawl', lat: 23.1645, lng: 92.9376, area: 21081, population: 1240000, accessibilityScore: 42, riskScore: 58, demandLevel: 'low' },
  { id: 'nagaland', name: 'Nagaland', capital: 'Kohima', lat: 25.6747, lng: 94.1086, area: 16579, population: 2250000, accessibilityScore: 45, riskScore: 60, demandLevel: 'medium' },
  { id: 'sikkim', name: 'Sikkim', capital: 'Gangtok', lat: 27.3389, lng: 88.6065, area: 7096, population: 690000, accessibilityScore: 52, riskScore: 65, demandLevel: 'low' },
  { id: 'tripura', name: 'Tripura', capital: 'Agartala', lat: 23.9408, lng: 91.9882, area: 10486, population: 4169000, accessibilityScore: 55, riskScore: 48, demandLevel: 'medium' },
];

// ===== DISTRICTS =====
export const districts: District[] = [
  // ASSAM
  { id: 'kamrup-metro', name: 'Kamrup Metropolitan', stateId: 'assam', lat: 26.1445, lng: 91.7362, population: 1260000, area: 1528, accessibilityScore: 88, riskScore: 35, roadConnectivity: 92, railConnectivity: 90, airportAccess: 95, nearestHub: 'guwahati-hub', nearestHubDistance: 5, avgDeliveryTime: 4, avgTravelTime: 1, lastMileDifficulty: 'low', infrastructureQuality: 85, demandLevel: 90, elevation: 55, terrain: 'plain' },
  { id: 'dibrugarh', name: 'Dibrugarh', stateId: 'assam', lat: 27.4728, lng: 94.9120, population: 1327748, area: 3381, accessibilityScore: 71, riskScore: 48, roadConnectivity: 75, railConnectivity: 80, airportAccess: 72, nearestHub: 'dibrugarh-hub', nearestHubDistance: 8, avgDeliveryTime: 8, avgTravelTime: 5, lastMileDifficulty: 'low', infrastructureQuality: 68, demandLevel: 72, elevation: 108, terrain: 'plain' },
  { id: 'silchar', name: 'Cachar', stateId: 'assam', lat: 24.8333, lng: 92.7789, population: 1736617, area: 3786, accessibilityScore: 58, riskScore: 52, roadConnectivity: 62, railConnectivity: 60, airportAccess: 55, nearestHub: 'silchar-hub', nearestHubDistance: 12, avgDeliveryTime: 14, avgTravelTime: 8, lastMileDifficulty: 'medium', infrastructureQuality: 55, demandLevel: 65, elevation: 30, terrain: 'plain' },
  { id: 'nagaon', name: 'Nagaon', stateId: 'assam', lat: 26.3500, lng: 92.6840, population: 2823768, area: 3831, accessibilityScore: 65, riskScore: 55, roadConnectivity: 70, railConnectivity: 68, airportAccess: 45, nearestHub: 'guwahati-hub', nearestHubDistance: 120, avgDeliveryTime: 10, avgTravelTime: 4, lastMileDifficulty: 'medium', infrastructureQuality: 58, demandLevel: 68, elevation: 60, terrain: 'plain' },
  { id: 'tinsukia', name: 'Tinsukia', stateId: 'assam', lat: 27.4922, lng: 95.3547, population: 1327929, area: 3790, accessibilityScore: 62, riskScore: 50, roadConnectivity: 68, railConnectivity: 72, airportAccess: 40, nearestHub: 'dibrugarh-hub', nearestHubDistance: 80, avgDeliveryTime: 12, avgTravelTime: 6, lastMileDifficulty: 'medium', infrastructureQuality: 55, demandLevel: 58, elevation: 116, terrain: 'plain' },
  { id: 'jorhat', name: 'Jorhat', stateId: 'assam', lat: 26.7509, lng: 94.2037, population: 1092256, area: 2851, accessibilityScore: 68, riskScore: 42, roadConnectivity: 72, railConnectivity: 70, airportAccess: 65, nearestHub: 'dibrugarh-hub', nearestHubDistance: 130, avgDeliveryTime: 9, avgTravelTime: 4.5, lastMileDifficulty: 'low', infrastructureQuality: 62, demandLevel: 60, elevation: 86, terrain: 'plain' },
  { id: 'sonitpur', name: 'Sonitpur', stateId: 'assam', lat: 26.7000, lng: 92.9700, population: 1925975, area: 5324, accessibilityScore: 60, riskScore: 48, roadConnectivity: 65, railConnectivity: 62, airportAccess: 38, nearestHub: 'guwahati-hub', nearestHubDistance: 180, avgDeliveryTime: 11, avgTravelTime: 5, lastMileDifficulty: 'medium', infrastructureQuality: 52, demandLevel: 55, elevation: 85, terrain: 'plain' },
  { id: 'barpeta', name: 'Barpeta', stateId: 'assam', lat: 26.3210, lng: 91.0050, population: 1693622, area: 3245, accessibilityScore: 56, riskScore: 62, roadConnectivity: 58, railConnectivity: 55, airportAccess: 35, nearestHub: 'guwahati-hub', nearestHubDistance: 105, avgDeliveryTime: 12, avgTravelTime: 4.5, lastMileDifficulty: 'medium', infrastructureQuality: 48, demandLevel: 52, elevation: 35, terrain: 'riverine' },

  // ARUNACHAL PRADESH
  { id: 'itanagar', name: 'Papum Pare', stateId: 'arunachal', lat: 27.0844, lng: 93.6053, population: 176573, area: 3462, accessibilityScore: 48, riskScore: 62, roadConnectivity: 52, railConnectivity: 25, airportAccess: 42, nearestHub: 'guwahati-hub', nearestHubDistance: 350, avgDeliveryTime: 24, avgTravelTime: 10, lastMileDifficulty: 'high', infrastructureQuality: 42, demandLevel: 45, elevation: 350, terrain: 'hilly' },
  { id: 'tawang', name: 'Tawang', stateId: 'arunachal', lat: 27.5860, lng: 91.8690, population: 49977, area: 2085, accessibilityScore: 22, riskScore: 82, roadConnectivity: 28, railConnectivity: 0, airportAccess: 10, nearestHub: 'guwahati-hub', nearestHubDistance: 520, avgDeliveryTime: 48, avgTravelTime: 18, lastMileDifficulty: 'very-high', infrastructureQuality: 25, demandLevel: 35, elevation: 3048, terrain: 'mountainous' },
  { id: 'west-kameng', name: 'West Kameng', stateId: 'arunachal', lat: 27.2340, lng: 92.3640, population: 87013, area: 7422, accessibilityScore: 28, riskScore: 78, roadConnectivity: 32, railConnectivity: 0, airportAccess: 12, nearestHub: 'guwahati-hub', nearestHubDistance: 420, avgDeliveryTime: 42, avgTravelTime: 15, lastMileDifficulty: 'very-high', infrastructureQuality: 28, demandLevel: 30, elevation: 1800, terrain: 'mountainous' },
  { id: 'east-siang', name: 'East Siang', stateId: 'arunachal', lat: 28.0690, lng: 95.3350, population: 99214, area: 4005, accessibilityScore: 32, riskScore: 70, roadConnectivity: 38, railConnectivity: 5, airportAccess: 20, nearestHub: 'dibrugarh-hub', nearestHubDistance: 280, avgDeliveryTime: 36, avgTravelTime: 14, lastMileDifficulty: 'very-high', infrastructureQuality: 30, demandLevel: 28, elevation: 420, terrain: 'hilly' },
  { id: 'changlang', name: 'Changlang', stateId: 'arunachal', lat: 27.1200, lng: 95.7400, population: 148226, area: 4662, accessibilityScore: 25, riskScore: 75, roadConnectivity: 30, railConnectivity: 8, airportAccess: 15, nearestHub: 'dibrugarh-hub', nearestHubDistance: 320, avgDeliveryTime: 40, avgTravelTime: 16, lastMileDifficulty: 'very-high', infrastructureQuality: 22, demandLevel: 32, elevation: 600, terrain: 'hilly' },
  { id: 'lower-subansiri', name: 'Lower Subansiri (Ziro)', stateId: 'arunachal', lat: 27.6000, lng: 93.8000, population: 83030, area: 3460, accessibilityScore: 30, riskScore: 72, roadConnectivity: 35, railConnectivity: 0, airportAccess: 18, nearestHub: 'guwahati-hub', nearestHubDistance: 400, avgDeliveryTime: 38, avgTravelTime: 14, lastMileDifficulty: 'very-high', infrastructureQuality: 26, demandLevel: 25, elevation: 1200, terrain: 'mountainous' },
  { id: 'dibang-valley', name: 'Dibang Valley (Anini)', stateId: 'arunachal', lat: 28.7900, lng: 95.9000, population: 7948, area: 9129, accessibilityScore: 18, riskScore: 84, roadConnectivity: 22, railConnectivity: 0, airportAccess: 8, nearestHub: 'dibrugarh-hub', nearestHubDistance: 405, avgDeliveryTime: 52, avgTravelTime: 20, lastMileDifficulty: 'very-high', infrastructureQuality: 20, demandLevel: 22, elevation: 1968, terrain: 'mountainous' },
  { id: 'lower-dibang', name: 'Lower Dibang Valley (Roing)', stateId: 'arunachal', lat: 28.1400, lng: 95.8300, population: 53986, area: 3900, accessibilityScore: 42, riskScore: 68, roadConnectivity: 48, railConnectivity: 5, airportAccess: 25, nearestHub: 'dibrugarh-hub', nearestHubDistance: 180, avgDeliveryTime: 24, avgTravelTime: 8, lastMileDifficulty: 'high', infrastructureQuality: 38, demandLevel: 36, elevation: 390, terrain: 'hilly' },
  { id: 'lohit', name: 'Lohit (Tezu)', stateId: 'arunachal', lat: 27.9100, lng: 96.1600, population: 145726, area: 2402, accessibilityScore: 40, riskScore: 65, roadConnectivity: 46, railConnectivity: 5, airportAccess: 30, nearestHub: 'dibrugarh-hub', nearestHubDistance: 210, avgDeliveryTime: 26, avgTravelTime: 9, lastMileDifficulty: 'high', infrastructureQuality: 36, demandLevel: 34, elevation: 210, terrain: 'hilly' },

  // MANIPUR
  { id: 'imphal-west', name: 'Imphal West', stateId: 'manipur', lat: 24.8074, lng: 93.9384, population: 517992, area: 519, accessibilityScore: 62, riskScore: 48, roadConnectivity: 68, railConnectivity: 15, airportAccess: 70, nearestHub: 'imphal-hub', nearestHubDistance: 5, avgDeliveryTime: 10, avgTravelTime: 6, lastMileDifficulty: 'medium', infrastructureQuality: 58, demandLevel: 70, elevation: 786, terrain: 'hilly' },
  { id: 'imphal-east', name: 'Imphal East', stateId: 'manipur', lat: 24.8500, lng: 94.0500, population: 452661, area: 710, accessibilityScore: 58, riskScore: 50, roadConnectivity: 62, railConnectivity: 10, airportAccess: 65, nearestHub: 'imphal-hub', nearestHubDistance: 12, avgDeliveryTime: 11, avgTravelTime: 6.5, lastMileDifficulty: 'medium', infrastructureQuality: 52, demandLevel: 62, elevation: 790, terrain: 'hilly' },
  { id: 'churachandpur', name: 'Churachandpur', stateId: 'manipur', lat: 24.3340, lng: 93.6840, population: 274143, area: 4570, accessibilityScore: 28, riskScore: 72, roadConnectivity: 30, railConnectivity: 0, airportAccess: 15, nearestHub: 'imphal-hub', nearestHubDistance: 60, avgDeliveryTime: 32, avgTravelTime: 12, lastMileDifficulty: 'very-high', infrastructureQuality: 25, demandLevel: 38, elevation: 1500, terrain: 'mountainous' },
  { id: 'ukhrul', name: 'Ukhrul', stateId: 'manipur', lat: 25.1200, lng: 94.3600, population: 183998, area: 4544, accessibilityScore: 24, riskScore: 74, roadConnectivity: 28, railConnectivity: 0, airportAccess: 12, nearestHub: 'imphal-hub', nearestHubDistance: 85, avgDeliveryTime: 36, avgTravelTime: 14, lastMileDifficulty: 'very-high', infrastructureQuality: 22, demandLevel: 30, elevation: 1662, terrain: 'mountainous' },

  // MEGHALAYA
  { id: 'east-khasi', name: 'East Khasi Hills', stateId: 'meghalaya', lat: 25.5788, lng: 91.8933, population: 825922, area: 2748, accessibilityScore: 68, riskScore: 48, roadConnectivity: 72, railConnectivity: 15, airportAccess: 62, nearestHub: 'shillong-hub', nearestHubDistance: 5, avgDeliveryTime: 8, avgTravelTime: 4, lastMileDifficulty: 'medium', infrastructureQuality: 62, demandLevel: 68, elevation: 1496, terrain: 'hilly' },
  { id: 'west-garo', name: 'West Garo Hills', stateId: 'meghalaya', lat: 25.5200, lng: 90.2200, population: 643291, area: 3714, accessibilityScore: 45, riskScore: 58, roadConnectivity: 48, railConnectivity: 8, airportAccess: 30, nearestHub: 'shillong-hub', nearestHubDistance: 320, avgDeliveryTime: 18, avgTravelTime: 9, lastMileDifficulty: 'high', infrastructureQuality: 40, demandLevel: 52, elevation: 380, terrain: 'hilly' },
  { id: 'ri-bhoi', name: 'Ri-Bhoi', stateId: 'meghalaya', lat: 25.7700, lng: 91.8500, population: 258840, area: 2448, accessibilityScore: 60, riskScore: 45, roadConnectivity: 65, railConnectivity: 12, airportAccess: 48, nearestHub: 'shillong-hub', nearestHubDistance: 45, avgDeliveryTime: 10, avgTravelTime: 4.5, lastMileDifficulty: 'medium', infrastructureQuality: 52, demandLevel: 45, elevation: 800, terrain: 'hilly' },
  { id: 'south-garo', name: 'South Garo Hills', stateId: 'meghalaya', lat: 25.2800, lng: 90.6200, population: 142574, area: 1850, accessibilityScore: 32, riskScore: 65, roadConnectivity: 35, railConnectivity: 0, airportAccess: 15, nearestHub: 'shillong-hub', nearestHubDistance: 380, avgDeliveryTime: 28, avgTravelTime: 12, lastMileDifficulty: 'very-high', infrastructureQuality: 28, demandLevel: 35, elevation: 450, terrain: 'hilly' },

  // MIZORAM
  { id: 'aizawl-dist', name: 'Aizawl', stateId: 'mizoram', lat: 23.7271, lng: 92.7176, population: 404054, area: 3576, accessibilityScore: 52, riskScore: 55, roadConnectivity: 55, railConnectivity: 0, airportAccess: 55, nearestHub: 'aizawl-hub', nearestHubDistance: 5, avgDeliveryTime: 16, avgTravelTime: 10, lastMileDifficulty: 'high', infrastructureQuality: 48, demandLevel: 55, elevation: 1132, terrain: 'mountainous' },
  { id: 'lunglei', name: 'Lunglei', stateId: 'mizoram', lat: 22.8800, lng: 92.7300, population: 161428, area: 4538, accessibilityScore: 28, riskScore: 68, roadConnectivity: 30, railConnectivity: 0, airportAccess: 12, nearestHub: 'aizawl-hub', nearestHubDistance: 180, avgDeliveryTime: 36, avgTravelTime: 14, lastMileDifficulty: 'very-high', infrastructureQuality: 25, demandLevel: 32, elevation: 850, terrain: 'mountainous' },
  { id: 'champhai', name: 'Champhai', stateId: 'mizoram', lat: 23.4567, lng: 93.3280, population: 125370, area: 3185, accessibilityScore: 30, riskScore: 65, roadConnectivity: 32, railConnectivity: 0, airportAccess: 10, nearestHub: 'aizawl-hub', nearestHubDistance: 190, avgDeliveryTime: 34, avgTravelTime: 13, lastMileDifficulty: 'very-high', infrastructureQuality: 28, demandLevel: 28, elevation: 1678, terrain: 'mountainous' },

  // NAGALAND
  { id: 'kohima', name: 'Kohima', stateId: 'nagaland', lat: 25.6747, lng: 94.1086, population: 267988, area: 1463, accessibilityScore: 52, riskScore: 58, roadConnectivity: 55, railConnectivity: 0, airportAccess: 30, nearestHub: 'dimapur-hub', nearestHubDistance: 74, avgDeliveryTime: 14, avgTravelTime: 7, lastMileDifficulty: 'high', infrastructureQuality: 48, demandLevel: 55, elevation: 1444, terrain: 'mountainous' },
  { id: 'dimapur', name: 'Dimapur', stateId: 'nagaland', lat: 25.8973, lng: 93.7266, population: 378811, area: 927, accessibilityScore: 65, riskScore: 42, roadConnectivity: 70, railConnectivity: 72, airportAccess: 60, nearestHub: 'dimapur-hub', nearestHubDistance: 3, avgDeliveryTime: 8, avgTravelTime: 5, lastMileDifficulty: 'low', infrastructureQuality: 58, demandLevel: 68, elevation: 154, terrain: 'plain' },
  { id: 'mon', name: 'Mon', stateId: 'nagaland', lat: 26.6919, lng: 94.9130, population: 250260, area: 1786, accessibilityScore: 22, riskScore: 75, roadConnectivity: 25, railConnectivity: 0, airportAccess: 8, nearestHub: 'dimapur-hub', nearestHubDistance: 340, avgDeliveryTime: 42, avgTravelTime: 16, lastMileDifficulty: 'very-high', infrastructureQuality: 18, demandLevel: 28, elevation: 900, terrain: 'mountainous' },
  { id: 'tuensang', name: 'Tuensang', stateId: 'nagaland', lat: 26.2700, lng: 94.8300, population: 196801, area: 4228, accessibilityScore: 20, riskScore: 78, roadConnectivity: 22, railConnectivity: 0, airportAccess: 5, nearestHub: 'dimapur-hub', nearestHubDistance: 360, avgDeliveryTime: 44, avgTravelTime: 18, lastMileDifficulty: 'very-high', infrastructureQuality: 15, demandLevel: 25, elevation: 1400, terrain: 'mountainous' },

  // SIKKIM
  { id: 'east-sikkim', name: 'East Sikkim', stateId: 'sikkim', lat: 27.3389, lng: 88.6065, population: 283583, area: 954, accessibilityScore: 62, riskScore: 55, roadConnectivity: 65, railConnectivity: 18, airportAccess: 52, nearestHub: 'siliguri-hub', nearestHubDistance: 120, avgDeliveryTime: 12, avgTravelTime: 6, lastMileDifficulty: 'high', infrastructureQuality: 55, demandLevel: 58, elevation: 1650, terrain: 'mountainous' },
  { id: 'north-sikkim', name: 'North Sikkim', stateId: 'sikkim', lat: 27.8500, lng: 88.5500, population: 43354, area: 4226, accessibilityScore: 18, riskScore: 85, roadConnectivity: 20, railConnectivity: 0, airportAccess: 8, nearestHub: 'siliguri-hub', nearestHubDistance: 280, avgDeliveryTime: 48, avgTravelTime: 18, lastMileDifficulty: 'very-high', infrastructureQuality: 15, demandLevel: 15, elevation: 4500, terrain: 'mountainous' },
  { id: 'south-sikkim', name: 'South Sikkim', stateId: 'sikkim', lat: 27.1300, lng: 88.4100, population: 146850, area: 750, accessibilityScore: 48, riskScore: 60, roadConnectivity: 50, railConnectivity: 10, airportAccess: 35, nearestHub: 'siliguri-hub', nearestHubDistance: 150, avgDeliveryTime: 16, avgTravelTime: 8, lastMileDifficulty: 'high', infrastructureQuality: 42, demandLevel: 38, elevation: 1500, terrain: 'mountainous' },
  { id: 'west-sikkim', name: 'West Sikkim', stateId: 'sikkim', lat: 27.2000, lng: 88.2500, population: 136435, area: 1166, accessibilityScore: 35, riskScore: 70, roadConnectivity: 38, railConnectivity: 0, airportAccess: 15, nearestHub: 'siliguri-hub', nearestHubDistance: 200, avgDeliveryTime: 24, avgTravelTime: 12, lastMileDifficulty: 'very-high', infrastructureQuality: 30, demandLevel: 28, elevation: 2200, terrain: 'mountainous' },

  // TRIPURA
  { id: 'west-tripura', name: 'West Tripura', stateId: 'tripura', lat: 23.8315, lng: 91.2868, population: 917534, area: 942, accessibilityScore: 68, riskScore: 38, roadConnectivity: 72, railConnectivity: 65, airportAccess: 70, nearestHub: 'agartala-hub', nearestHubDistance: 5, avgDeliveryTime: 8, avgTravelTime: 4, lastMileDifficulty: 'low', infrastructureQuality: 62, demandLevel: 72, elevation: 15, terrain: 'plain' },
  { id: 'dhalai', name: 'Dhalai', stateId: 'tripura', lat: 23.8400, lng: 91.9800, population: 377988, area: 2523, accessibilityScore: 38, riskScore: 55, roadConnectivity: 40, railConnectivity: 20, airportAccess: 18, nearestHub: 'agartala-hub', nearestHubDistance: 120, avgDeliveryTime: 22, avgTravelTime: 10, lastMileDifficulty: 'high', infrastructureQuality: 32, demandLevel: 35, elevation: 100, terrain: 'hilly' },
  { id: 'north-tripura', name: 'North Tripura', stateId: 'tripura', lat: 24.3200, lng: 92.0200, population: 415946, area: 2036, accessibilityScore: 42, riskScore: 48, roadConnectivity: 45, railConnectivity: 30, airportAccess: 22, nearestHub: 'agartala-hub', nearestHubDistance: 170, avgDeliveryTime: 18, avgTravelTime: 8, lastMileDifficulty: 'medium', infrastructureQuality: 38, demandLevel: 42, elevation: 55, terrain: 'hilly' },
  { id: 'south-tripura', name: 'South Tripura', stateId: 'tripura', lat: 23.3600, lng: 91.4200, population: 433737, area: 1534, accessibilityScore: 45, riskScore: 45, roadConnectivity: 48, railConnectivity: 32, airportAccess: 25, nearestHub: 'agartala-hub', nearestHubDistance: 90, avgDeliveryTime: 16, avgTravelTime: 7, lastMileDifficulty: 'medium', infrastructureQuality: 40, demandLevel: 45, elevation: 25, terrain: 'plain' },
];

// ===== ROADS / HIGHWAYS =====
export const roads: Road[] = [
  { id: 'nh-27', name: 'NH-27 (East-West Corridor)', type: 'NH', fromCity: 'Guwahati', toCity: 'Dibrugarh', distance: 480, condition: 'good', lanes: 4, riskScore: 35, avgSpeed: 55, isOperational: true },
  { id: 'nh-37', name: 'NH-37 (Assam Trunk)', type: 'NH', fromCity: 'Guwahati', toCity: 'Sadiya', distance: 620, condition: 'good', lanes: 2, riskScore: 40, avgSpeed: 50, isOperational: true },
  { id: 'nh-6', name: 'NH-6 (Jorabat-Shillong)', type: 'NH', fromCity: 'Guwahati', toCity: 'Shillong', distance: 103, condition: 'good', lanes: 2, riskScore: 45, avgSpeed: 40, isOperational: true },
  { id: 'nh-29', name: 'NH-29 (Nagaland Link)', type: 'NH', fromCity: 'Dimapur', toCity: 'Kohima', distance: 74, condition: 'fair', lanes: 2, riskScore: 60, avgSpeed: 30, isOperational: true },
  { id: 'nh-2', name: 'NH-2 (Imphal Road)', type: 'NH', fromCity: 'Dimapur', toCity: 'Imphal', distance: 215, condition: 'fair', lanes: 2, riskScore: 65, avgSpeed: 30, isOperational: true },
  { id: 'nh-306', name: 'NH-306 (Aizawl Highway)', type: 'NH', fromCity: 'Silchar', toCity: 'Aizawl', distance: 180, condition: 'fair', lanes: 2, riskScore: 62, avgSpeed: 28, isOperational: true },
  { id: 'nh-8', name: 'NH-8 (Agartala Highway)', type: 'NH', fromCity: 'Silchar', toCity: 'Agartala', distance: 302, condition: 'good', lanes: 2, riskScore: 42, avgSpeed: 45, isOperational: true },
  { id: 'nh-13', name: 'NH-13 (Tawang Road)', type: 'NH', fromCity: 'Tezpur', toCity: 'Tawang', distance: 317, condition: 'poor', lanes: 2, riskScore: 82, avgSpeed: 20, isOperational: true },
  { id: 'nh-15', name: 'NH-15 (Itanagar Highway)', type: 'NH', fromCity: 'Banderdewa', toCity: 'Itanagar', distance: 22, condition: 'good', lanes: 2, riskScore: 40, avgSpeed: 40, isOperational: true },
  { id: 'nh-10', name: 'NH-10 (Sikkim Highway)', type: 'NH', fromCity: 'Siliguri', toCity: 'Gangtok', distance: 114, condition: 'fair', lanes: 2, riskScore: 58, avgSpeed: 32, isOperational: true },
  { id: 'nh-44', name: 'NH-44 (Trans-India)', type: 'NH', fromCity: 'Guwahati', toCity: 'Silchar', distance: 340, condition: 'good', lanes: 4, riskScore: 38, avgSpeed: 55, isOperational: true },
  { id: 'nh-54', name: 'NH-54 (Mizoram Corridor)', type: 'NH', fromCity: 'Aizawl', toCity: 'Tuipang', distance: 280, condition: 'poor', lanes: 2, riskScore: 70, avgSpeed: 25, isOperational: true },
  { id: 'nh-36', name: 'NH-36 (Upper Assam)', type: 'NH', fromCity: 'Nagaon', toCity: 'Dibrugarh', distance: 280, condition: 'good', lanes: 2, riskScore: 42, avgSpeed: 48, isOperational: true },
  { id: 'nh-53', name: 'NH-53 (Meghalaya Link)', type: 'NH', fromCity: 'Shillong', toCity: 'Tura', distance: 325, condition: 'fair', lanes: 2, riskScore: 55, avgSpeed: 35, isOperational: true },
  { id: 'sh-sikkim-1', name: 'Gangtok-Nathula Road', type: 'SH', fromCity: 'Gangtok', toCity: 'Nathula', distance: 56, condition: 'fair', lanes: 2, riskScore: 72, avgSpeed: 22, isOperational: true },
  { id: 'nh-702a', name: 'NH-702A (Manipur-Myanmar)', type: 'NH', fromCity: 'Imphal', toCity: 'Moreh', distance: 110, condition: 'fair', lanes: 2, riskScore: 55, avgSpeed: 35, isOperational: true },
  { id: 'nh-127b', name: 'NH-127B (Tripura Interior)', type: 'NH', fromCity: 'Agartala', toCity: 'Sabroom', distance: 185, condition: 'fair', lanes: 2, riskScore: 48, avgSpeed: 38, isOperational: true },
  { id: 'nh-208', name: 'NH-208 (Nagaland-Mon)', type: 'NH', fromCity: 'Dimapur', toCity: 'Mon', distance: 280, condition: 'poor', lanes: 2, riskScore: 72, avgSpeed: 22, isOperational: true },
];

// ===== LOGISTICS HUBS =====
export const logisticsHubs: LogisticsHub[] = [
  { id: 'guwahati-hub', name: 'Guwahati Central Logistics Hub', type: 'major', city: 'Guwahati', stateId: 'assam', lat: 26.1445, lng: 91.7362, capacity: 50000, currentUtilization: 78, incomingShipments: 1250, outgoingShipments: 1180, storageAvailable: 11000, connectivityScore: 92, nearbyPopulation: 1260000, avgDeliveryTime: 4, hasRailAccess: true, hasAirAccess: true },
  { id: 'dibrugarh-hub', name: 'Dibrugarh Regional Hub', type: 'regional', city: 'Dibrugarh', stateId: 'assam', lat: 27.4728, lng: 94.9120, capacity: 18000, currentUtilization: 65, incomingShipments: 420, outgoingShipments: 380, storageAvailable: 6300, connectivityScore: 74, nearbyPopulation: 1327748, avgDeliveryTime: 8, hasRailAccess: true, hasAirAccess: true },
  { id: 'silchar-hub', name: 'Silchar Distribution Center', type: 'regional', city: 'Silchar', stateId: 'assam', lat: 24.8333, lng: 92.7789, capacity: 12000, currentUtilization: 72, incomingShipments: 310, outgoingShipments: 280, storageAvailable: 3360, connectivityScore: 62, nearbyPopulation: 1736617, avgDeliveryTime: 14, hasRailAccess: true, hasAirAccess: true },
  { id: 'dimapur-hub', name: 'Dimapur Gateway Hub', type: 'regional', city: 'Dimapur', stateId: 'nagaland', lat: 25.8973, lng: 93.7266, capacity: 15000, currentUtilization: 70, incomingShipments: 380, outgoingShipments: 340, storageAvailable: 4500, connectivityScore: 68, nearbyPopulation: 378811, avgDeliveryTime: 8, hasRailAccess: true, hasAirAccess: true },
  { id: 'imphal-hub', name: 'Imphal Logistics Center', type: 'regional', city: 'Imphal', stateId: 'manipur', lat: 24.8074, lng: 93.9384, capacity: 10000, currentUtilization: 82, incomingShipments: 280, outgoingShipments: 220, storageAvailable: 1800, connectivityScore: 55, nearbyPopulation: 517992, avgDeliveryTime: 10, hasRailAccess: false, hasAirAccess: true },
  { id: 'shillong-hub', name: 'Shillong Regional Hub', type: 'regional', city: 'Shillong', stateId: 'meghalaya', lat: 25.5788, lng: 91.8933, capacity: 8000, currentUtilization: 68, incomingShipments: 210, outgoingShipments: 190, storageAvailable: 2560, connectivityScore: 58, nearbyPopulation: 825922, avgDeliveryTime: 8, hasRailAccess: false, hasAirAccess: true },
  { id: 'aizawl-hub', name: 'Aizawl Distribution Point', type: 'local', city: 'Aizawl', stateId: 'mizoram', lat: 23.7271, lng: 92.7176, capacity: 5000, currentUtilization: 75, incomingShipments: 140, outgoingShipments: 110, storageAvailable: 1250, connectivityScore: 42, nearbyPopulation: 404054, avgDeliveryTime: 16, hasRailAccess: false, hasAirAccess: true },
  { id: 'agartala-hub', name: 'Agartala Freight Terminal', type: 'regional', city: 'Agartala', stateId: 'tripura', lat: 23.8315, lng: 91.2868, capacity: 12000, currentUtilization: 62, incomingShipments: 260, outgoingShipments: 230, storageAvailable: 4560, connectivityScore: 60, nearbyPopulation: 917534, avgDeliveryTime: 8, hasRailAccess: true, hasAirAccess: true },
  { id: 'siliguri-hub', name: 'Siliguri Chicken Neck Hub', type: 'major', city: 'Siliguri', stateId: 'sikkim', lat: 26.7271, lng: 88.3953, capacity: 35000, currentUtilization: 85, incomingShipments: 980, outgoingShipments: 1050, storageAvailable: 5250, connectivityScore: 88, nearbyPopulation: 700000, avgDeliveryTime: 6, hasRailAccess: true, hasAirAccess: true },
  { id: 'jorhat-hub', name: 'Jorhat Local Hub', type: 'local', city: 'Jorhat', stateId: 'assam', lat: 26.7509, lng: 94.2037, capacity: 6000, currentUtilization: 55, incomingShipments: 150, outgoingShipments: 130, storageAvailable: 2700, connectivityScore: 60, nearbyPopulation: 1092256, avgDeliveryTime: 9, hasRailAccess: true, hasAirAccess: true },
];

// ===== AIRPORTS =====
export const airports: Airport[] = [
  { id: 'guwahati-apt', name: 'Lokpriya Gopinath Bordoloi International', code: 'GAU', city: 'Guwahati', stateId: 'assam', lat: 26.1061, lng: 91.5859, type: 'international', isOperational: true },
  { id: 'dibrugarh-apt', name: 'Dibrugarh Airport', code: 'DIB', city: 'Dibrugarh', stateId: 'assam', lat: 27.4839, lng: 95.0169, type: 'domestic', isOperational: true },
  { id: 'silchar-apt', name: 'Silchar Airport', code: 'IXS', city: 'Silchar', stateId: 'assam', lat: 24.9129, lng: 92.9787, type: 'domestic', isOperational: true },
  { id: 'jorhat-apt', name: 'Jorhat Airport', code: 'JRH', city: 'Jorhat', stateId: 'assam', lat: 26.7315, lng: 94.1753, type: 'domestic', isOperational: true },
  { id: 'imphal-apt', name: 'Bir Tikendrajit International', code: 'IMF', city: 'Imphal', stateId: 'manipur', lat: 24.7600, lng: 93.8967, type: 'international', isOperational: true },
  { id: 'shillong-apt', name: 'Shillong Airport', code: 'SHL', city: 'Shillong', stateId: 'meghalaya', lat: 25.7036, lng: 91.9787, type: 'domestic', isOperational: true },
  { id: 'aizawl-apt', name: 'Lengpui Airport', code: 'AJL', city: 'Aizawl', stateId: 'mizoram', lat: 23.8406, lng: 92.6197, type: 'domestic', isOperational: true },
  { id: 'dimapur-apt', name: 'Dimapur Airport', code: 'DMU', city: 'Dimapur', stateId: 'nagaland', lat: 25.8839, lng: 93.7711, type: 'domestic', isOperational: true },
  { id: 'pakyong-apt', name: 'Pakyong Airport', code: 'PYG', city: 'Gangtok', stateId: 'sikkim', lat: 27.2256, lng: 88.5842, type: 'domestic', isOperational: true },
  { id: 'agartala-apt', name: 'Maharaja Bir Bikram Airport', code: 'IXA', city: 'Agartala', stateId: 'tripura', lat: 23.8870, lng: 91.2404, type: 'domestic', isOperational: true },
  { id: 'itanagar-apt', name: 'Donyi Polo Airport', code: 'HGI', city: 'Itanagar', stateId: 'arunachal', lat: 27.1800, lng: 93.7000, type: 'domestic', isOperational: true },
  { id: 'pasighat-apt', name: 'Pasighat Airport', code: 'IXT', city: 'Pasighat', stateId: 'arunachal', lat: 28.0660, lng: 95.3340, type: 'domestic', isOperational: true },
];

// ===== RAILWAY STATIONS =====
export const railwayStations: RailwayStation[] = [
  { id: 'ghy-rly', name: 'Guwahati Junction', city: 'Guwahati', stateId: 'assam', lat: 26.1850, lng: 91.7460, type: 'junction', hasFreight: true },
  { id: 'dib-rly', name: 'Dibrugarh Town', city: 'Dibrugarh', stateId: 'assam', lat: 27.4800, lng: 94.9100, type: 'terminal', hasFreight: true },
  { id: 'slr-rly', name: 'Silchar', city: 'Silchar', stateId: 'assam', lat: 24.8200, lng: 92.7800, type: 'terminal', hasFreight: true },
  { id: 'ngs-rly', name: 'Nagaon', city: 'Nagaon', stateId: 'assam', lat: 26.3400, lng: 92.6900, type: 'regular', hasFreight: true },
  { id: 'lmg-rly', name: 'Lumding Junction', city: 'Lumding', stateId: 'assam', lat: 25.7500, lng: 93.1700, type: 'junction', hasFreight: true },
  { id: 'dmp-rly', name: 'Dimapur', city: 'Dimapur', stateId: 'nagaland', lat: 25.8900, lng: 93.7300, type: 'terminal', hasFreight: true },
  { id: 'agt-rly', name: 'Agartala', city: 'Agartala', stateId: 'tripura', lat: 23.8400, lng: 91.2800, type: 'terminal', hasFreight: true },
  { id: 'njp-rly', name: 'New Jalpaiguri', city: 'Siliguri', stateId: 'sikkim', lat: 26.7100, lng: 88.4300, type: 'junction', hasFreight: true },
  { id: 'tsk-rly', name: 'Tinsukia Junction', city: 'Tinsukia', stateId: 'assam', lat: 27.4900, lng: 95.3600, type: 'junction', hasFreight: true },
  { id: 'jrh-rly', name: 'Jorhat Town', city: 'Jorhat', stateId: 'assam', lat: 26.7600, lng: 94.2000, type: 'regular', hasFreight: true },
];

// ===== RISK EVENTS (current/recent) =====
export const riskEvents: RiskEvent[] = [
  { id: 'risk-1', type: 'heavy_rainfall', severity: 'high', location: 'NH-13 Tezpur-Tawang', districtId: 'tawang', stateId: 'arunachal', lat: 27.4, lng: 92.1, description: 'Heavy monsoon rainfall causing road waterlogging and reduced visibility on NH-13 corridor', startDate: '2026-08-25', affectedRoutes: ['nh-13'], riskScore: 81, recommendation: 'Use alternate route via Bhalukpong-Bomdila corridor. Delay non-essential cargo by 48 hours.' },
  { id: 'risk-2', type: 'landslide', severity: 'critical', location: 'Sela Pass, West Kameng', districtId: 'west-kameng', stateId: 'arunachal', lat: 27.5, lng: 92.1, description: 'Active landslide zone near Sela Pass. Multiple debris flows reported. Road partially blocked.', startDate: '2026-08-26', affectedRoutes: ['nh-13'], riskScore: 92, recommendation: 'Avoid Sela Pass route. Critical cargo should be airlifted from Guwahati. Regular cargo should be rerouted through Itanagar corridor.' },
  { id: 'risk-3', type: 'flood', severity: 'high', location: 'Brahmaputra basin, Barpeta', districtId: 'barpeta', stateId: 'assam', lat: 26.3, lng: 91.0, description: 'Brahmaputra river water level above danger mark. Low-lying areas inundated. NH-31 partially submerged.', startDate: '2026-08-22', affectedRoutes: ['nh-27'], riskScore: 78, recommendation: 'Reroute through elevated NH-27 corridor. Deploy watercraft for last-mile delivery in affected areas.' },
  { id: 'risk-4', type: 'road_blockage', severity: 'medium', location: 'NH-2 Mao Gate, Manipur', districtId: 'imphal-west', stateId: 'manipur', lat: 25.4, lng: 94.0, description: 'Road maintenance work causing single-lane traffic at Mao Gate. Expected delays of 3-5 hours.', startDate: '2026-08-27', endDate: '2026-09-05', affectedRoutes: ['nh-2'], riskScore: 55, recommendation: 'Plan for additional 4-hour buffer. Cargo exceeding 10 tons should use Jiribam corridor.' },
  { id: 'risk-5', type: 'earthquake', severity: 'low', location: 'North Sikkim zone', districtId: 'north-sikkim', stateId: 'sikkim', lat: 27.9, lng: 88.5, description: 'Seismic activity detected (3.2 magnitude). No infrastructure damage reported. Monitoring ongoing.', startDate: '2026-08-28', affectedRoutes: ['nh-10', 'sh-sikkim-1'], riskScore: 35, recommendation: 'Normal operations. Monitor seismic activity feed. Drivers should report any road damage.' },
  { id: 'risk-6', type: 'heavy_rainfall', severity: 'high', location: 'Cherrapunji-Dawki corridor, Meghalaya', districtId: 'east-khasi', stateId: 'meghalaya', lat: 25.3, lng: 91.7, description: 'Extreme rainfall (300mm+) in Cherrapunji area. Flash flood risk elevated. Road sections washed out.', startDate: '2026-08-24', affectedRoutes: ['nh-6'], riskScore: 75, recommendation: 'Avoid Dawki corridor. Use Guwahati-Shillong highway with caution. Check road conditions before departure.' },
  { id: 'risk-7', type: 'infrastructure_failure', severity: 'medium', location: 'Barak Bridge, NH-44 Silchar', districtId: 'silchar', stateId: 'assam', lat: 24.9, lng: 92.8, description: 'Load restriction imposed on Barak Bridge. Vehicles above 20 tons not permitted.', startDate: '2026-08-20', affectedRoutes: ['nh-44', 'nh-8'], riskScore: 58, recommendation: 'Heavy cargo (>20 tons) should use alternate bridge 12km upstream. Light vehicles can proceed normally.' },
  { id: 'risk-8', type: 'landslide', severity: 'high', location: 'NH-10 Rangpo-Gangtok, Sikkim', districtId: 'east-sikkim', stateId: 'sikkim', lat: 27.2, lng: 88.5, description: 'Landslide debris on NH-10 near Rangpo. One lane cleared for alternating traffic.', startDate: '2026-08-26', affectedRoutes: ['nh-10'], riskScore: 72, recommendation: 'Use NH-10 with 6-hour additional buffer. Critical supplies should be airlifted via Pakyong Airport.' },
];

// ===== SEEDED DEMAND DATA GENERATOR =====
// Uses deterministic seeding for consistent results

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

export function generateDemandHistory(districtId: string, baseDemand: number, months: number = 12): DemandRecord[] {
  const seed = districtId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const rng = seededRandom(seed);
  const records: DemandRecord[] = [];

  const categories = ['FMCG', 'Construction', 'Agriculture', 'Fuel', 'Medical', 'General'];

  for (let m = 0; m < months; m++) {
    for (let d = 1; d <= 30; d++) {
      const month = ((8 - months + m + 1 + 12) % 12) + 1; // count back from August 2026
      const year = month > 8 ? 2025 : 2026;
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

      // Seasonal pattern: monsoon (Jun-Sep) has higher demand for essentials, lower for construction
      const seasonalFactor = (month >= 6 && month <= 9) ? 1.15 : (month >= 11 || month <= 2) ? 0.9 : 1.0;
      // Weekly pattern: weekdays higher
      const dayOfWeek = new Date(year, month - 1, d).getDay();
      const weekdayFactor = (dayOfWeek >= 1 && dayOfWeek <= 5) ? 1.05 : 0.85;
      // Trend: slight growth
      const trendFactor = 1 + (m * 0.008);

      const category = categories[Math.floor(rng() * categories.length)];
      const noise = 0.85 + rng() * 0.3;
      const demand = Math.round(baseDemand * seasonalFactor * weekdayFactor * trendFactor * noise);

      records.push({
        districtId,
        date: dateStr,
        demand: Math.max(1, demand),
        category,
      });
    }
  }

  return records;
}

// ===== WEATHER DATA GENERATOR =====
export function generateWeatherData(districtId: string, terrain: string): WeatherEvent[] {
  const seed = districtId.split('').reduce((acc, c) => acc + c.charCodeAt(0) * 2, 0);
  const rng = seededRandom(seed);
  const events: WeatherEvent[] = [];

  for (let d = 0; d < 30; d++) {
    const date = new Date(2026, 7, d + 1); // August 2026
    const dateStr = date.toISOString().split('T')[0];
    const isMonsoon = true; // August is monsoon

    const baseRainfall = isMonsoon ? 15 + rng() * 40 : 2 + rng() * 10;
    const rainfall = Math.round(baseRainfall * (terrain === 'mountainous' ? 1.3 : terrain === 'hilly' ? 1.15 : 1.0));
    const temperature = terrain === 'mountainous' ? 12 + rng() * 8 : terrain === 'hilly' ? 18 + rng() * 8 : 24 + rng() * 8;
    const humidity = 70 + rng() * 25;
    const condition: WeatherEvent['condition'] = rainfall > 40 ? 'heavy_rain' : rainfall > 25 ? 'rain' : rainfall > 10 ? 'cloudy' : 'clear';
    const floodRisk = Math.min(100, Math.round(rainfall * 1.8 * (terrain === 'riverine' ? 1.5 : 1.0)));
    const landslideRisk = Math.min(100, Math.round(rainfall * 1.5 * (terrain === 'mountainous' ? 2.0 : terrain === 'hilly' ? 1.4 : 0.3)));

    events.push({
      districtId,
      date: dateStr,
      rainfall: Math.round(rainfall),
      temperature: Math.round(temperature * 10) / 10,
      humidity: Math.round(humidity),
      condition,
      floodRisk,
      landslideRisk,
    });
  }

  return events;
}

// ===== GRAPH FOR ROUTE OPTIMIZATION =====
export interface GraphNode {
  id: string;
  name: string;
  lat: number;
  lng: number;
  stateId: string;
}

export interface GraphEdge {
  from: string;
  to: string;
  distance: number;  // km
  time: number;       // hours
  cost: number;       // INR per ton-km
  risk: number;       // 0-100
  accessibility: number; // 0-100
  roadId: string;
  roadName: string;
  condition: string;
  waypoints: [number, number][];
}

export const graphNodes: GraphNode[] = [
  { id: 'guwahati', name: 'Guwahati', lat: 26.1445, lng: 91.7362, stateId: 'assam' },
  { id: 'dibrugarh', name: 'Dibrugarh', lat: 27.4728, lng: 94.9120, stateId: 'assam' },
  { id: 'silchar', name: 'Silchar', lat: 24.8333, lng: 92.7789, stateId: 'assam' },
  { id: 'nagaon', name: 'Nagaon', lat: 26.3500, lng: 92.6840, stateId: 'assam' },
  { id: 'tezpur', name: 'Tezpur', lat: 26.6338, lng: 92.7840, stateId: 'assam' },
  { id: 'jorhat', name: 'Jorhat', lat: 26.7509, lng: 94.2037, stateId: 'assam' },
  { id: 'tinsukia', name: 'Tinsukia', lat: 27.4922, lng: 95.3547, stateId: 'assam' },
  { id: 'itanagar', name: 'Itanagar', lat: 27.0844, lng: 93.6053, stateId: 'arunachal' },
  { id: 'tawang', name: 'Tawang', lat: 27.5860, lng: 91.8690, stateId: 'arunachal' },
  { id: 'bomdila', name: 'Bomdila', lat: 27.2660, lng: 92.4200, stateId: 'arunachal' },
  { id: 'pasighat', name: 'Pasighat', lat: 28.0660, lng: 95.3340, stateId: 'arunachal' },
  { id: 'shillong', name: 'Shillong', lat: 25.5788, lng: 91.8933, stateId: 'meghalaya' },
  { id: 'tura', name: 'Tura', lat: 25.5200, lng: 90.2200, stateId: 'meghalaya' },
  { id: 'kohima', name: 'Kohima', lat: 25.6747, lng: 94.1086, stateId: 'nagaland' },
  { id: 'dimapur', name: 'Dimapur', lat: 25.8973, lng: 93.7266, stateId: 'nagaland' },
  { id: 'imphal', name: 'Imphal', lat: 24.8074, lng: 93.9384, stateId: 'manipur' },
  { id: 'aizawl', name: 'Aizawl', lat: 23.7271, lng: 92.7176, stateId: 'mizoram' },
  { id: 'gangtok', name: 'Gangtok', lat: 27.3389, lng: 88.6065, stateId: 'sikkim' },
  { id: 'siliguri', name: 'Siliguri', lat: 26.7271, lng: 88.3953, stateId: 'sikkim' },
  { id: 'agartala', name: 'Agartala', lat: 23.8315, lng: 91.2868, stateId: 'tripura' },
  { id: 'lumding', name: 'Lumding', lat: 25.7500, lng: 93.1700, stateId: 'assam' },
  { id: 'barpeta', name: 'Barpeta', lat: 26.3210, lng: 91.0050, stateId: 'assam' },
  { id: 'anini', name: 'Anini', lat: 28.7900, lng: 95.9000, stateId: 'arunachal' },
  { id: 'roing', name: 'Roing', lat: 28.1400, lng: 95.8300, stateId: 'arunachal' },
  { id: 'tezu', name: 'Tezu', lat: 27.9100, lng: 96.1600, stateId: 'arunachal' },
  { id: 'ziro', name: 'Ziro', lat: 27.5300, lng: 93.8300, stateId: 'arunachal' },
];

export const graphEdges: GraphEdge[] = [
  // Assam internal
  { from: 'guwahati', to: 'nagaon', distance: 120, time: 2.5, cost: 3.2, risk: 30, accessibility: 75, roadId: 'nh-27', roadName: 'NH-27', condition: 'good', waypoints: [[26.1445, 91.7362], [26.2, 92.1], [26.35, 92.684]] },
  { from: 'nagaon', to: 'jorhat', distance: 160, time: 3.2, cost: 3.0, risk: 35, accessibility: 70, roadId: 'nh-36', roadName: 'NH-36', condition: 'good', waypoints: [[26.35, 92.684], [26.5, 93.2], [26.75, 94.2]] },
  { from: 'jorhat', to: 'dibrugarh', distance: 138, time: 2.8, cost: 3.0, risk: 32, accessibility: 72, roadId: 'nh-37', roadName: 'NH-37', condition: 'good', waypoints: [[26.75, 94.2], [27.1, 94.5], [27.47, 94.91]] },
  { from: 'dibrugarh', to: 'tinsukia', distance: 85, time: 1.5, cost: 2.8, risk: 28, accessibility: 68, roadId: 'nh-37', roadName: 'NH-37', condition: 'good', waypoints: [[27.47, 94.91], [27.49, 95.35]] },
  { from: 'guwahati', to: 'tezpur', distance: 180, time: 3.5, cost: 3.2, risk: 35, accessibility: 70, roadId: 'nh-27', roadName: 'NH-27', condition: 'good', waypoints: [[26.1445, 91.7362], [26.3, 92.0], [26.63, 92.78]] },
  { from: 'guwahati', to: 'barpeta', distance: 105, time: 2.2, cost: 3.0, risk: 45, accessibility: 60, roadId: 'nh-27', roadName: 'NH-27', condition: 'good', waypoints: [[26.1445, 91.7362], [26.3, 91.3], [26.32, 91.0]] },
  { from: 'guwahati', to: 'silchar', distance: 340, time: 7.5, cost: 3.8, risk: 42, accessibility: 62, roadId: 'nh-44', roadName: 'NH-44', condition: 'good', waypoints: [[26.1445, 91.7362], [25.9, 92.1], [25.4, 92.5], [24.83, 92.78]] },
  { from: 'nagaon', to: 'lumding', distance: 70, time: 1.5, cost: 2.8, risk: 30, accessibility: 65, roadId: 'nh-36', roadName: 'NH-36', condition: 'good', waypoints: [[26.35, 92.684], [25.9, 93.0], [25.75, 93.17]] },

  // Assam to Arunachal
  { from: 'tezpur', to: 'bomdila', distance: 150, time: 5.5, cost: 5.0, risk: 68, accessibility: 35, roadId: 'nh-13', roadName: 'NH-13', condition: 'poor', waypoints: [[26.63, 92.78], [27.0, 92.5], [27.27, 92.42]] },
  { from: 'bomdila', to: 'tawang', distance: 180, time: 7.0, cost: 6.0, risk: 82, accessibility: 22, roadId: 'nh-13', roadName: 'NH-13', condition: 'poor', waypoints: [[27.27, 92.42], [27.4, 92.1], [27.59, 91.87]] },
  { from: 'guwahati', to: 'itanagar', distance: 350, time: 8.5, cost: 4.5, risk: 55, accessibility: 45, roadId: 'nh-15', roadName: 'NH-15', condition: 'fair', waypoints: [[26.1445, 91.7362], [26.5, 92.3], [26.9, 93.0], [27.08, 93.61]] },
  { from: 'dibrugarh', to: 'pasighat', distance: 195, time: 5.5, cost: 4.8, risk: 60, accessibility: 35, roadId: 'nh-15', roadName: 'NH-515', condition: 'fair', waypoints: [[27.47, 94.91], [27.8, 95.1], [28.07, 95.33]] },
  { from: 'tinsukia', to: 'roing', distance: 95, time: 2.2, cost: 3.5, risk: 45, accessibility: 55, roadId: 'nh-115', roadName: 'NH-115 (via Bhupen Hazarika Setu)', condition: 'good', waypoints: [[27.49, 95.35], [27.78, 95.66], [28.14, 95.83]] },
  { from: 'roing', to: 'anini', distance: 225, time: 6.5, cost: 6.5, risk: 84, accessibility: 18, roadId: 'nh-313', roadName: 'NH-313 (Roing-Anini Highway via Hunli & Mayodia)', condition: 'fair', waypoints: [[28.14, 95.83], [28.23, 95.91], [28.52, 95.96], [28.79, 95.90]] },
  { from: 'roing', to: 'pasighat', distance: 85, time: 2.0, cost: 3.8, risk: 48, accessibility: 48, roadId: 'nh-13', roadName: 'NH-13 (Trans-Arunachal Highway)', condition: 'good', waypoints: [[28.14, 95.83], [28.10, 95.55], [28.07, 95.33]] },
  { from: 'roing', to: 'tezu', distance: 65, time: 1.5, cost: 3.5, risk: 42, accessibility: 52, roadId: 'nh-13', roadName: 'NH-13', condition: 'good', waypoints: [[28.14, 95.83], [27.98, 96.00], [27.91, 96.16]] },
  { from: 'itanagar', to: 'ziro', distance: 110, time: 3.8, cost: 4.2, risk: 62, accessibility: 38, roadId: 'nh-13', roadName: 'NH-13 (Potin-Ziro)', condition: 'fair', waypoints: [[27.08, 93.61], [27.3, 93.7], [27.53, 93.83]] },

  // Assam to Meghalaya
  { from: 'guwahati', to: 'shillong', distance: 103, time: 2.8, cost: 3.5, risk: 42, accessibility: 65, roadId: 'nh-6', roadName: 'NH-6', condition: 'good', waypoints: [[26.1445, 91.7362], [25.8, 91.8], [25.58, 91.89]] },
  { from: 'shillong', to: 'tura', distance: 325, time: 8.5, cost: 4.2, risk: 55, accessibility: 48, roadId: 'nh-53', roadName: 'NH-53', condition: 'fair', waypoints: [[25.58, 91.89], [25.5, 91.2], [25.4, 90.5], [25.52, 90.22]] },

  // Assam to Nagaland
  { from: 'jorhat', to: 'dimapur', distance: 142, time: 3.5, cost: 3.5, risk: 40, accessibility: 62, roadId: 'nh-36', roadName: 'NH-36', condition: 'good', waypoints: [[26.75, 94.2], [26.3, 93.9], [25.9, 93.73]] },
  { from: 'lumding', to: 'dimapur', distance: 95, time: 2.5, cost: 3.2, risk: 38, accessibility: 65, roadId: 'nh-29', roadName: 'NH-29', condition: 'fair', waypoints: [[25.75, 93.17], [25.85, 93.5], [25.9, 93.73]] },
  { from: 'dimapur', to: 'kohima', distance: 74, time: 2.5, cost: 4.0, risk: 58, accessibility: 52, roadId: 'nh-29', roadName: 'NH-29', condition: 'fair', waypoints: [[25.9, 93.73], [25.8, 93.9], [25.67, 94.11]] },

  // Nagaland to Manipur
  { from: 'kohima', to: 'imphal', distance: 138, time: 4.5, cost: 4.5, risk: 62, accessibility: 48, roadId: 'nh-2', roadName: 'NH-2', condition: 'fair', waypoints: [[25.67, 94.11], [25.3, 94.0], [24.81, 93.94]] },
  { from: 'dimapur', to: 'imphal', distance: 215, time: 6.5, cost: 4.8, risk: 65, accessibility: 45, roadId: 'nh-2', roadName: 'NH-2', condition: 'fair', waypoints: [[25.9, 93.73], [25.67, 94.11], [25.3, 94.0], [24.81, 93.94]] },

  // Assam to Mizoram (via Silchar)
  { from: 'silchar', to: 'aizawl', distance: 180, time: 6.0, cost: 5.0, risk: 62, accessibility: 42, roadId: 'nh-306', roadName: 'NH-306', condition: 'fair', waypoints: [[24.83, 92.78], [24.2, 92.7], [23.73, 92.72]] },

  // Assam to Tripura (via Silchar)
  { from: 'silchar', to: 'agartala', distance: 302, time: 7.0, cost: 3.8, risk: 42, accessibility: 58, roadId: 'nh-8', roadName: 'NH-8', condition: 'good', waypoints: [[24.83, 92.78], [24.2, 92.2], [23.9, 91.7], [23.83, 91.29]] },
  { from: 'guwahati', to: 'agartala', distance: 599, time: 14.0, cost: 4.0, risk: 48, accessibility: 55, roadId: 'nh-44', roadName: 'NH-44 + NH-8', condition: 'good', waypoints: [[26.1445, 91.7362], [25.9, 92.1], [24.83, 92.78], [24.2, 92.2], [23.83, 91.29]] },

  // Sikkim connections
  { from: 'siliguri', to: 'gangtok', distance: 114, time: 3.5, cost: 4.0, risk: 58, accessibility: 55, roadId: 'nh-10', roadName: 'NH-10', condition: 'fair', waypoints: [[26.7271, 88.3953], [27.0, 88.5], [27.34, 88.61]] },
  { from: 'guwahati', to: 'siliguri', distance: 560, time: 9.5, cost: 3.5, risk: 35, accessibility: 72, roadId: 'nh-27', roadName: 'NH-27', condition: 'good', waypoints: [[26.1445, 91.7362], [26.4, 90.5], [26.5, 89.5], [26.73, 88.4]] },
];

// ===== CITY MAPPING FOR ROUTE OPTIMIZER =====
export const cityOptions = graphNodes.map(n => ({
  id: n.id,
  name: n.name,
  lat: n.lat,
  lng: n.lng,
  stateId: n.stateId,
}));
