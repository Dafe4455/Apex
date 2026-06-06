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
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Manrope:wght@300;400;500;600&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --cr:  #1f0a0a;
          --crd: #180808;
          --crx: #3a1010;
          --ink: #120505;
          --inm: #edcaca;
          --inl: #96504d;
          --accent: #e63030;
          --mono: 'DM Mono', 'Courier New', monospace;
          --sans: 'Manrope', system-ui, sans-serif;
        }

        html, body { background: #120505 !important; }

        .db-shell {
          min-height: 100vh;
          background: var(--cr);
          font-family: var(--sans);
          display: flex;
        }

        /* ── SIDEBAR ── */
        .db-sidebar {
          width: 200px;
          flex-shrink: 0;
          background: var(--ink);
          display: flex;
          flex-direction: column;
          position: fixed;
          top: 0; left: 0; bottom: 0;
          z-index: 50;
          transition: transform 0.25s ease;
        }

        .db-sidebar-logo {
          padding: 22px 18px 18px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .db-logo-text {
          font-family: var(--mono);
          font-size: 0.72rem;
          font-weight: 500;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #edcaca;
          text-decoration: none;
          display: block;
        }
        .db-logo-text span { color: var(--accent); }
        .db-logo-sub {
          font-family: var(--mono);
          font-size: 0.52rem;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: #3d1e1e;
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
          color: #5a2d2d;
          text-decoration: none;
          transition: color 0.1s, background 0.1s;
          position: relative;
          margin: 1px 0;
        }
        .db-nav-item:hover { color: #c87a7a; background: rgba(230,48,48,0.06); }
        .db-nav-item.active { color: #edcaca; }
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
          color: #5a2d2d;
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
          background: var(--cr);
          border-bottom: 1px solid var(--crx);
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
        .db-topbar-sep { color: var(--crx); }

        /* ── CONTENT ── */
        .db-content {
          flex: 1;
          padding: 28px 32px;
          max-width: 1000px;
          width: 100%;
        }

        /* ── MOBILE ── */
        .db-mobile-bar {
          display: none;
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 60;
          background: #120505 !important;
          padding: 12px 18px;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .db-hamburger {
          background: none; border: none;
          color: #96504d; cursor: pointer; padding: 4px;
        }
        .db-mobile-logo {
          font-family: var(--mono);
          font-size: 0.7rem;
          font-weight: 500;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #edcaca;
        }
        .db-mobile-logo span { color: var(--accent); }

        @media (max-width: 768px) {
          .db-sidebar { transform: translateX(-100%); }
          .db-sidebar.open { transform: translateX(0); }
          .db-main { margin-left: 0; }
          .db-topbar { display: none; }
          .db-mobile-bar { display: flex; }
          .db-content { padding: 68px 16px 32px; }
          .db-shell { background: var(--ink); }
        }
      `}</style>

      <div className="db-shell">
        {/* SIDEBAR */}
        <aside className={`db-sidebar ${mobileOpen ? 'open' : ''}`}>
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
                onClick={() => setMobileOpen(false)}
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

        {/* MOBILE BAR */}
        <div className="db-mobile-bar">
          <button className="db-hamburger" onClick={() => setMobileOpen((v) => !v)}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M2 4h14M2 9h14M2 14h14" stroke="currentColor" strokeWidth="1.2" strokeLinecap="square" />
            </svg>
          </button>
          <span className="db-mobile-logo">APEX<span>•</span>MARKETS</span>
          <div style={{ width: 26 }} />
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

        {/* Mobile overlay */}
        {mobileOpen && (
          <div
            onClick={() => setMobileOpen(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 49 }}
          />
        )}
      </div>
    </>
  );
}
