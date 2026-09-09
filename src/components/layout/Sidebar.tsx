'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Accessibility,
  Route,
  TrendingUp,
  AlertTriangle,
  Warehouse,
  Building2,
  FlaskConical,
  BarChart3,
  Bot,
  ChevronLeft,
  ChevronRight,
  Zap,
  X,
} from 'lucide-react';
import { useState, useEffect } from 'react';

import Logo from '@/components/ui/Logo';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/accessibility', label: 'Accessibility', icon: Accessibility },
  { href: '/dashboard/route-optimizer', label: 'Route Optimizer', icon: Route },
  { href: '/dashboard/demand', label: 'Demand Forecast', icon: TrendingUp },
  { href: '/dashboard/risk', label: 'Risk Intelligence', icon: AlertTriangle },
  { href: '/dashboard/hubs', label: 'Logistics Hubs', icon: Warehouse },
  { href: '/dashboard/infrastructure', label: 'Infrastructure Gaps', icon: Building2 },
  { href: '/dashboard/simulator', label: 'Scenario Simulator', icon: FlaskConical },
  { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/dashboard/copilot', label: 'NER AI Copilot', icon: Bot },
];

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export default function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  // Close mobile drawer on route change
  useEffect(() => {
    if (onMobileClose) {
      onMobileClose();
    }
  }, [pathname]);

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={onMobileClose}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 md:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Drawer */}
      <aside
        className={`sidebar fixed left-0 top-0 h-full z-50 md:z-30 flex flex-col transition-all duration-300 ${
          collapsed ? 'md:w-[68px]' : 'md:w-[260px]'
        } w-[280px] ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Logo & Close for Mobile */}
        <div className="p-4 border-b border-primary-500/10 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 text-decoration-none">
            <Logo className="w-9 h-9" />
            {(!collapsed || mobileOpen) && (
              <div className="overflow-hidden">
                <h1 className="text-sm font-bold text-white leading-tight">NER LOGISTICS</h1>
                <p className="text-[10px] text-primary-300 font-medium tracking-wider">INTELLIGENCE</p>
              </div>
            )}
          </Link>

          {/* Close button for mobile */}
          <button
            onClick={onMobileClose}
            className="md:hidden p-1.5 rounded-lg text-surface-400 hover:text-white hover:bg-surface-800 transition"
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {(!collapsed || mobileOpen) && (
            <p className="px-3 py-2 text-[10px] font-semibold text-surface-500 uppercase tracking-widest">
              Main Modules
            </p>
          )}
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`sidebar-link ${isActive ? 'active' : ''} ${
                  collapsed && !mobileOpen ? 'justify-center px-2' : ''
                }`}
                title={collapsed && !mobileOpen ? item.label : undefined}
              >
                <Icon
                  className={`w-[18px] h-[18px] flex-shrink-0 ${
                    isActive ? 'text-primary-400' : 'text-surface-400'
                  }`}
                />
                {(!collapsed || mobileOpen) && <span className="text-sm font-medium">{item.label}</span>}
                {isActive && (!collapsed || mobileOpen) && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-400" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Status & Desktop Collapse Toggle */}
        <div className="p-3 border-t border-primary-500/10">
          {(!collapsed || mobileOpen) && (
            <div className="mb-3 px-3 py-2 rounded-lg bg-gradient-to-r from-primary-500/10 to-accent-500/10 border border-primary-500/15">
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-3.5 h-3.5 text-accent-400" />
                <span className="text-[11px] font-semibold text-accent-400">AI POWERED</span>
              </div>
              <p className="text-[10px] text-surface-400 leading-relaxed">
                5 ML engines active. All computations are real-time.
              </p>
            </div>
          )}

          {/* Desktop collapse button */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:flex w-full items-center justify-center gap-2 py-2 rounded-lg text-surface-400 hover:text-white hover:bg-primary-500/10 transition-all text-xs"
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <>
                <ChevronLeft className="w-4 h-4" />
                <span>Collapse</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
