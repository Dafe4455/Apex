import type { Metadata } from 'next';
import Providers from './providers';

export const metadata: Metadata = {
  title: 'Apex Markets — Professional Trading',
  description: 'Institutional-quality access to equities, derivatives, crypto, and FX.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, background: '#f5f0e8' }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
