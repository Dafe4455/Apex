import type { Metadata, Viewport } from 'next';
import Providers from './providers';
import SWRegister from './sw-register';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export const metadata: Metadata = {
  title: 'Apex Markets',
  description: 'Global easy access to equities, derivatives, crypto, and FX.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Apex Markets',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    apple: '/icon-192.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#0a1a26',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, background: '#0a1a26' }}>
        <Providers>
          <LanguageSwitcher />
          {children}
        </Providers>
        <SWRegister />
      </body>
    </html>
  );
}
