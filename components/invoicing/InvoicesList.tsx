'use client';

import React, { useState } from 'react';
import { Invoice, InvoiceStatus, CompanyProfile } from '@/types/business';
import {
  FileText,
  Plus,
  Search,
  CheckCircle,
  Clock,
  Ban,
  Printer,
  ShieldCheck,
  Download,
  AlertCircle,
  Eye,
} from 'lucide-react';

interface InvoicesListProps {
  invoices: Invoice[];
  profile: CompanyProfile;
  onOpenNewInvoice: () => void;
  onViewInvoice: (invoice: Invoice) => void;
  onMarkPaid: (invoiceId: string) => void;
  onCertifyDraft: (invoiceId: string) => void;
}

export function InvoicesList({
  invoices,
  profile,
  onOpenNewInvoice,
  onViewInvoice,
  onMarkPaid,
  onCertifyDraft,
}: InvoicesListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | InvoiceStatus>('all');

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.customer.legalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.customer.taxId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inv.certification?.cufeUuid && inv.certification.cufeUuid.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Financial aggregates
  const totalInvoiced = invoices
    .filter((i) => i.status !== 'cancelled')
    .reduce((acc, i) => acc + i.total, 0);

  const totalCollected = invoices
    .filter((i) => i.status === 'paid')
    .reduce((acc, i) => acc + i.total, 0);

  const totalPending = invoices
    .filter((i) => i.status === 'certified' || i.status === 'sent')
    .reduce((acc, i) => acc + i.total, 0);

  const formatCurrency = (amt: number) => {
    return `$${amt.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const handleExportInvoicesCSV = () => {
    const headers = ['Numero Factura', 'Fecha Emision', 'Fecha Vencimiento', 'Cliente', 'RFC/NIT', 'Estado', 'Subtotal', 'IVA', 'Total', 'UUID Fiscal'];
    const rows = invoices.map((inv) => [
      `"${inv.invoiceNumber}"`,
      `"${inv.issueDate}"`,
      `"${inv.dueDate}"`,
      `"${inv.customer.legalName.replace(/"/g, '""')}"`,
      `"${inv.customer.taxId}"`,
      `"${inv.status}"`,
      inv.subtotal,
      inv.taxAmount,
      inv.total,
      `"${inv.certification?.cufeUuid || ''}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Facturas_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">Facturación Electrónica</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Emisión de comprobantes fiscales con timbrado digital SAT/DIAN y control de cuentas por cobrar.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExportInvoicesCSV}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-2xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar CSV</span>
          </button>

          <button
            type="button"
            onClick={onOpenNewInvoice}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Emitir Nueva Factura</span>
          </button>
        </div>
      </div>

      {/* Aggregate Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-medium text-slate-500">Total Facturación Bruta</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1">
            {formatCurrency(totalInvoiced)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">{invoices.filter((i) => i.status !== 'cancelled').length} facturas válidas emitidas</div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-medium text-slate-500">Cobrado Efectivo</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-emerald-800 mt-1">
            {formatCurrency(totalCollected)}
          </div>
          <div className="text-[11px] text-emerald-700 mt-1">Ingresos ingresados a tesorería</div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-medium text-slate-500">Por Cobrar (Pendiente)</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-amber-800 mt-1">
            {formatCurrency(totalPending)}
          </div>
          <div className="text-[11px] text-amber-700 mt-1">Facturas con crédito comercial vigente</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por número (FE-2026-0044), cliente o RFC/NIT..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900"
          />
        </div>

        {/* Segmented Filter */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
              statusFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Todas ({invoices.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('certified')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
              statusFilter === 'certified' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Pendientes Cobro
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('paid')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
              statusFilter === 'paid' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Pagadas
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('draft')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
              statusFilter === 'draft' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Borrador
          </button>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Comprobante Fiscal</th>
                <th className="py-3 px-3">Cliente Receptor</th>
                <th className="py-3 px-3">Emisión / Venc.</th>
                <th className="py-3 px-3 text-right">Subtotal</th>
                <th className="py-3 px-3 text-right">IVA</th>
                <th className="py-3 px-3 text-right">Total Factura</th>
                <th className="py-3 px-3">Estado</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No se encontraron facturas registradas.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => {
                  const isPaid = inv.status === 'paid';
                  const isCancelled = inv.status === 'cancelled';
                  const isDraft = inv.status === 'draft';

                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold font-mono text-slate-900 flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-slate-400" />
                          <span>{inv.invoiceNumber}</span>
                        </div>
                        {inv.certification?.cufeUuid && (
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate max-w-44" title={inv.certification.cufeUuid}>
                            UUID: {inv.certification.cufeUuid.slice(0, 16)}...
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-900 max-w-xs truncate">{inv.customer.legalName}</div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">{inv.customer.taxId}</div>
                      </td>

                      <td className="py-3 px-3 font-mono text-slate-600">
                        <div>{inv.issueDate}</div>
                        <div className="text-[11px] text-slate-400">Vence: {inv.dueDate}</div>
                      </td>

                      <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-600">
                        {formatCurrency(inv.subtotal)}
                      </td>

                      <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-500">
                        {formatCurrency(inv.taxAmount)}
                      </td>

                      <td className="py-3 px-3 text-right font-mono tabular-nums font-bold text-slate-900">
                        {formatCurrency(inv.total)}
                      </td>

                      <td className="py-3 px-3">
                        {isPaid ? (
                          <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                            Pagada
                          </span>
                        ) : isCancelled ? (
                          <span className="text-[11px] font-semibold text-rose-700 flex items-center gap-1">
                            <Ban className="w-3.5 h-3.5 text-rose-600" />
                            Anulada
                          </span>
                        ) : isDraft ? (
                          <span className="text-[11px] font-medium text-slate-500">Borrador</span>
                        ) : (
                          <span className="text-[11px] font-semibold text-amber-700 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            Pendiente
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isDraft ? (
                            <button
                              type="button"
                              onClick={() => onCertifyDraft(inv.id)}
                              className="px-2.5 py-1 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors"
                            >
                              Timbrar
                            </button>
                          ) : !isPaid && !isCancelled ? (
                            <button
                              type="button"
                              onClick={() => onMarkPaid(inv.id)}
                              className="px-2.5 py-1 text-xs font-medium text-emerald-900 bg-emerald-100 hover:bg-emerald-200 rounded transition-colors"
                            >
                              Cobrar
                            </button>
                          ) : null}

                          <button
                            type="button"
                            onClick={() => onViewInvoice(inv)}
                            className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors inline-flex items-center gap-1"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Ver PDF</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards View */}
      <div className="md:hidden space-y-3">
        {filteredInvoices.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 bg-white rounded-xl border border-slate-200">
            No se encontraron facturas.
          </div>
        ) : (
          filteredInvoices.map((inv) => {
            const isPaid = inv.status === 'paid';
            const isCancelled = inv.status === 'cancelled';
            const isDraft = inv.status === 'draft';

            return (
              <div key={inv.id} className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-bold font-mono text-sm text-slate-900">{inv.invoiceNumber}</div>
                    <div className="text-xs text-slate-700 font-medium truncate max-w-[200px] mt-0.5">
                      {inv.customer.legalName}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">{inv.customer.taxId}</div>
                  </div>

                  <div className="text-right">
                    <div className="text-base font-bold font-mono tabular-nums text-slate-900">
                      {formatCurrency(inv.total)}
                    </div>
                    <div className="text-[10px] text-slate-400">Emisión: {inv.issueDate}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                  <div>
                    {isPaid ? (
                      <span className="text-[11px] font-semibold text-emerald-700">Pagada</span>
                    ) : isCancelled ? (
                      <span className="text-[11px] font-semibold text-rose-700">Anulada</span>
                    ) : isDraft ? (
                      <span className="text-[11px] text-slate-500">Borrador</span>
                    ) : (
                      <span className="text-[11px] font-semibold text-amber-700">Pendiente de Cobro</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {!isPaid && !isCancelled && !isDraft && (
                      <button
                        type="button"
                        onClick={() => onMarkPaid(inv.id)}
                        className="min-h-[44px] px-3 py-1.5 text-xs font-semibold text-emerald-900 bg-emerald-100 active:bg-emerald-200 rounded-lg"
                      >
                        Cobrar
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => onViewInvoice(inv)}
                      className="min-h-[44px] px-3 py-1.5 text-xs font-medium text-slate-800 bg-slate-100 active:bg-slate-200 rounded-lg flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Ver Factura</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
