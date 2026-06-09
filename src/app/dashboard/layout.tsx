'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import GoogleTranslate from '@/components/GoogleTranslate';
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
];

const ChevronRight = () => (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
    <path d="M3.5 2l3 3-3 3" stroke="currentColor" strokeWidth="1.1" strokeLinecap="square" />
  </svg>
);

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [walletOpen, setWalletOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  const walletActive = ['/dashboard/deposit', '/dashboard/withdraw', '/dashboard/history'].includes(pathname);
  const moreActive   = ['/dashboard/support', '/dashboard/settings', '/dashboard/notifications', '/dashboard/kyc'].includes(pathname);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Manrope:wght@300;400;500;600&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg:    #0f2535;
          --bg-1:  #0b1e2c;
          --bg-2:  #1a3a50;
          --bg-3:  #234d67;
          --card:  #132f45;
          --ink:   #f0f8ff;
          --ink-2: #d6ecf8;
          --inl:   #4e6e90;
          --inm:   #ccdff5;
          --accent: #38bdf8;
          --mono: 'DM Mono', 'Courier New', monospace;
          --sans: 'Manrope', system-ui, sans-serif;
        }

        html, body {
          background: var(--bg-1) !important;
          min-height: 100vh;
          min-height: 100dvh;
        }

        .db-shell {
          min-height: 100vh;
          min-height: 100dvh;
          background: var(--bg) !important;
          font-family: var(--sans);
          display: flex;
        }

        /* ── SIDEBAR ── */
        .db-sidebar {
          width: 200px;
          flex-shrink: 0;
          background: var(--bg-1) !important;
          display: flex;
          flex-direction: column;
          position: fixed;
          top: 0; left: 0; bottom: 0;
          z-index: 50;
          border-right: 1px solid rgba(255,255,255,0.05);
        }
        .db-sidebar-logo {
          padding: 22px 18px 18px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .db-logo-text {
          font-family: var(--mono);
          font-size: 0.72rem;
          font-weight: 500;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--inm);
          text-decoration: none;
          display: block;
        }
        .db-logo-text span { color: var(--accent); }
        .db-logo-sub {
          font-family: var(--mono);
          font-size: 0.52rem;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: var(--bg-3);
          margin-top: 4px;
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
          color: var(--bg-3);
          text-decoration: none;
          transition: color 0.1s, background 0.1s;
          position: relative;
          margin: 1px 0;
        }
        .db-nav-item:hover { color: #7a9ec0; background: rgba(56,189,248,0.04); }
        .db-nav-item.active { color: var(--inm); }
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
          border-top: 1px solid rgba(255,255,255,0.04);
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
          color: var(--bg-3);
          background: none;
          border: none;
          cursor: pointer;
          width: 100%;
          transition: color 0.1s;
          text-align: left;
        }
        .db-signout:hover { color: #f87171; }

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
          background: var(--bg) !important;
          border-bottom: 1px solid var(--bg-2);
          padding: 0 32px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .db-topbar-title {
          font-family: var(--mono);
          font-size: 0.6rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--inl);
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
          color: var(--inl);
        }
        .db-topbar-sep { color: var(--bg-2); }

        /* ── CONTENT (desktop) ── */
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
          background: var(--bg-1) !important;
          padding: 14px 20px;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          height: 52px;
        }
        .db-mobile-logo {
          font-family: var(--mono);
          font-size: 0.7rem;
          font-weight: 500;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--inm);
        }
        .db-mobile-logo span { color: var(--accent); }

        /* ── BOTTOM NAV ── */
        .db-bottom-nav {
          display: none;
          position: fixed;
          bottom: 0; left: 0; right: 0;
          z-index: 60;
          background: rgba(11, 38, 54, 0.97);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-top: 1px solid rgba(255,255,255,0.06);
          padding-bottom: max(env(safe-area-inset-bottom), 16px);
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
          color: #759fa1;
          transition: color 0.15s;
        }
        .db-bn-item.active svg { color: var(--ink); }
        .db-bn-label {
          font-family: var(--mono);
          font-size: 0.48rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #759fa1;
          transition: color 0.15s;
          line-height: 1;
        }
        .db-bn-item.active .db-bn-label { color: #7a9ec0; }

        /* ── BOTTOM SHEET ── */
        .db-sheet-overlay {
          position: fixed; inset: 0;
          background: rgba(5, 14, 22, 0.8);
          z-index: 70;
          animation: fadeIn 0.2s ease;
          backdrop-filter: blur(4px);
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

        .db-sheet {
          position: fixed;
          bottom: 0; left: 0; right: 0;
          z-index: 71;
          background: var(--bg-1);
          border-radius: 20px 20px 0 0;
          border-top: 1px solid rgba(255,255,255,0.06);
          padding: 0 0 max(env(safe-area-inset-bottom), 24px);
          animation: slideUp 0.28s cubic-bezier(0.32,0.72,0,1);
        }
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }

        .db-sheet-handle {
          width: 32px; height: 3px;
          background: rgba(255,255,255,0.08);
          border-radius: 2px;
          margin: 14px auto 4px;
        }
        .db-sheet-title {
          font-family: var(--mono);
          font-size: 0.54rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--inl);
          padding: 8px 20px 14px;
          border-bottom: 1px solid rgba(255,255,255,0.04);
        }

        /* ── SHEET ROWS ── */
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
        .db-sheet-row:active { background: rgba(255,255,255,0.03); }
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
          color: var(--inm);
          display: block;
          line-height: 1;
          margin-bottom: 3px;
        }
        .db-sheet-row-sub {
          font-family: var(--mono);
          font-size: 0.55rem;
          letter-spacing: 0.04em;
          color: var(--inl);
        }
        .db-sheet-row-arrow { color: var(--bg-3); flex-shrink: 0; }
        .db-sheet-row-divider {
          height: 1px;
          background: rgba(255,255,255,0.04);
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
          border-top: 1px solid rgba(248,113,113,0.08);
        }
        .db-sheet-signout-row:active { background: rgba(248,113,113,0.04); }
        .db-sheet-signout-label {
          font-family: var(--mono);
          font-size: 0.7rem;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #f87171;
        }

        @media (max-width: 768px) {
          .db-sidebar { display: none; }
          .db-main { margin-left: 0; }
          .db-topbar { display: none; }
          .db-mobile-bar { display: flex; }
          .db-bottom-nav { display: block; }
          .db-shell { background: var(--bg) !important; }

          /*
           * KEY FIX: on mobile, db-content must have:
           * - zero horizontal padding (the page itself handles its own side spacing)
           * - zero max-width (let it fill the full viewport width)
           * - top padding = mobile topbar height (52px)
           * - bottom padding = bottom nav height + safe area
           */
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
            <Link href="/" className="db-logo-text">
              APEX<span>•</span>MARKETS
            </Link>
            <p className="db-logo-sub">Terminal v1.0</p>
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
  <span className="db-mobile-logo">APEX<span>•</span>MARKETS</span>
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
              <span>APEX MARKETS</span>
              <span className="db-topbar-sep">·</span>
              <span>Trading Terminal</span>
            </div>
          </div>
          <div className="db-content">{children}</div>
        </main>

        {/* BOTTOM NAV */}
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

            <button
              className={`db-bn-item ${walletActive ? 'active' : ''}`}
              onClick={() => { setWalletOpen(true); setMoreOpen(false); }}
            >
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                <rect x="2" y="5" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.3" />
                <path d="M2 8h16" stroke="currentColor" strokeWidth="1.3" />
                <circle cx="14.5" cy="12" r="1.2" fill="currentColor" />
                <path d="M6 3l8 0" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
              <span className="db-bn-label">Wallet</span>
            </button>

            <button
              className={`db-bn-item ${moreActive ? 'active' : ''}`}
              onClick={() => { setMoreOpen(true); setWalletOpen(false); }}
            >
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                <circle cx="4" cy="10" r="1.5" fill="currentColor" />
                <circle cx="10" cy="10" r="1.5" fill="currentColor" />
                <circle cx="16" cy="10" r="1.5" fill="currentColor" />
              </svg>
              <span className="db-bn-label">More</span>
            </button>

          </div>
        </nav>

        {/* WALLET SHEET */}
        {walletOpen && (
          <>
            <div className="db-sheet-overlay" onClick={() => setWalletOpen(false)} />
            <div className="db-sheet">
              <div className="db-sheet-handle" />
              <div className="db-sheet-title">Wallet</div>
              <div className="db-sheet-rows">
                <Link href="/dashboard/deposit" className="db-sheet-row" onClick={() => setWalletOpen(false)}>
                  <div className="db-sheet-row-icon">
                    <svg width="14" height="14" viewBox="0 0 13 13" fill="none">
                      <path d="M6.5 1v8M4 7l2.5 2.5L9 7M1 11h11" stroke="#4ade80" strokeWidth="1.1" strokeLinecap="square" />
                    </svg>
                  </div>
                  <div className="db-sheet-row-text">
                    <span className="db-sheet-row-label">Deposit</span>
                    <span className="db-sheet-row-sub">Add funds to your account</span>
                  </div>
                  <div className="db-sheet-row-arrow"><ChevronRight /></div>
                </Link>
                <div className="db-sheet-row-divider" />
                <Link href="/dashboard/withdraw" className="db-sheet-row" onClick={() => setWalletOpen(false)}>
                  <div className="db-sheet-row-icon">
                    <svg width="14" height="14" viewBox="0 0 13 13" fill="none">
                      <path d="M6.5 9V1M4 3l2.5-2.5L9 3M1 11h11" stroke="#f87171" strokeWidth="1.1" strokeLinecap="square" />
                    </svg>
                  </div>
                  <div className="db-sheet-row-text">
                    <span className="db-sheet-row-label">Withdraw</span>
                    <span className="db-sheet-row-sub">Send funds to your bank or wallet</span>
                  </div>
                  <div className="db-sheet-row-arrow"><ChevronRight /></div>
                </Link>
                <div className="db-sheet-row-divider" />
                <Link href="/dashboard/history" className="db-sheet-row" onClick={() => setWalletOpen(false)}>
                  <div className="db-sheet-row-icon">
                    <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                      <circle cx="10" cy="10" r="7" stroke="#8dbdd8" strokeWidth="1.3" />
                      <path d="M10 6v4l3 2" stroke="#8dbdd8" strokeWidth="1.3" strokeLinecap="round" />
                    </svg>
                  </div>
                  <div className="db-sheet-row-text">
                    <span className="db-sheet-row-label">History</span>
                    <span className="db-sheet-row-sub">View all past transactions</span>
                  </div>
                  <div className="db-sheet-row-arrow"><ChevronRight /></div>
                </Link>
              </div>
            </div>
          </>
        )}

        {/* MORE SHEET */}
        {moreOpen && (
          <>
            <div className="db-sheet-overlay" onClick={() => setMoreOpen(false)} />
            <div className="db-sheet">
              <div className="db-sheet-handle" />
              <div className="db-sheet-title">More</div>
              <div className="db-sheet-rows">
                <Link href="/dashboard/support" className="db-sheet-row" onClick={() => setMoreOpen(false)}>
                  <div className="db-sheet-row-icon">
                    <svg width="14" height="14" viewBox="0 0 13 13" fill="none">
                      <circle cx="6.5" cy="6.5" r="5" stroke="#8dbdd8" strokeWidth="1.1" />
                      <path d="M6.5 7.5V7c.9 0 1.5-.7 1.5-1.5S7.4 4 6.5 4 5 4.7 5 5.5" stroke="#8dbdd8" strokeWidth="1.1" strokeLinecap="square" />
                      <circle cx="6.5" cy="9.5" r="0.6" fill="#8dbdd8" />
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
                  <div className="db-sheet-row-icon">
                    <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                      <circle cx="10" cy="10" r="2.5" stroke="#8dbdd8" strokeWidth="1.3" />
                      <path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.22 4.22l1.42 1.42M14.36 14.36l1.42 1.42M4.22 15.78l1.42-1.42M14.36 5.64l1.42-1.42" stroke="#8dbdd8" strokeWidth="1.3" strokeLinecap="round" />
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
                  <div className="db-sheet-row-icon">
                    <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                      <path d="M10 2a6 6 0 0 1 6 6c0 3 1 4 1 4H3s1-1 1-4a6 6 0 0 1 6-6z" stroke="#8dbdd8" strokeWidth="1.3" />
                      <path d="M8.5 16a1.5 1.5 0 0 0 3 0" stroke="#8dbdd8" strokeWidth="1.3" strokeLinecap="round" />
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
                  <div className="db-sheet-row-icon">
                    <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                      <rect x="3" y="5" width="14" height="10" rx="2" stroke="#8dbdd8" strokeWidth="1.3" />
                      <circle cx="7.5" cy="9.5" r="1.5" stroke="#8dbdd8" strokeWidth="1.1" />
                      <path d="M11 8h4M11 11h3" stroke="#8dbdd8" strokeWidth="1.1" strokeLinecap="round" />
                    </svg>
                  </div>
                  <div className="db-sheet-row-text">
                    <span className="db-sheet-row-label">KYC</span>
                    <span className="db-sheet-row-sub">Identity verification</span>
                  </div>
                  <div className="db-sheet-row-arrow"><ChevronRight /></div>
                </Link>
              </div>
              <button
                className="db-sheet-signout-row"
                onClick={() => { setMoreOpen(false); signOut({ callbackUrl: '/login' }); }}
              >
                <div className="db-sheet-row-icon">
                  <svg width="14" height="14" viewBox="0 0 13 13" fill="none">
                    <path d="M5 2H2v9h3M8 9l3-2.5L8 4M11 6.5H5" stroke="#f87171" strokeWidth="1.1" strokeLinecap="square" />
                  </svg>
                </div>
                <span className="db-sheet-signout-label">Sign Out</span>
              </button>
            </div>
          </>
        )}

      </div>
    </>
  );
}
