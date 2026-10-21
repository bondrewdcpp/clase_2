import { CompanyProfile, Customer, Product, Invoice, Expense, StockMovement, InvoiceStatus } from '@/types/business';
import { initialCompanyProfile, initialCustomers, initialProducts, initialInvoices, initialExpenses, initialStockMovements } from './mockData';

const STORAGE_KEYS = {
  PROFILE: 'gestionpro_company_profile',
  PRODUCTS: 'gestionpro_products',
  CUSTOMERS: 'gestionpro_customers',
  INVOICES: 'gestionpro_invoices',
  EXPENSES: 'gestionpro_expenses',
  MOVEMENTS: 'gestionpro_stock_movements',
};

// Safe JSON parser helper
function getStoredItem<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (error) {
    console.error(`Error loading ${key} from storage:`, error);
    return fallback;
  }
}

function setStoredItem<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error saving ${key} to storage:`, error);
  }
}

// Generate simple deterministic UUID
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Generate digital signature hash simulation
export function generateDigitalHash(): string {
  const chars = '0123456789abcdef';
  let hash = '';
  for (let i = 0; i < 64; i++) {
    hash += chars[Math.floor(Math.random() * chars.length)];
  }
  return hash;
}

export const StorageService = {
  // Reset all data to initial demo seed
  resetAll(): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(initialCompanyProfile));
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(initialProducts));
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(initialCustomers));
    localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(initialInvoices));
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(initialExpenses));
    localStorage.setItem(STORAGE_KEYS.MOVEMENTS, JSON.stringify(initialStockMovements));
  },

  // Company Profile
  getProfile(): CompanyProfile {
    return getStoredItem(STORAGE_KEYS.PROFILE, initialCompanyProfile);
  },
  saveProfile(profile: CompanyProfile): void {
    setStoredItem(STORAGE_KEYS.PROFILE, profile);
  },

  // Products
  getProducts(): Product[] {
    return getStoredItem(STORAGE_KEYS.PRODUCTS, initialProducts);
  },
  saveProducts(products: Product[]): void {
    setStoredItem(STORAGE_KEYS.PRODUCTS, products);
  },
  addProduct(product: Omit<Product, 'id' | 'lastUpdated'>): Product {
    const products = this.getProducts();
    const newProduct: Product = {
      ...product,
      id: `prod-${Date.now()}`,
      lastUpdated: new Date().toISOString().split('T')[0],
    };
    const updated = [newProduct, ...products];
    this.saveProducts(updated);

    // Register initial stock movement if > 0
    if (newProduct.currentStock > 0) {
      this.addStockMovement({
        productId: newProduct.id,
        productName: newProduct.name,
        sku: newProduct.sku,
        type: 'in',
        quantity: newProduct.currentStock,
        previousStock: 0,
        newStock: newProduct.currentStock,
        reason: 'Carga inicial de inventario al registrar producto',
        userName: 'Administrador',
      });
    }

    return newProduct;
  },
  updateProduct(product: Product): void {
    const products = this.getProducts();
    const updated = products.map((p) => (p.id === product.id ? { ...product, lastUpdated: new Date().toISOString().split('T')[0] } : p));
    this.saveProducts(updated);
  },
  deleteProduct(productId: string): void {
    const products = this.getProducts();
    const updated = products.filter((p) => p.id !== productId);
    this.saveProducts(updated);
  },

  // Stock movements & adjustments
  getMovements(): StockMovement[] {
    return getStoredItem(STORAGE_KEYS.MOVEMENTS, initialStockMovements);
  },
  addStockMovement(data: Omit<StockMovement, 'id' | 'date'>): StockMovement {
    const movements = this.getMovements();
    const now = new Date();
    const dateFormatted = `${now.toISOString().split('T')[0]} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const newMovement: StockMovement = {
      ...data,
      id: `mov-${Date.now()}`,
      date: dateFormatted,
    };
    setStoredItem(STORAGE_KEYS.MOVEMENTS, [newMovement, ...movements]);
    return newMovement;
  },
  adjustStock(params: {
    productId: string;
    type: 'in' | 'out' | 'adjustment';
    quantity: number;
    reason: string;
    userName?: string;
  }): { product: Product; movement: StockMovement } | null {
    const products = this.getProducts();
    const prodIndex = products.findIndex((p) => p.id === params.productId);
    if (prodIndex === -1) return null;

    const prod = products[prodIndex];
    const prevStock = prod.currentStock;
    let newStock = prevStock;

    if (params.type === 'in') {
      newStock = prevStock + Math.abs(params.quantity);
    } else if (params.type === 'out') {
      newStock = Math.max(0, prevStock - Math.abs(params.quantity));
    } else if (params.type === 'adjustment') {
      newStock = Math.max(0, params.quantity);
    }

    const updatedProd: Product = {
      ...prod,
      currentStock: newStock,
      lastUpdated: new Date().toISOString().split('T')[0],
    };
    products[prodIndex] = updatedProd;
    this.saveProducts(products);

    const movement = this.addStockMovement({
      productId: prod.id,
      productName: prod.name,
      sku: prod.sku,
      type: params.type,
      quantity: Math.abs(newStock - prevStock),
      previousStock: prevStock,
      newStock: newStock,
      reason: params.reason,
      userName: params.userName || 'Administrador',
    });

    return { product: updatedProd, movement };
  },

  // Customers
  getCustomers(): Customer[] {
    return getStoredItem(STORAGE_KEYS.CUSTOMERS, initialCustomers);
  },
  saveCustomers(customers: Customer[]): void {
    setStoredItem(STORAGE_KEYS.CUSTOMERS, customers);
  },
  addCustomer(customer: Omit<Customer, 'id'>): Customer {
    const customers = this.getCustomers();
    const newCust: Customer = {
      ...customer,
      id: `cust-${Date.now()}`,
    };
    this.saveCustomers([newCust, ...customers]);
    return newCust;
  },

  // Invoices & Electronic Invoicing
  getInvoices(): Invoice[] {
    return getStoredItem(STORAGE_KEYS.INVOICES, initialInvoices);
  },
  saveInvoices(invoices: Invoice[]): void {
    setStoredItem(STORAGE_KEYS.INVOICES, invoices);
  },
  createInvoice(params: {
    customer: Customer;
    items: Invoice['items'];
    paymentMethod: Invoice['paymentMethod'];
    currency: Invoice['currency'];
    notes?: string;
    issueDate?: string;
    dueDate?: string;
    shouldCertifyImmediately?: boolean;
  }): Invoice {
    const profile = this.getProfile();
    const invoices = this.getInvoices();
    const products = this.getProducts();

    const folio = profile.nextFolio || 50;
    const invoiceNumber = `${profile.invoicePrefix}-${String(folio).padStart(4, '0')}`;
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    // Calculate totals
    let subtotal = 0;
    let totalDiscount = 0;
    let taxAmount = 0;

    params.items.forEach((item) => {
      subtotal += item.subtotal;
      totalDiscount += (item.quantity * item.unitPrice * (item.discountPercent || 0)) / 100;
      taxAmount += item.taxAmount;
    });

    const total = subtotal + taxAmount;
    const shouldCertify = params.shouldCertifyImmediately ?? true;

    const cufe = generateUUID();
    const hash = generateDigitalHash();

    const invoice: Invoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber,
      prefix: profile.invoicePrefix,
      folio,
      customer: params.customer,
      issueDate: params.issueDate || todayStr,
      dueDate: params.dueDate || todayStr,
      paymentMethod: params.paymentMethod,
      currency: params.currency || profile.currency,
      items: params.items,
      subtotal: Math.round(subtotal * 100) / 100,
      totalDiscount: Math.round(totalDiscount * 100) / 100,
      taxAmount: Math.round(taxAmount * 100) / 100,
      total: Math.round(total * 100) / 100,
      status: shouldCertify ? 'certified' : 'draft',
      notes: params.notes || '',
      certification: shouldCertify
        ? {
            cufeUuid: cufe,
            digitalSignature: hash,
            qrPayload: `https://verificador-fiscal.gov/consulta?uuid=${cufe}&total=${total.toFixed(2)}&emisor=${encodeURIComponent(profile.taxId)}`,
            certifiedAt: now.toISOString(),
            taxAuthorityStatus: 'Aprobado y Timbrado',
            certificateNumber: '00001000000508924119',
          }
        : undefined,
    };

    // Deduct stock for physical items
    const updatedProducts = [...products];
    params.items.forEach((item) => {
      const pIndex = updatedProducts.findIndex((p) => p.id === item.productId);
      if (pIndex !== -1) {
        const prod = updatedProducts[pIndex];
        // Do not deduct infinite services
        if (prod.unit !== 'Servicio') {
          const prev = prod.currentStock;
          const next = Math.max(0, prev - item.quantity);
          updatedProducts[pIndex] = {
            ...prod,
            currentStock: next,
            lastUpdated: todayStr,
          };
          this.addStockMovement({
            productId: prod.id,
            productName: prod.name,
            sku: prod.sku,
            type: 'sale_deduction',
            quantity: item.quantity,
            previousStock: prev,
            newStock: next,
            reason: `Venta por Factura Electrónica ${invoiceNumber}`,
            referenceDoc: invoiceNumber,
            userName: 'Facturación Electrónica',
          });
        }
      }
    });

    this.saveProducts(updatedProducts);
    this.saveInvoices([invoice, ...invoices]);

    // Advance folio
    this.saveProfile({
      ...profile,
      nextFolio: folio + 1,
    });

    return invoice;
  },

  certifyInvoice(invoiceId: string): Invoice | null {
    const invoices = this.getInvoices();
    const index = invoices.findIndex((i) => i.id === invoiceId);
    if (index === -1) return null;

    const inv = invoices[index];
    const profile = this.getProfile();
    const cufe = generateUUID();
    const hash = generateDigitalHash();

    const certified: Invoice = {
      ...inv,
      status: 'certified',
      certification: {
        cufeUuid: cufe,
        digitalSignature: hash,
        qrPayload: `https://verificador-fiscal.gov/consulta?uuid=${cufe}&total=${inv.total.toFixed(2)}&emisor=${encodeURIComponent(profile.taxId)}`,
        certifiedAt: new Date().toISOString(),
        taxAuthorityStatus: 'Aprobado y Timbrado',
        certificateNumber: '00001000000508924119',
      },
    };

    invoices[index] = certified;
    this.saveInvoices(invoices);
    return certified;
  },

  markInvoicePaid(invoiceId: string): Invoice | null {
    const invoices = this.getInvoices();
    const index = invoices.findIndex((i) => i.id === invoiceId);
    if (index === -1) return null;

    const inv = invoices[index];
    const updated: Invoice = {
      ...inv,
      status: 'paid',
      paidAt: new Date().toISOString().split('T')[0],
    };

    invoices[index] = updated;
    this.saveInvoices(invoices);
    return updated;
  },

  cancelInvoice(invoiceId: string, reason: string): Invoice | null {
    const invoices = this.getInvoices();
    const index = invoices.findIndex((i) => i.id === invoiceId);
    if (index === -1) return null;

    const inv = invoices[index];
    // Return items to inventory
    const products = this.getProducts();
    const todayStr = new Date().toISOString().split('T')[0];

    inv.items.forEach((item) => {
      const pIndex = products.findIndex((p) => p.id === item.productId);
      if (pIndex !== -1 && products[pIndex].unit !== 'Servicio') {
        const prod = products[pIndex];
        const prev = prod.currentStock;
        const next = prev + item.quantity;
        products[pIndex] = {
          ...prod,
          currentStock: next,
          lastUpdated: todayStr,
        };
        this.addStockMovement({
          productId: prod.id,
          productName: prod.name,
          sku: prod.sku,
          type: 'in',
          quantity: item.quantity,
          previousStock: prev,
          newStock: next,
          reason: `Devolución por anulación de Factura ${inv.invoiceNumber}: ${reason}`,
          referenceDoc: `NC-${inv.invoiceNumber}`,
          userName: 'Auditoría Facturación',
        });
      }
    });

    this.saveProducts(products);

    const cancelled: Invoice = {
      ...inv,
      status: 'cancelled',
      notes: `${inv.notes ? inv.notes + ' | ' : ''}ANULADA: ${reason}`,
    };

    invoices[index] = cancelled;
    this.saveInvoices(invoices);
    return cancelled;
  },

  // Expenses
  getExpenses(): Expense[] {
    return getStoredItem(STORAGE_KEYS.EXPENSES, initialExpenses);
  },
  saveExpenses(expenses: Expense[]): void {
    setStoredItem(STORAGE_KEYS.EXPENSES, expenses);
  },
  addExpense(expense: Omit<Expense, 'id'>): Expense {
    const expenses = this.getExpenses();
    const newExp: Expense = {
      ...expense,
      id: `exp-${Date.now()}`,
    };
    this.saveExpenses([newExp, ...expenses]);
    return newExp;
  },
  deleteExpense(expenseId: string): void {
    const expenses = this.getExpenses();
    this.saveExpenses(expenses.filter((e) => e.id !== expenseId));
  },
};
