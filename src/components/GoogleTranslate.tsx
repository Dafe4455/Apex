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

    const googtrans = getCookie('googtrans');
    if (googtrans) {
      const langCode = googtrans.split('/').pop();
      if (langCode && languages.some(l => l.code === langCode)) {
        setCurrent(langCode);
      }
    }
  }, []);

  // 2. Suppress the Google Banner and destroy dynamic scripts/spinners on the fly
  useEffect(() => {
    // Inject custom CSS to make sure structural components stay hidden
    const style = document.createElement('style');
    style.innerHTML = `
      .goog-te-banner-frame, 
      .goog-te-banner, 
      #goog-gt-tt, 
      .goog-te-balloon-frame,
      #goog-gt-inside,
      .template-popup,
      .goog-te-spinner-pos,     
      .goog-te-spinner,         
      #google_translate_element { 
        display: none !important; 
        visibility: hidden !important;
        opacity: 0 !important;
        pointer-events: none !important;
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

    // Watch the DOM body for newly spawned Google elements and eliminate them immediately
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof HTMLElement) {
            const isGoogClass = Array.from(node.classList).some(c => c.startsWith('goog-te-'));
            const isGoogId = node.id && node.id.startsWith('goog-');
            
            if (isGoogClass || isGoogId || node.classList.contains('skiptranslate')) {
              node.remove();
            }
          }
        });
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      document.head.removeChild(style);
      observer.disconnect();
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
    <div style={{ position: 'relative', fontFamily: 'var(--sans)' }}>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: 'var(--surface)',
          border: '1px solid var(--line-strong)',
          borderRadius: 10,
          padding: '8px 14px',
          color: 'var(--ink)',
          fontSize: 14,
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          transition: 'background 0.2s, border-color 0.2s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-hover)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--surface)')}
      >
        <span style={{ fontSize: 18 }}>{selected.flag}</span>
        <span>{selected.label}</span>
        <span style={{ color: 'var(--ink-faint)', fontSize: 10, marginLeft: 2 }}>{open ? '▲' : '▼'}</span>
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
            background: 'var(--card)',
            border: '1px solid var(--line-strong)',
            borderRadius: 14,
            overflow: 'hidden',
            minWidth: 200,
            boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
          }}>
            {languages.map((lang, i) => {
              const isActive = lang.code === current;
              return (
                <button
                  key={lang.code}
                  onClick={() => switchLocale(lang.code)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '14px 18px',
                    background: isActive ? 'var(--surface-hover)' : 'transparent',
                    border: 'none',
                    borderBottom: i < languages.length - 1 ? '1px solid var(--line)' : 'none',
                    color: isActive ? 'var(--accent)' : 'var(--ink-2)',
                    fontSize: 15,
                    cursor: 'pointer',
                    textAlign: 'left',
                    gap: 12,
                    transition: 'background 0.15s, color 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.background = 'var(--surface)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 20 }}>{lang.flag}</span>
                    <span style={{ fontWeight: isActive ? '500' : '400' }}>{lang.label}</span>
                  </span>
                  {isActive && (
                    <span style={{
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      border: '2px solid var(--accent)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <span style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: 'var(--accent)',
                        display: 'block',
                      }} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
