import type { Metadata, Viewport } from 'next';
import Providers from './providers';
import SWRegister from './sw-register';

export const metadata: Metadata = {
  title: 'Apex Markets',
  description: 'Global access to equities, derivatives, crypto, and FX.',
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
    <html lang="en" translate="no">
      <head>
        <meta name="google" content="notranslate" />
        <style dangerouslySetInnerHTML={{ __html: `
          .goog-te-banner-frame,
          .goog-te-banner-frame.skiptranslate,
          iframe.goog-te-banner-frame {
            display: none !important;
            visibility: hidden !important;
            height: 0 !important;
          }
          body {
            top: 0 !important;
            position: static !important;
          }
        `}} />
        <script dangerouslySetInnerHTML={{ __html: `
          var _gtKill = setInterval(function() {
            var banner = document.querySelector('iframe.goog-te-banner-frame');
            if (banner) {
              banner.style.display = 'none';
              banner.style.height = '0';
              document.body.style.top = '0';
            }
          }, 300);
          setTimeout(function() { clearInterval(_gtKill); }, 5000);
        `}} />
        <script
          src="https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
          async
        />
        <script dangerouslySetInnerHTML={{ __html: `
          function googleTranslateElementInit() {
            new google.translate.TranslateElement({
              pageLanguage: 'en',
              autoDisplay: false
            }, 'google_translate_element');
          }
        `}} />
      </head>
      <body style={{ margin: 0, padding: 0, background: '#0a1a26' }}>
        <div id="google_translate_element" style={{ display: 'none' }} />
        <Providers>{children}</Providers>
        <SWRegister />
      </body>
    </html>
  );
}
