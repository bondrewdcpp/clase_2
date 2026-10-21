'use client';

import React from 'react';
import { Invoice, Product, Expense, CompanyProfile, StockMovement } from '@/types/business';
import { StorageService } from '@/lib/storage';
import {
  TrendingUp,
  Package,
  FileText,
  DollarSign,
  AlertTriangle,
  Plus,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  Clock,
  ArrowUpRight,
  Eye,
  RefreshCw,
} from 'lucide-react';

interface ExecutiveDashboardProps {
  invoices: Invoice[];
  products: Product[];
  expenses: Expense[];
  profile: CompanyProfile;
  onNavigate: (tab: 'dashboard' | 'inventory' | 'invoicing' | 'reports' | 'settings') => void;
  onOpenNewInvoice: () => void;
  onViewInvoice: (invoice: Invoice) => void;
  onRefresh: () => void;
}

export function ExecutiveDashboard({
  invoices,
  products,
  expenses,
  profile,
  onNavigate,
  onOpenNewInvoice,
  onViewInvoice,
  onRefresh,
}: ExecutiveDashboardProps) {
  // Aggregate calculations
  const validInvoices = invoices.filter((i) => i.status !== 'cancelled');
  const totalSales = validInvoices.reduce((acc, i) => acc + i.subtotal, 0);

  // COGS calculation
  let cogs = 0;
  validInvoices.forEach((inv) => {
    inv.items.forEach((item) => {
      cogs += (item.unitCost || 0) * item.quantity;
    });
  });

  const grossProfit = totalSales - cogs;
  const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);
  const netProfit = grossProfit - totalExpenses;
  const netMargin = totalSales > 0 ? Math.round((netProfit / totalSales) * 100) : 0;

  // Inventory value & alerts
  const totalInventoryCost = products.reduce((acc, p) => (p.unit !== 'Servicio' ? acc + p.purchaseCost * p.currentStock : acc), 0);
  const lowStockProducts = products.filter((p) => p.unit !== 'Servicio' && p.currentStock <= p.minStockAlert);

  // Accounts receivable
  const pendingInvoices = invoices.filter((i) => i.status === 'certified' || i.status === 'sent');
  const totalReceivables = pendingInvoices.reduce((acc, i) => acc + i.total, 0);

  // Recent invoices (last 5)
  const recentInvoices = invoices.slice(0, 5);

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const handleQuickRestock = (product: Product) => {
    StorageService.adjustStock({
      productId: product.id,
      type: 'in',
      quantity: 10,
      reason: 'Reabastecimiento rápido desde el panel principal',
      userName: 'Gerente General',
    });
    onRefresh();
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              {profile.commercialName}
            </h1>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Certificado Fiscal Activo
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {profile.taxRegime} · Identificación: {profile.taxId}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenNewInvoice}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>Nueva Factura Electrónica</span>
          </button>
        </div>
      </div>

      {/* 4 Main Executive KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* KPI 1: Total Sales */}
        <div
          onClick={() => onNavigate('invoicing')}
          className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs hover:border-slate-300 transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Facturación Total</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-900 transition-colors" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1">
            {formatCurrency(totalSales)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {validInvoices.length} facturas emitidas este periodo
          </div>
        </div>

        {/* KPI 2: Net Profit & Margin */}
        <div
          onClick={() => onNavigate('reports')}
          className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs hover:border-slate-300 transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Utilidad Neta Real</span>
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-emerald-800 mt-1">
            {formatCurrency(netProfit)}
          </div>
          <div className="text-[11px] text-emerald-700 font-medium mt-1">
            Margen Neto Operativo: {netMargin}%
          </div>
        </div>

        {/* KPI 3: Inventory Valuation */}
        <div
          onClick={() => onNavigate('inventory')}
          className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs hover:border-slate-300 transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Valor de Inventario</span>
            <Package className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-900 transition-colors" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1">
            {formatCurrency(totalInventoryCost)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {products.length} productos en {products.filter((p) => p.unit !== 'Servicio').length} categorías
          </div>
        </div>

        {/* KPI 4: Accounts Receivable */}
        <div
          onClick={() => onNavigate('invoicing')}
          className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs hover:border-slate-300 transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Por Cobrar (Cartera)</span>
            <Clock className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-amber-800 mt-1">
            {formatCurrency(totalReceivables)}
          </div>
          <div className="text-[11px] text-amber-700 font-medium mt-1">
            {pendingInvoices.length} facturas pendientes de cobro
          </div>
        </div>
      </div>

      {/* Critical Stock Alert Banner if any items low */}
      {lowStockProducts.length > 0 && (
        <div className="p-4 bg-amber-50/90 border border-amber-200 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
              <h2 className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                Alerta de Reabastecimiento: {lowStockProducts.length} productos bajo el stock mínimo
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('inventory')}
              className="text-xs font-semibold text-amber-900 hover:underline flex items-center gap-1"
            >
              <span>Ver en Inventario</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-1">
            {lowStockProducts.slice(0, 3).map((prod) => (
              <div
                key={prod.id}
                className="p-2.5 bg-white rounded-lg border border-amber-200 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-semibold text-slate-900 truncate max-w-[170px]">{prod.name}</div>
                  <div className="text-[11px] text-amber-700 font-mono">
                    Stock actual: <strong>{prod.currentStock}</strong> / Mínimo: {prod.minStockAlert}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleQuickRestock(prod)}
                  className="px-2.5 py-1 text-[11px] font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors whitespace-nowrap"
                >
                  +10 Unidades
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Financial Performance Chart (6-Month Sales vs Costs) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Evolución Mensual: Ingresos vs Egresos Operativos
            </h2>
            <p className="text-[11px] text-slate-400">Tendencia semestral del flujo de operaciones del negocio</p>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium">
            <span className="flex items-center gap-1.5 text-slate-700">
              <span className="w-2.5 h-2.5 rounded-xs bg-slate-900 inline-block" />
              Facturación
            </span>
            <span className="flex items-center gap-1.5 text-slate-500">
              <span className="w-2.5 h-2.5 rounded-xs bg-rose-400 inline-block" />
              Costos & Gastos
            </span>
          </div>
        </div>

        {/* Responsive Pure SVG Bar Chart */}
        <div className="h-56 w-full pt-4">
          <svg className="w-full h-full" viewBox="0 0 600 200" preserveAspectRatio="none">
            {/* Horizontal guide lines */}
            <line x1="40" y1="20" x2="580" y2="20" stroke="#f1f5f9" strokeWidth="1" />
            <line x1="40" y1="70" x2="580" y2="70" stroke="#f1f5f9" strokeWidth="1" />
            <line x1="40" y1="120" x2="580" y2="120" stroke="#f1f5f9" strokeWidth="1" />
            <line x1="40" y1="170" x2="580" y2="170" stroke="#e2e8f0" strokeWidth="1" />

            {/* Y-Axis Labels */}
            <text x="35" y="24" textAnchor="end" fontSize="10" fill="#94a3b8" fontFamily="monospace">$8k</text>
            <text x="35" y="74" textAnchor="end" fontSize="10" fill="#94a3b8" fontFamily="monospace">$5k</text>
            <text x="35" y="124" textAnchor="end" fontSize="10" fill="#94a3b8" fontFamily="monospace">$2k</text>
            <text x="35" y="174" textAnchor="end" fontSize="10" fill="#94a3b8" fontFamily="monospace">$0</text>

            {/* Monthly grouped bars (May, Jun, Jul, Aug, Sep, Oct) */}
            {[
              { month: 'Mayo', sales: 4200, costs: 2400, x: 70 },
              { month: 'Junio', sales: 4900, costs: 2800, x: 160 },
              { month: 'Julio', sales: 5600, costs: 3100, x: 250 },
              { month: 'Agosto', sales: 6100, costs: 3400, x: 340 },
              { month: 'Septiembre', sales: 6800, costs: 3600, x: 430 },
              { month: 'Octubre (Act.)', sales: 7950, costs: 4100, x: 520 },
            ].map((d, idx) => {
              const maxVal = 8000;
              const salesHeight = (d.sales / maxVal) * 150;
              const costsHeight = (d.costs / maxVal) * 150;

              return (
                <g key={idx}>
                  {/* Sales bar */}
                  <rect
                    x={d.x - 18}
                    y={170 - salesHeight}
                    width="16"
                    height={salesHeight}
                    rx="3"
                    fill="#0f172a"
                    className="hover:fill-slate-800 transition-colors"
                  >
                    <title>{`${d.month}: Facturación $${d.sales}`}</title>
                  </rect>

                  {/* Costs bar */}
                  <rect
                    x={d.x + 2}
                    y={170 - costsHeight}
                    width="16"
                    height={costsHeight}
                    rx="3"
                    fill="#fb7185"
                    className="hover:fill-rose-500 transition-colors"
                  >
                    <title>{`${d.month}: Costos $${d.costs}`}</title>
                  </rect>

                  {/* X-Axis month label */}
                  <text
                    x={d.x}
                    y="190"
                    textAnchor="middle"
                    fontSize="10"
                    fill="#64748b"
                    fontWeight={idx === 5 ? 'bold' : 'normal'}
                  >
                    {d.month}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* 2-Column: Recent Invoices & Quick Inventory Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Invoices (2 Columns) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
            <div>
              <h2 className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
                Facturas Electrónicas Recientes
              </h2>
              <p className="text-[11px] text-slate-400">Últimos comprobantes emitidos con timbrado fiscal</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('invoicing')}
              className="text-xs font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-1"
            >
              <span>Ver Todas</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px] bg-slate-50/75">
                  <th className="py-2.5 px-4">Folio</th>
                  <th className="py-2.5 px-3">Cliente</th>
                  <th className="py-2.5 px-3">Emisión</th>
                  <th className="py-2.5 px-3 text-right">Total</th>
                  <th className="py-2.5 px-3">Estado</th>
                  <th className="py-2.5 px-4 text-right">Comprobante</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {recentInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{inv.invoiceNumber}</td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-900 max-w-[160px] truncate">{inv.customer.legalName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{inv.customer.taxId}</div>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-500">{inv.issueDate}</td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums font-semibold text-slate-900">
                      ${inv.total.toFixed(2)}
                    </td>
                    <td className="py-3 px-3">
                      {inv.status === 'paid' ? (
                        <span className="text-[11px] font-semibold text-emerald-700">Pagada</span>
                      ) : inv.status === 'certified' ? (
                        <span className="text-[11px] font-semibold text-amber-700">Pendiente</span>
                      ) : inv.status === 'cancelled' ? (
                        <span className="text-[11px] text-rose-700">Anulada</span>
                      ) : (
                        <span className="text-[11px] text-slate-500">Borrador</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => onViewInvoice(inv)}
                        className="px-2 py-1 text-[11px] font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors inline-flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Ver</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Inventory Summary (1 Column) */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <div>
              <h2 className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
                Resumen de Almacén
              </h2>
              <p className="text-[11px] text-slate-400">Estado de existencias críticas</p>
            </div>
            <Package className="w-4 h-4 text-slate-400" />
          </div>

          <div className="space-y-3">
            {products.slice(0, 5).map((p) => {
              const isLow = p.unit !== 'Servicio' && p.currentStock <= p.minStockAlert;
              return (
                <div key={p.id} className="flex items-center justify-between text-xs">
                  <div className="min-w-0 flex-1 pr-2">
                    <div className="font-medium text-slate-900 truncate">{p.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">SKU: {p.sku}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`font-mono font-bold ${isLow ? 'text-amber-800' : 'text-slate-900'}`}>
                      {p.unit === 'Servicio' ? 'Servicio' : `${p.currentStock} ${p.unit}s`}
                    </span>
                    {isLow && <div className="text-[10px] text-amber-700 font-medium">Bajo Mínimo</div>}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => onNavigate('inventory')}
              className="w-full py-2 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors text-center"
            >
              Ver Catálogo Completo ({products.length} productos)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
