'use client';

import React, { useState } from 'react';
import { Invoice, CompanyProfile } from '@/types/business';
import { QrCodeSvg } from '@/components/ui/QrCodeSvg';
import { Printer, CheckCircle, Mail, Ban, X, ShieldCheck, FileText, ArrowDownToLine } from 'lucide-react';

interface ElectronicInvoiceModalProps {
  invoice: Invoice | null;
  profile: CompanyProfile;
  isOpen: boolean;
  onClose: () => void;
  onMarkPaid: (invoiceId: string) => void;
  onCancelInvoice: (invoiceId: string, reason: string) => void;
}

export function ElectronicInvoiceModal({
  invoice,
  profile,
  isOpen,
  onClose,
  onMarkPaid,
  onCancelInvoice,
}: ElectronicInvoiceModalProps) {
  const [emailSentNotice, setEmailSentNotice] = useState(false);
  const [showCancelPrompt, setShowCancelPrompt] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  if (!isOpen || !invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleSendEmail = () => {
    setEmailSentNotice(true);
    setTimeout(() => setEmailSentNotice(false), 3500);
  };

  const handleConfirmCancel = () => {
    if (!cancelReason.trim()) return;
    onCancelInvoice(invoice.id, cancelReason);
    setShowCancelPrompt(false);
    setCancelReason('');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: invoice.currency,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getStatusText = (status: Invoice['status']) => {
    switch (status) {
      case 'paid':
        return 'PAGADA';
      case 'certified':
        return 'TIMBRADA / PENDIENTE DE COBRO';
      case 'draft':
        return 'BORRADOR';
      case 'cancelled':
        return 'ANULADA';
      default:
        return status.toUpperCase();
    }
  };

  const getPaymentMethodLabel = (method: Invoice['paymentMethod']) => {
    switch (method) {
      case 'transfer':
        return 'Transferencia Bancaria (SPEI / ACH)';
      case 'credit_card':
        return 'Tarjeta de Crédito / Débito';
      case 'credit_term':
        return `Crédito Comercial (${invoice.customer.paymentTermsDays || 30} días)`;
      case 'cash':
        return 'Efectivo';
      default:
        return method;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto bg-white rounded-xl shadow-2xl border border-slate-200 text-slate-800 flex flex-col">
        {/* Modal Action Bar (Hidden in print) */}
        <div className="no-print sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 px-6 py-3.5 bg-slate-900 text-white rounded-t-xl border-b border-slate-800">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-400" />
            <span className="font-semibold text-sm tracking-tight">Comprobante Fiscal Digital</span>
            <span className="text-xs text-slate-400">· {invoice.invoiceNumber}</span>
          </div>

          <div className="flex items-center gap-2">
            {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
              <button
                type="button"
                onClick={() => onMarkPaid(invoice.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-950 bg-emerald-400 hover:bg-emerald-300 rounded-md transition-colors"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Marcar Pagada</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleSendEmail}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-md transition-colors"
              title="Enviar PDF y XML al cliente"
            >
              <Mail className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Enviar Correo</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-700 hover:bg-slate-600 rounded-md transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Imprimir / PDF</span>
            </button>

            {invoice.status !== 'cancelled' && (
              <button
                type="button"
                onClick={() => setShowCancelPrompt(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-rose-300 hover:text-white hover:bg-rose-900/60 rounded-md transition-colors"
                title="Anular comprobante y devolver stock"
              >
                <Ban className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Anular</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-md transition-colors ml-1"
              aria-label="Cerrar modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Email toast feedback */}
        {emailSentNotice && (
          <div className="no-print mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>Factura electrónica y archivo XML enviados con éxito a <strong>{invoice.customer.email}</strong></span>
            </div>
            <button onClick={() => setEmailSentNotice(false)} className="text-emerald-700 hover:text-emerald-900">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Cancel Prompt Dialog */}
        {showCancelPrompt && (
          <div className="no-print mx-6 mt-4 p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-900 text-xs">
            <h4 className="font-semibold text-sm mb-1 text-rose-950">¿Confirmar anulación de la factura {invoice.invoiceNumber}?</h4>
            <p className="text-rose-700 mb-2">
              Esta acción emitirá una Nota de Crédito fiscal y devolverá automáticamente todas las unidades vendidas al inventario disponible.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="Motivo de la anulación (ej: Error en datos de facturación)"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="flex-1 px-3 py-1.5 bg-white border border-rose-300 rounded text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleConfirmCancel}
                  disabled={!cancelReason.trim()}
                  className="px-3 py-1.5 bg-rose-600 text-white font-medium rounded hover:bg-rose-700 disabled:opacity-50 transition-colors"
                >
                  Confirmar Anulación
                </button>
                <button
                  type="button"
                  onClick={() => setShowCancelPrompt(false)}
                  className="px-3 py-1.5 bg-slate-200 text-slate-700 font-medium rounded hover:bg-slate-300 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PRINTABLE INVOICE BODY */}
        <div className="p-6 sm:p-10 text-slate-900 bg-white" id="invoice-printable-area">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pb-6 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                  {profile.commercialName}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Facturación Electrónica Autorizada
                </span>
              </div>
              <p className="text-xs text-slate-600 font-medium">{profile.legalName}</p>
              <p className="text-xs text-slate-600">{profile.taxId}</p>
              <p className="text-xs text-slate-500">{profile.taxRegime}</p>
              <p className="text-xs text-slate-500">{profile.address} · {profile.city}, {profile.country}</p>
              <p className="text-xs text-slate-500">Tel: {profile.phone} · {profile.email}</p>
            </div>

            <div className="text-left sm:text-right w-full sm:w-auto p-3 sm:p-0 bg-slate-50 sm:bg-transparent rounded-lg">
              <div className="text-xs uppercase tracking-wider text-slate-500 font-medium">Factura Electrónica de Venta</div>
              <div className="text-2xl font-bold font-mono text-slate-900 tracking-tight">{invoice.invoiceNumber}</div>
              <div className="mt-1 text-xs">
                <span className="text-slate-500">Estado: </span>
                <span className={`font-semibold ${
                  invoice.status === 'paid'
                    ? 'text-emerald-700'
                    : invoice.status === 'cancelled'
                    ? 'text-rose-700 line-through'
                    : 'text-amber-700'
                }`}>
                  {getStatusText(invoice.status)}
                </span>
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                Emisión: <span className="font-mono font-medium text-slate-800">{invoice.issueDate}</span>
              </div>
              <div className="text-xs text-slate-500">
                Vencimiento: <span className="font-mono font-medium text-slate-800">{invoice.dueDate}</span>
              </div>
              {invoice.paidAt && (
                <div className="text-xs text-emerald-600">
                  Fecha de Pago: <span className="font-mono font-medium">{invoice.paidAt}</span>
                </div>
              )}
            </div>
          </div>

          {/* Customer and Fiscal Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-6 border-b border-slate-200 text-xs">
            <div>
              <div className="text-slate-400 font-semibold uppercase tracking-wider text-[11px] mb-1.5">
                Datos del Cliente / Receptor
              </div>
              <div className="font-bold text-sm text-slate-900">{invoice.customer.legalName}</div>
              <div className="text-slate-700 font-mono mt-0.5">Identificación Fiscal: {invoice.customer.taxId}</div>
              <div className="text-slate-600">{invoice.customer.address}, {invoice.customer.city}</div>
              <div className="text-slate-600">{invoice.customer.email} · {invoice.customer.phone}</div>
            </div>

            <div className="sm:text-right">
              <div className="text-slate-400 font-semibold uppercase tracking-wider text-[11px] mb-1.5">
                Condiciones de Pago & Fiscales
              </div>
              <div><span className="text-slate-500">Método de Pago:</span> <span className="font-medium text-slate-800">{getPaymentMethodLabel(invoice.paymentMethod)}</span></div>
              <div><span className="text-slate-500">Moneda:</span> <span className="font-medium text-slate-800">{invoice.currency}</span></div>
              <div><span className="text-slate-500">Entidad de Regulación:</span> <span className="font-medium text-slate-800">{profile.taxAuthorityName}</span></div>
              {invoice.certification && (
                <div className="mt-1 text-[11px] text-slate-600">
                  Certificado SAT/DIAN: <span className="font-mono">{invoice.certification.certificateNumber}</span>
                </div>
              )}
            </div>
          </div>

          {/* Items Table */}
          <div className="py-6 border-b border-slate-200">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-300 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-2.5 px-2">Código</th>
                    <th className="py-2.5 px-2">Descripción</th>
                    <th className="py-2.5 px-2 text-right">Cant.</th>
                    <th className="py-2.5 px-2 text-right">Precio Unit.</th>
                    <th className="py-2.5 px-2 text-right">Desc %</th>
                    <th className="py-2.5 px-2 text-right">IVA %</th>
                    <th className="py-2.5 px-2 text-right">Importe</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {invoice.items.map((item, idx) => (
                    <tr key={`${item.productId}-${idx}`} className="hover:bg-slate-50/50">
                      <td className="py-3 px-2 font-mono text-slate-600 whitespace-nowrap">{item.sku}</td>
                      <td className="py-3 px-2">
                        <div className="font-medium text-slate-900">{item.name}</div>
                      </td>
                      <td className="py-3 px-2 text-right font-mono tabular-nums">{item.quantity}</td>
                      <td className="py-3 px-2 text-right font-mono tabular-nums">{formatCurrency(item.unitPrice)}</td>
                      <td className="py-3 px-2 text-right font-mono tabular-nums text-slate-500">
                        {item.discountPercent > 0 ? `${item.discountPercent}%` : '0%'}
                      </td>
                      <td className="py-3 px-2 text-right font-mono tabular-nums text-slate-500">{item.taxRate}%</td>
                      <td className="py-3 px-2 text-right font-mono tabular-nums font-semibold text-slate-900">
                        {formatCurrency(item.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals Section */}
          <div className="py-6 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
            <div className="max-w-md text-xs text-slate-600">
              <span className="font-semibold text-slate-800 block mb-1">Notas y Términos Comerciales:</span>
              <p className="text-slate-600 leading-relaxed">
                {invoice.notes || 'Comprobante fiscal expedido conforme a las regulaciones tributarias vigentes. Esta factura constituye título ejecutivo una vez aceptada.'}
              </p>
            </div>

            <div className="w-full sm:w-72 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal Bruto:</span>
                <span className="font-mono tabular-nums">{formatCurrency(invoice.subtotal + invoice.totalDiscount)}</span>
              </div>
              {invoice.totalDiscount > 0 && (
                <div className="flex justify-between text-rose-600">
                  <span>Descuentos Aplicados:</span>
                  <span className="font-mono tabular-nums">-{formatCurrency(invoice.totalDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-600">
                <span>Base Imponible:</span>
                <span className="font-mono tabular-nums">{formatCurrency(invoice.subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Impuesto al Valor Agregado (IVA):</span>
                <span className="font-mono tabular-nums">{formatCurrency(invoice.taxAmount)}</span>
              </div>
              <div className="pt-2 border-t border-slate-300 flex justify-between items-baseline text-slate-900">
                <span className="font-bold text-sm">TOTAL A PAGAR:</span>
                <span className="font-bold font-mono text-lg tabular-nums text-slate-900">{formatCurrency(invoice.total)}</span>
              </div>
            </div>
          </div>

          {/* Official Electronic Stamping & QR Code Block */}
          {invoice.certification ? (
            <div className="pt-6 grid grid-cols-1 md:grid-cols-4 gap-6 items-center text-xs">
              <div className="md:col-span-1 flex flex-col items-center sm:items-start">
                <QrCodeSvg value={invoice.certification.qrPayload} size={110} />
                <span className="text-[10px] text-slate-500 mt-1 text-center sm:text-left">
                  Escanee para validar con la autoridad tributaria
                </span>
              </div>

              <div className="md:col-span-3 space-y-1.5 text-slate-600">
                <div className="flex items-center gap-1.5 text-emerald-800 font-semibold text-xs">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Timbrado y Certificación Fiscal Digital</span>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Folio Fiscal (UUID / CUFE): </span>
                  <span className="font-mono text-[11px] text-slate-900 break-all select-all">
                    {invoice.certification.cufeUuid}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Fecha y Hora de Certificación: </span>
                  <span className="font-mono text-[11px] text-slate-800">
                    {new Date(invoice.certification.certifiedAt).toLocaleString('es-MX')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Sello Digital del Emisor & SAT: </span>
                  <p className="font-mono text-[9px] text-slate-500 break-all leading-tight">
                    {invoice.certification.digitalSignature}
                  </p>
                </div>
                <p className="text-[10px] text-slate-400 pt-1">
                  Este documento es una representación gráfica impresa de un Comprobante Fiscal Digital por Internet (CFDI / Factura Electrónica).
                </p>
              </div>
            </div>
          ) : (
            <div className="pt-6 text-center text-xs text-amber-700 bg-amber-50 p-3 rounded-lg border border-amber-200">
              Este documento es un <strong>Borrador</strong> preliminar sin timbrado fiscal oficial.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
