import type {Metadata} from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'GestiónPro - Inventario, Facturación y Finanzas',
  description: 'Sistema integral de gestión empresarial con control de inventario en tiempo real, emisión de facturación electrónica con timbrado digital y reportes financieros automáticos responsive.',
  openGraph: {
    title: 'GestiónPro - Inventario, Facturación y Finanzas',
    description: 'Sistema integral de gestión empresarial con control de inventario en tiempo real, emisión de facturación electrónica con timbrado digital y reportes financieros automáticos responsive.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GestiónPro - Inventario, Facturación y Finanzas',
    description: 'Sistema integral de gestión empresarial con control de inventario en tiempo real, emisión de facturación electrónica con timbrado digital y reportes financieros automáticos responsive.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="es" className="h-full bg-slate-50 text-slate-900 antialiased">
      <body className="min-h-full flex flex-col font-sans selection:bg-slate-900 selection:text-white" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}

