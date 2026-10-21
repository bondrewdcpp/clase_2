'use client';

import React, { useState } from 'react';
import { CompanyProfile } from '@/types/business';
import { StorageService } from '@/lib/storage';
import { Building2, ShieldCheck, Save, RotateCcw, Download, CheckCircle, AlertCircle } from 'lucide-react';

interface BusinessSettingsModalProps {
  profile: CompanyProfile;
  onProfileUpdated: (newProfile: CompanyProfile) => void;
  onResetData: () => void;
}

export function BusinessSettingsModal({ profile, onProfileUpdated, onResetData }: BusinessSettingsModalProps) {
  const [formData, setFormData] = useState<CompanyProfile>(profile);
  const [savedNotice, setSavedNotice] = useState(false);
  const [resetNotice, setResetNotice] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    StorageService.saveProfile(formData);
    onProfileUpdated(formData);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  const handleExportJSON = () => {
    const backup = {
      profile: StorageService.getProfile(),
      products: StorageService.getProducts(),
      customers: StorageService.getCustomers(),
      invoices: StorageService.getInvoices(),
      expenses: StorageService.getExpenses(),
      movements: StorageService.getMovements(),
      exportDate: new Date().toISOString(),
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backup, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `GestionPro_Respaldo_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleConfirmReset = () => {
    if (window.confirm('¿Está seguro de restablecer todos los datos a la demostración inicial? Los cambios no guardados se perderán.')) {
      onResetData();
      setResetNotice(true);
      setTimeout(() => setResetNotice(false), 3500);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">Configuración de la Empresa</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Parámetros fiscales, datos del emisor para facturación electrónica y gestión de respaldos.
        </p>
      </div>

      {savedNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>Configuración del negocio guardada exitosamente. Los nuevos comprobantes se emitirán con estos datos.</span>
        </div>
      )}

      {resetNotice && (
        <div className="p-3 bg-slate-900 text-white rounded-lg text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>Datos demo iniciales restablecidos con éxito en el almacenamiento local.</span>
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 shadow-2xs p-6 space-y-6 text-xs">
        <div>
          <h2 className="text-sm font-bold text-slate-900 mb-1">Identidad Legal & Fiscal del Emisor</h2>
          <p className="text-slate-500 text-[11px]">Estos datos aparecerán impresos en el encabezado de las facturas electrónicas oficiales.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-medium text-slate-700 mb-1">Nombre Comercial *</label>
            <input
              type="text"
              required
              value={formData.commercialName}
              onChange={(e) => setFormData({ ...formData, commercialName: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Razón Social Legal *</label>
            <input
              type="text"
              required
              value={formData.legalName}
              onChange={(e) => setFormData({ ...formData, legalName: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Identificación Fiscal (RFC / NIT / CIF) *</label>
            <input
              type="text"
              required
              value={formData.taxId}
              onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Régimen Fiscal *</label>
            <input
              type="text"
              required
              value={formData.taxRegime}
              onChange={(e) => setFormData({ ...formData, taxRegime: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Correo Electrónico de Facturación</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Teléfono de Contacto</label>
            <input
              type="text"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block font-medium text-slate-700 mb-1">Dirección Fiscal / Bodega</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>
        </div>

        {/* Invoicing Settings & Series */}
        <div className="pt-4 border-t border-slate-200 space-y-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 mb-1">Parámetros de Facturación Electrónica</h2>
            <p className="text-slate-500 text-[11px]">Control de correlativos, series y tasas impositivas predeterminadas.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Prefijo de Factura</label>
              <input
                type="text"
                value={formData.invoicePrefix}
                onChange={(e) => setFormData({ ...formData, invoicePrefix: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Siguiente Folio Correlativo</label>
              <input
                type="number"
                min="1"
                value={formData.nextFolio}
                onChange={(e) => setFormData({ ...formData, nextFolio: parseInt(e.target.value) || 1 })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Tasa IVA Predeterminada (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.defaultTaxRate}
                onChange={(e) => setFormData({ ...formData, defaultTaxRate: parseFloat(e.target.value) || 16 })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>
          </div>
        </div>

        {/* Certificate Simulation Status */}
        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold text-slate-900 block">Certificado de Sello Digital (CSD) Activo</span>
            <p className="text-slate-500">
              Conexión directa con el servicio de timbrado fiscal {formData.taxAuthorityName}. No. de Certificado: 00001000000508924119 (Vigencia activa hasta 2028).
            </p>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 transition-colors shadow-sm"
          >
            <Save className="w-4 h-4" />
            <span>Guardar Configuración Fiscal</span>
          </button>
        </div>
      </form>

      {/* Backup and Data Management */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-6 space-y-4 text-xs">
        <div>
          <h2 className="text-sm font-bold text-slate-900 mb-1">Respaldo y Datos del Sistema</h2>
          <p className="text-slate-500 text-[11px]">
            Descargue una copia de seguridad en formato JSON con todo su inventario, movimientos, facturas y gastos, o restablezca la demostración.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleExportJSON}
            className="flex items-center gap-1.5 px-3.5 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 font-medium rounded-lg transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Descargar Copia de Seguridad JSON</span>
          </button>

          <button
            type="button"
            onClick={handleConfirmReset}
            className="flex items-center gap-1.5 px-3.5 py-2 text-rose-700 bg-rose-50 hover:bg-rose-100 font-medium rounded-lg transition-colors border border-rose-200"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restablecer Datos Demo Iniciales</span>
          </button>
        </div>
      </div>
    </div>
  );
}
