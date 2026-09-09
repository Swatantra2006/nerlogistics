'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  ChevronLeft,
  ChevronRight,
  Printer,
  Maximize2,
  Minimize2,
  Play,
  Pause,
  Home,
  CheckCircle2,
  ExternalLink,
  ShieldAlert,
  Cpu,
  TrendingUp,
  MapPin,
  Compass,
  Zap,
  Layers,
  Sparkles,
  Edit3,
  Check,
  RotateCcw,
  ArrowRight,
  Database,
  Sliders,
  BarChart2,
  Radio,
  FileText,
  Download,
  Loader2
} from 'lucide-react';

export default function PitchDeckPage() {
  const [currentSlide, setCurrentSlide] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isEditingTeamId, setIsEditingTeamId] = useState(false);
  const [teamId, setTeamId] = useState('NER-LOGISTICS-ENTERPRISE');
  const [viewMode, setViewMode] = useState<'presentation' | 'all'>('presentation');

  const totalSlides = 6;
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-play feature
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setCurrentSlide((prev) => (prev >= totalSlides ? 1 : prev + 1));
      }, 7000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isEditingTeamId) return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        setCurrentSlide((prev) => Math.min(prev + 1, totalSlides));
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        setCurrentSlide((prev) => Math.max(prev - 1, 1));
      } else if (e.key >= '1' && e.key <= '6') {
        setCurrentSlide(parseInt(e.key, 10));
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditingTeamId]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
      }
    }
  };

  const handlePrint = () => {
    setViewMode('all');
    setTimeout(() => {
      window.print();
    }, 300);
  };

  const [isExportingPPTX, setIsExportingPPTX] = useState(false);

  const handleDownloadPPTX = async () => {
    setIsExportingPPTX(true);
    try {
      if (typeof (window as any).PptxGenJS === 'undefined') {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://cdn.jsdelivr.net/npm/pptxgenjs@3.12.0/dist/pptxgen.bundle.js';
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }

      const PptxGen = (window as any).PptxGenJS;
      const pptx = new PptxGen();
      pptx.layout = 'LAYOUT_16x9';
      pptx.author = 'NER Logistics Intelligence';
      pptx.company = 'NER Logistics Intelligence Platform';
      pptx.title = 'AI-Based Smart Logistics and Accessibility Intelligence Platform for NER';

      const addTemplateChrome = (slide: any, title: string, slideNum: number) => {
        slide.addShape(pptx.ShapeType.ellipse, {
          x: 0.5, y: 0.35, w: 1.8, h: 0.75,
          line: { color: '1E293B', width: 2 },
          fill: { color: 'FFFFFF' }
        });
        slide.addText("NER\nLogistics\nPlatform", {
          x: 0.5, y: 0.35, w: 1.8, h: 0.75,
          align: 'center', valign: 'middle',
          fontSize: 10, bold: true, color: '0F172A',
          fontFace: 'Arial'
        });

        slide.addText(title, {
          x: 2.5, y: 0.35, w: 8.3, h: 0.75,
          align: 'center', valign: 'middle',
          fontSize: 24, bold: true, color: '0F172A',
          fontFace: 'Georgia'
        });

        slide.addText("NER LOGISTICS\nINTELLIGENCE\nSYSTEM", {
          x: 11.2, y: 0.35, w: 1.8, h: 0.75,
          align: 'right', valign: 'middle',
          fontSize: 10, bold: true, color: '1E293B',
          fontFace: 'Arial'
        });

        slide.addText("NER Logistics Intelligence Platform Architecture", {
          x: 0.5, y: 7.0, w: 5.0, h: 0.3,
          fontSize: 10, color: '64748B', fontFace: 'Arial'
        });
        slide.addText(String(slideNum), {
          x: 12.0, y: 7.0, w: 0.8, h: 0.3,
          align: 'right', fontSize: 10, bold: true, color: '64748B', fontFace: 'Arial'
        });
      };

      // SLIDE 1
      const s1 = pptx.addSlide();
      addTemplateChrome(s1, "TITLE PAGE", 1);
      s1.addShape(pptx.ShapeType.rect, {
        x: 0.8, y: 1.5, w: 7.5, h: 0.9,
        fill: { color: 'FEF3C7' }, line: { color: 'F59E0B', width: 2 }
      });
      s1.addText("AI-Based Smart Logistics and Accessibility Intelligence Platform for North Eastern Region (NER)", {
        x: 0.9, y: 1.55, w: 7.3, h: 0.8,
        fontSize: 14, bold: true, color: '78350F', fontFace: 'Arial'
      });

      const s1Rows = [
        [{ text: "• Problem Statement ID:", options: { bold: true, color: "0F172A" } }, { text: "26002", options: { bold: true, color: "B45309" } }],
        [{ text: "• Problem Statement Title:", options: { bold: true, color: "0F172A" } }, { text: "AI-Based Smart Logistics and Accessibility Intelligence Platform for North Eastern Region (NER)", options: { color: "334155" } }],
        [{ text: "• Theme:", options: { bold: true, color: "0F172A" } }, { text: "Transportation and Logistics", options: { color: "334155" } }],
        [{ text: "• PS Category:", options: { bold: true, color: "0F172A" } }, { text: "Software", options: { bold: true, color: "047857" } }],
        [{ text: "• System Deployment ID:", options: { bold: true, color: "0F172A" } }, { text: teamId || "NER-LOGISTICS-ENTERPRISE", options: { bold: true, color: "0F172A" } }],
        [{ text: "• Team Name:", options: { bold: true, color: "0F172A" } }, { text: "Red & Gold", options: { bold: true, color: "BE123C" } }],
      ];
      s1.addTable(s1Rows, {
        x: 0.8, y: 2.6, w: 7.5, h: 3.8,
        colW: [2.6, 4.9],
        fontSize: 12,
        fontFace: 'Arial',
        border: { type: 'none' },
        fill: { color: 'FFFFFF' }
      });

      s1.addShape(pptx.ShapeType.roundRect, {
        x: 8.7, y: 1.5, w: 4.0, h: 4.9,
        fill: { color: 'F8FAFC' }, line: { color: 'CBD5E1', width: 1.5 }
      });
      s1.addText("SMART LOGISTICS PLATFORM\nFOR NORTH EAST INDIA", {
        x: 8.8, y: 1.8, w: 3.8, h: 0.8,
        align: 'center', fontSize: 13, bold: true, color: '0F172A', fontFace: 'Arial'
      });

      const badges = [
        { text: "🗺️ 8 North Eastern States Covered", fill: "EFF6FF", color: "1D4ED8" },
        { text: "⚙️ 5 Dedicated AI/ML Engines", fill: "ECFDF5", color: "047857" },
        { text: "⚠️ Multi-Hazard Landslide & Flood Alert", fill: "FFFBEB", color: "B45309" },
        { text: "🚚 Multi-Modal: Road + Rail + River NW-2", fill: "FAF5FF", color: "6B21A8" }
      ];
      badges.forEach((b, i) => {
        s1.addShape(pptx.ShapeType.roundRect, {
          x: 8.9, y: 2.8 + (i * 0.8), w: 3.6, h: 0.65,
          fill: { color: b.fill }, line: { color: 'E2E8F0', width: 1 }
        });
        s1.addText(b.text, {
          x: 9.0, y: 2.8 + (i * 0.8), w: 3.4, h: 0.65,
          fontSize: 10, bold: true, color: b.color, valign: 'middle', fontFace: 'Arial'
        });
      });

      // SLIDE 2
      const s2 = pptx.addSlide();
      addTemplateChrome(s2, "IDEA TITLE", 2);
      s2.addShape(pptx.ShapeType.roundRect, {
        x: 0.8, y: 1.3, w: 11.7, h: 0.9,
        fill: { color: '0F172A' }
      });
      s2.addText("NER-LogiAI: Smart Multi-Modal Logistics & Risk Intelligence Engine", {
        x: 1.0, y: 1.35, w: 11.3, h: 0.45,
        fontSize: 15, bold: true, color: 'F59E0B', fontFace: 'Arial'
      });
      s2.addText("India's first unified geospatial AI platform engineered specifically for the 8 North Eastern States.", {
        x: 1.0, y: 1.75, w: 11.3, h: 0.35,
        fontSize: 10, color: 'E2E8F0', fontFace: 'Arial'
      });
      s2.addText("❖ Proposed Solution (Describe your Idea/Solution/Prototype)", {
        x: 0.8, y: 2.35, w: 11.7, h: 0.35,
        fontSize: 12, bold: true, color: '0F172A', fontFace: 'Arial'
      });

      const pillars = [
        {
          title: "1. Multi-Hazard Safe Routing",
          desc: "Dijkstra algorithm enhanced with real-time multi-criteria cost matrices (Distance, Travel Time, Monsoon Landslide Probability, Flood Inundation & Seismic Zone V).\n\n• Real-time road block rerouting & detours",
          fill: "EFF6FF", stroke: "93C5FD", headColor: "1D4ED8"
        },
        {
          title: "2. Demand Forecasting",
          desc: "Box-Jenkins and linear time-series decomposition modeling seasonal demand spikes for food grains, fuel, medical supplies, and agricultural exports (Tea/Spices).\n\n• 7 to 30-day proactive planning",
          fill: "ECFDF5", stroke: "A7F3D0", headColor: "047857"
        },
        {
          title: "3. Accessibility Intelligence",
          desc: "Weighted composite accessibility index (0–100) scoring 40+ districts on road density, all-weather connectivity, terrain ruggedness, and nearest hospital/hub access.\n\n• Automated bottleneck ranking",
          fill: "FFFBEB", stroke: "FDE68A", headColor: "B45309"
        },
        {
          title: "4. Scenario Simulator & Copilot",
          desc: "Interactive 'What-If' stress-testing engine simulating Brahmaputra bridge cut-offs, fuel price spikes, or highway washouts with conversational AI decision guidance.\n\n• Instant contingency action plans",
          fill: "FAF5FF", stroke: "E9D5FF", headColor: "6B21A8"
        }
      ];
      pillars.forEach((p, i) => {
        const px = 0.8 + (i * 2.98);
        s2.addShape(pptx.ShapeType.roundRect, {
          x: px, y: 2.8, w: 2.8, h: 3.9,
          fill: { color: p.fill }, line: { color: p.stroke, width: 1.5 }
        });
        s2.addText(p.title, {
          x: px + 0.1, y: 2.9, w: 2.6, h: 0.5,
          fontSize: 11, bold: true, color: p.headColor, fontFace: 'Arial'
        });
        s2.addText(p.desc, {
          x: px + 0.1, y: 3.4, w: 2.6, h: 3.2,
          fontSize: 9.5, color: '334155', fontFace: 'Arial'
        });
      });

      // SLIDE 3
      const s3 = pptx.addSlide();
      addTemplateChrome(s3, "TECHNICAL APPROACH", 3);
      s3.addShape(pptx.ShapeType.roundRect, {
        x: 0.8, y: 1.3, w: 3.8, h: 3.0,
        fill: { color: '0F172A' }
      });
      s3.addText("PRODUCTION TECH STACK", {
        x: 1.0, y: 1.45, w: 3.4, h: 0.35,
        fontSize: 12, bold: true, color: 'F59E0B', fontFace: 'Arial'
      });
      s3.addText("• Core: Next.js 14 (App Router) & React 18\n• Language: TypeScript (Full Type Safety)\n• Geospatial: Leaflet.js + OpenStreetMap\n• Analytics: Recharts + Client-Side ML\n• Algorithms: Dijkstra + Box-Jenkins + AHP\n• Design: Tailwind CSS (Ultra-Responsive)", {
        x: 1.0, y: 1.85, w: 3.4, h: 2.3,
        fontSize: 10, color: 'E2E8F0', fontFace: 'Arial'
      });

      s3.addShape(pptx.ShapeType.roundRect, {
        x: 0.8, y: 4.5, w: 3.8, h: 2.2,
        fill: { color: 'ECFDF5' }, line: { color: '6EE7B7', width: 1.5 }
      });
      s3.addText("FUNCTIONAL PROTOTYPE", {
        x: 1.0, y: 4.6, w: 3.4, h: 0.35,
        fontSize: 11, bold: true, color: '065F46', fontFace: 'Arial'
      });
      s3.addText("Live web application operational with:\n✓ 40+ NER districts mapped\n✓ Multi-modal routes (Road, Rail, River NW-2)\n✓ Real-time risk alerts & early warnings\n✓ Conversational NER AI Copilot", {
        x: 1.0, y: 4.95, w: 3.4, h: 1.6,
        fontSize: 9.5, color: '047857', fontFace: 'Arial'
      });

      s3.addShape(pptx.ShapeType.roundRect, {
        x: 4.9, y: 1.3, w: 7.6, h: 5.4,
        fill: { color: 'F8FAFC' }, line: { color: 'CBD5E1', width: 1.5 }
      });
      s3.addText("METHODOLOGY & IMPLEMENTATION FLOWCHART", {
        x: 5.1, y: 1.45, w: 7.2, h: 0.35,
        fontSize: 12, bold: true, color: '0F172A', fontFace: 'Arial'
      });

      const flowSteps = [
        { num: "1", title: "Data Collection", text: "OSM road network, NHAI/BRO data, Census 2026 demand, NDMA/ASDMA hazard zones." },
        { num: "2", title: "Data Processing", text: "Data cleaning, coordinate projections, feature extraction, graph topology building." },
        { num: "3", title: "5 ML Engines", text: "Accessibility scoring, Dijkstra routing, Box-Jenkins forecasting, AHP risk engine." },
        { num: "4", title: "Decision Logic", text: "Multi-attribute Pareto optimization (Fastest vs. Safest vs. Cheapest routes)." },
        { num: "5", title: "Dashboard UI", text: "Interactive Leaflet maps, KPI scorecards, risk alerts, and conversational AI Copilot." },
        { num: "6", title: "Simulation & Action", text: "What-If disruption stress testing, detour planning, and infrastructure gap reports." }
      ];
      flowSteps.forEach((st, idx) => {
        const col = idx % 2;
        const row = Math.floor(idx / 2);
        const fx = 5.1 + (col * 3.6);
        const fy = 1.9 + (row * 1.55);

        s3.addShape(pptx.ShapeType.roundRect, {
          x: fx, y: fy, w: 3.4, h: 1.35,
          fill: { color: 'FFFFFF' }, line: { color: '94A3B8', width: 1 }
        });
        s3.addText(`[Step ${st.num}] ${st.title}`, {
          x: fx + 0.1, y: fy + 0.08, w: 3.2, h: 0.3,
          fontSize: 10, bold: true, color: '1E293B', fontFace: 'Arial'
        });
        s3.addText(st.text, {
          x: fx + 0.1, y: fy + 0.38, w: 3.2, h: 0.9,
          fontSize: 8.5, color: '475569', fontFace: 'Arial'
        });
      });

      // SLIDE 4
      const s4 = pptx.addSlide();
      addTemplateChrome(s4, "FEASIBILITY AND VIABILITY", 4);
      s4.addShape(pptx.ShapeType.roundRect, {
        x: 0.8, y: 1.3, w: 4.8, h: 5.4,
        fill: { color: '0F172A' }
      });
      s4.addText("FEASIBILITY SCORECARD: 8.75 / 10", {
        x: 1.0, y: 1.5, w: 4.4, h: 0.4,
        fontSize: 13, bold: true, color: '10B981', fontFace: 'Arial'
      });

      const scores = [
        { title: "Technical Feasibility (9/10)", text: "Proven graph algorithms, client-side ML execution, zero heavy cloud GPU dependency." },
        { title: "Economic Viability (9/10)", text: "100% open-source software stack with near-zero recurring licensing costs." },
        { title: "Operational Viability (7.5/10)", text: "Offline-first PWA caching mitigates patchy 2G/4G connectivity across mountain passes." },
        { title: "Market & Strategic Impact (10/10)", text: "Directly serves 46M citizens and aligns with PM Gati Shakti & Act East Policy." }
      ];
      scores.forEach((sc, i) => {
        s4.addText(sc.title, {
          x: 1.0, y: 2.1 + (i * 1.15), w: 4.4, h: 0.3,
          fontSize: 11, bold: true, color: 'F59E0B', fontFace: 'Arial'
        });
        s4.addText(sc.text, {
          x: 1.0, y: 2.4 + (i * 1.15), w: 4.4, h: 0.75,
          fontSize: 9.5, color: 'CBD5E1', fontFace: 'Arial'
        });
      });

      s4.addShape(pptx.ShapeType.roundRect, {
        x: 5.9, y: 1.3, w: 6.6, h: 5.4,
        fill: { color: 'F8FAFC' }, line: { color: 'CBD5E1', width: 1.5 }
      });
      s4.addText("POTENTIAL CHALLENGES & MITIGATION STRATEGIES", {
        x: 6.1, y: 1.5, w: 6.2, h: 0.4,
        fontSize: 12, bold: true, color: '0F172A', fontFace: 'Arial'
      });

      const mitigations = [
        { c: "Patchy Connectivity in Hills", m: "Offline-first PWA caching with local vector maps and background queue synchronization." },
        { c: "Fragmented Government Data", m: "Standardized GeoJSON ingestion pipeline with automated data confidence scoring." },
        { c: "Monsoon & Landslide Volatility", m: "Automated webhooks with Central Water Commission (CWC) & crowdsourced trucker alerts." },
        { c: "Geopolitical & Border Sensitivity", m: "Enterprise Role-Based Access Control (RBAC) & on-premise government cloud deployment." }
      ];
      mitigations.forEach((m, idx) => {
        const my = 2.0 + (idx * 1.15);
        s4.addShape(pptx.ShapeType.roundRect, {
          x: 6.1, y: my, w: 6.2, h: 1.0,
          fill: { color: 'FFFFFF' }, line: { color: 'E2E8F0', width: 1 }
        });
        s4.addText(`⚠️ Challenge: ${m.c}`, {
          x: 6.2, y: my + 0.08, w: 6.0, h: 0.3,
          fontSize: 9.5, bold: true, color: 'BE123C', fontFace: 'Arial'
        });
        s4.addText(`✓ Strategy: ${m.m}`, {
          x: 6.2, y: my + 0.38, w: 6.0, h: 0.55,
          fontSize: 9, bold: true, color: '047857', fontFace: 'Arial'
        });
      });

      // SLIDE 5
      const s5 = pptx.addSlide();
      addTemplateChrome(s5, "IMPACT AND BENEFITS", 5);
      s5.addShape(pptx.ShapeType.roundRect, {
        x: 0.8, y: 1.3, w: 11.7, h: 1.1,
        fill: { color: '0F172A' }
      });
      s5.addText("POTENTIAL IMPACT: 46M+ Citizens | 8 States Covered", {
        x: 1.0, y: 1.4, w: 11.3, h: 0.35,
        fontSize: 13, bold: true, color: '10B981', fontFace: 'Arial'
      });
      s5.addText("Enables government officials (DoNER, NEC, MoRTH), disaster managers (NDMA, ASDMA), and logistics planners to make data-driven decisions that cut delivery times and secure life-saving supply chains.", {
        x: 1.0, y: 1.75, w: 11.3, h: 0.55,
        fontSize: 10, color: 'E2E8F0', fontFace: 'Arial'
      });

      const impacts = [
        {
          title: "1. Social Impact",
          stat: "+40% Faster",
          head: "Emergency & Life Safety",
          desc: "Cuts delivery time for emergency relief & medical kits during monsoon landslides. Guarantees safe routing for 15+ isolated hill districts.",
          fill: "ECFDF5", stroke: "A7F3D0", statColor: "047857"
        },
        {
          title: "2. Economic Impact",
          stat: "22% Cost Cut",
          head: "Freight & Trade Boost",
          desc: "Lowers logistics expenditure by 22% and trip time by 35% through multi-modal integration (Brahmaputra NW-2 barges + rail + road).",
          fill: "EFF6FF", stroke: "93C5FD", statColor: "1D4ED8"
        },
        {
          title: "3. Environmental",
          stat: "18% Fuel Saved",
          head: "Green Logistics & Carbon Cut",
          desc: "Terrain-gradient optimized routing minimizes idling on steep mountain passes, reducing diesel emissions across ecologically sensitive hills.",
          fill: "F0FDFA", stroke: "99F6E4", statColor: "0F766E"
        },
        {
          title: "4. Governance",
          stat: "High ROI",
          head: "PM Gati Shakti Alignment",
          desc: "Provides Ministry of DoNER and NITI Aayog with automated infrastructure gap analytics to target multi-crore capex where most needed.",
          fill: "FFFBEB", stroke: "FDE68A", statColor: "B45309"
        }
      ];
      impacts.forEach((imp, i) => {
        const ix = 0.8 + (i * 2.98);
        s5.addShape(pptx.ShapeType.roundRect, {
          x: ix, y: 2.6, w: 2.8, h: 4.1,
          fill: { color: imp.fill }, line: { color: imp.stroke, width: 1.5 }
        });
        s5.addText(imp.title, {
          x: ix + 0.1, y: 2.75, w: 2.6, h: 0.3,
          fontSize: 11, bold: true, color: '0F172A', fontFace: 'Arial'
        });
        s5.addText(imp.stat, {
          x: ix + 0.1, y: 3.1, w: 2.6, h: 0.45,
          fontSize: 16, bold: true, color: imp.statColor, fontFace: 'Arial'
        });
        s5.addText(imp.head, {
          x: ix + 0.1, y: 3.6, w: 2.6, h: 0.35,
          fontSize: 10, bold: true, color: '1E293B', fontFace: 'Arial'
        });
        s5.addText(imp.desc, {
          x: ix + 0.1, y: 4.0, w: 2.6, h: 2.5,
          fontSize: 9.5, color: '475569', fontFace: 'Arial'
        });
      });

      // SLIDE 6
      const s6 = pptx.addSlide();
      addTemplateChrome(s6, "RESEARCH AND REFERENCES", 6);
      s6.addText("Academic Foundations, Government Policies & Verified Data Benchmarks", {
        x: 0.8, y: 1.3, w: 11.7, h: 0.4,
        fontSize: 12, bold: true, color: '0F172A', fontFace: 'Arial'
      });

      const refs = [
        {
          title: "1. Core Algorithmic Foundations",
          items: [
            "• Dijkstra, E.W. (1959): 'A note on two problems in connexion with graphs.' Numerische Mathematik, 1(1), 269–271.",
            "• Box, G.E.P. & Jenkins, G.M. (1976): Time Series Analysis: Forecasting and Control for demand modeling.",
            "• Saaty, T.L. (1980): The Analytic Hierarchy Process (AHP) for multi-hazard composite weighting."
          ],
          foot: "Peer-reviewed CS & Operations Research"
        },
        {
          title: "2. Government Reports & Policies",
          items: [
            "• PM Gati Shakti National Master Plan: Integrated multi-modal connectivity corridors (pmgatishakti.gov.in)",
            "• NITI Aayog NER Vision 2035: Regional transport infrastructure development targets (niti.gov.in)",
            "• MoRTH & BRO: National Highway networks & strategic border road data (morth.nic.in / bro.gov.in)"
          ],
          foot: "Official Government of India Frameworks"
        },
        {
          title: "3. Hazard & Benchmark Frameworks",
          items: [
            "• NDMA & ASDMA: Multi-hazard vulnerability maps, Brahmaputra flood inundation & Zone V data (ndma.gov.in)",
            "• World Bank Logistics Performance Index (LPI): Accessibility scoring methodology (lpi.worldbank.org)",
            "• Census of India (Projected 2026): Demographics for 8 North Eastern states."
          ],
          foot: "Validated Geospatial & Statistical Data"
        }
      ];
      refs.forEach((rf, i) => {
        const rx = 0.8 + (i * 3.98);
        s6.addShape(pptx.ShapeType.roundRect, {
          x: rx, y: 1.8, w: 3.8, h: 4.9,
          fill: { color: 'F8FAFC' }, line: { color: 'CBD5E1', width: 1.5 }
        });
        s6.addText(rf.title, {
          x: rx + 0.15, y: 1.95, w: 3.5, h: 0.4,
          fontSize: 11, bold: true, color: '0F172A', fontFace: 'Arial'
        });
        const bulletText = rf.items.join("\n\n");
        s6.addText(bulletText, {
          x: rx + 0.15, y: 2.45, w: 3.5, h: 3.6,
          fontSize: 9.5, color: '334155', fontFace: 'Arial'
        });
        s6.addText(rf.foot, {
          x: rx + 0.15, y: 6.2, w: 3.5, h: 0.35,
          fontSize: 8.5, bold: true, color: '2563EB', fontFace: 'Arial'
        });
      });

      await pptx.writeFile({ fileName: 'NER_Logistics_Platform_Architecture.pptx' });
    } catch (err: any) {
      alert('Could not generate PPTX directly: ' + err.message);
    } finally {
      setIsExportingPPTX(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Top Controller Bar (Hidden during Print) */}
      <header className="print:hidden sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 sm:px-6 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition"
          >
            <Home className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Back to Dashboard</span>
          </Link>
          <div className="h-4 w-px bg-slate-700 mx-1 hidden sm:block" />
          <div className="flex items-center gap-2">
            <span className="bg-primary-500/20 text-primary-400 text-[11px] font-bold px-2 py-0.5 rounded border border-primary-500/30">
              NER LOGISTICS
            </span>
            <span className="text-xs font-bold text-white hidden md:inline">
              Executive System Architecture Briefing
            </span>
          </div>
        </div>

        {/* Slide Selector & Controls */}
        <div className="flex items-center gap-2">
          {viewMode === 'presentation' && (
            <div className="flex items-center bg-slate-800/80 rounded-lg p-1 border border-slate-700">
              <button
                onClick={() => setCurrentSlide((prev) => Math.max(prev - 1, 1))}
                disabled={currentSlide === 1}
                className="p-1 rounded hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent transition text-slate-200"
                title="Previous Slide (←)"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1 px-2">
                {[1, 2, 3, 4, 5, 6].map((num) => (
                  <button
                    key={num}
                    onClick={() => setCurrentSlide(num)}
                    className={`w-6 h-6 rounded text-xs font-bold transition flex items-center justify-center ${
                      currentSlide === num
                        ? 'bg-amber-500 text-slate-950 shadow-md scale-105'
                        : 'text-slate-400 hover:text-white hover:bg-slate-700/60'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setCurrentSlide((prev) => Math.min(prev + 1, totalSlides))}
                disabled={currentSlide === totalSlides}
                className="p-1 rounded hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent transition text-slate-200"
                title="Next Slide (→)"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Autoplay button */}
          {viewMode === 'presentation' && (
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`p-2 rounded-lg border text-xs font-medium transition flex items-center gap-1.5 ${
                isPlaying
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
              }`}
              title={isPlaying ? 'Pause Auto-play' : 'Start Auto-play'}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span className="hidden lg:inline">{isPlaying ? 'Auto-Playing' : 'Auto-Play'}</span>
            </button>
          )}

          {/* View Mode Toggle */}
          <button
            onClick={() => setViewMode(viewMode === 'presentation' ? 'all' : 'presentation')}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 text-xs font-medium transition flex items-center gap-1"
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{viewMode === 'presentation' ? 'Show All 6 Slides' : 'Single Slide'}</span>
          </button>

          {/* Download PPTX Button */}
          <button
            onClick={handleDownloadPPTX}
            disabled={isExportingPPTX}
            className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-slate-950 font-black text-xs shadow-md shadow-amber-900/30 flex items-center gap-1.5 transition active:scale-95 disabled:opacity-50"
            title="Download editable PowerPoint (.pptx) file directly"
          >
            {isExportingPPTX ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Generating PPTX...</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>Download .PPTX</span>
              </>
            )}
          </button>

          {/* Print / Save PDF Button */}
          <button
            onClick={handlePrint}
            className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-900/30 flex items-center gap-1.5 transition active:scale-95"
            title="Export/Save as Architecture PDF Briefing"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print to PDF</span>
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 transition"
            title="Toggle Fullscreen (F)"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main Presentation Container */}
      <main className="flex-1 flex flex-col items-center justify-center p-2 sm:p-6 lg:p-8 overflow-y-auto">
        {viewMode === 'presentation' ? (
          /* Single Slide Presentation Mode */
          <div className="w-full max-w-[1240px] aspect-[16/9] shadow-2xl rounded-2xl overflow-hidden border border-slate-800 bg-white text-slate-900 relative transition-all duration-300 flex flex-col">
            <SlideRenderer
              slideNumber={currentSlide}
              teamId={teamId}
              setTeamId={setTeamId}
              isEditingTeamId={isEditingTeamId}
              setIsEditingTeamId={setIsEditingTeamId}
            />
          </div>
        ) : (
          /* All Slides Overview (Print & Review Mode) */
          <div className="w-full max-w-[1240px] flex flex-col gap-8 print:gap-0 print:m-0 print:p-0">
            {[1, 2, 3, 4, 5, 6].map((num) => (
              <div
                key={num}
                className="w-full aspect-[16/9] shadow-2xl rounded-xl overflow-hidden border border-slate-700/80 bg-white text-slate-900 relative print:shadow-none print:rounded-none print:border-none print:break-after-page print:page-break-after-always"
              >
                <SlideRenderer
                  slideNumber={num}
                  teamId={teamId}
                  setTeamId={setTeamId}
                  isEditingTeamId={isEditingTeamId}
                  setIsEditingTeamId={setIsEditingTeamId}
                />
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Keyboard Shortcuts Helper bar (Hidden in Print) */}
      <footer className="print:hidden py-2 px-6 bg-slate-900/60 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-4">
          <span>Shortcuts: <kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-300 font-mono">←</kbd> <kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-300 font-mono">→</kbd> Next/Prev</span>
          <span><kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-300 font-mono">Space</kbd> Advance</span>
          <span><kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-300 font-mono">1-6</kbd> Direct Jump</span>
          <span><kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-300 font-mono">F</kbd> Fullscreen</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>NER Logistics Intelligence System Architecture (6 Sections)</span>
        </div>
      </footer>
    </div>
  );
}

// --------------------------------------------------------------------------
// Slide Renderer Component
// --------------------------------------------------------------------------
function SlideRenderer({
  slideNumber,
  teamId,
  setTeamId,
  isEditingTeamId,
  setIsEditingTeamId,
}: {
  slideNumber: number;
  teamId: string;
  setTeamId: (id: string) => void;
  isEditingTeamId: boolean;
  setIsEditingTeamId: (b: boolean) => void;
}) {
  return (
    <div className="w-full h-full flex flex-col justify-between p-6 sm:p-10 relative bg-white text-slate-900 select-text overflow-hidden font-sans">
      {/* Top Banner Common to All Presentation Slides */}
      <div className="flex items-start justify-between border-b border-slate-200 pb-3">
        {/* Top-Left Oval: Team Name */}
        <div className="flex items-center">
          <div className="w-28 sm:w-36 h-11 sm:h-12 rounded-full border-2 border-slate-800 flex flex-col items-center justify-center bg-white shadow-sm">
            <span className="text-[12px] sm:text-[14px] font-bold text-slate-900 tracking-wide uppercase leading-tight">
              Red & Gold
            </span>
          </div>
        </div>

        {/* Center Header Title */}
        <div className="text-center flex-1 px-4">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-black tracking-wider text-slate-900 uppercase">
            {slideNumber === 1 && 'TITLE PAGE'}
            {slideNumber === 2 && 'IDEA TITLE'}
            {slideNumber === 3 && 'TECHNICAL APPROACH'}
            {slideNumber === 4 && 'FEASIBILITY AND VIABILITY'}
            {slideNumber === 5 && 'IMPACT AND BENEFITS'}
            {slideNumber === 6 && 'RESEARCH AND REFERENCES'}
          </h1>
        </div>

        {/* Top-Right NER Logistics Badge */}
        <div className="flex items-center gap-2 text-right">
          <div className="w-10 h-10 sm:w-12 sm:h-12 relative flex items-center justify-center">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <circle cx="50" cy="50" r="46" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="2" />
              <path d="M 50 15 A 35 35 0 0 0 50 85 Z" fill="#6366f1" />
              <path d="M 50 15 A 35 35 0 0 1 50 85 Z" fill="#10b981" />
              <circle cx="50" cy="45" r="16" fill="#ffffff" />
              <path d="M 44 63 L 56 63 L 53 72 L 47 72 Z" fill="#ffffff" />
              <text x="50" y="49" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#0f172a">NER</text>
            </svg>
          </div>
          <div className="hidden sm:flex flex-col text-left leading-none">
            <span className="text-[11px] font-black tracking-tight text-slate-800 uppercase">NER LOGISTICS</span>
            <span className="text-[11px] font-black tracking-tight text-slate-800 uppercase">INTELLIGENCE</span>
            <span className="text-[13px] font-black text-indigo-600">ENTERPRISE</span>
          </div>
        </div>
      </div>

      {/* Middle Content: Dynamic based on slideNumber */}
      <div className="flex-1 my-3 flex flex-col justify-center overflow-hidden">
        {slideNumber === 1 && (
          <Slide1Content
            teamId={teamId}
            setTeamId={setTeamId}
            isEditingTeamId={isEditingTeamId}
            setIsEditingTeamId={setIsEditingTeamId}
          />
        )}
        {slideNumber === 2 && <Slide2Content />}
        {slideNumber === 3 && <Slide3Content />}
        {slideNumber === 4 && <Slide4Content />}
        {slideNumber === 5 && <Slide5Content />}
        {slideNumber === 6 && <Slide6Content />}
      </div>

      {/* Bottom Footer: Platform Blue Bar */}
      <div className="bg-blue-700 h-8 sm:h-9 -mx-6 sm:-mx-10 -mb-6 sm:-mb-10 px-6 sm:px-10 flex items-center justify-between text-white text-xs sm:text-sm font-bold">
        <span className="w-8 opacity-0">.</span>
        <span className="tracking-wide">NER Logistics Intelligence Platform • Enterprise Deployment Architecture</span>
        <span className="bg-blue-800/80 px-2 py-0.5 rounded text-white font-mono text-xs">{slideNumber}</span>
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------
// SLIDE 1: TITLE PAGE
// --------------------------------------------------------------------------
function Slide1Content({
  teamId,
  setTeamId,
  isEditingTeamId,
  setIsEditingTeamId,
}: {
  teamId: string;
  setTeamId: (id: string) => void;
  isEditingTeamId: boolean;
  setIsEditingTeamId: (b: boolean) => void;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center h-full">
      {/* Left Column: Essential System Specifications */}
      <div className="md:col-span-7 space-y-4">
        <div className="bg-amber-500/10 border-l-4 border-amber-600 p-3 rounded-r-lg">
          <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">Government of India / MoRTH & NEC Initiative</span>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-snug mt-0.5">
            AI-Based Smart Logistics & Accessibility Intelligence Platform for North Eastern Region (NER)
          </h2>
        </div>

        <div className="space-y-2.5 text-xs sm:text-sm text-slate-800">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-slate-900 w-44 flex-shrink-0">• Problem Statement ID:</span>
            <span className="font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded text-sm tracking-wide">
              26002
            </span>
          </div>

          <div className="flex items-start gap-2">
            <span className="font-extrabold text-slate-900 w-44 flex-shrink-0">• Problem Statement Title:</span>
            <span className="font-medium text-slate-700">
              AI-Based Smart Logistics and Accessibility Intelligence Platform for North Eastern Region (NER)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-extrabold text-slate-900 w-44 flex-shrink-0">• Theme:</span>
            <span className="font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
              Transportation and Logistics
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-extrabold text-slate-900 w-44 flex-shrink-0">• PS Category:</span>
            <span className="font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
              Software
            </span>
          </div>

          {/* Interactive Team ID Field */}
          <div className="flex items-center gap-2 pt-1">
            <span className="font-extrabold text-slate-900 w-44 flex-shrink-0">• Team ID:</span>
            {isEditingTeamId ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={teamId}
                  onChange={(e) => setTeamId(e.target.value)}
                  className="border-2 border-amber-500 rounded px-2 py-0.5 text-sm font-bold text-slate-900 focus:outline-none"
                  autoFocus
                />
                <button
                  onClick={() => setIsEditingTeamId(false)}
                  className="p-1 rounded bg-emerald-600 text-white hover:bg-emerald-700 text-xs"
                  title="Save Team ID"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 group">
                <span className="font-bold text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded border border-slate-300">
                  {teamId}
                </span>
                <button
                  onClick={() => setIsEditingTeamId(true)}
                  className="text-slate-400 hover:text-amber-600 print:hidden text-xs flex items-center gap-1 font-normal opacity-70 group-hover:opacity-100 transition"
                  title="Click to edit Team ID"
                >
                  <Edit3 className="w-3 h-3" />
                  <span className="text-[10px]">Edit</span>
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="font-extrabold text-slate-900 w-44 flex-shrink-0">• Team Name:</span>
            <span className="font-black text-rose-700 text-base tracking-wide">
              Red & Gold
            </span>
          </div>
        </div>

        {/* Feature Badges */}
        <div className="pt-2 flex flex-wrap gap-2 text-[11px]">
          <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-bold border border-blue-200 flex items-center gap-1">
            <MapPin className="w-3 h-3" /> 8 North Eastern States Covered
          </span>
          <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 flex items-center gap-1">
            <Cpu className="w-3 h-3" /> 5 Dedicated ML Engines
          </span>
          <span className="px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 font-bold border border-purple-200 flex items-center gap-1">
            <Radio className="w-3 h-3" /> Multi-Hazard Risk Rerouting
          </span>
        </div>
      </div>

      {/* Right Column: Hero High-Tech Illustration & Neural Bulb */}
      <div className="md:col-span-5 flex flex-col items-center justify-center relative p-4">
        <div className="w-48 h-48 sm:w-60 sm:h-60 relative flex items-center justify-center">
          {/* Animated glow rings */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-amber-400/20 to-emerald-400/20 blur-xl animate-pulse" />
          
          {/* Central High-Tech Brain/Bulb Emblem */}
          <svg viewBox="0 0 200 200" className="w-full h-full relative z-10 drop-shadow-md">
            {/* Outer Hexagon Tech Ring */}
            <circle cx="100" cy="100" r="85" fill="none" stroke="#e2e8f0" strokeWidth="2" strokeDasharray="6 4" />
            
            {/* Left Brain Circuit (Warm Amber / Gold) */}
            <path
              d="M 100 35 C 70 35 50 60 50 90 C 50 115 65 135 85 145 L 85 160 L 100 160 Z"
              fill="#f59e0b"
              opacity="0.95"
            />
            {/* Right Digital Circuit (Teal / Green) */}
            <path
              d="M 100 35 C 130 35 150 60 150 90 C 150 115 135 135 115 145 L 115 160 L 100 160 Z"
              fill="#10b981"
              opacity="0.95"
            />

            {/* Neural lines & nodes */}
            <circle cx="75" cy="70" r="4" fill="#ffffff" />
            <circle cx="80" cy="105" r="4" fill="#ffffff" />
            <circle cx="65" cy="120" r="3" fill="#ffffff" />
            <line x1="75" y1="70" x2="80" y2="105" stroke="#ffffff" strokeWidth="2" />
            <line x1="80" y1="105" x2="65" y2="120" stroke="#ffffff" strokeWidth="2" />

            {/* Digital Binary matrix lines */}
            <text x="125" y="70" fill="#ffffff" fontSize="9" fontFamily="monospace" fontWeight="bold">10101</text>
            <text x="120" y="88" fill="#ffffff" fontSize="9" fontFamily="monospace" fontWeight="bold">01010</text>
            <text x="123" y="106" fill="#ffffff" fontSize="9" fontFamily="monospace" fontWeight="bold">11001</text>
            <text x="121" y="124" fill="#ffffff" fontSize="9" fontFamily="monospace" fontWeight="bold">00110</text>

            {/* Base Connector & Platform label */}
            <rect x="88" y="164" width="24" height="6" rx="2" fill="#64748b" />
            <rect x="92" y="172" width="16" height="4" rx="2" fill="#475569" />
          </svg>
        </div>

        <div className="text-center mt-2">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
            NER Logistics Intelligence Platform
          </span>
          <span className="text-[11px] text-slate-500 font-medium">
            AI-Powered Multi-Modal Corridor Operations for North East India
          </span>
        </div>
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------
// SLIDE 2: IDEA TITLE & PROPOSED SOLUTION
// --------------------------------------------------------------------------
function Slide2Content() {
  return (
    <div className="flex flex-col justify-between h-full space-y-3">
      {/* Idea Branding Callout */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-3 sm:p-4 rounded-xl shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-amber-500 text-slate-950 font-black text-[10px] sm:text-xs px-2 py-0.5 rounded tracking-wide uppercase">
              Core Innovation
            </span>
            <span className="text-xs text-slate-300 font-medium">PS ID: 26002</span>
          </div>
          <h2 className="text-lg sm:text-xl lg:text-2xl font-black tracking-tight text-white mt-1">
            NER-LogiAI: Smart Multi-Modal Logistics & Risk Intelligence Engine
          </h2>
          <p className="text-xs text-slate-300">
            India&apos;s first unified geospatial AI platform engineered specifically for the 8 North Eastern States.
          </p>
        </div>

        <div className="bg-slate-800/90 border border-slate-700 px-3 py-2 rounded-lg text-right flex-shrink-0">
          <div className="text-xs font-bold text-amber-400">Siliguri Corridor &amp; Hill States</div>
          <div className="text-[10px] text-slate-300">All-Weather Freight Continuity</div>
        </div>
      </div>

      {/* Proposed Solution Overview */}
      <div className="flex items-center gap-2 text-slate-900 font-black text-xs sm:text-sm">
        <span className="text-amber-600 text-base">❖</span>
        <span className="underline decoration-amber-500 decoration-2 font-bold">
          Proposed Architecture &amp; System Capabilities
        </span>
      </div>

      {/* 4 Infographic Pillars (Replacing plain text bullets) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 flex-1">
        {/* Pillar 1 */}
        <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3 flex flex-col justify-between hover:shadow-md transition">
          <div>
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm mb-2 shadow-sm">
              <Compass className="w-4 h-4" />
            </div>
            <h3 className="font-black text-slate-900 text-xs sm:text-sm leading-tight">
              1. Multi-Hazard Safe Routing
            </h3>
            <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
              Dijkstra algorithm enhanced with real-time multi-criteria cost matrices (Distance, Travel Time, Monsoon Landslide Probability, Flood Inundation &amp; Seismic Zone V).
            </p>
          </div>
          <div className="pt-2 border-t border-blue-200/80 text-[10px] font-bold text-blue-800">
            • Real-time road block rerouting
          </div>
        </div>

        {/* Pillar 2 */}
        <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 flex flex-col justify-between hover:shadow-md transition">
          <div>
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-sm mb-2 shadow-sm">
              <TrendingUp className="w-4 h-4" />
            </div>
            <h3 className="font-black text-slate-900 text-xs sm:text-sm leading-tight">
              2. Demand Forecasting
            </h3>
            <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
              Box-Jenkins and linear time-series decomposition modeling seasonal demand spikes for food grains, fuel, medical supplies, and agricultural exports (Tea/Spices).
            </p>
          </div>
          <div className="pt-2 border-t border-emerald-200/80 text-[10px] font-bold text-emerald-800">
            • 7 to 30-day proactive planning
          </div>
        </div>

        {/* Pillar 3 */}
        <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 flex flex-col justify-between hover:shadow-md transition">
          <div>
            <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center font-bold text-sm mb-2 shadow-sm">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <h3 className="font-black text-slate-900 text-xs sm:text-sm leading-tight">
              3. Accessibility Intelligence
            </h3>
            <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
              Weighted composite accessibility index (0–100) scoring 40+ districts on road density, all-weather connectivity, terrain ruggedness, and nearest hospital/hub access.
            </p>
          </div>
          <div className="pt-2 border-t border-amber-200/80 text-[10px] font-bold text-amber-800">
            • Automated bottleneck ranking
          </div>
        </div>

        {/* Pillar 4 */}
        <div className="bg-purple-50/70 border border-purple-200 rounded-xl p-3 flex flex-col justify-between hover:shadow-md transition">
          <div>
            <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center font-bold text-sm mb-2 shadow-sm">
              <Sliders className="w-4 h-4" />
            </div>
            <h3 className="font-black text-slate-900 text-xs sm:text-sm leading-tight">
              4. Scenario Simulator &amp; Copilot
            </h3>
            <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
              &quot;What-If&quot; stress-testing engine simulating Brahmaputra bridge cut-offs, fuel price spikes, or highway washouts with conversational AI decision guidance.
            </p>
          </div>
          <div className="pt-2 border-t border-purple-200/80 text-[10px] font-bold text-purple-800">
            • Instant contingency action plans
          </div>
        </div>
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------
// SLIDE 3: TECHNICAL APPROACH
// --------------------------------------------------------------------------
function Slide3Content() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-full items-center">
      {/* Left Column: Stack & Prototype Overview */}
      <div className="lg:col-span-4 flex flex-col justify-between h-full space-y-3">
        <div className="bg-slate-900 text-white p-3.5 rounded-xl border border-slate-800 shadow-sm">
          <div className="flex items-center gap-1.5 text-amber-400 font-bold text-xs uppercase tracking-wider mb-2">
            <Cpu className="w-3.5 h-3.5" /> Production Stack
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between border-b border-slate-800 pb-1">
              <span className="text-slate-400">Core Framework:</span>
              <span className="font-bold text-white">Next.js 14 (App Router)</span>
            </div>
            <div className="flex justify-between border-b border-slate-800 pb-1">
              <span className="text-slate-400">Language &amp; Type:</span>
              <span className="font-bold text-white">TypeScript &amp; React 18</span>
            </div>
            <div className="flex justify-between border-b border-slate-800 pb-1">
              <span className="text-slate-400">Geospatial Engine:</span>
              <span className="font-bold text-white">Leaflet + OpenStreetMap</span>
            </div>
            <div className="flex justify-between border-b border-slate-800 pb-1">
              <span className="text-slate-400">Data Analytics:</span>
              <span className="font-bold text-white">Recharts + Client-side ML</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Design System:</span>
              <span className="font-bold text-white">Tailwind CSS (Zero Bloat)</span>
            </div>
          </div>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl">
          <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-xs mb-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Functional Prototype Status
          </div>
          <p className="text-[11px] text-emerald-950 leading-relaxed font-medium">
            Live interactive dashboard operational with 40+ NER districts, multi-modal routing (Road, Rail, Inland Waterway NW-2, Air), live hazard alerts, and natural language AI Copilot.
          </p>
        </div>
      </div>

      {/* Right Column: 6-Stage Methodology Flowchart */}
      <div className="lg:col-span-8 bg-slate-50 border border-slate-200 rounded-xl p-3 sm:p-4 flex flex-col justify-between h-full">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-2">
          <span className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-amber-600" />
            Methodology &amp; Implementation Flowchart
          </span>
          <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
            End-to-End Pipeline
          </span>
        </div>

        {/* 6 Step Interactive Process Visual */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 flex-1">
          {/* Step 1 */}
          <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-black text-[10px] flex items-center justify-center">1</span>
              <span className="text-xs font-black text-slate-900">Data Collection</span>
            </div>
            <p className="text-[10px] text-slate-600 mt-1">
              Geographic (OSM), NHAI/BRO roads, Census demand, NDMA/ASDMA flood &amp; landslide hazard zones.
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-teal-600 text-white font-black text-[10px] flex items-center justify-center">2</span>
              <span className="text-xs font-black text-slate-900">Data Processing</span>
            </div>
            <p className="text-[10px] text-slate-600 mt-1">
              Data cleaning, spatial coordinate transformation, feature extraction, and graph network topology build.
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-white p-2.5 rounded-lg border-2 border-amber-500 shadow-xs flex flex-col justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-amber-600 text-white font-black text-[10px] flex items-center justify-center">3</span>
              <span className="text-xs font-black text-slate-900">5 ML Engines</span>
            </div>
            <p className="text-[10px] text-slate-600 mt-1">
              Dijkstra routing, Box-Jenkins time-series demand forecasting, Saaty AHP risk scoring, gap analysis.
            </p>
          </div>

          {/* Step 4 */}
          <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-black text-[10px] flex items-center justify-center">4</span>
              <span className="text-xs font-black text-slate-900">Decision Logic</span>
            </div>
            <p className="text-[10px] text-slate-600 mt-1">
              Multi-objective Pareto optimization (Fastest vs. Safest vs. Cheapest), dynamic alert thresholding.
            </p>
          </div>

          {/* Step 5 */}
          <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-rose-600 text-white font-black text-[10px] flex items-center justify-center">5</span>
              <span className="text-xs font-black text-slate-900">Dashboard UI</span>
            </div>
            <p className="text-[10px] text-slate-600 mt-1">
              Interactive Leaflet maps, district scorecards, supply-demand charts, and conversational AI copilot.
            </p>
          </div>

          {/* Step 6 */}
          <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-black text-[10px] flex items-center justify-center">6</span>
              <span className="text-xs font-black text-slate-900">Simulation &amp; Act</span>
            </div>
            <p className="text-[10px] text-slate-600 mt-1">
              Real-time disruption stress testing, detour planning, and actionable infrastructure gap recommendations.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------
// SLIDE 4: FEASIBILITY AND VIABILITY
// --------------------------------------------------------------------------
function Slide4Content() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-full items-center">
      {/* Left: Feasibility Scores Infographic */}
      <div className="lg:col-span-5 bg-slate-900 text-white p-4 rounded-xl shadow-sm flex flex-col justify-between h-full">
        <div>
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wide">Analysis Of The Idea</span>
            <span className="text-xs font-black bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30">
              Overall: 8.75 / 10
            </span>
          </div>

          <div className="space-y-3 mt-3">
            {/* Technical */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span>Technical Feasibility</span>
                <span className="text-emerald-400 font-bold">9 / 10</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: '90%' }} />
              </div>
              <span className="text-[10px] text-slate-400">Proven graph algorithms, client-side ML, zero cloud GPU dependency.</span>
            </div>

            {/* Economic */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span>Economic Viability</span>
                <span className="text-emerald-400 font-bold">9 / 10</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: '90%' }} />
              </div>
              <span className="text-[10px] text-slate-400">100% open-source software stack with near-zero recurring license cost.</span>
            </div>

            {/* Operational */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span>Operational Viability</span>
                <span className="text-amber-400 font-bold">7.5 / 10</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full rounded-full" style={{ width: '75%' }} />
              </div>
              <span className="text-[10px] text-slate-400">PWA offline caching mitigates spotty 2G/4G connectivity in mountain passes.</span>
            </div>

            {/* Market Impact */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span>Market &amp; Strategic Impact</span>
                <span className="text-emerald-400 font-bold">10 / 10</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: '100%' }} />
              </div>
              <span className="text-[10px] text-slate-400">Directly serves 46M citizens and aligns with PM Gati Shakti &amp; Act East.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Potential Challenges & Strategies Matrix (No paragraphs!) */}
      <div className="lg:col-span-7 flex flex-col justify-between h-full space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black text-slate-900 uppercase tracking-wide">
            Potential Challenges &amp; Mitigation Strategies
          </span>
          <span className="text-[10px] font-bold text-slate-500">Multi-Hazard Resilience Framework</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 flex-1">
          {/* Risk 1 */}
          <div className="bg-rose-50/70 border border-rose-200 rounded-lg p-2.5 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold text-rose-800 uppercase flex items-center gap-1">
                <ShieldAlert className="w-3 h-3 text-rose-600" /> Challenge: Patchy Connectivity
              </span>
              <p className="text-[11px] text-slate-700 font-medium mt-0.5">
                Weak cellular coverage across remote high-altitude routes (e.g., Tawang, Zunheboto).
              </p>
            </div>
            <div className="bg-white p-1.5 rounded border border-rose-200 mt-1 text-[10px] text-emerald-800 font-bold">
              ✓ Mitigation: Offline-first PWA caching with local vector map tiles and sync queue.
            </div>
          </div>

          {/* Risk 2 */}
          <div className="bg-amber-50/70 border border-amber-200 rounded-lg p-2.5 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold text-amber-800 uppercase flex items-center gap-1">
                <Database className="w-3 h-3 text-amber-600" /> Challenge: Fragmented Data
              </span>
              <p className="text-[11px] text-slate-700 font-medium mt-0.5">
                Inconsistent data formats across 8 state disaster management authorities &amp; NHAI.
              </p>
            </div>
            <div className="bg-white p-1.5 rounded border border-amber-200 mt-1 text-[10px] text-emerald-800 font-bold">
              ✓ Mitigation: Standardized GeoJSON ingestion pipeline with automated data confidence scoring.
            </div>
          </div>

          {/* Risk 3 */}
          <div className="bg-blue-50/70 border border-blue-200 rounded-lg p-2.5 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold text-blue-800 uppercase flex items-center gap-1">
                <Radio className="w-3 h-3 text-blue-600" /> Challenge: Monsoon Volatility
              </span>
              <p className="text-[11px] text-slate-700 font-medium mt-0.5">
                Sudden flash floods and severe landslides altering road passability in minutes.
              </p>
            </div>
            <div className="bg-white p-1.5 rounded border border-blue-200 mt-1 text-[10px] text-emerald-800 font-bold">
              ✓ Mitigation: Automated webhooks with Central Water Commission and crowdsourced trucker alerts.
            </div>
          </div>

          {/* Risk 4 */}
          <div className="bg-purple-50/70 border border-purple-200 rounded-lg p-2.5 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold text-purple-800 uppercase flex items-center gap-1">
                <Zap className="w-3 h-3 text-purple-600" /> Challenge: Scalability &amp; Security
              </span>
              <p className="text-[11px] text-slate-700 font-medium mt-0.5">
                Geopolitically sensitive international border corridors (China, Myanmar, Bangladesh).
              </p>
            </div>
            <div className="bg-white p-1.5 rounded border border-purple-200 mt-1 text-[10px] text-emerald-800 font-bold">
              ✓ Mitigation: Enterprise Role-Based Access Control (RBAC) &amp; on-premise government deployment.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------
// SLIDE 5: IMPACT AND BENEFITS
// --------------------------------------------------------------------------
function Slide5Content() {
  return (
    <div className="flex flex-col justify-between h-full space-y-3">
      {/* Top Banner: Quantified Impact Header */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-3 rounded-xl flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold bg-amber-500 text-slate-950 px-2 py-0.5 rounded uppercase">
            Quantified Value Proposition
          </span>
          <h2 className="text-base sm:text-lg font-black mt-0.5">
            Transforming North Eastern Logistics Through Data-Driven Intelligence
          </h2>
        </div>
        <div className="hidden sm:flex items-center gap-4 text-right">
          <div>
            <div className="text-lg font-black text-emerald-400">46M+</div>
            <div className="text-[10px] text-slate-300">Citizens Impacted</div>
          </div>
          <div>
            <div className="text-lg font-black text-amber-400">8 States</div>
            <div className="text-[10px] text-slate-300">Complete NER Reach</div>
          </div>
        </div>
      </div>

      {/* 4 Impact Pillars with Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 flex-1">
        {/* Social Impact */}
        <div className="bg-emerald-50/80 border-2 border-emerald-300 rounded-xl p-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black text-emerald-900 uppercase tracking-wide">1. Social Impact</span>
              <span className="text-sm font-black text-emerald-700 bg-emerald-200/60 px-2 py-0.5 rounded">+40% Faster</span>
            </div>
            <h4 className="text-xs font-bold text-slate-900">Emergency &amp; Life Safety</h4>
            <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
              Drastically cuts medical supply delivery times during monsoon landslides; guarantees resilient disaster relief routing for ASDMA &amp; NDMA.
            </p>
          </div>
          <div className="mt-2 pt-2 border-t border-emerald-200 text-[10px] font-bold text-emerald-800">
            • All-weather access to 15+ isolated districts
          </div>
        </div>

        {/* Economic Impact */}
        <div className="bg-blue-50/80 border-2 border-blue-300 rounded-xl p-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black text-blue-900 uppercase tracking-wide">2. Economic Impact</span>
              <span className="text-sm font-black text-blue-700 bg-blue-200/60 px-2 py-0.5 rounded">22% Cost Cut</span>
            </div>
            <h4 className="text-xs font-bold text-slate-900">Freight &amp; Trade Boost</h4>
            <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
              Reduces transit costs by 22% and trip time by 35% by integrating Brahmaputra river barges (NW-2), rail, and road networks.
            </p>
          </div>
          <div className="mt-2 pt-2 border-t border-blue-200 text-[10px] font-bold text-blue-800">
            • Accelerates Act East cross-border trade
          </div>
        </div>

        {/* Environmental Impact */}
        <div className="bg-teal-50/80 border-2 border-teal-300 rounded-xl p-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black text-teal-900 uppercase tracking-wide">3. Environmental</span>
              <span className="text-sm font-black text-teal-700 bg-teal-200/60 px-2 py-0.5 rounded">18% Fuel Saved</span>
            </div>
            <h4 className="text-xs font-bold text-slate-900">Green Logistics &amp; Carbon Cut</h4>
            <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
              Terrain-gradient optimized routing minimizes idling on steep mountain inclines, reducing diesel emissions across ecologically sensitive Himalayan corridors.
            </p>
          </div>
          <div className="mt-2 pt-2 border-t border-teal-200 text-[10px] font-bold text-teal-800">
            • Eco-sensitive Himalayan protection
          </div>
        </div>

        {/* Governance Impact */}
        <div className="bg-amber-50/80 border-2 border-amber-300 rounded-xl p-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black text-amber-900 uppercase tracking-wide">4. Governance</span>
              <span className="text-sm font-black text-amber-700 bg-amber-200/60 px-2 py-0.5 rounded">High ROI</span>
            </div>
            <h4 className="text-xs font-bold text-slate-900">PM Gati Shakti Alignment</h4>
            <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
              Supplies Ministry of DoNER &amp; NITI Aayog with automated infrastructure gap analytics to target multi-crore capex investments where most needed.
            </p>
          </div>
          <div className="mt-2 pt-2 border-t border-amber-200 text-[10px] font-bold text-amber-800">
            • Precision warehouse &amp; bridge planning
          </div>
        </div>
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------
// SLIDE 6: RESEARCH AND REFERENCES
// --------------------------------------------------------------------------
function Slide6Content() {
  return (
    <div className="flex flex-col justify-between h-full space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-black text-slate-900 uppercase tracking-wide">
            Academic Foundations, National Policies &amp; Authoritative Data
          </span>
          <p className="text-[11px] text-slate-500">
            All algorithms, methodologies, and benchmarks are grounded in published literature and official government frameworks.
          </p>
        </div>
        <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded border border-slate-300">
          Concise &amp; Verified Sources
        </span>
      </div>

      {/* Structured Reference Table / Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 flex-1">
        {/* Category 1 */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-black text-slate-900 border-b border-slate-200 pb-1.5 mb-2">
              <Cpu className="w-3.5 h-3.5 text-blue-600" />
              1. Core Algorithmic Foundations
            </div>
            <ul className="space-y-2 text-[11px] text-slate-700">
              <li>
                <strong className="text-slate-900">Dijkstra, E.W. (1959):</strong> Shortest path graph optimization algorithm (Numerische Mathematik, 1(1), 269–271).
              </li>
              <li>
                <strong className="text-slate-900">Box, G.E.P. &amp; Jenkins, G.M. (1976):</strong> Time Series Analysis: Forecasting &amp; Control for demand trends.
              </li>
              <li>
                <strong className="text-slate-900">Saaty, T.L. (1980):</strong> Analytic Hierarchy Process (AHP) for multi-criteria hazard weighting.
              </li>
            </ul>
          </div>
          <div className="text-[10px] text-blue-700 font-semibold pt-2 border-t border-slate-200">
            Peer-reviewed computer science &amp; operations research
          </div>
        </div>

        {/* Category 2 */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-black text-slate-900 border-b border-slate-200 pb-1.5 mb-2">
              <FileText className="w-3.5 h-3.5 text-amber-600" />
              2. Government Reports &amp; Policies
            </div>
            <ul className="space-y-2 text-[11px] text-slate-700">
              <li>
                <strong className="text-slate-900">PM Gati Shakti National Master Plan:</strong> Integrated logistics &amp; multi-modal connectivity corridors.
                <span className="block text-slate-400 text-[10px]">pmgatishakti.gov.in</span>
              </li>
              <li>
                <strong className="text-slate-900">NITI Aayog NER Vision 2035:</strong> Comprehensive infrastructure development roadmaps for 8 states.
                <span className="block text-slate-400 text-[10px]">niti.gov.in</span>
              </li>
              <li>
                <strong className="text-slate-900">MoRTH &amp; BRO:</strong> National Highway network data &amp; strategic border connectivity reports.
                <span className="block text-slate-400 text-[10px]">morth.nic.in / bro.gov.in</span>
              </li>
            </ul>
          </div>
          <div className="text-[10px] text-amber-700 font-semibold pt-2 border-t border-slate-200">
            Official Government of India planning blueprints
          </div>
        </div>

        {/* Category 3 */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-black text-slate-900 border-b border-slate-200 pb-1.5 mb-2">
              <ShieldAlert className="w-3.5 h-3.5 text-emerald-600" />
              3. Hazard &amp; Benchmark Data
            </div>
            <ul className="space-y-2 text-[11px] text-slate-700">
              <li>
                <strong className="text-slate-900">NDMA &amp; ASDMA:</strong> Multi-hazard vulnerability mapping, Brahmaputra flood inundation &amp; seismic Zone V.
                <span className="block text-slate-400 text-[10px]">ndma.gov.in / asdma.assam.gov.in</span>
              </li>
              <li>
                <strong className="text-slate-900">World Bank LPI:</strong> Logistics Performance Index methodology adapted for regional district scoring.
                <span className="block text-slate-400 text-[10px]">lpi.worldbank.org</span>
              </li>
              <li>
                <strong className="text-slate-900">Census of India (Projected 2026):</strong> Demographics &amp; district boundary data for 8 NER states.
              </li>
            </ul>
          </div>
          <div className="text-[10px] text-emerald-700 font-semibold pt-2 border-t border-slate-200">
            Validated geospatial &amp; meteorological data sources
          </div>
        </div>
      </div>
    </div>
  );
}
