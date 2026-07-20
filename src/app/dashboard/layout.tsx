'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import GoogleTranslate from '@/components/GoogleTranslate';
import Logo from '@/components/Logo';

const navItems = [
  {
    href: '/dashboard',
    label: 'Overview',
    icon: (
      <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
        <rect x="1" y="1" width="5" height="5" stroke="currentColor" strokeWidth="1.1" />
        <rect x="7" y="1" width="5" height="5" stroke="currentColor" strokeWidth="1.1" />
        <rect x="1" y="7" width="5" height="5" stroke="currentColor" strokeWidth="1.1" />
        <rect x="7" y="7" width="5" height="5" stroke="currentColor" strokeWidth="1.1" />
      </svg>
    ),
  },
  {
    href: '/dashboard/markets',
    label: 'Markets',
    icon: (
      <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
        <path d="M1 10l3-4 2.5 2 3.5-5 2 2.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="square" strokeLinejoin="miter" />
      </svg>
    ),
  },
  {
    href: '/dashboard/trade',
    label: 'Trade',
    icon: (
      <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
        <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.1" />
        <path d="M6.5 4v3l2 1.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="square" />
      </svg>
    ),
  },
  {
    href: '/dashboard/assets',
    label: 'Assets',
    icon: (
      <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
        <path d="M1 10l3-4 2.5 2 3.5-5 2 2.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="square" strokeLinejoin="miter" />
        <circle cx="6.5" cy="6.5" r="2" stroke="currentColor" strokeWidth="1.1" />
      </svg>
    ),
  },
  {
    href: '/dashboard/deposit',
    label: 'Deposit',
    icon: (
      <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
        <path d="M6.5 1v8M4 7l2.5 2.5L9 7M1 11h11" stroke="currentColor" strokeWidth="1.1" strokeLinecap="square" />
      </svg>
    ),
  },
  {
    href: '/dashboard/withdraw',
    label: 'Withdraw',
    icon: (
      <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
        <path d="M6.5 9V1M4 3l2.5-2.5L9 3M1 11h11" stroke="currentColor" strokeWidth="1.1" strokeLinecap="square" />
      </svg>
    ),
  },
  {
    href: '/dashboard/support',
    label: 'Support',
    icon: (
      <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
        <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.1" />
        <path d="M6.5 7.5V7c.9 0 1.5-.7 1.5-1.5S7.4 4 6.5 4 5 4.7 5 5.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="square" />
        <circle cx="6.5" cy="9.5" r="0.6" fill="currentColor" />
      </svg>
    ),
  },
  {
    href: '/dashboard/settings',
    label: 'Settings',
    icon: (
      <svg width="13" height="13" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.3" />
        <path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.22 4.22l1.42 1.42M14.36 14.36l1.42 1.42M4.22 15.78l1.42-1.42M14.36 5.64l1.42-1.42" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: '/dashboard/notifications',
    label: 'Alerts',
    icon: (
      <svg width="13" height="13" viewBox="0 0 20 20" fill="none">
        <path d="M10 2a6 6 0 0 1 6 6c0 3 1 4 1 4H3s1-1 1-4a6 6 0 0 1 6-6z" stroke="currentColor" strokeWidth="1.3" />
        <path d="M8.5 16a1.5 1.5 0 0 0 3 0" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: '/dashboard/kyc',
    label: 'KYC',
    icon: (
      <svg width="13" height="13" viewBox="0 0 20 20" fill="none">
        <rect x="3" y="5" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.3" />
        <circle cx="7.5" cy="9.5" r="1.5" stroke="currentColor" strokeWidth="1.1" />
        <path d="M11 8h4M11 11h3" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: '/dashboard/subscription',
    label: 'Investment Plans',
    icon: (
      <svg width="13" height="13" viewBox="0 0 20 20" fill="none">
        <rect x="3" y="4" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.3" />
        <path d="M3 8h14" stroke="currentColor" strokeWidth="1.3" />
        <circle cx="10" cy="12" r="1.2" fill="currentColor" />
      </svg>
    ),
  },
];

const ChevronRight = () => (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
    <path d="M3.5 2l3 3-3 3" stroke="currentColor" strokeWidth="1.1" strokeLinecap="square" />
  </svg>
);

const HamburgerIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
  </svg>
);

const ChevronLeft = () => (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
    <path d="M6.5 2l-3 3 3 3" stroke="currentColor" strokeWidth="1.1" strokeLinecap="square" />
  </svg>
);

const SunIcon = () => (
  <svg width="13" height="13" viewBox="0 0 20 20" fill="none">
    <circle cx="10" cy="10" r="3.5" stroke="currentColor" strokeWidth="1.4" />
    <path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.22 4.22l1.42 1.42M14.36 14.36l1.42 1.42M4.22 15.78l1.42-1.42M14.36 5.64l1.42-1.42" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

const MoonIcon = () => (
  <svg width="13" height="13" viewBox="0 0 20 20" fill="none">
    <path d="M17 12.3A7 7 0 0 1 7.7 3a7 7 0 1 0 9.3 9.3z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('apex-theme') as 'dark' | 'light' | null;
    if (saved) {
      setTheme(saved);
      document.documentElement.setAttribute('data-theme', saved);
    } else if (window.matchMedia('(prefers-color-scheme: light)').matches) {
      setTheme('light');
      document.documentElement.setAttribute('data-theme', 'light');
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('apex-theme', next);
    if (next === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  };

  const walletActive = pathname === '/dashboard/assets';
  const moreActive = ['/dashboard/support', '/dashboard/settings', '/dashboard/notifications', '/dashboard/kyc', '/dashboard/subscription'].includes(pathname);
  const isAdmin = pathname.startsWith('/dashboard/admin');

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Manrope:wght@300;400;500;600&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        html, body {
          background: var(--bg) !important;
          min-height: 100vh;
          min-height: 100dvh;
        }

        .db-shell {
          min-height: 100vh;
          min-height: 100dvh;
          background: var(--bg);
          font-family: var(--sans);
          display: flex;
          transition: background 0.2s ease;
        }

        /* ── SIDEBAR ── */
        .db-sidebar {
          width: 200px;
          flex-shrink: 0;
          background: var(--bg);
          display: flex;
          flex-direction: column;
          position: fixed;
          top: 0; left: 0; bottom: 0;
          z-index: 50;
          border-right: 1px solid var(--line-strong);
          transition: background 0.2s ease, border-color 0.2s ease;
        }
        .db-sidebar-logo {
          padding: 22px 18px 18px;
          border-bottom: 1px solid var(--line-strong);
        }
        .db-nav { flex: 1; padding: 12px 0; overflow-y: auto; }
        .db-nav-item {
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 8px 16px;
          font-family: var(--mono);
          font-size: 0.65rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--ink-faint);
          text-decoration: none;
          transition: color 0.1s, background 0.1s;
          position: relative;
          margin: 1px 0;
        }
        .db-nav-item:hover { color: var(--ink-dim); background: var(--surface-hover); }
        .db-nav-item.active { color: var(--ink-2); }
        .db-nav-item.active::before {
          content: '';
          position: absolute;
          left: 0; top: 50%;
          transform: translateY(-50%);
          height: 16px; width: 2px;
          background: var(--accent);
        }
        .db-sidebar-footer {
          padding: 12px 0;
          border-top: 1px solid var(--line);
        }
        .db-signout {
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 8px 16px;
          font-family: var(--mono);
          font-size: 0.65rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--ink-faint);
          background: none;
          border: none;
          cursor: pointer;
          width: 100%;
          transition: color 0.1s;
          text-align: left;
        }
        .db-signout:hover { color: var(--red); }

        /* ── THEME TOGGLE ── */
        .db-theme-toggle {
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 8px 16px;
          font-family: var(--mono);
          font-size: 0.65rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--ink-faint);
          background: none;
          border: none;
          cursor: pointer;
          width: 100%;
          transition: color 0.1s;
          text-align: left;
        }
        .db-theme-toggle:hover { color: var(--ink-dim); }

        /* ── MAIN ── */
        .db-main {
          flex: 1;
          margin-left: 200px;
          display: flex;
          flex-direction: column;
          min-height: 100vh;
        }

        /* ── TOPBAR ── */
        .db-topbar {
          position: sticky;
          top: 0;
          z-index: 40;
          background: var(--bg);
          border-bottom: 1px solid var(--line-strong);
          padding: 0 32px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          transition: background 0.2s ease, border-color 0.2s ease;
        }
        .db-topbar-title {
          font-family: var(--mono);
          font-size: 0.6rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--ink-faint);
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .db-topbar-title::before {
          content: '';
          display: inline-block;
          width: 12px; height: 1px;
          background: var(--accent);
        }
        .db-topbar-right {
          display: flex;
          align-items: center;
          gap: 12px;
          font-family: var(--mono);
          font-size: 0.58rem;
          letter-spacing: 0.1em;
          color: var(--ink-faint);
        }
        .db-topbar-sep { color: var(--line-strong); opacity: 0.5; }

        .db-topbar-theme {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px; height: 28px;
          background: var(--surface);
          border: 1px solid var(--line-strong);
          border-radius: 4px;
          color: var(--ink-dim);
          cursor: pointer;
          transition: background 0.15s, color 0.15s;
        }
        .db-topbar-theme:hover {
          background: var(--surface-hover);
          color: var(--ink);
        }

        /* ── CONTENT ── */
        .db-content {
          flex: 1;
          padding: 28px 32px;
          max-width: 1000px;
          width: 100%;
        }

        /* ── MOBILE TOPBAR ── */
        .db-mobile-bar {
          display: none;
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 60;
          background: var(--bg);
          padding: 14px 20px;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid var(--line-strong);
          height: 52px;
          transition: background 0.2s ease;
        }
        .db-mobile-bar-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .db-mobile-logo {
          font-family: var(--mono);
          font-size: 0.7rem;
          font-weight: 500;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--ink-2);
        }
        .db-mobile-logo span { color: var(--accent); }

        .db-mobile-theme {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px; height: 28px;
          background: var(--surface);
          border: 1px solid var(--line-strong);
          border-radius: 4px;
          color: var(--ink-dim);
          cursor: pointer;
          transition: background 0.15s;
        }

        .db-hamburger {
          display: none;
          align-items: center;
          justify-content: center;
          width: 28px; height: 28px;
          background: var(--surface);
          border: 1px solid var(--line-strong);
          border-radius: 4px;
          color: var(--ink-dim);
          cursor: pointer;
          transition: background 0.15s;
          margin-right: 8px;
        }
        .db-hamburger:hover {
          background: var(--surface-hover);
        }

        /* ── MOBILE SIDEBAR OVERLAY ── */
        .db-mobile-sidebar-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
          z-index: 55;
          backdrop-filter: blur(4px);
          opacity: 0;
          visibility: hidden;
          pointer-events: none;
          transition: opacity 0.2s ease, visibility 0.2s ease;
        }
        .db-mobile-sidebar-overlay.dbMobileSidebarOpen {
          opacity: 1;
          visibility: visible;
          pointer-events: auto;
        }

        /* ── MOBILE SIDEBAR ── */
        .db-mobile-sidebar {
          position: fixed;
          top: 0; left: 0; bottom: 0;
          z-index: 56;
          width: 220px;
          background: var(--bg);
          border-right: 1px solid var(--line-strong);
          padding-bottom: max(env(safe-area-inset-bottom), 16px);
          flex-direction: column;
          transition: transform 0.28s cubic-bezier(0.32,0.72,0,1), opacity 0.2s ease, visibility 0.2s ease;
          transform: translateX(-100%);
          opacity: 0;
          visibility: hidden;
          pointer-events: none;
        }
        .db-mobile-sidebar.dbMobileSidebarOpen {
          transform: translateX(0);
          opacity: 1;
          visibility: visible;
          pointer-events: auto;
        }

        .db-mobile-sidebar-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 16px;
          border-bottom: 1px solid var(--line-strong);
        }
        .db-mobile-sidebar-logo {
          font-family: var(--mono);
          font-size: 0.75rem;
          font-weight: 600;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--ink-2);
        }
        .db-mobile-sidebar-logo span { color: var(--accent); }
        .db-mobile-sidebar-close {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px; height: 24px;
          background: none;
          border: none;
          cursor: pointer;
          color: var(--ink-dim);
        }

        .db-mobile-sidebar-content {
          flex: 1;
          overflow-y: auto;
          padding: 12px 0;
        }
        .db-mobile-sidebar-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          text-decoration: none;
          background: none;
          border: none;
          width: 100%;
          cursor: pointer;
          transition: background 0.12s;
          text-align: left;
          color: var(--ink-2);
          font-family: var(--mono);
          font-size: 0.65rem;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }
        .db-mobile-sidebar-row:hover,
        .db-mobile-sidebar-row:active { background: var(--surface-hover); }
        .db-mobile-sidebar-divider {
          height: 1px;
          background: var(--line);
          margin: 4px 0;
        }
        .db-mobile-sidebar-footer {
          padding: 12px 0;
          border-top: 1px solid var(--line-strong);
        }

        /* ── BOTTOM NAV ── */
        .db-bottom-nav {
          display: none;
          position: fixed;
          bottom: 0; left: 0; right: 0;
          z-index: 60;
          background: var(--bg);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-top: 1px solid var(--line-strong);
          padding-bottom: max(env(safe-area-inset-bottom), 16px);
          transition: background 0.2s ease;
        }
        .db-bottom-nav-inner {
          display: flex;
          justify-content: space-around;
          align-items: center;
          height: 58px;
        }
        .db-bn-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          flex: 1;
          height: 100%;
          text-decoration: none;
          background: none;
          border: none;
          cursor: pointer;
          position: relative;
          padding: 0;
          transition: opacity 0.15s;
        }
        .db-bn-item:active { opacity: 0.6; }
        .db-bn-item.active::before {
          content: '';
          position: absolute;
          top: 0; left: 50%;
          transform: translateX(-50%);
          width: 20px; height: 1.5px;
          background: var(--accent);
          border-radius: 0 0 2px 2px;
        }
        .db-bn-item svg {
          color: var(--ink-faint);
          transition: color 0.15s;
        }
        .db-bn-item.active svg { color: var(--ink); }
        .db-bn-label {
          font-family: var(--mono);
          font-size: 0.48rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--ink-faint);
          transition: color 0.15s;
          line-height: 1;
        }
        .db-bn-item.active .db-bn-label { color: var(--ink-dim); }

        /* ── BOTTOM SHEET ── */
        .db-sheet-overlay {
          position: fixed; inset: 0;
          background: rgba(0, 0, 0, 0.6);
          z-index: 70;
          animation: fadeIn 0.2s ease;
          backdrop-filter: blur(4px);
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

        .db-sheet {
          position: fixed;
          bottom: 0; left: 0; right: 0;
          z-index: 71;
          background: var(--bg);
          border-radius: 20px 20px 0 0;
          border-top: 1px solid var(--line-strong);
          padding: 0 0 max(env(safe-area-inset-bottom), 24px);
          animation: slideUp 0.28s cubic-bezier(0.32,0.72,0,0.1);
          transition: background 0.2s ease;
        }
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }

        .db-sheet-handle {
          width: 32px; height: 3px;
          background: var(--line-strong);
          border-radius: 2px;
          margin: 14px auto 4px;
        }
        .db-sheet-title {
          font-family: var(--mono);
          font-size: 0.54rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--ink-faint);
          padding: 8px 20px 14px;
          border-bottom: 1px solid var(--line);
        }

        .db-sheet-rows { padding: 4px 0; }
        .db-sheet-row {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 20px;
          text-decoration: none;
          background: none;
          border: none;
          width: 100%;
          cursor: pointer;
          transition: background 0.12s;
          text-align: left;
        }
        .db-sheet-row:active { background: var(--surface-hover); }
        .db-sheet-row-icon {
          width: 16px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .db-sheet-row-text { flex: 1; }
        .db-sheet-row-label {
          font-family: var(--mono);
          font-size: 0.7rem;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--ink-2);
          display: block;
          line-height: 1;
          margin-bottom: 3px;
        }
        .db-sheet-row-sub {
          font-family: var(--mono);
          font-size: 0.55rem;
          letter-spacing: 0.04em;
          color: var(--ink-faint);
        }
        .db-sheet-row-arrow { color: var(--ink-faint); flex-shrink: 0; }
        .db-sheet-row-divider {
          height: 1px;
          background: var(--line);
          margin: 0 20px;
        }
        .db-sheet-signout-row {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 20px;
          background: none;
          border: none;
          width: 100%;
          cursor: pointer;
          transition: background 0.12s;
          text-align: left;
          margin-top: 4px;
          border-top: 1px solid var(--red-l);
        }
        .db-sheet-signout-row:active { background: var(--red-l); }
        .db-sheet-signout-label {
          font-family: var(--mono);
          font-size: 0.7rem;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--red);
        }

        /* ── MOUNTED GUARD ── */
        .db-mobile-sidebar-not-mounted {
          display: none !important;
        }

        @media (max-width: 768px) {
          .db-sidebar { display: none; }
          .db-main { margin-left: 0; }
          .db-topbar { display: none; }
          .db-mobile-bar { display: flex; }
          .db-hamburger { display: flex; }
          .db-mobile-sidebar { display: flex; }
          .db-bottom-nav { display: block; }

          .db-content {
            padding: 52px 0 calc(74px + max(env(safe-area-inset-bottom), 0px));
            max-width: 100%;
            width: 100%;
          }
        }
      `}</style>

      <div className="db-shell">

        {/* SIDEBAR */}
        <aside className="db-sidebar">
          <div className="db-sidebar-logo">
            <Logo />
          </div>
          <nav className="db-nav">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`db-nav-item ${pathname === item.href ? 'active' : ''}`}
              >
                {item.icon}
                {item.label}
              </Link>
            ))}
          </nav>
          <GoogleTranslate />
          <div className="db-sidebar-footer">
            <button className="db-theme-toggle" onClick={toggleTheme}>
              {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
              {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </button>
            <button className="db-signout" onClick={() => signOut({ callbackUrl: '/login' })}>
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path d="M5 2H2v9h3M8 9l3-2.5L8 4M11 6.5H5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="square" />
              </svg>
              Sign Out
            </button>
          </div>
        </aside>

        {/* MOBILE TOPBAR */}
        <div className="db-mobile-bar">
          <div className="db-mobile-bar-left">
            {!isAdmin && (
              <button className="db-hamburger" onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="Toggle menu">
                <HamburgerIcon />
              </button>
            )}
            <span className="db-mobile-logo">APEX<span>•</span></span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button className="db-mobile-theme" onClick={toggleTheme} aria-label="Toggle theme">
              {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
            </button>
            <GoogleTranslate />
          </div>
        </div>

        {/* MAIN */}
        <main className="db-main">
          <div className="db-topbar">
            <span className="db-topbar-title">
              {navItems.find((n) => n.href === pathname)?.label ?? 'Dashboard'}
            </span>
            <div className="db-topbar-right">
              <button className="db-topbar-theme" onClick={toggleTheme} aria-label="Toggle theme">
                {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
              </button>
              <span className="db-topbar-sep">·</span>
              <span>APEX MARKETS</span>
              <span className="db-topbar-sep">·</span>
              <span>Trading Terminal</span>
            </div>
          </div>
          <div className="db-content">{children}</div>
        </main>

        {/* MOBILE SIDEBAR */}
        {mounted && !isAdmin && (
          <>
            <div
              className={`db-mobile-sidebar-overlay ${sidebarOpen ? 'dbMobileSidebarOpen' : ''}`}
              onClick={() => setSidebarOpen(false)}
            />
            <div className={`db-mobile-sidebar ${sidebarOpen ? 'dbMobileSidebarOpen' : ''}`}>
              <div className="db-mobile-sidebar-header">
                <span className="db-mobile-sidebar-logo">APEX<span>•</span>MARKETS</span>
                <button className="db-mobile-sidebar-close" onClick={() => setSidebarOpen(false)} aria-label="Close menu">
                  <ChevronLeft />
                </button>
              </div>
              <div className="db-mobile-sidebar-content">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="db-mobile-sidebar-row"
                    onClick={() => setSidebarOpen(false)}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', color: 'var(--ink-dim)' }}>
                      {item.icon}
                    </span>
                    {item.label}
                  </Link>
                ))}
              </div>
              <div className="db-mobile-sidebar-footer">
                <button 
                  className="db-mobile-sidebar-row" 
                  style={{ color: 'var(--red)' }}
                  onClick={() => { setSidebarOpen(false); signOut({ callbackUrl: '/login' }); }}
                >
                  <svg width="14" height="14" viewBox="0 0 13 13" fill="none">
                    <path d="M5 2H2v9h3M8 9l3-2.5L8 4M11 6.5H5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="square" />
                  </svg>
                  Sign Out
                </button>
              </div>
            </div>
          </>
        )}

        {/* BOTTOM NAV + MORE SHEET */}
        {!isAdmin && (
          <>
            <nav className="db-bottom-nav">
              <div className="db-bottom-nav-inner">

                <Link href="/dashboard" className={`db-bn-item ${pathname === '/dashboard' ? 'active' : ''}`}>
                  <svg width="18" height="18" viewBox="0 0 13 13" fill="none">
                    <rect x="1" y="1" width="5" height="5" stroke="currentColor" strokeWidth="1.1" />
                    <rect x="7" y="1" width="5" height="5" stroke="currentColor" strokeWidth="1.1" />
                    <rect x="1" y="7" width="5" height="5" stroke="currentColor" strokeWidth="1.1" />
                    <rect x="7" y="7" width="5" height="5" stroke="currentColor" strokeWidth="1.1" />
                  </svg>
                  <span className="db-bn-label">Home</span>
                </Link>

                <Link href="/dashboard/markets" className={`db-bn-item ${pathname === '/dashboard/markets' ? 'active' : ''}`}>
                  <svg width="18" height="18" viewBox="0 0 13 13" fill="none">
                    <path d="M1 10l3-4 2.5 2 3.5-5 2 2.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="square" strokeLinejoin="miter" />
                  </svg>
                  <span className="db-bn-label">Markets</span>
                </Link>

                <Link href="/dashboard/trade" className={`db-bn-item ${pathname === '/dashboard/trade' ? 'active' : ''}`}>
                  <svg width="18" height="18" viewBox="0 0 13 13" fill="none">
                    <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.1" />
                    <path d="M6.5 4v3l2 1.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="square" />
                  </svg>
                  <span className="db-bn-label">Trade</span>
                </Link>

                <Link href="/dashboard/assets" className={`db-bn-item ${walletActive ? 'active' : ''}`}>
                  <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                    <rect x="2" y="5" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.3" />
                    <path d="M2 8h16" stroke="currentColor" strokeWidth="1.3" />
                    <circle cx="14.5" cy="12" r="1.2" fill="currentColor" />
                    <path d="M6 3l8 0" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                  </svg>
                  <span className="db-bn-label">Wallet</span>
                </Link>

                <button
                  className={`db-bn-item ${moreActive ? 'active' : ''}`}
                  onClick={() => setMoreOpen(true)}
                >
                  <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                    <circle cx="4" cy="10" r="1.5" fill="currentColor" />
                    <circle cx="10" cy="10" r="1.5" fill="currentColor" />
                    <circle cx="16" cy="10" r="1.5" fill="currentColor" />
                  </svg>
                  <span className="db-bn-label">Account</span>
                </button>

              </div>
            </nav>

            {/* MORE SHEET */}
            {moreOpen && (
              <>
                <div className="db-sheet-overlay" onClick={() => setMoreOpen(false)} />
                <div className="db-sheet">
                  <div className="db-sheet-handle" />
                  <div className="db-sheet-title">More</div>
                  <div className="db-sheet-rows">
                    <Link href="/dashboard/support" className="db-sheet-row" onClick={() => setMoreOpen(false)}>
                      <div className="db-sheet-row-icon" style={{ color: 'var(--ink-dim)' }}>
                        <svg width="14" height="14" viewBox="0 0 13 13" fill="none">
                          <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.1" />
                          <path d="M6.5 7.5V7c.9 0 1.5-.7 1.5-1.5S7.4 4 6.5 4 5 4.7 5 5.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="square" />
                          <circle cx="6.5" cy="9.5" r="0.6" fill="currentColor" />
                        </svg>
                      </div>
                      <div className="db-sheet-row-text">
                        <span className="db-sheet-row-label">Support</span>
                        <span className="db-sheet-row-sub">Get help or contact us</span>
                      </div>
                      <div className="db-sheet-row-arrow"><ChevronRight /></div>
                    </Link>
                    <div className="db-sheet-row-divider" />
                    <Link href="/dashboard/settings" className="db-sheet-row" onClick={() => setMoreOpen(false)}>
                      <div className="db-sheet-row-icon" style={{ color: 'var(--ink-dim)' }}>
                        <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                          <circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.3" />
                          <path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.22 4.22l1.42 1.42M14.36 14.36l1.42 1.42M4.22 15.78l1.42-1.42M14.36 5.64l1.42-1.42" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                        </svg>
                      </div>
                      <div className="db-sheet-row-text">
                        <span className="db-sheet-row-label">Settings</span>
                        <span className="db-sheet-row-sub">Account preferences</span>
                      </div>
                      <div className="db-sheet-row-arrow"><ChevronRight /></div>
                    </Link>
                    <div className="db-sheet-row-divider" />
                    <Link href="/dashboard/notifications" className="db-sheet-row" onClick={() => setMoreOpen(false)}>
                      <div className="db-sheet-row-icon" style={{ color: 'var(--ink-dim)' }}>
                        <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                          <path d="M10 2a6 6 0 0 1 6 6c0 3 1 4 1 4H3s1-1 1-4a6 6 0 0 1 6-6z" stroke="currentColor" strokeWidth="1.3" />
                          <path d="M8.5 16a1.5 1.5 0 0 0 3 0" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                        </svg>
                      </div>
                      <div className="db-sheet-row-text">
                        <span className="db-sheet-row-label">Alerts</span>
                        <span className="db-sheet-row-sub">Notifications &amp; price alerts</span>
                      </div>
                      <div className="db-sheet-row-arrow"><ChevronRight /></div>
                    </Link>
                    <div className="db-sheet-row-divider" />
                    <Link href="/dashboard/kyc" className="db-sheet-row" onClick={() => setMoreOpen(false)}>
                      <div className="db-sheet-row-icon" style={{ color: 'var(--ink-dim)' }}>
                        <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                          <rect x="3" y="5" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.3" />
                          <circle cx="7.5" cy="9.5" r="1.5" stroke="currentColor" strokeWidth="1.1" />
                          <path d="M11 8h4M11 11h3" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
                        </svg>
                      </div>
                      <div className="db-sheet-row-text">
                        <span className="db-sheet-row-label">KYC</span>
                        <span className="db-sheet-row-sub">Identity verification</span>
                      </div>
                      <div className="db-sheet-row-arrow"><ChevronRight /></div>
                    </Link>
                    <div className="db-sheet-row-divider" />
                    <Link href="/dashboard/subscription" className="db-sheet-row" onClick={() => setMoreOpen(false)}>
                      <div className="db-sheet-row-icon" style={{ color: 'var(--ink-dim)' }}>
                        <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                          <rect x="3" y="4" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.3" />
                          <path d="M3 8h14" stroke="currentColor" strokeWidth="1.3" />
                          <circle cx="10" cy="12" r="1.2" fill="currentColor" />
                        </svg>
                      </div>
                      <div className="db-sheet-row-text">
                        <span className="db-sheet-row-label">Investment Plans</span>
                        <span className="db-sheet-row-sub">Manage your plan</span>
                      </div>
                      <div className="db-sheet-row-arrow"><ChevronRight /></div>
                    </Link>
                  </div>
                  <button
                    className="db-sheet-signout-row"
                    onClick={() => { setMoreOpen(false); signOut({ callbackUrl: '/login' }); }}
                  >
                    <div className="db-sheet-row-icon" style={{ color: 'var(--red)' }}>
                      <svg width="14" height="14" viewBox="0 0 13 13" fill="none">
                        <path d="M5 2H2v9h3M8 9l3-2.5L8 4M11 6.5H5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="square" />
                      </svg>
                    </div>
                    <span className="db-sheet-signout-label">Sign Out</span>
                  </button>
                </div>
              </>
            )}
          </>
        )}

      </div>
    </>
  );
}
