import type { Metadata, Viewport } from 'next';
import { Geist } from 'next/font/google';
import { ServiceWorkerRegister } from '@/components/pwa/ServiceWorkerRegister';
import './globals.css';

const geist = Geist({ subsets: ['latin'], variable: '--font-geist-sans' });

export const metadata: Metadata = {
  applicationName: 'Sallon-ConnecT',
  title: {
    default: 'Sallon-ConnecT',
    template: '%s | Sallon-ConnecT',
  },
  description: 'Hub local intelligent pour salon connecte',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'Sallon-ConnecT',
    statusBarStyle: 'black-translucent',
  },
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#0A2540',
  colorScheme: 'dark',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${geist.variable} h-full`}>
      <body className="min-h-full bg-navy text-slate-200">
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
