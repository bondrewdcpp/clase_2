'use client';

import React, { useState } from 'react';
import { Customer, Product, InvoiceItem, PaymentMethod, CompanyProfile } from '@/types/business';
import { StorageService } from '@/lib/storage';
import { X, Plus, Trash2, ShieldCheck, AlertCircle, UserPlus, CheckCircle2 } from 'lucide-react';

interface NewInvoiceDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  customers: Customer[];
  profile: CompanyProfile;
  onInvoiceCreated: (newInvoiceId: string) => void;
  onCustomerAdded: (newCustomer: Customer) => void;
}

export function NewInvoiceDrawer({
  isOpen,
  onClose,
  products,
  customers,
  profile,
  onInvoiceCreated,
  onCustomerAdded,
}: NewInvoiceDrawerProps) {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(customers[0]?.id || '');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('transfer');
  const [currency, setCurrency] = useState<'USD' | 'MXN' | 'COP' | 'EUR'>(profile.currency || 'USD');
  const [issueDate, setIssueDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState<string>('Condiciones comerciales: Pago acordado según términos vigentes.');
  
  // Quick customer creation modal/section
  const [isAddingCustomer, setIsAddingCustomer] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustTaxId, setNewCustTaxId] = useState('');
  const [newCustEmail, setNewCustEmail] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');
  const [newCustDays, setNewCustDays] = useState(30);

  // Line items
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [selectedProdId, setSelectedProdId] = useState<string>('');
  const [addQuantity, setAddQuantity] = useState<number>(1);
  const [addDiscount, setAddDiscount] = useState<number>(0);

  // Stamping simulation state
  const [isCertifying, setIsCertifying] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentCustomer = customers.find((c) => c.id === selectedCustomerId) || customers[0];

  // Calculate due date based on payment terms
  const calculateDueDate = () => {
    if (!currentCustomer || currentCustomer.paymentTermsDays === 0) return issueDate;
    const date = new Date(issueDate);
    date.setDate(date.getDate() + currentCustomer.paymentTermsDays);
    return date.toISOString().split('T')[0];
  };

  const handleAddItem = () => {
    setErrorMsg(null);
    if (!selectedProdId) {
      setErrorMsg('Por favor seleccione un producto del catálogo.');
      return;
    }

    const prod = products.find((p) => p.id === selectedProdId);
    if (!prod) return;

    if (prod.unit !== 'Servicio' && prod.currentStock < addQuantity) {
      setErrorMsg(`Stock insuficiente: Solo hay ${prod.currentStock} unidades disponibles de ${prod.name}.`);
      return;
    }

    // Check if already in items
    const existingIndex = items.findIndex((i) => i.productId === prod.id);
    const taxRate = prod.taxRate || profile.defaultTaxRate || 16;
    const discount = Math.min(100, Math.max(0, addDiscount));

    if (existingIndex > -1) {
      const updated = [...items];
      const existing = updated[existingIndex];
      const newQty = existing.quantity + addQuantity;
      if (prod.unit !== 'Servicio' && prod.currentStock < newQty) {
        setErrorMsg(`No puedes agregar más: El stock total disponible es ${prod.currentStock}.`);
        return;
      }
      const subtotal = newQty * prod.sellingPrice * (1 - discount / 100);
      const taxAmount = subtotal * (taxRate / 100);
      updated[existingIndex] = {
        ...existing,
        quantity: newQty,
        discountPercent: discount,
        subtotal: Math.round(subtotal * 100) / 100,
        taxAmount: Math.round(taxAmount * 100) / 100,
        total: Math.round((subtotal + taxAmount) * 100) / 100,
      };
      setItems(updated);
    } else {
      const subtotal = addQuantity * prod.sellingPrice * (1 - discount / 100);
      const taxAmount = subtotal * (taxRate / 100);
      const newItem: InvoiceItem = {
        productId: prod.id,
        sku: prod.sku,
        name: prod.name,
        quantity: addQuantity,
        unitCost: prod.purchaseCost,
        unitPrice: prod.sellingPrice,
        discountPercent: discount,
        taxRate,
        subtotal: Math.round(subtotal * 100) / 100,
        taxAmount: Math.round(taxAmount * 100) / 100,
        total: Math.round((subtotal + taxAmount) * 100) / 100,
      };
      setItems([...items, newItem]);
    }

    // Reset picker
    setSelectedProdId('');
    setAddQuantity(1);
    setAddDiscount(0);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim() || !newCustTaxId.trim()) return;

    const newCust = StorageService.addCustomer({
      legalName: newCustName.trim(),
      taxId: newCustTaxId.trim(),
      email: newCustEmail.trim() || 'contacto@cliente.com',
      phone: newCustPhone.trim() || '+1 555-0199',
      address: newCustAddress.trim() || 'Dirección Comercial Principal',
      city: 'Ciudad Principal',
      paymentTermsDays: Number(newCustDays) || 0,
    });

    onCustomerAdded(newCust);
    setSelectedCustomerId(newCust.id);
    setIsAddingCustomer(false);
    setNewCustName('');
    setNewCustTaxId('');
    setNewCustEmail('');
    setNewCustPhone('');
    setNewCustAddress('');
  };

  // Calculations
  const subtotal = items.reduce((acc, item) => acc + item.subtotal, 0);
  const taxAmount = items.reduce((acc, item) => acc + item.taxAmount, 0);
  const total = subtotal + taxAmount;

  const handleEmitInvoice = (certifyImmediately: boolean) => {
    if (!currentCustomer) {
      setErrorMsg('Seleccione un cliente receptor para la factura.');
      return;
    }
    if (items.length === 0) {
      setErrorMsg('Debe agregar al menos un producto o servicio a la factura.');
      return;
    }

    if (certifyImmediately) {
      setIsCertifying(true);
      setTimeout(() => {
        const invoice = StorageService.createInvoice({
          customer: currentCustomer,
          items,
          paymentMethod,
          currency,
          notes,
          issueDate,
          dueDate: calculateDueDate(),
          shouldCertifyImmediately: true,
        });
        setIsCertifying(false);
        onInvoiceCreated(invoice.id);
      }, 700);
    } else {
      const invoice = StorageService.createInvoice({
        customer: currentCustomer,
        items,
        paymentMethod,
        currency,
        notes,
        issueDate,
        dueDate: calculateDueDate(),
        shouldCertifyImmediately: false,
      });
      onInvoiceCreated(invoice.id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/50 backdrop-blur-xs">
      <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white shrink-0">
          <div>
            <h2 className="text-base font-semibold tracking-tight">Nueva Factura Electrónica</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Serie {profile.invoicePrefix} · Folio #{String(profile.nextFolio || 49).padStart(4, '0')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-md transition-colors"
            aria-label="Cerrar panel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Customer Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
                Cliente Receptor
              </label>
              <button
                type="button"
                onClick={() => setIsAddingCustomer(!isAddingCustomer)}
                className="text-xs text-slate-600 hover:text-slate-900 font-medium flex items-center gap-1"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>{isAddingCustomer ? 'Cancelar' : 'Crear Nuevo Cliente'}</span>
              </button>
            </div>

            {isAddingCustomer ? (
              <form onSubmit={handleSaveCustomer} className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3 text-xs">
                <div className="font-medium text-slate-900">Registrar Nuevo Cliente Fiscal</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 mb-1">Razón Social *</label>
                    <input
                      type="text"
                      required
                      placeholder="Empresa o Nombre Completo"
                      value={newCustName}
                      onChange={(e) => setNewCustName(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-slate-900 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">Identificación Fiscal (RFC/NIT/CIF) *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: ABC120304-999"
                      value={newCustTaxId}
                      onChange={(e) => setNewCustTaxId(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-slate-900 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">Correo Electrónico</label>
                    <input
                      type="email"
                      placeholder="facturacion@cliente.com"
                      value={newCustEmail}
                      onChange={(e) => setNewCustEmail(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-slate-900 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">Teléfono</label>
                    <input
                      type="text"
                      placeholder="+52 55 1234 5678"
                      value={newCustPhone}
                      onChange={(e) => setNewCustPhone(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-slate-900 outline-none"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-slate-900 text-white font-medium rounded hover:bg-slate-800 transition-colors"
                >
                  Guardar y Asignar Cliente
                </button>
              </form>
            ) : (
              <div className="space-y-2">
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.legalName} ({c.taxId})
                    </option>
                  ))}
                </select>
                {currentCustomer && (
                  <div className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded border border-slate-200">
                    <span className="font-medium text-slate-800">{currentCustomer.legalName}</span> · {currentCustomer.taxId} · {currentCustomer.email}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Invoice Parameters: Dates, Currency, Payment Method */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Fecha Emisión</label>
              <input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Método de Pago</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900"
              >
                <option value="transfer">Transferencia Bancaria</option>
                <option value="credit_card">Tarjeta Crédito/Débito</option>
                <option value="credit_term">Crédito Comercial</option>
                <option value="cash">Efectivo</option>
              </select>
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Moneda</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as any)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900"
              >
                <option value="USD">USD ($ Dólar)</option>
                <option value="MXN">MXN ($ Peso Mexicano)</option>
                <option value="COP">COP ($ Peso Colombiano)</option>
                <option value="EUR">EUR (€ Euro)</option>
              </select>
            </div>
          </div>

          {/* Add Line Items Section */}
          <div className="space-y-3 pt-3 border-t border-slate-200">
            <label className="block text-xs font-semibold text-slate-800 uppercase tracking-wider">
              Agregar Productos / Servicios desde Inventario
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 text-xs">
              <div className="sm:col-span-6">
                <select
                  value={selectedProdId}
                  onChange={(e) => setSelectedProdId(e.target.value)}
                  className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 text-xs"
                >
                  <option value="">-- Seleccionar Producto del Inventario --</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id} disabled={p.unit !== 'Servicio' && p.currentStock <= 0}>
                      {p.name} [{p.sku}] - ${p.sellingPrice} {currency} {p.unit !== 'Servicio' ? `(Stock: ${p.currentStock})` : '(Servicio)'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <input
                  type="number"
                  min="1"
                  value={addQuantity}
                  onChange={(e) => setAddQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  placeholder="Cant."
                  className="w-full px-2 py-2 bg-white border border-slate-200 rounded text-center font-mono tabular-nums focus:outline-none focus:ring-1 focus:ring-slate-900 text-xs"
                />
              </div>

              <div className="sm:col-span-2">
                <input
                  type="number"
                  min="0"
                  max="90"
                  value={addDiscount}
                  onChange={(e) => setAddDiscount(Math.max(0, parseInt(e.target.value) || 0))}
                  placeholder="Desc %"
                  className="w-full px-2 py-2 bg-white border border-slate-200 rounded text-center font-mono tabular-nums focus:outline-none focus:ring-1 focus:ring-slate-900 text-xs"
                />
              </div>

              <div className="sm:col-span-2">
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="w-full h-full py-2 bg-slate-900 text-white font-medium rounded hover:bg-slate-800 transition-colors flex items-center justify-center gap-1 text-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Agregar</span>
                </button>
              </div>
            </div>
          </div>

          {/* Current Items List */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-slate-700">Partidas Incluidas ({items.length})</div>
            {items.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 border border-dashed border-slate-200 rounded-lg">
                No hay productos agregados a la factura todavía. Seleccione uno arriba.
              </div>
            ) : (
              <div className="border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-100 text-xs">
                {items.map((item, index) => (
                  <div key={index} className="p-3 flex items-center justify-between gap-3 bg-white hover:bg-slate-50">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-slate-900 truncate">{item.name}</div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {item.quantity} x ${item.unitPrice} {item.discountPercent > 0 ? `(-${item.discountPercent}%)` : ''} + IVA {item.taxRate}%
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-semibold font-mono tabular-nums text-slate-900">
                        ${item.total.toFixed(2)}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        className="text-rose-600 hover:text-rose-800 text-[11px] font-medium flex items-center gap-0.5 justify-end mt-0.5"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Quitar</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Totals Summary */}
          {items.length > 0 && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal Partidas:</span>
                <span className="font-mono tabular-nums">${subtotal.toFixed(2)} {currency}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>IVA General ({profile.defaultTaxRate}%):</span>
                <span className="font-mono tabular-nums">${taxAmount.toFixed(2)} {currency}</span>
              </div>
              <div className="pt-2 border-t border-slate-300 flex justify-between items-baseline font-bold text-slate-900">
                <span className="text-sm">Total a Facturar:</span>
                <span className="text-base font-mono tabular-nums text-slate-900">${total.toFixed(2)} {currency}</span>
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Notas Comerciales / Términos</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded text-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-200 rounded transition-colors"
          >
            Cancelar
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              disabled={items.length === 0 || isCertifying}
              onClick={() => handleEmitInvoice(false)}
              className="w-full sm:w-auto px-4 py-2 text-xs font-medium text-slate-800 bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-50 rounded transition-colors"
            >
              Guardar Borrador
            </button>

            <button
              type="button"
              disabled={items.length === 0 || isCertifying}
              onClick={() => handleEmitInvoice(true)}
              className="w-full sm:w-auto px-5 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded shadow-sm transition-colors flex items-center justify-center gap-2"
            >
              {isCertifying ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Timbrando con SAT/DIAN...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Emitir y Timbrar Factura</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
