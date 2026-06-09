"use client";

import { useRouter, usePathname } from "next/navigation";

const languages = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "pt", label: "Português", flag: "🇧🇷" },
  { code: "ja", label: "日本語", flag: "🇯🇵" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
];

export default function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();

  const currentLocale = pathname.split("/")[1] ?? "en";

  function switchLocale(locale: string) {
    document.cookie = `locale=${locale};path=/;max-age=${60 * 60 * 24 * 365}`;
    const segments = pathname.split("/");
    segments[1] = locale;
    router.push(segments.join("/"));
  }

  return (
    <div style={{ position: "fixed", top: 16, right: 16, zIndex: 9999 }}>
      <select
        value={currentLocale}
        onChange={(e) => switchLocale(e.target.value)}
        style={{
          background: "#0f2a3d",
          color: "#00d4ff",
          border: "1px solid #00d4ff40",
          borderRadius: 6,
          padding: "4px 8px",
          fontSize: 13,
          cursor: "pointer",
        }}
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code} style={{ background: "#0f2a3d" }}>
            {lang.flag} {lang.label}
          </option>
        ))}
      </select>
    </div>
  );
}
