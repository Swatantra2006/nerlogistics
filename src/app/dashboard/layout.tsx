'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, Activity, Bot, Route, LayoutDashboard, AlertTriangle, Layers } from 'lucide-react';
import Sidebar from '@/components/layout/Sidebar';
import Logo from '@/components/ui/Logo';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const mobileTabs = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/route-optimizer', label: 'Routes', icon: Route },
    { href: '/dashboard/risk', label: 'Hazards', icon: AlertTriangle },
    { href: '/dashboard/copilot', label: 'Copilot', icon: Bot },
  ];

  return (
    <div className="min-h-screen bg-surface-950 text-surface-100 flex flex-col">
      {/* Mobile Top App Bar */}
      <header className="md:hidden sticky top-0 z-30 flex items-center justify-between px-4 h-14 bg-surface-950/90 backdrop-blur-md border-b border-primary-500/15">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 rounded-lg text-surface-300 hover:text-white hover:bg-surface-800 transition"
            aria-label="Open Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <Link href="/dashboard" className="flex items-center gap-2">
            <Logo className="w-7 h-7" />
            <span className="text-xs font-bold text-white tracking-wide">NER LOGISTICS</span>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/copilot"
            className="p-1.5 rounded-lg bg-primary-500/10 text-primary-400 border border-primary-500/20 text-xs flex items-center gap-1"
            title="AI Copilot"
          >
            <Bot className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-semibold text-emerald-400">LIVE</span>
          </div>
        </div>
      </header>

      {/* Responsive Sidebar Drawer */}
      <Sidebar
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <main className="md:ml-[260px] flex-1 transition-all duration-300 pb-20 md:pb-6">
        <div className="p-3 sm:p-5 md:p-6 max-w-full overflow-x-hidden">
          {children}
        </div>
      </main>

      {/* Smartphone Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface-950/95 backdrop-blur-lg border-t border-surface-800 px-3 py-1.5 flex items-center justify-around shadow-2xl">
        {mobileTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center py-1 px-3 rounded-lg text-[10px] font-medium transition-colors ${
                isActive ? 'text-primary-400 font-bold' : 'text-surface-400 hover:text-surface-200'
              }`}
            >
              <Icon className={`w-4 h-4 mb-0.5 ${isActive ? 'text-primary-400' : 'text-surface-400'}`} />
              <span>{tab.label}</span>
            </Link>
          );
        })}
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="flex flex-col items-center py-1 px-3 rounded-lg text-[10px] font-medium text-surface-400 hover:text-surface-200"
          aria-label="More options"
        >
          <Menu className="w-4 h-4 mb-0.5 text-surface-400" />
          <span>More</span>
        </button>
      </nav>
    </div>
  );
}
