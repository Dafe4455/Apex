'use client';

import { useState, useEffect } from 'react';

const languages = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'pt', label: 'Português', flag: '🇧🇷' },
  { code: 'ja', label: '日本語', flag: '🇯🇵' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
];

export default function GoogleTranslate() {
  const [current, setCurrent] = useState('en');
  const [open, setOpen] = useState(false);

  // 1. Parse the cookie on mount so the dropdown state persists after page reload
  useEffect(() => {
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift();
    };

    const googtrans = getCookie('googtrans'); // Returns something like "/en/ja"
    if (googtrans) {
      const langCode = googtrans.split('/').pop(); // Extracts "ja"
      if (langCode && languages.some(l => l.code === langCode)) {
        setCurrent(langCode);
      }
    }
  }, []);

  // 2. Inject CSS to suppress the Google Banner layout shifts completely
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      .goog-te-banner-frame, 
      .goog-te-banner, 
      #goog-gt-tt, 
      .goog-te-balloon-frame,
      #goog-gt-inside,
      .template-popup { 
        display: none !important; 
      }
      body { 
        top: 0 !important; 
        position: static !important; 
      }
      .skiptranslate { 
        display: none !important; 
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  function switchLocale(langCode: string) {
    setCurrent(langCode);
    setOpen(false);

    if (langCode === 'en') {
      document.cookie = 'googtrans=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      document.cookie = 'googtrans=; path=/; domain=' + window.location.hostname + '; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    } else {
      document.cookie = `googtrans=/en/${langCode}; path=/`;
      document.cookie = `googtrans=/en/${langCode}; path=/; domain=${window.location.hostname}`;
    }

    window.location.reload();
  }

  const selected = languages.find(l => l.code === current) || languages[0];

  return (
    <div style={{ position: 'relative' }}>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 10,
          padding: '8px 14px',
          color: '#e2e8f0',
          fontSize: 14,
          cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        <span style={{ fontSize: 18 }}>{selected.flag}</span>
        <span>{selected.label}</span>
        <span style={{ color: '#64748b', fontSize: 10, marginLeft: 2 }}>{open ? '▲' : '▼'}</span>
      </button>

      {/* Dropdown */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 40,
            }}
          />
          <div style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            zIndex: 50,
            background: '#0f1f2e',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 14,
            overflow: 'hidden',
            minWidth: 200,
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          }}>
            {languages.map((lang, i) => (
              <button
                key={lang.code}
                onClick={() => switchLocale(lang.code)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  padding: '14px 18px',
                  background: lang.code === current ? 'rgba(56,189,248,0.08)' : 'transparent',
                  border: 'none',
                  borderBottom: i < languages.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                  color: lang.code === current ? '#38bdf8' : '#e2e8f0',
                  fontSize: 15,
                  cursor: 'pointer',
                  textAlign: 'left',
                  gap: 12,
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 20 }}>{lang.flag}</span>
                  <span>{lang.label}</span>
                </span>
                {lang.code === current && (
                  <span style={{
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    border: '2px solid #38bdf8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <span style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: '#38bdf8',
                      display: 'block',
                    }} />
                  </span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
