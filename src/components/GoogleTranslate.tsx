'use client';

import { useEffect, useState } from 'react';

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

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    script.async = true;
    document.body.appendChild(script);

    (window as any).googleTranslateElementInit = () => {
      new (window as any).google.translate.TranslateElement(
        {
          pageLanguage: 'en',
          includedLanguages: 'fr,es,pt,ja,de,en',
          autoDisplay: false,
        },
        'google_translate_element'
      );
    };

    return () => {
      document.body.removeChild(script);
      delete (window as any).googleTranslateElementInit;
    };
  }, []);

  function switchLanguage(langCode: string) {
    setCurrent(langCode);
    const select = document.querySelector('.goog-te-combo') as HTMLSelectElement;
    if (select) {
      select.value = langCode;
      select.dispatchEvent(new Event('change'));
    }
  }

  return (
    <>
      {/* Hidden Google widget */}
      <div id="google_translate_element" style={{ display: 'none' }} />

      {/* Your own custom UI */}
      <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 9999 }}>
        <select
          value={current}
          onChange={(e) => switchLanguage(e.target.value)}
          style={{
            background: '#0f2a3d',
            color: '#00d4ff',
            border: '1px solid #00d4ff40',
            borderRadius: 6,
            padding: '4px 8px',
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          {languages.map((lang) => (
            <option key={lang.code} value={lang.code} style={{ background: '#0f2a3d' }}>
              {lang.flag} {lang.label}
            </option>
          ))}
        </select>
      </div>
    </>
  );
        }
