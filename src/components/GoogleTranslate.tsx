'use client';

import { useState } from 'react';

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

  function switchLocale(langCode: string) {
    setCurrent(langCode);

    if (langCode === 'en') {
      // Remove cookie to go back to English
      document.cookie = 'googtrans=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      document.cookie = 'googtrans=; path=/; domain=' + window.location.hostname + '; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    } else {
      // Set googtrans cookie — format must be /en/fr
      document.cookie = `googtrans=/en/${langCode}; path=/`;
      document.cookie = `googtrans=/en/${langCode}; path=/; domain=${window.location.hostname}`;
    }

    // Reload to apply
    window.location.reload();
  }

  return (
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
  );
}
