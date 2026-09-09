'use client';

import Link from 'next/link';
import {
  Map, Route, TrendingUp, AlertTriangle, Brain,
  ArrowRight, Shield, Zap, Target, Layers, ChevronRight,
  Building2, Gauge
} from 'lucide-react';

import Logo from '@/components/ui/Logo';

import HeroSlideshow from '@/components/ui/HeroSlideshow';

const stats = [
  { value: '8', label: 'NE States Covered' },
  { value: '40+', label: 'Districts Analyzed' },
  { value: '5', label: 'AI/ML Engines' },
  { value: '10+', label: 'Logistics Hubs' },
];

const features = [
  { icon: Map, title: 'Interactive Regional Map', desc: 'Easily view logistics hubs, road networks, and risk zones across all 8 North Eastern states in real-time.' },
  { icon: Route, title: 'Smart Route Optimizer', desc: 'Find the fastest, safest, and most cost-effective routes for your cargo deliveries automatically.' },
  { icon: TrendingUp, title: 'Demand Forecasting', desc: 'Predict future logistics demand based on past trends, seasonal changes, and local events to plan ahead.' },
  { icon: AlertTriangle, title: 'Risk Intelligence', desc: 'Receive early warnings about floods, landslides, and road closures to prevent delivery delays.' },
  { icon: Brain, title: 'Smart Decision Assistant', desc: 'Ask questions about your supply chain and get actionable, data-driven answers instantly.' },
  { icon: Building2, title: 'Infrastructure Gap Analysis', desc: 'Identify areas that urgently need new warehouses, better roads, or improved logistics support.' },
];

const howItWorks = [
  { step: '01', title: 'Data Collection', desc: 'We gather geographic, weather, demand, and transport data from across the region.' },
  { step: '02', title: 'Smart Analysis', desc: 'Our system analyzes the data to understand risks, predict demand, and calculate the best routes.' },
  { step: '03', title: 'Clear Insights', desc: 'Complex data is turned into easy-to-understand visual maps and clear recommendations.' },
  { step: '04', title: 'Better Decisions', desc: 'Use our smart simulator to test "what-if" scenarios and plan your logistics with confidence.' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-surface-950">
      {/* Top Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-surface-950/80 backdrop-blur-xl border-b border-primary-500/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <Logo />
            <div>
              <span className="text-xs sm:text-sm font-bold text-white">NER LOGISTICS</span>
              <span className="text-[9px] sm:text-[10px] text-primary-300 ml-1.5 font-medium">INTELLIGENCE</span>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/dashboard" className="btn-secondary text-xs px-2.5 sm:px-4 py-1.5">
              Dashboard
            </Link>
            <Link href="/dashboard/route-optimizer" className="btn-primary text-xs px-2.5 sm:px-4 py-1.5">
              Route Analysis <ArrowRight className="w-3.5 h-3.5 hidden sm:inline" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6 relative overflow-hidden min-h-[90vh] flex items-center">
        <HeroSlideshow />
        
        {/* Decorative elements */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary-500/10 rounded-full blur-3xl z-10" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl z-10" />
        
        <div className="max-w-7xl mx-auto relative">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-500/10 border border-primary-500/20 mb-6">
              <Zap className="w-3.5 h-3.5 text-primary-400" />
              <span className="text-xs font-semibold text-primary-300">AI-Based Logistics & Accessibility Intelligence Platform</span>
            </div>
            
            <h1 className="text-5xl font-black leading-[1.1] mb-6">
              <span className="text-white">AI-Powered Logistics Intelligence for the </span>
              <span className="gradient-text">North Eastern Region</span>
            </h1>
            
            <p className="text-lg text-surface-400 leading-relaxed mb-8 max-w-2xl">
              Connecting people, predicting demand, optimizing routes, and building a more resilient NER logistics network. 
              Transform geographic and infrastructure data into <strong className="text-surface-200">actionable logistics decisions</strong>.
            </p>
            
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="btn-primary text-base px-6 py-3">
                Explore NER Intelligence <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/dashboard/route-optimizer" className="btn-secondary text-base px-6 py-3">
                Run Route Analysis <Route className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-4 gap-4">
            {stats.map((stat) => (
              <div key={stat.label} className="glass-card p-5 text-center">
                <div className="text-3xl font-black gradient-text mb-1">{stat.value}</div>
                <div className="text-xs text-surface-400 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Key Differentiator */}
      <section className="py-16 px-6 border-b border-primary-500/5 relative" style={{ backgroundImage: `linear-gradient(to right, rgba(10, 14, 26, 0.95) 30%, rgba(10, 14, 26, 0.7)), url('https://images.unsplash.com/photo-1583279116348-183d2c884be5?auto=format&fit=crop&w=2000&q=80')`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }}>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="glass-card p-8 relative overflow-hidden max-w-3xl">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-500 via-accent-500 to-primary-500" />
            <div className="flex items-start gap-6">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary-500/20 to-accent-500/20 flex items-center justify-center flex-shrink-0 border border-primary-500/20">
                <Target className="w-7 h-7 text-primary-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white mb-2">Why Our Platform is Different</h2>
                <p className="text-surface-300 leading-relaxed">
                  Instead of just showing raw data on a screen, our platform <strong className="text-white">actively helps you make decisions</strong>. 
                  It connects the dots between weather risks, road conditions, and supply demand to give you clear, actionable advice on where and how to move your goods across the North East.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 relative" style={{ backgroundImage: `linear-gradient(to bottom, rgba(10, 14, 26, 1), rgba(10, 14, 26, 0.85) 50%, rgba(10, 14, 26, 1)), url('https://images.unsplash.com/photo-1605649487212-6dcd29598811?auto=format&fit=crop&w=2000&q=80')`, backgroundSize: 'cover', backgroundPosition: 'center top', backgroundAttachment: 'fixed' }}>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold text-primary-400 uppercase tracking-widest mb-3">Platform Capabilities</p>
            <h2 className="text-3xl font-bold text-white mb-3">Comprehensive Logistics Intelligence</h2>
            <p className="text-surface-400 max-w-xl mx-auto">
              Six integrated intelligence modules working together to provide end-to-end logistics decision support.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="glass-card p-6 group cursor-pointer">
                  <div className="w-11 h-11 rounded-lg bg-primary-500/10 flex items-center justify-center mb-4 group-hover:bg-primary-500/20 transition-colors border border-primary-500/10">
                    <Icon className="w-5 h-5 text-primary-400" />
                  </div>
                  <h3 className="text-base font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-sm text-surface-400 leading-relaxed">{feature.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-6 border-t border-primary-500/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold text-accent-400 uppercase tracking-widest mb-3">Architecture</p>
            <h2 className="text-3xl font-bold text-white mb-3">How It Works</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {howItWorks.map((item, i) => (
              <div key={item.step} className="relative">
                <div className="glass-card p-6 h-full">
                  <div className="text-3xl font-black text-primary-500/20 mb-3">{item.step}</div>
                  <h3 className="text-base font-semibold text-white mb-2">{item.title}</h3>
                  <p className="text-sm text-surface-400 leading-relaxed">{item.desc}</p>
                </div>
                {i < 3 && (
                  <div className="hidden md:flex absolute top-1/2 -right-3 z-10">
                    <ChevronRight className="w-5 h-5 text-primary-500/30" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Section */}
      <section className="py-20 px-6 border-t border-primary-500/5">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-xs font-semibold text-accent-400 uppercase tracking-widest mb-3">Smart Intelligence</p>
              <h2 className="text-3xl font-bold text-white mb-4">A Truly Helpful Assistant</h2>
              <p className="text-surface-400 leading-relaxed mb-6">
                Our smart assistant does more than just answer questions. It analyzes the entire supply chain to provide specific, helpful recommendations that you can trust.
              </p>
              <div className="space-y-3">
                {[
                  { icon: Gauge, label: 'Accessibility Scoring', desc: 'Rates how easy it is to reach an area' },
                  { icon: Route, label: 'Route Optimization', desc: 'Finds the safest and fastest paths' },
                  { icon: TrendingUp, label: 'Demand Forecasting', desc: 'Predicts supply needs for the coming months' },
                  { icon: Shield, label: 'Risk Assessment', desc: 'Evaluates weather and infrastructure hazards' },
                  { icon: Layers, label: 'Infrastructure Gap', desc: 'Highlights missing supply chain links' },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-3 p-3 rounded-lg bg-surface-900/50 border border-primary-500/5">
                    <item.icon className="w-4 h-4 text-primary-400 flex-shrink-0" />
                    <div>
                      <span className="text-sm font-medium text-white">{item.label}</span>
                      <span className="text-xs text-surface-500 ml-2">— {item.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="glass-card p-6">
              <div className="flex items-center gap-2 mb-4">
                <Brain className="w-4 h-4 text-accent-400" />
                <span className="text-sm font-semibold text-accent-400">AI Copilot Response</span>
              </div>
              <div className="bg-surface-950/60 rounded-lg p-4 text-sm leading-relaxed text-surface-300">
                <p className="mb-3">Based on the current logistics intelligence:</p>
                <p className="mb-3"><strong className="text-white">Tawang</strong> has a low accessibility score of <strong className="text-rose-400">22/100</strong>.</p>
                <p className="mb-2 text-surface-400">Primary factors:</p>
                <ul className="list-disc ml-4 space-y-1 text-surface-400 mb-3">
                  <li>Road connectivity: 28/100</li>
                  <li>Zero rail connectivity</li>
                  <li>520 km from nearest logistics hub</li>
                  <li>High terrain-related risk (82/100)</li>
                </ul>
                <p className="text-primary-300 italic">💡 Recommendation: Prioritize alternate supply corridors and establish a regional logistics staging point.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 border-t border-primary-500/5 relative" style={{ backgroundImage: `linear-gradient(to top, rgba(10, 14, 26, 1), rgba(10, 14, 26, 0.8)), url('https://images.unsplash.com/photo-1576483569733-14ee7111cbb0?auto=format&fit=crop&w=2000&q=80')`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }}>
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Explore the Platform?</h2>
          <p className="text-surface-300 mb-8 font-medium">
            Access the complete logistics intelligence platform — interactive maps, smart analytics, route optimization, and more.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/dashboard" className="btn-primary text-base px-8 py-3.5">
              Launch Dashboard <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 bg-surface-950 border-t border-primary-500/10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo className="w-7 h-7" />
            <span className="text-xs text-surface-500">NER Logistics Intelligence Platform</span>
          </div>
          <div className="text-xs text-surface-600">
            Smart Solutions for the North Eastern Region
          </div>
        </div>
      </footer>
    </div>
  );
}
