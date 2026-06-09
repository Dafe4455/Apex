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
    // Save to cookie
    document.cookie = `locale=${locale};path=/;max-age=${60 * 60 * 24 * 365}`;

    // Swap locale in current path e.g. /en/dashboard → /fr/dashboard
    const segments = pathname.split("/");
    segments[1] = locale;
    router.push(segments.join("/"));
  }

  return (
    <select
      value={currentLocale}
      onChange={(e) => switchLocale(e.target.value)}
      className="bg-transparent text-sm border border-white/20 rounded px-2 py-1 cursor-pointer"
    >
      {languages.map((lang) => (
        <option key={lang.code} value={lang.code}>
          {lang.flag} {lang.label}
        </option>
      ))}
    </select>
  );
}
