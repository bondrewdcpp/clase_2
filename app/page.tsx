'use client';

import React, { useState, useEffect } from 'react';
import { Product, Invoice, Expense, Customer, CompanyProfile, StockMovement } from '@/types/business';
import { StorageService } from '@/lib/storage';
import { AppNavigation, NavTab } from '@/components/layout/AppNavigation';
import { ExecutiveDashboard } from '@/components/dashboard/ExecutiveDashboard';
import { InventoryManager } from '@/components/inventory/InventoryManager';
import { InvoicesList } from '@/components/invoicing/InvoicesList';
import { FinancialReports } from '@/components/reports/FinancialReports';
import { BusinessSettingsModal } from '@/components/settings/BusinessSettingsModal';
import { NewInvoiceDrawer } from '@/components/invoicing/NewInvoiceDrawer';
import { ElectronicInvoiceModal } from '@/components/invoicing/ElectronicInvoiceModal';

// Hydration-safe mount hook
const emptySubscribe = () => () => {};
function useIsClient() {
  return React.useSyncExternalStore(emptySubscribe, () => true, () => false);
}

export default function Home() {
  const isMounted = useIsClient();
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');

  // Application Data States initialized lazily from StorageService
  const [products, setProducts] = useState<Product[]>(() => StorageService.getProducts());
  const [invoices, setInvoices] = useState<Invoice[]>(() => StorageService.getInvoices());
  const [expenses, setExpenses] = useState<Expense[]>(() => StorageService.getExpenses());
  const [customers, setCustomers] = useState<Customer[]>(() => StorageService.getCustomers());
  const [movements, setMovements] = useState<StockMovement[]>(() => StorageService.getMovements());
  const [profile, setProfile] = useState<CompanyProfile>(() => StorageService.getProfile());

  // Interactive Overlays
  const [isNewInvoiceOpen, setIsNewInvoiceOpen] = useState(false);
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);

  // Reload from Storage helper
  const loadData = () => {
    setProducts(StorageService.getProducts());
    setInvoices(StorageService.getInvoices());
    setExpenses(StorageService.getExpenses());
    setCustomers(StorageService.getCustomers());
    setMovements(StorageService.getMovements());
    setProfile(StorageService.getProfile());
  };

  // Handlers
  const handleInvoiceCreated = (newInvoiceId: string) => {
    loadData();
    setIsNewInvoiceOpen(false);
    // Find newly created invoice and open printable modal
    const freshInvoices = StorageService.getInvoices();
    const created = freshInvoices.find((i) => i.id === newInvoiceId);
    if (created) {
      setViewingInvoice(created);
    }
  };

  const handleMarkPaid = (invoiceId: string) => {
    StorageService.markInvoicePaid(invoiceId);
    loadData();
    if (viewingInvoice && viewingInvoice.id === invoiceId) {
      setViewingInvoice({
        ...viewingInvoice,
        status: 'paid',
        paidAt: new Date().toISOString().split('T')[0],
      });
    }
  };

  const handleCertifyDraft = (invoiceId: string) => {
    const certified = StorageService.certifyInvoice(invoiceId);
    loadData();
    if (certified) {
      setViewingInvoice(certified);
    }
  };

  const handleCancelInvoice = (invoiceId: string, reason: string) => {
    StorageService.cancelInvoice(invoiceId, reason);
    loadData();
    if (viewingInvoice && viewingInvoice.id === invoiceId) {
      setViewingInvoice(null);
    }
  };

  const handleCustomerAdded = (newCustomer: Customer) => {
    setCustomers((prev) => [newCustomer, ...prev]);
  };

  const handleProfileUpdated = (newProfile: CompanyProfile) => {
    setProfile(newProfile);
  };

  const handleResetData = () => {
    StorageService.resetAll();
    loadData();
  };

  // Safe SSR placeholder
  if (!isMounted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-slate-400">
        <div className="flex items-center gap-2 text-sm font-medium">
          <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin" />
          <span>Iniciando GestiónPro...</span>
        </div>
      </div>
    );
  }

  const lowStockCount = products.filter((p) => p.unit !== 'Servicio' && p.currentStock <= p.minStockAlert).length;
  const pendingInvoicesCount = invoices.filter((i) => i.status === 'certified' || i.status === 'sent').length;

  return (
    <AppNavigation
      activeTab={activeTab}
      onSelectTab={setActiveTab}
      profile={profile}
      lowStockCount={lowStockCount}
      pendingInvoicesCount={pendingInvoicesCount}
      onOpenNewInvoice={() => setIsNewInvoiceOpen(true)}
    >
      {/* Dynamic View rendering */}
      {activeTab === 'dashboard' && (
        <ExecutiveDashboard
          invoices={invoices}
          products={products}
          expenses={expenses}
          profile={profile}
          onNavigate={setActiveTab}
          onOpenNewInvoice={() => setIsNewInvoiceOpen(true)}
          onViewInvoice={(inv) => setViewingInvoice(inv)}
          onRefresh={loadData}
        />
      )}

      {activeTab === 'inventory' && (
        <InventoryManager
          products={products}
          movements={movements}
          profile={profile}
          onRefresh={loadData}
        />
      )}

      {activeTab === 'invoicing' && (
        <InvoicesList
          invoices={invoices}
          profile={profile}
          onOpenNewInvoice={() => setIsNewInvoiceOpen(true)}
          onViewInvoice={(inv) => setViewingInvoice(inv)}
          onMarkPaid={handleMarkPaid}
          onCertifyDraft={handleCertifyDraft}
        />
      )}

      {activeTab === 'reports' && (
        <FinancialReports
          invoices={invoices}
          expenses={expenses}
          products={products}
          profile={profile}
          onRefresh={loadData}
          onMarkPaid={handleMarkPaid}
        />
      )}

      {activeTab === 'settings' && (
        <BusinessSettingsModal
          profile={profile}
          onProfileUpdated={handleProfileUpdated}
          onResetData={handleResetData}
        />
      )}

      {/* New Invoice Slide-over Drawer */}
      <NewInvoiceDrawer
        isOpen={isNewInvoiceOpen}
        onClose={() => setIsNewInvoiceOpen(false)}
        products={products}
        customers={customers}
        profile={profile}
        onInvoiceCreated={handleInvoiceCreated}
        onCustomerAdded={handleCustomerAdded}
      />

      {/* Printable Electronic Invoice Official Modal */}
      <ElectronicInvoiceModal
        invoice={viewingInvoice}
        profile={profile}
        isOpen={Boolean(viewingInvoice)}
        onClose={() => setViewingInvoice(null)}
        onMarkPaid={handleMarkPaid}
        onCancelInvoice={handleCancelInvoice}
      />
    </AppNavigation>
  );
}
