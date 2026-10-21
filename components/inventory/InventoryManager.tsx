'use client';

import React, { useState } from 'react';
import { Product, ProductCategory, StockMovement, CompanyProfile } from '@/types/business';
import { StorageService } from '@/lib/storage';
import {
  Package,
  Plus,
  ArrowUpDown,
  Search,
  AlertTriangle,
  History,
  Download,
  Filter,
  DollarSign,
  Boxes,
  CheckCircle2,
  X,
  Edit2,
  TrendingUp,
  Building,
} from 'lucide-react';

interface InventoryManagerProps {
  products: Product[];
  movements: StockMovement[];
  profile: CompanyProfile;
  onRefresh: () => void;
}

export function InventoryManager({ products, movements, profile, onRefresh }: InventoryManagerProps) {
  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [stockStatusFilter, setStockStatusFilter] = useState<'all' | 'low' | 'normal' | 'out'>('all');
  const [activeTab, setActiveTab] = useState<'catalog' | 'history'>('catalog');

  // Modals state
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isAdjustStockOpen, setIsAdjustStockOpen] = useState(false);
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [adjustType, setAdjustType] = useState<'in' | 'out' | 'adjustment'>('in');
  const [adjustQty, setAdjustQty] = useState<number>(10);
  const [adjustReason, setAdjustReason] = useState<string>('Recepción de orden de compra proveedor');

  // New product form state
  const [newProdName, setNewProdName] = useState('');
  const [newProdSku, setNewProdSku] = useState('');
  const [newProdCategory, setNewProdCategory] = useState<ProductCategory>('Hardware & Computo');
  const [newProdUnit, setNewProdUnit] = useState('Unidad');
  const [newProdCost, setNewProdCost] = useState<number>(50);
  const [newProdPrice, setNewProdPrice] = useState<number>(85);
  const [newProdTaxRate, setNewProdTaxRate] = useState<number>(profile.defaultTaxRate || 16);
  const [newProdStock, setNewProdStock] = useState<number>(10);
  const [newProdMinStock, setNewProdMinStock] = useState<number>(3);
  const [newProdBarcode, setNewProdBarcode] = useState('');
  const [newProdSupplier, setNewProdSupplier] = useState('');
  const [newProdLocation, setNewProdLocation] = useState('Bodega Principal');
  const [newProdDesc, setNewProdDesc] = useState('');

  // Calculations
  const totalPhysicalItems = products.filter((p) => p.unit !== 'Servicio').length;
  const totalCostValue = products.reduce((acc, p) => (p.unit !== 'Servicio' ? acc + p.purchaseCost * p.currentStock : acc), 0);
  const totalRetailValue = products.reduce((acc, p) => (p.unit !== 'Servicio' ? acc + p.sellingPrice * p.currentStock : acc), 0);
  const lowStockCount = products.filter((p) => p.unit !== 'Servicio' && p.currentStock <= p.minStockAlert).length;

  // Filtered products
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.barcode.includes(searchTerm) ||
      p.supplier.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;

    let matchesStock = true;
    if (stockStatusFilter === 'low') {
      matchesStock = p.unit !== 'Servicio' && p.currentStock <= p.minStockAlert && p.currentStock > 0;
    } else if (stockStatusFilter === 'out') {
      matchesStock = p.unit !== 'Servicio' && p.currentStock === 0;
    } else if (stockStatusFilter === 'normal') {
      matchesStock = p.unit === 'Servicio' || p.currentStock > p.minStockAlert;
    }

    return matchesSearch && matchesCategory && matchesStock;
  });

  const categories: ProductCategory[] = [
    'Hardware & Computo',
    'Accesorios & Periféricos',
    'Redes & Conectividad',
    'Servicios & Consultoría',
    'Audio & Video',
    'Insumos de Oficina',
    'Otros',
  ];

  // Handlers
  const handleOpenAdjust = (prod: Product) => {
    setAdjustingProduct(prod);
    setAdjustType('in');
    setAdjustQty(10);
    setAdjustReason(prod.currentStock <= prod.minStockAlert ? 'Reabastecimiento urgente por bajo stock' : 'Entrada regular de almacén');
    setIsAdjustStockOpen(true);
  };

  const handleSaveStockAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingProduct) return;

    StorageService.adjustStock({
      productId: adjustingProduct.id,
      type: adjustType,
      quantity: adjustQty,
      reason: adjustReason.trim() || 'Ajuste manual de existencias',
      userName: 'Responsable de Inventario',
    });

    setIsAdjustStockOpen(false);
    setAdjustingProduct(null);
    onRefresh();
  };

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName.trim() || !newProdSku.trim()) return;

    StorageService.addProduct({
      name: newProdName.trim(),
      sku: newProdSku.trim().toUpperCase(),
      category: newProdCategory,
      unit: newProdUnit,
      purchaseCost: Number(newProdCost) || 0,
      sellingPrice: Number(newProdPrice) || 0,
      taxRate: Number(newProdTaxRate) || 16,
      currentStock: Number(newProdStock) || 0,
      minStockAlert: Number(newProdMinStock) || 0,
      barcode: newProdBarcode.trim() || String(Math.floor(1000000000000 + Math.random() * 9000000000000)),
      supplier: newProdSupplier.trim() || 'Proveedor Directo',
      location: newProdLocation.trim() || 'Bodega Principal',
      description: newProdDesc.trim() || newProdName,
    });

    setIsAddProductOpen(false);
    // Reset form
    setNewProdName('');
    setNewProdSku('');
    setNewProdCost(50);
    setNewProdPrice(85);
    setNewProdStock(10);
    setNewProdMinStock(3);
    setNewProdBarcode('');
    setNewProdSupplier('');
    setNewProdDesc('');
    onRefresh();
  };

  const handleExportCSV = () => {
    const headers = ['SKU', 'Nombre', 'Categoria', 'Unidad', 'Costo Unitario', 'Precio Venta', 'Stock Actual', 'Stock Minimo', 'Valor Total Costo', 'Proveedor', 'Ubicacion'];
    const rows = products.map((p) => [
      `"${p.sku}"`,
      `"${p.name.replace(/"/g, '""')}"`,
      `"${p.category}"`,
      `"${p.unit}"`,
      p.purchaseCost,
      p.sellingPrice,
      p.currentStock,
      p.minStockAlert,
      (p.purchaseCost * p.currentStock).toFixed(2),
      `"${p.supplier}"`,
      `"${p.location}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Inventario_${profile.commercialName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">Control de Inventario</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Gestión de existencias en tiempo real, catálogo de productos y kardex de movimientos.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-2xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar CSV</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAddProductOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Producto</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-medium text-slate-500">Referencias en Catálogo</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1">{products.length}</div>
          <div className="text-[11px] text-slate-400 mt-1">{totalPhysicalItems} productos físicos · {products.length - totalPhysicalItems} servicios</div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-medium text-slate-500">Valoración al Costo</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1">
            ${totalCostValue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Capital invertido en almacén</div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-medium text-slate-500">Valor Potencial de Venta</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-emerald-800 mt-1">
            ${totalRetailValue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </div>
          <div className="text-[11px] text-emerald-700 mt-1">
            Margen bruto teórico: +{Math.round(((totalRetailValue - totalCostValue) / (totalCostValue || 1)) * 100)}%
          </div>
        </div>

        <div className={`p-4 rounded-xl border shadow-2xs ${lowStockCount > 0 ? 'bg-amber-50/70 border-amber-200' : 'bg-white border-slate-200'}`}>
          <div className={`text-xs font-medium ${lowStockCount > 0 ? 'text-amber-900' : 'text-slate-500'}`}>
            Alertas de Stock Crítico
          </div>
          <div className={`text-2xl font-bold font-mono tabular-nums mt-1 ${lowStockCount > 0 ? 'text-amber-900' : 'text-slate-900'}`}>
            {lowStockCount}
          </div>
          <div className={`text-[11px] mt-1 ${lowStockCount > 0 ? 'text-amber-700 font-medium' : 'text-slate-400'}`}>
            {lowStockCount > 0 ? 'Requieren reposición inmediata' : 'Todas las referencias con nivel óptimo'}
          </div>
        </div>
      </div>

      {/* Navigation Tabs (Catálogo vs Kardex) */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg w-fit text-xs font-medium">
        <button
          type="button"
          onClick={() => setActiveTab('catalog')}
          className={`px-3.5 py-1.5 rounded-md transition-colors ${
            activeTab === 'catalog' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Catálogo & Existencias ({products.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`px-3.5 py-1.5 rounded-md transition-colors ${
            activeTab === 'history' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Historial de Movimientos ({movements.length})
        </button>
      </div>

      {activeTab === 'catalog' ? (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nombre, SKU, código de barras o proveedor..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-900"
              >
                <option value="all">Todas las categorías</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              <select
                value={stockStatusFilter}
                onChange={(e) => setStockStatusFilter(e.target.value as any)}
                className="px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-900"
              >
                <option value="all">Todos los estados</option>
                <option value="low">Bajo Stock Mínimo ({lowStockCount})</option>
                <option value="normal">Nivel Normal</option>
                <option value="out">Agotados (0)</option>
              </select>
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Producto / SKU</th>
                    <th className="py-3 px-3">Categoría</th>
                    <th className="py-3 px-3 text-right">Costo Unit.</th>
                    <th className="py-3 px-3 text-right">Precio Venta</th>
                    <th className="py-3 px-3 text-right">Margen</th>
                    <th className="py-3 px-3 text-center">Stock Actual</th>
                    <th className="py-3 px-3">Estado</th>
                    <th className="py-3 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        No se encontraron productos que coincidan con la búsqueda o filtro.
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((p) => {
                      const isLowStock = p.unit !== 'Servicio' && p.currentStock <= p.minStockAlert;
                      const isOutOfStock = p.unit !== 'Servicio' && p.currentStock === 0;
                      const marginPercent = Math.round(((p.sellingPrice - p.purchaseCost) / (p.sellingPrice || 1)) * 100);

                      return (
                        <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-900">{p.name}</div>
                            <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                              SKU: {p.sku} · {p.supplier}
                            </div>
                          </td>
                          <td className="py-3 px-3 text-slate-600">{p.category}</td>
                          <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-600">
                            ${p.purchaseCost.toFixed(2)}
                          </td>
                          <td className="py-3 px-3 text-right font-mono tabular-nums font-semibold text-slate-900">
                            ${p.sellingPrice.toFixed(2)}
                          </td>
                          <td className="py-3 px-3 text-right font-mono tabular-nums text-emerald-700">
                            +{marginPercent}%
                          </td>
                          <td className="py-3 px-3 text-center font-mono tabular-nums font-bold">
                            {p.unit === 'Servicio' ? (
                              <span className="text-slate-500 font-normal">Servicio</span>
                            ) : (
                              <span className={isLowStock ? 'text-amber-800' : 'text-slate-900'}>
                                {p.currentStock} {p.unit}s
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            {p.unit === 'Servicio' ? (
                              <span className="text-[11px] text-slate-500">Ilimitado</span>
                            ) : isOutOfStock ? (
                              <span className="text-[11px] font-semibold text-rose-700">Agotado</span>
                            ) : isLowStock ? (
                              <span className="text-[11px] font-semibold text-amber-700 flex items-center gap-1">
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                                Bajo mín ({p.minStockAlert})
                              </span>
                            ) : (
                              <span className="text-[11px] text-emerald-700 font-medium">Óptimo</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => handleOpenAdjust(p)}
                              className="px-2.5 py-1 text-xs font-medium text-slate-800 bg-slate-100 hover:bg-slate-200 rounded transition-colors inline-flex items-center gap-1"
                            >
                              <ArrowUpDown className="w-3 h-3" />
                              <span>Ajustar Stock</span>
                            </button>
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
            {filteredProducts.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 bg-white rounded-xl border border-slate-200">
                No se encontraron productos.
              </div>
            ) : (
              filteredProducts.map((p) => {
                const isLowStock = p.unit !== 'Servicio' && p.currentStock <= p.minStockAlert;
                return (
                  <div key={p.id} className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-semibold text-sm text-slate-900">{p.name}</div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                          SKU: {p.sku} · {p.category}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold font-mono tabular-nums text-slate-900">
                          ${p.sellingPrice.toFixed(2)}
                        </div>
                        <div className="text-[10px] text-slate-500">Costo: ${p.purchaseCost.toFixed(2)}</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                      <div>
                        <span className="text-slate-500">Existencias: </span>
                        {p.unit === 'Servicio' ? (
                          <span className="font-medium text-slate-700">Servicio</span>
                        ) : (
                          <span className={`font-mono font-bold ${isLowStock ? 'text-amber-800' : 'text-slate-900'}`}>
                            {p.currentStock} {p.unit}s
                          </span>
                        )}
                        {isLowStock && (
                          <span className="ml-2 text-[10px] font-medium text-amber-700">
                            (Mínimo: {p.minStockAlert})
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleOpenAdjust(p)}
                        className="min-h-[44px] px-3 py-1.5 text-xs font-medium text-slate-800 bg-slate-100 active:bg-slate-200 rounded-lg flex items-center gap-1.5"
                      >
                        <ArrowUpDown className="w-3.5 h-3.5" />
                        <span>Ajustar Stock</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : (
        /* Kardex / Movements History Tab */
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
            <div className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
              Registro Histórico de Auditoría (Kardex)
            </div>
            <span className="text-xs text-slate-500">{movements.length} movimientos registrados</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px] bg-slate-50/75">
                  <th className="py-3 px-4">Fecha & Hora</th>
                  <th className="py-3 px-3">Producto / SKU</th>
                  <th className="py-3 px-3">Tipo Movimiento</th>
                  <th className="py-3 px-3 text-right">Cant.</th>
                  <th className="py-3 px-3 text-center">Previo &rarr; Nuevo</th>
                  <th className="py-3 px-4">Motivo / Documento</th>
                  <th className="py-3 px-4">Usuario</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {movements.map((m) => {
                  const isPositive = m.type === 'in' || (m.type === 'adjustment' && m.newStock > m.previousStock);
                  return (
                    <tr key={m.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">{m.date}</td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-900">{m.productName}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{m.sku}</div>
                      </td>
                      <td className="py-3 px-3">
                        {m.type === 'in' ? (
                          <span className="text-emerald-700 font-medium">Entrada Compra</span>
                        ) : m.type === 'sale_deduction' ? (
                          <span className="text-indigo-700 font-medium">Venta Facturada</span>
                        ) : m.type === 'out' ? (
                          <span className="text-rose-700 font-medium">Salida / Merma</span>
                        ) : (
                          <span className="text-slate-700 font-medium">Ajuste de Conteo</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums font-semibold">
                        <span className={isPositive ? 'text-emerald-700' : 'text-slate-800'}>
                          {isPositive ? `+${m.quantity}` : `-${m.quantity}`}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-mono tabular-nums text-slate-500">
                        {m.previousStock} &rarr; <span className="font-bold text-slate-900">{m.newStock}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                        {m.reason}
                        {m.referenceDoc && <span className="font-mono text-slate-800 ml-1">[{m.referenceDoc}]</span>}
                      </td>
                      <td className="py-3 px-4 text-slate-500">{m.userName}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: Stock Adjustment */}
      {isAdjustStockOpen && adjustingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
              <div>
                <h3 className="text-sm font-semibold">Ajustar Existencias de Inventario</h3>
                <p className="text-xs text-slate-400 truncate max-w-xs">{adjustingProduct.name}</p>
              </div>
              <button onClick={() => setIsAdjustStockOpen(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStockAdjustment} className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center">
                <div>
                  <span className="text-slate-500 block">Stock Actual en Bodega:</span>
                  <span className="text-base font-bold font-mono text-slate-900">
                    {adjustingProduct.currentStock} {adjustingProduct.unit}s
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 block">Mínimo sugerido:</span>
                  <span className="font-mono text-slate-700">{adjustingProduct.minStockAlert} unidades</span>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Tipo de Operación</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustType('in')}
                    className={`py-2 px-2 text-center rounded border transition-colors ${
                      adjustType === 'in'
                        ? 'bg-slate-900 text-white border-slate-900 font-semibold'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    + Entrada Compra
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustType('out')}
                    className={`py-2 px-2 text-center rounded border transition-colors ${
                      adjustType === 'out'
                        ? 'bg-slate-900 text-white border-slate-900 font-semibold'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    - Salida / Merma
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustType('adjustment')}
                    className={`py-2 px-2 text-center rounded border transition-colors ${
                      adjustType === 'adjustment'
                        ? 'bg-slate-900 text-white border-slate-900 font-semibold'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    = Fijar Conteo
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  {adjustType === 'adjustment' ? 'Nuevo Stock Total Contado' : 'Cantidad a Mover'}
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-slate-900 font-mono text-sm focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Motivo o Justificación del Movimiento *</label>
                <input
                  type="text"
                  required
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="Ej: Factura Proveedor OC-891 o Ajuste de inventario físico"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAdjustStockOpen(false)}
                  className="px-3 py-2 text-slate-600 hover:bg-slate-100 rounded"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 text-white font-medium rounded hover:bg-slate-800 transition-colors"
                >
                  Confirmar y Guardar Movimiento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: New Product Creation */}
      {isAddProductOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-xl bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden my-6">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
              <h3 className="text-sm font-semibold">Registrar Nuevo Producto o Servicio</h3>
              <button onClick={() => setIsAddProductOpen(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-medium text-slate-700 mb-1">Nombre Comercial del Producto *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Teclado Ergonómico Inalámbrico"
                    value={newProdName}
                    onChange={(e) => setNewProdName(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-slate-900 focus:ring-1 focus:ring-slate-900 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Código SKU *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: TEC-ERG-01"
                    value={newProdSku}
                    onChange={(e) => setNewProdSku(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded font-mono text-slate-900 focus:ring-1 focus:ring-slate-900 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Categoría</label>
                  <select
                    value={newProdCategory}
                    onChange={(e) => setNewProdCategory(e.target.value as ProductCategory)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-slate-900 focus:ring-1 focus:ring-slate-900 outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Costo de Compra (USD) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={newProdCost}
                    onChange={(e) => setNewProdCost(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded font-mono text-slate-900 focus:ring-1 focus:ring-slate-900 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Precio de Venta al Público (USD) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={newProdPrice}
                    onChange={(e) => setNewProdPrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded font-mono text-slate-900 focus:ring-1 focus:ring-slate-900 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Stock Inicial</label>
                  <input
                    type="number"
                    min="0"
                    value={newProdStock}
                    onChange={(e) => setNewProdStock(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded font-mono text-slate-900 focus:ring-1 focus:ring-slate-900 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Alerta Stock Mínimo</label>
                  <input
                    type="number"
                    min="0"
                    value={newProdMinStock}
                    onChange={(e) => setNewProdMinStock(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded font-mono text-slate-900 focus:ring-1 focus:ring-slate-900 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Proveedor Principal</label>
                  <input
                    type="text"
                    placeholder="Ej: Distribuidora Mayorista"
                    value={newProdSupplier}
                    onChange={(e) => setNewProdSupplier(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-slate-900 focus:ring-1 focus:ring-slate-900 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Ubicación en Bodega</label>
                  <input
                    type="text"
                    placeholder="Ej: Estante B-4"
                    value={newProdLocation}
                    onChange={(e) => setNewProdLocation(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-slate-900 focus:ring-1 focus:ring-slate-900 outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-medium text-slate-700 mb-1">Descripción Técnica</label>
                  <textarea
                    rows={2}
                    placeholder="Detalles y especificaciones del producto..."
                    value={newProdDesc}
                    onChange={(e) => setNewProdDesc(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-slate-900 focus:ring-1 focus:ring-slate-900 outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddProductOpen(false)}
                  className="px-3 py-2 text-slate-600 hover:bg-slate-100 rounded"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 text-white font-medium rounded hover:bg-slate-800 transition-colors"
                >
                  Guardar Producto en Inventario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
