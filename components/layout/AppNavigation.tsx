'use client';

import React from 'react';
import {
  LayoutDashboard,
  Package,
  FileText,
  BarChart3,
  Settings,
  Plus,
  Building2,
  ShieldCheck,
} from 'lucide-react';
import { CompanyProfile } from '@/types/business';

export type NavTab = 'dashboard' | 'inventory' | 'invoicing' | 'reports' | 'settings';

interface AppNavigationProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  profile: CompanyProfile;
  lowStockCount: number;
  pendingInvoicesCount: number;
  onOpenNewInvoice: () => void;
  children: React.ReactNode;
}

export function AppNavigation({
  activeTab,
  onSelectTab,
  profile,
  lowStockCount,
  pendingInvoicesCount,
  onOpenNewInvoice,
  children,
}: AppNavigationProps) {
  const navItems = [
    {
      id: 'dashboard' as NavTab,
      label: 'Panel General',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'inventory' as NavTab,
      label: 'Control de Inventario',
      icon: Package,
      badge: lowStockCount > 0 ? `${lowStockCount} bajo mín.` : null,
      badgeColor: 'text-amber-800 font-semibold',
    },
    {
      id: 'invoicing' as NavTab,
      label: 'Facturación Electrónica',
      icon: FileText,
      badge: pendingInvoicesCount > 0 ? `${pendingInvoicesCount} por cobrar` : null,
      badgeColor: 'text-slate-500',
    },
    {
      id: 'reports' as NavTab,
      label: 'Reportes Financieros',
      icon: BarChart3,
      badge: null,
    },
    {
      id: 'settings' as NavTab,
      label: 'Configuración Negocio',
      icon: Settings,
      badge: null,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-slate-800">
      {/* DESKTOP SIDEBAR (Hidden on mobile) */}
      <aside className="no-print hidden md:flex flex-col w-64 bg-white border-r border-slate-200 shrink-0 sticky top-0 h-screen select-none">
        {/* Brand Zone: 1-line clean wordmark */}
        <div className="p-5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-sm tracking-tighter">
              GP
            </div>
            <div className="min-w-0">
              <span className="text-base font-bold tracking-tight text-slate-900 block truncate">
                GestiónPro
              </span>
              <span className="text-[11px] text-slate-400 block truncate">
                {profile.commercialName}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Action Button */}
        <div className="p-4 border-b border-slate-100">
          <button
            type="button"
            onClick={onOpenNewInvoice}
            className="w-full py-2.5 px-3 bg-slate-900 text-white rounded-lg font-medium text-xs flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>Emitir Factura</span>
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-slate-100 text-slate-900 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-slate-900' : 'text-slate-400'}`} />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`text-[10px] tabular-nums ${item.badgeColor || 'text-slate-500'}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Emisor / Tax Authority Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 text-[11px] text-slate-500">
          <div className="flex items-center gap-1 text-slate-800 font-medium truncate">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="truncate">{profile.taxAuthorityName}</span>
          </div>
          <div className="truncate text-slate-400 mt-0.5">
            Folio actual: {profile.invoicePrefix}-{profile.nextFolio}
          </div>
        </div>
      </aside>

      {/* MOBILE TOP BAR (Fixed on mobile screens) */}
      <header className="no-print md:hidden sticky top-0 z-30 flex items-center justify-between px-4 h-14 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
            GP
          </div>
          <span className="font-bold text-sm tracking-tight text-slate-900">
            {navItems.find((n) => n.id === activeTab)?.label || 'GestiónPro'}
          </span>
        </div>

        <button
          type="button"
          onClick={onOpenNewInvoice}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 text-xs font-medium text-white bg-slate-900 rounded-lg active:bg-slate-800"
          aria-label="Nueva Factura Electrónica"
        >
          <Plus className="w-4 h-4 text-emerald-400" />
        </button>
      </header>

      {/* MAIN VIEWPORT CANVAS */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 pb-24 md:pb-8 max-w-7xl mx-auto w-full">
        {children}
      </main>

      {/* MOBILE BOTTOM TAB BAR (Thumb Reach Optimized, >=44px hitboxes) */}
      <nav className="no-print md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200">
        <div className="grid grid-cols-5 h-16 items-center px-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className="min-h-[44px] flex flex-col items-center justify-center py-1 transition-colors relative"
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-slate-900 stroke-[2.5]' : 'text-slate-400'}`} />
                <span
                  className={`text-[10px] tracking-tight mt-1 truncate ${
                    isActive ? 'font-bold text-slate-900' : 'text-slate-500'
                  }`}
                >
                  {item.id === 'dashboard'
                    ? 'Inicio'
                    : item.id === 'inventory'
                    ? 'Inventario'
                    : item.id === 'invoicing'
                    ? 'Facturas'
                    : item.id === 'reports'
                    ? 'Reportes'
                    : 'Ajustes'}
                </span>
                {item.id === 'inventory' && lowStockCount > 0 && (
                  <span className="absolute top-1 right-3 w-2 h-2 rounded-full bg-amber-500" />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
