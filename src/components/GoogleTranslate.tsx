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

  function switchLocale(langCode: string) {
    setCurrent(langCode);
    const select = document.querySelector('.goog-te-combo') as HTMLSelectElement;
    if (select) {
      select.value = langCode;
      select.dispatchEvent(new Event('change'));
    }
  }

  return (
    <>
      <div id="google_translate_element" style={{ display: 'none' }} />
      <select
        value={current}
        onChange={(e) => switchLocale(e.target.value)}
        style={{
          background: '#0f2a3d',
          color: '#38bdf8',
          border: '1px solid rgba(56,189,248,0.25)',
          borderRadius: 6,
          padding: '4px 8px',
          fontSize: 12,
          cursor: 'pointer',
        }}
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code} style={{ background: '#0f2a3d' }}>
            {lang.flag} {lang.label}
          </option>
        ))}
      </select>
    </>
  );
}
