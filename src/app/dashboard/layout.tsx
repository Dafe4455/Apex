'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';

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
          --cr:  #1e3f56;
          --crd: #18374c;
          --crx: #2a5470;
          --inm: #d6ecf8;
          --inl: #6a9ab8;
          --accent: #38bdf8;
          --mono: 'DM Mono', 'Courier New', monospace;
          --sans: 'Manrope', system-ui, sans-serif;
        }

        html, body { background: #18374c !important; }

        .db-shell {
          min-height: 100vh;
          background: #1e3f56 !important;
          font-family: var(--sans);
          display: flex;
        }

        /* ── SIDEBAR ── */
        .db-sidebar {
          width: 200px;
          flex-shrink: 0;
          background: #13304a !important;
          display: flex;
          flex-direction: column;
          position: fixed;
          top: 0; left: 0; bottom: 0;
          z-index: 50;
          border-right: 1px solid rgba(255,255,255,0.06);
        }
        .db-sidebar-logo {
          padding: 22px 18px 18px;
          border-bottom: 1px solid rgba(255,255,255,0.07);
        }
        .db-logo-text {
          font-family: var(--mono);
          font-size: 0.72rem;
          font-weight: 500;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #d6ecf8;
          text-decoration: none;
          display: block;
        }
        .db-logo-text span { color: var(--accent); }
        .db-logo-sub {
          font-family: var(--mono);
          font-size: 0.52rem;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: #2a5470;
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
          color: #3d6e8a;
          text-decoration: none;
          transition: color 0.1s, background 0.1s;
          position: relative;
          margin: 1px 0;
        }
        .db-nav-item:hover { color: #8dbdd8; background: rgba(56,189,248,0.05); }
        .db-nav-item.active { color: #d6ecf8; }
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
          border-top: 1px solid rgba(255,255,255,0.05);
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
          color: #3d6e8a;
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
          background: #1e3f56 !important;
          border-bottom: 1px solid #2a5470;
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
        .db-topbar-sep { color: #2a5470; }

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
          background: #13304a !important;
          padding: 14px 20px;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid rgba(255,255,255,0.07);
        }
        .db-mobile-logo {
          font-family: var(--mono);
          font-size: 0.7rem;
          font-weight: 500;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #d6ecf8;
        }
        .db-mobile-logo span { color: var(--accent); }

        /* ── BOTTOM NAV ── */
        .db-bottom-nav {
          display: none;
          position: fixed;
          bottom: 0; left: 0; right: 0;
          z-index: 60;
          background: rgba(19, 48, 74, 0.97);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-top: 1px solid rgba(255,255,255,0.07);
          padding: 0 0 env(safe-area-inset-bottom);
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
          color: #3d6e8a;
          transition: color 0.15s;
        }
        .db-bn-item.active svg { color: #f0f8ff; }
        .db-bn-label {
          font-family: var(--mono);
          font-size: 0.48rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #3d6e8a;
          transition: color 0.15s;
          line-height: 1;
        }
        .db-bn-item.active .db-bn-label { color: #8dbdd8; }

        /* ── BOTTOM SHEET ── */
        .db-sheet-overlay {
          position: fixed; inset: 0;
          background: rgba(10, 24, 38, 0.65);
          z-index: 70;
          animation: fadeIn 0.2s ease;
          backdrop-filter: blur(3px);
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

        .db-sheet {
          position: fixed;
          bottom: 0; left: 0; right: 0;
          z-index: 71;
          background: #18374c;
          border-radius: 20px 20px 0 0;
          border-top: 1px solid rgba(255,255,255,0.08);
          padding: 0 0 calc(24px + env(safe-area-inset-bottom));
          animation: slideUp 0.28s cubic-bezier(0.32,0.72,0,1);
        }
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }

        .db-sheet-handle {
          width: 32px; height: 3px;
          background: rgba(255,255,255,0.15);
          border-radius: 2px;
          margin: 14px auto 6px;
        }
        .db-sheet-title {
          font-family: var(--mono);
          font-size: 0.56rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #4d7a96;
          text-align: center;
          padding: 6px 0 18px;
        }
        .db-sheet-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          padding: 0 16px 8px;
        }
        .db-sheet-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          text-decoration: none;
          padding: 18px 8px 14px;
          border-radius: 14px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          transition: background 0.15s, border-color 0.15s;
        }
        .db-sheet-item:active {
          background: rgba(56,189,248,0.08);
          border-color: rgba(56,189,248,0.2);
        }
        .db-sheet-item-icon {
          width: 40px; height: 40px;
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
        }
        .db-sheet-item-label {
          font-family: var(--mono);
          font-size: 0.56rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #8dbdd8;
        }
        .db-sheet-signout {
          margin: 6px 16px 0;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 13px;
          border-radius: 12px;
          background: rgba(248,113,113,0.05);
          border: 1px solid rgba(248,113,113,0.1);
          font-family: var(--mono);
          font-size: 0.58rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #f87171;
          cursor: pointer;
          width: calc(100% - 32px);
          transition: background 0.15s;
        }
        .db-sheet-signout:active { background: rgba(248,113,113,0.1); }

        @media (max-width: 768px) {
          .db-sidebar { display: none; }
          .db-main { margin-left: 0; }
          .db-topbar { display: none; }
          .db-mobile-bar { display: flex; }
          .db-bottom-nav { display: block; }
          .db-content { padding: 64px 16px 80px; }
          .db-shell { background: #1e3f56 !important; }
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
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ color: '#3d6e8a' }}>
            <circle cx="8" cy="4" r="1.2" fill="currentColor" />
            <circle cx="8" cy="8" r="1.2" fill="currentColor" />
            <circle cx="8" cy="12" r="1.2" fill="currentColor" />
          </svg>
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
              <div className="db-sheet-grid">
                <Link href="/dashboard/deposit" className="db-sheet-item" onClick={() => setWalletOpen(false)}>
                  <div className="db-sheet-item-icon" style={{ background: 'rgba(74,222,128,0.08)' }}>
                    <svg width="22" height="22" viewBox="0 0 13 13" fill="none">
                      <path d="M6.5 1v8M4 7l2.5 2.5L9 7M1 11h11" stroke="#4ade80" strokeWidth="1.1" strokeLinecap="square" />
                    </svg>
                  </div>
                  <span className="db-sheet-item-label">Deposit</span>
                </Link>
                <Link href="/dashboard/withdraw" className="db-sheet-item" onClick={() => setWalletOpen(false)}>
                  <div className="db-sheet-item-icon" style={{ background: 'rgba(248,113,113,0.08)' }}>
                    <svg width="22" height="22" viewBox="0 0 13 13" fill="none">
                      <path d="M6.5 9V1M4 3l2.5-2.5L9 3M1 11h11" stroke="#f87171" strokeWidth="1.1" strokeLinecap="square" />
                    </svg>
                  </div>
                  <span className="db-sheet-item-label">Withdraw</span>
                </Link>
                <Link href="/dashboard/history" className="db-sheet-item" onClick={() => setWalletOpen(false)}>
                  <div className="db-sheet-item-icon" style={{ background: 'rgba(56,189,248,0.08)' }}>
                    <svg width="22" height="22" viewBox="0 0 20 20" fill="none">
                      <circle cx="10" cy="10" r="7" stroke="#38bdf8" strokeWidth="1.3" />
                      <path d="M10 6v4l3 2" stroke="#38bdf8" strokeWidth="1.3" strokeLinecap="round" />
                    </svg>
                  </div>
                  <span className="db-sheet-item-label">History</span>
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
              <div className="db-sheet-grid">
                <Link href="/dashboard/support" className="db-sheet-item" onClick={() => setMoreOpen(false)}>
                  <div className="db-sheet-item-icon" style={{ background: 'rgba(56,189,248,0.08)' }}>
                    <svg width="22" height="22" viewBox="0 0 13 13" fill="none">
                      <circle cx="6.5" cy="6.5" r="5" stroke="#38bdf8" strokeWidth="1.1" />
                      <path d="M6.5 7.5V7c.9 0 1.5-.7 1.5-1.5S7.4 4 6.5 4 5 4.7 5 5.5" stroke="#38bdf8" strokeWidth="1.1" strokeLinecap="square" />
                      <circle cx="6.5" cy="9.5" r="0.6" fill="#38bdf8" />
                    </svg>
                  </div>
                  <span className="db-sheet-item-label">Support</span>
                </Link>
                <Link href="/dashboard/settings" className="db-sheet-item" onClick={() => setMoreOpen(false)}>
                  <div className="db-sheet-item-icon" style={{ background: 'rgba(148,163,184,0.08)' }}>
                    <svg width="22" height="22" viewBox="0 0 20 20" fill="none">
                      <circle cx="10" cy="10" r="2.5" stroke="#94a3b8" strokeWidth="1.3" />
                      <path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.22 4.22l1.42 1.42M14.36 14.36l1.42 1.42M4.22 15.78l1.42-1.42M14.36 5.64l1.42-1.42" stroke="#94a3b8" strokeWidth="1.3" strokeLinecap="round" />
                    </svg>
                  </div>
                  <span className="db-sheet-item-label">Settings</span>
                </Link>
                <Link href="/dashboard/notifications" className="db-sheet-item" onClick={() => setMoreOpen(false)}>
                  <div className="db-sheet-item-icon" style={{ background: 'rgba(251,191,36,0.08)' }}>
                    <svg width="22" height="22" viewBox="0 0 20 20" fill="none">
                      <path d="M10 2a6 6 0 0 1 6 6c0 3 1 4 1 4H3s1-1 1-4a6 6 0 0 1 6-6z" stroke="#fbbf24" strokeWidth="1.3" />
                      <path d="M8.5 16a1.5 1.5 0 0 0 3 0" stroke="#fbbf24" strokeWidth="1.3" strokeLinecap="round" />
                    </svg>
                  </div>
                  <span className="db-sheet-item-label">Alerts</span>
                </Link>
                <Link href="/dashboard/kyc" className="db-sheet-item" onClick={() => setMoreOpen(false)}>
                  <div className="db-sheet-item-icon" style={{ background: 'rgba(167,139,250,0.08)' }}>
                    <svg width="22" height="22" viewBox="0 0 20 20" fill="none">
                      <rect x="3" y="5" width="14" height="10" rx="2" stroke="#a78bfa" strokeWidth="1.3" />
                      <circle cx="7.5" cy="9.5" r="1.5" stroke="#a78bfa" strokeWidth="1.1" />
                      <path d="M11 8h4M11 11h3" stroke="#a78bfa" strokeWidth="1.1" strokeLinecap="round" />
                    </svg>
                  </div>
                  <span className="db-sheet-item-label">KYC</span>
                </Link>
              </div>
              <button
                className="db-sheet-signout"
                onClick={() => { setMoreOpen(false); signOut({ callbackUrl: '/login' }); }}
              >
                <svg width="14" height="14" viewBox="0 0 13 13" fill="none">
                  <path d="M5 2H2v9h3M8 9l3-2.5L8 4M11 6.5H5" stroke="#f87171" strokeWidth="1.1" strokeLinecap="square" />
                </svg>
                Sign Out
              </button>
            </div>
          </>
        )}

      </div>
    </>
  );
        }
