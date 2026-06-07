import type { Metadata } from 'next';
import Providers from './providers';

export const metadata: Metadata = {
  title: 'Apex Markets',
  description: ' Global easy access to equities, derivatives, crypto, and FX.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
<meta name="theme-color" content="#0a1a26" />
<meta name="mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<meta name="apple-mobile-web-app-title" content="Apex Markets" />
<link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <script dangerouslySetInnerHTML={{ __html: `
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js');
    });
  }
`}} />
      <body style={{ margin: 0, padding: 0, background: '#f5f0e8' }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
