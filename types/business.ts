export type ProductCategory =
  | 'Hardware & Computo'
  | 'Accesorios & Periféricos'
  | 'Redes & Conectividad'
  | 'Servicios & Consultoría'
  | 'Audio & Video'
  | 'Insumos de Oficina'
  | 'Otros';

export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string;
  category: ProductCategory;
  unit: string; // 'Unidad' | 'Servicio' | 'Caja' | 'Kit'
  purchaseCost: number; // Costo de adquisición unitario
  sellingPrice: number; // Precio de venta antes de IVA
  taxRate: number; // Porcentaje IVA (ej: 16 o 19)
  currentStock: number;
  minStockAlert: number;
  barcode: string;
  supplier: string;
  location: string;
  lastUpdated: string;
}

export type MovementType = 'in' | 'out' | 'adjustment' | 'sale_deduction';

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  type: MovementType;
  quantity: number;
  previousStock: number;
  newStock: number;
  reason: string;
  referenceDoc?: string; // e.g. Factura #FE-2026-0042 o Orden Compra
  date: string;
  userName: string;
}

export interface Customer {
  id: string;
  legalName: string;
  taxId: string; // RFC / RUT / NIT / CIF / NIF
  email: string;
  phone: string;
  address: string;
  city: string;
  paymentTermsDays: number; // 0 = Contado, 15, 30, 60
}

export interface InvoiceItem {
  productId: string;
  sku: string;
  name: string;
  quantity: number;
  unitCost: number; // para cálculo exacto de utilidad bruta
  unitPrice: number;
  discountPercent: number;
  taxRate: number; // ej: 16%
  subtotal: number; // quantity * unitPrice * (1 - discountPercent/100)
  taxAmount: number; // subtotal * (taxRate / 100)
  total: number; // subtotal + taxAmount
}

export type InvoiceStatus = 'draft' | 'certified' | 'sent' | 'paid' | 'cancelled';
export type PaymentMethod = 'transfer' | 'credit_card' | 'cash' | 'credit_term';

export interface ElectronicCertification {
  cufeUuid: string; // Código Único de Factura Electrónica / UUID Fiscal
  digitalSignature: string; // Sello digital / hash SHA-256
  qrPayload: string; // Cadena de validación QR para autoridad tributaria
  certifiedAt: string;
  taxAuthorityStatus: 'Aprobado y Timbrado' | 'En Validación' | 'Rechazado';
  certificateNumber: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string; // ej: 'FE-2026-0042'
  prefix: string; // 'FE'
  folio: number; // 42
  customer: Customer;
  issueDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  paymentMethod: PaymentMethod;
  currency: 'USD' | 'MXN' | 'COP' | 'EUR';
  items: InvoiceItem[];
  subtotal: number;
  totalDiscount: number;
  taxAmount: number;
  total: number;
  status: InvoiceStatus;
  certification?: ElectronicCertification;
  notes?: string;
  paidAt?: string;
}

export interface Expense {
  id: string;
  category: 'Alquiler' | 'Nómina & Sueldos' | 'Servicios Públicos' | 'Marketing & Publicidad' | 'Mantenimiento' | 'Logística' | 'Otros';
  description: string;
  amount: number;
  date: string;
  paymentMethod: PaymentMethod;
  supplier: string;
  reference?: string;
}

export interface CompanyProfile {
  legalName: string;
  commercialName: string;
  taxId: string;
  taxRegime: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  currency: 'USD' | 'MXN' | 'COP' | 'EUR';
  defaultTaxRate: number; // 16 o 19
  invoicePrefix: string;
  nextFolio: number;
  taxAuthorityName: string; // SAT, DIAN, SII, AEAT, SUNAT
}
