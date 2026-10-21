'use client';

import React, { useState } from 'react';
import { Invoice, Expense, Product, CompanyProfile } from '@/types/business';
import { StorageService } from '@/lib/storage';
import {
  TrendingUp,
  DollarSign,
  PieChart,
  Calendar,
  Download,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  FileSpreadsheet,
  AlertCircle,
  X,
  CreditCard,
  Printer,
  ChevronRight,
  Clock,
} from 'lucide-react';

interface FinancialReportsProps {
  invoices: Invoice[];
  expenses: Expense[];
  products: Product[];
  profile: CompanyProfile;
  onRefresh: () => void;
  onMarkPaid: (invoiceId: string) => void;
}

export function FinancialReports({
  invoices,
  expenses,
  products,
  profile,
  onRefresh,
  onMarkPaid,
}: FinancialReportsProps) {
  const [period, setPeriod] = useState<'month' | 'quarter' | 'year' | 'all'>('month');
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

  // New expense form state
  const [expCategory, setExpCategory] = useState<Expense['category']>('Alquiler');
  const [expDescription, setExpDescription] = useState('');
  const [expAmount, setExpAmount] = useState<number>(100);
  const [expSupplier, setExpSupplier] = useState('');
  const [expMethod, setExpMethod] = useState<Expense['paymentMethod']>('transfer');

  // Filter items by selected period
  const filterByDate = (dateStr: string) => {
    if (period === 'all') return true;
    const itemDate = new Date(dateStr);
    const now = new Date();
    if (period === 'month') {
      return itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear();
    }
    if (period === 'quarter') {
      const diffMonths = (now.getFullYear() - itemDate.getFullYear()) * 12 + (now.getMonth() - itemDate.getMonth());
      return diffMonths >= 0 && diffMonths <= 3;
    }
    if (period === 'year') {
      return itemDate.getFullYear() === now.getFullYear();
    }
    return true;
  };

  const periodInvoices = invoices.filter((i) => i.status !== 'cancelled' && filterByDate(i.issueDate));
  const periodExpenses = expenses.filter((e) => filterByDate(e.date));

  // 1. P&L Calculations
  const grossSales = periodInvoices.reduce((acc, i) => acc + (i.subtotal + i.totalDiscount), 0);
  const totalDiscounts = periodInvoices.reduce((acc, i) => acc + i.totalDiscount, 0);
  const netSales = grossSales - totalDiscounts; // Base imponible neta

  // Cost of Goods Sold (COGS) based on items sold
  let cogs = 0;
  periodInvoices.forEach((inv) => {
    inv.items.forEach((item) => {
      cogs += (item.unitCost || 0) * item.quantity;
    });
  });

  const grossProfit = netSales - cogs;
  const grossMarginPercent = netSales > 0 ? Math.round((grossProfit / netSales) * 100) : 0;

  const totalOperatingExpenses = periodExpenses.reduce((acc, e) => acc + e.amount, 0);
  const netOperatingProfit = grossProfit - totalOperatingExpenses;
  const netMarginPercent = netSales > 0 ? Math.round((netOperatingProfit / netSales) * 100) : 0;

  // 2. Cashflow (Real Cash Inflows vs Cash Outflows)
  const cashInflow = periodInvoices
    .filter((i) => i.status === 'paid')
    .reduce((acc, i) => acc + i.total, 0);

  const cashOutflow = totalOperatingExpenses;
  const netCashflow = cashInflow - cashOutflow;

  // 3. Accounts Receivable (Cuentas por cobrar)
  const pendingInvoices = invoices.filter((i) => i.status === 'certified' || i.status === 'sent');
  const totalReceivables = pendingInvoices.reduce((acc, i) => acc + i.total, 0);

  // Receivables aging (Corrientes vs Vencidas)
  const today = new Date().toISOString().split('T')[0];
  const overdueInvoices = pendingInvoices.filter((i) => i.dueDate < today);
  const currentInvoices = pendingInvoices.filter((i) => i.dueDate >= today);

  // 4. Tax collection
  const totalVatCollected = periodInvoices.reduce((acc, i) => acc + i.taxAmount, 0);

  // 5. Product performance
  const productSalesMap: Record<string, { name: string; sku: string; units: number; revenue: number; profit: number }> = {};
  periodInvoices.forEach((inv) => {
    inv.items.forEach((item) => {
      if (!productSalesMap[item.productId]) {
        productSalesMap[item.productId] = {
          name: item.name,
          sku: item.sku,
          units: 0,
          revenue: 0,
          profit: 0,
        };
      }
      productSalesMap[item.productId].units += item.quantity;
      productSalesMap[item.productId].revenue += item.subtotal;
      productSalesMap[item.productId].profit += item.subtotal - (item.unitCost || 0) * item.quantity;
    });
  });

  const topProducts = Object.values(productSalesMap).sort((a, b) => b.revenue - a.revenue);

  // Handlers
  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expDescription.trim() || expAmount <= 0) return;

    StorageService.addExpense({
      category: expCategory,
      description: expDescription.trim(),
      amount: Number(expAmount),
      date: new Date().toISOString().split('T')[0],
      paymentMethod: expMethod,
      supplier: expSupplier.trim() || 'Proveedor Operativo',
      reference: `EXP-${Date.now().toString().slice(-4)}`,
    });

    setIsExpenseModalOpen(false);
    setExpDescription('');
    setExpAmount(100);
    setExpSupplier('');
    onRefresh();
  };

  const handleExportFinancialReport = () => {
    const lines = [
      `INFORME FINANCIERO Y ESTADO DE RESULTADOS - ${profile.commercialName}`,
      `Generado: ${new Date().toLocaleString('es-MX')}`,
      `Periodo: ${period.toUpperCase()}`,
      '',
      'ESTADO DE RESULTADOS (P&L)',
      `Ventas Brutas,${grossSales.toFixed(2)}`,
      `(-) Descuentos Concedidos,-${totalDiscounts.toFixed(2)}`,
      `Ventas Netas,${netSales.toFixed(2)}`,
      `(-) Costo de Mercancía Vendida (COGS),-${cogs.toFixed(2)}`,
      `Utilidad Bruta,${grossProfit.toFixed(2)} (${grossMarginPercent}%)`,
      `(-) Gastos Operacionales,-${totalOperatingExpenses.toFixed(2)}`,
      `Utilidad Neta del Periodo,${netOperatingProfit.toFixed(2)} (${netMarginPercent}%)`,
      '',
      'FLUJO DE CAJA EFECTIVO',
      `Ingresos Efectivos Cobrados,${cashInflow.toFixed(2)}`,
      `Egresos Operacionales Pagados,-${cashOutflow.toFixed(2)}`,
      `Flujo Neto de Caja,${netCashflow.toFixed(2)}`,
      '',
      'IMPUESTOS',
      `IVA Débito Fiscal Facturado,${totalVatCollected.toFixed(2)}`,
      '',
      'CUENTAS POR COBRAR',
      `Total Pendiente de Cobro,${totalReceivables.toFixed(2)}`,
      `Cartera Vencida,${overdueInvoices.reduce((acc, i) => acc + i.total, 0).toFixed(2)}`,
    ];

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + lines.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Reporte_Financiero_${period}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatCurrency = (amt: number) => {
    return `$${amt.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">Reportes Financieros</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Estado de resultados automático (P&L), flujo de caja real, cartera de cobro y rentabilidad por producto.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Period Selector */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs font-medium">
            <button
              type="button"
              onClick={() => setPeriod('month')}
              className={`px-2.5 py-1.5 rounded transition-colors ${
                period === 'month' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Este Mes
            </button>
            <button
              type="button"
              onClick={() => setPeriod('quarter')}
              className={`px-2.5 py-1.5 rounded transition-colors ${
                period === 'quarter' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Trimestre
            </button>
            <button
              type="button"
              onClick={() => setPeriod('year')}
              className={`px-2.5 py-1.5 rounded transition-colors ${
                period === 'year' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Año 2026
            </button>
            <button
              type="button"
              onClick={() => setPeriod('all')}
              className={`px-2.5 py-1.5 rounded transition-colors ${
                period === 'all' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Histórico
            </button>
          </div>

          <button
            type="button"
            onClick={handleExportFinancialReport}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-2xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar CSV</span>
          </button>

          <button
            type="button"
            onClick={() => setIsExpenseModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Gasto</span>
          </button>
        </div>
      </div>

      {/* Main Financial KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-medium text-slate-500">Ventas Netas Facturadas</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1">
            {formatCurrency(netSales)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">{periodInvoices.length} facturas emitidas en el periodo</div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-medium text-slate-500">Utilidad Bruta (Margen)</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1">
            {formatCurrency(grossProfit)}
          </div>
          <div className="text-[11px] text-emerald-700 font-medium mt-1">Margen Bruto: {grossMarginPercent}%</div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-medium text-slate-500">Gastos Operativos</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-rose-700 mt-1">
            {formatCurrency(totalOperatingExpenses)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">{periodExpenses.length} egresos operacionales</div>
        </div>

        <div className={`p-4 rounded-xl border shadow-2xs ${netOperatingProfit >= 0 ? 'bg-white border-slate-200' : 'bg-rose-50 border-rose-200'}`}>
          <div className="text-xs font-medium text-slate-500">Utilidad Operativa Neta</div>
          <div className={`text-2xl font-bold font-mono tabular-nums mt-1 ${netOperatingProfit >= 0 ? 'text-emerald-800' : 'text-rose-800'}`}>
            {formatCurrency(netOperatingProfit)}
          </div>
          <div className={`text-[11px] font-medium mt-1 ${netOperatingProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
            Margen Neto Final: {netMarginPercent}%
          </div>
        </div>
      </div>

      {/* 2-Column Section: P&L Statement vs Cashflow & Taxes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* P&L Statement (Estado de Resultados Detallado) */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Estado de Resultados (P&L)
              </h2>
              <p className="text-[11px] text-slate-400">Desglose contable de ingresos, costos y beneficios</p>
            </div>
            <FileSpreadsheet className="w-4 h-4 text-slate-400" />
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1 text-slate-700">
              <span className="font-medium">1. Ingresos Brutos por Facturación:</span>
              <span className="font-mono tabular-nums font-semibold">{formatCurrency(grossSales)}</span>
            </div>

            {totalDiscounts > 0 && (
              <div className="flex justify-between py-1 text-rose-600 pl-3">
                <span>(-) Descuentos y Bonificaciones:</span>
                <span className="font-mono tabular-nums">-{formatCurrency(totalDiscounts)}</span>
              </div>
            )}

            <div className="flex justify-between py-1.5 px-2.5 bg-slate-50 rounded text-slate-900 font-semibold border border-slate-100">
              <span>(=) Ventas Netas Operacionales:</span>
              <span className="font-mono tabular-nums">{formatCurrency(netSales)}</span>
            </div>

            <div className="flex justify-between py-1 text-slate-600 pl-3">
              <span>(-) Costo de Mercancía Vendida (COGS):</span>
              <span className="font-mono tabular-nums font-medium text-rose-700">-{formatCurrency(cogs)}</span>
            </div>

            <div className="flex justify-between py-1.5 px-2.5 bg-emerald-50/70 rounded text-emerald-950 font-semibold border border-emerald-100">
              <div className="flex items-center gap-1.5">
                <span>(=) Utilidad Bruta:</span>
                <span className="text-[10px] text-emerald-700 font-normal">({grossMarginPercent}% sobre ventas)</span>
              </div>
              <span className="font-mono tabular-nums font-bold">{formatCurrency(grossProfit)}</span>
            </div>

            <div className="space-y-1 pl-3 pt-1">
              <div className="text-slate-500 font-medium text-[11px]">(-) Gastos Operacionales de Administración & Venta:</div>
              {periodExpenses.map((exp) => (
                <div key={exp.id} className="flex justify-between text-slate-500 text-[11px]">
                  <span>· {exp.category} ({exp.description.slice(0, 32)}...):</span>
                  <span className="font-mono tabular-nums">-${exp.amount.toFixed(2)}</span>
                </div>
              ))}
              <div className="flex justify-between font-medium text-slate-700 pt-1 border-t border-slate-100">
                <span>Total Gastos de Operación:</span>
                <span className="font-mono tabular-nums text-rose-700">-{formatCurrency(totalOperatingExpenses)}</span>
              </div>
            </div>

            <div className="flex justify-between py-2.5 px-3 bg-slate-900 text-white rounded-lg font-bold text-sm">
              <div className="flex items-center gap-1.5">
                <span>(=) Utilidad Operativa Neta:</span>
                <span className="text-xs text-slate-300 font-normal">({netMarginPercent}%)</span>
              </div>
              <span className="font-mono tabular-nums text-emerald-400">{formatCurrency(netOperatingProfit)}</span>
            </div>
          </div>
        </div>

        {/* Flujo de Caja & Impuestos */}
        <div className="space-y-6">
          {/* Flujo de Caja */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Flujo de Caja Real (Efectivo)
                </h2>
                <p className="text-[11px] text-slate-400">Entradas efectivamente cobradas vs pagos de gastos realizados</p>
              </div>
              <DollarSign className="w-4 h-4 text-slate-400" />
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                <span className="text-[11px] text-emerald-700 font-medium block">Entradas Cobradas</span>
                <span className="text-base font-bold font-mono tabular-nums text-emerald-900">
                  {formatCurrency(cashInflow)}
                </span>
              </div>

              <div className="p-3 bg-rose-50 rounded-lg border border-rose-100">
                <span className="text-[11px] text-rose-700 font-medium block">Salidas Pagadas</span>
                <span className="text-base font-bold font-mono tabular-nums text-rose-900">
                  {formatCurrency(cashOutflow)}
                </span>
              </div>

              <div className={`p-3 rounded-lg border ${netCashflow >= 0 ? 'bg-slate-100 border-slate-200' : 'bg-rose-50 border-rose-200'}`}>
                <span className="text-[11px] text-slate-600 font-medium block">Flujo Neto</span>
                <span className={`text-base font-bold font-mono tabular-nums ${netCashflow >= 0 ? 'text-slate-900' : 'text-rose-800'}`}>
                  {formatCurrency(netCashflow)}
                </span>
              </div>
            </div>

            <div className="pt-2 text-[11px] text-slate-500 flex items-center justify-between">
              <span>IVA Fiscal Facturado (16% promedio):</span>
              <span className="font-mono font-semibold text-slate-800">{formatCurrency(totalVatCollected)}</span>
            </div>
          </div>

          {/* Cuentas por Cobrar (Aging) */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 sm:p-6 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div>
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Cuentas por Cobrar ({pendingInvoices.length})
                </h2>
                <p className="text-[11px] text-slate-400">Cartera pendiente de pago por clientes</p>
              </div>
              <span className="text-base font-bold font-mono tabular-nums text-slate-900">
                {formatCurrency(totalReceivables)}
              </span>
            </div>

            {pendingInvoices.length === 0 ? (
              <div className="py-4 text-center text-xs text-slate-400">
                No hay facturas pendientes de cobro actualmente.
              </div>
            ) : (
              <div className="space-y-2 text-xs divide-y divide-slate-100">
                {pendingInvoices.map((inv) => {
                  const isOverdue = inv.dueDate < today;
                  return (
                    <div key={inv.id} className="pt-2 flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-slate-900 truncate">{inv.customer.legalName}</div>
                        <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1.5">
                          <span>{inv.invoiceNumber}</span>
                          <span>·</span>
                          <span className={isOverdue ? 'text-rose-600 font-semibold flex items-center gap-0.5' : 'text-slate-500'}>
                            {isOverdue && <AlertCircle className="w-3 h-3" />}
                            Vence: {inv.dueDate} {isOverdue ? '(Vencida)' : ''}
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="font-bold font-mono tabular-nums text-slate-900">
                          {formatCurrency(inv.total)}
                        </div>
                        <button
                          type="button"
                          onClick={() => onMarkPaid(inv.id)}
                          className="mt-0.5 px-2 py-0.5 text-[11px] font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded transition-colors"
                        >
                          Registrar Cobro
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Top Performing Products Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <div>
            <h2 className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
              Rentabilidad por Producto / Servicio en el Periodo
            </h2>
            <p className="text-[11px] text-slate-400">Ranking según volumen facturado y contribución al margen</p>
          </div>
          <TrendingUp className="w-4 h-4 text-slate-400" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px] bg-slate-50/75">
                <th className="py-3 px-4">Producto / Referencia</th>
                <th className="py-3 px-3 text-right">Unidades Vendidas</th>
                <th className="py-3 px-3 text-right">Facturación Bruta</th>
                <th className="py-3 px-3 text-right">Ganancia Bruta</th>
                <th className="py-3 px-4 text-right">Margen Contribución</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {topProducts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    No se registran ventas en el periodo seleccionado.
                  </td>
                </tr>
              ) : (
                topProducts.map((p, idx) => {
                  const marginPct = p.revenue > 0 ? Math.round((p.profit / p.revenue) * 100) : 0;
                  return (
                    <tr key={idx} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{p.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">SKU: {p.sku}</div>
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums font-medium text-slate-800">
                        {p.units}
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums font-semibold text-slate-900">
                        {formatCurrency(p.revenue)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums font-semibold text-emerald-800">
                        {formatCurrency(p.profit)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-emerald-700 font-bold">
                        +{marginPct}%
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Register Operating Expense */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
              <h3 className="text-sm font-semibold">Registrar Gasto Operacional</h3>
              <button onClick={() => setIsExpenseModalOpen(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Categoría del Gasto *</label>
                <select
                  value={expCategory}
                  onChange={(e) => setExpCategory(e.target.value as any)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                >
                  <option value="Alquiler">Alquiler de Instalaciones / Bodega</option>
                  <option value="Nómina & Sueldos">Nómina & Sueldos de Empleados</option>
                  <option value="Servicios Públicos">Servicios Públicos (Luz, Internet, Agua)</option>
                  <option value="Marketing & Publicidad">Marketing & Publicidad Digital</option>
                  <option value="Logística">Logística & Envíos de Mercancía</option>
                  <option value="Mantenimiento">Mantenimiento de Equipos</option>
                  <option value="Otros">Otros Gastos Generales</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Descripción del Desembolso *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Pago de conexión de fibra óptica empresarial"
                  value={expDescription}
                  onChange={(e) => setExpDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Monto del Gasto (USD) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={expAmount}
                  onChange={(e) => setExpAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded font-mono text-slate-900 text-sm focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Proveedor / Beneficiario</label>
                <input
                  type="text"
                  placeholder="Ej: Empresa de Telecomunicaciones"
                  value={expSupplier}
                  onChange={(e) => setExpSupplier(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Método de Pago</label>
                <select
                  value={expMethod}
                  onChange={(e) => setExpMethod(e.target.value as any)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                >
                  <option value="transfer">Transferencia Bancaria</option>
                  <option value="credit_card">Tarjeta Corporativa</option>
                  <option value="cash">Caja Chica / Efectivo</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="px-3 py-2 text-slate-600 hover:bg-slate-100 rounded"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 text-white font-medium rounded hover:bg-slate-800 transition-colors"
                >
                  Guardar Gasto en Finanzas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
