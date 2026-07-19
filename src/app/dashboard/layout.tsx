'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import GoogleTranslate from '@/components/GoogleTranslate';
import styles from './dashboard-layout.module.css';

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

  useEffect(() => {
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
    <div className={styles.dbShell}>

      {/* SIDEBAR */}
      <aside className={styles.dbSidebar}>
        <div className={styles.dbSidebarLogo}>
          <Link href="/" className={styles.dbLogoText}>
            APEX<span>•</span>MARKETS
          </Link>
          <p className={styles.dbLogoSub}>Terminal v1.0</p>
        </div>
        <nav className={styles.dbNav}>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.dbNavItem} ${pathname === item.href ? styles.dbNavItemActive : ''}`}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>
        <GoogleTranslate />
        <div className={styles.dbSidebarFooter}>
          <button className={styles.dbThemeToggle} onClick={toggleTheme}>
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </button>
          <button className={styles.dbSignout} onClick={() => signOut({ callbackUrl: '/login' })}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M5 2H2v9h3M8 9l3-2.5L8 4M11 6.5H5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="square" />
            </svg>
            Sign Out
          </button>
        </div>
      </aside>

      {/* MOBILE TOPBAR */}
      <div className={styles.dbMobileBar}>
        <div className={styles.dbMobileBarLeft}>
          {!isAdmin && (
            <button className={styles.dbHamburger} onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="Toggle menu">
              <HamburgerIcon />
            </button>
          )}
          <span className={styles.dbMobileLogo}>APEX<span>•</span></span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button className={styles.dbMobileTheme} onClick={toggleTheme} aria-label="Toggle theme">
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>
          <GoogleTranslate />
        </div>
      </div>

      {/* MAIN */}
      <main className={styles.dbMain}>
        <div className={styles.dbTopbar}>
          <span className={styles.dbTopbarTitle}>
            {navItems.find((n) => n.href === pathname)?.label ?? 'Dashboard'}
          </span>
          <div className={styles.dbTopbarRight}>
            <button className={styles.dbTopbarTheme} onClick={toggleTheme} aria-label="Toggle theme">
              {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
            </button>
            <span className={styles.dbTopbarSep}>·</span>
            <span>APEX MARKETS</span>
            <span className={styles.dbTopbarSep}>·</span>
            <span>Trading Terminal</span>
          </div>
        </div>
        <div className={styles.dbContent}>{children}</div>
      </main>

      {/* MOBILE SIDEBAR */}
      {!isAdmin && sidebarOpen && (
        <div
          className={`${styles.dbMobileSidebarOverlay} ${styles.dbMobileSidebarOverlayOpen}`}
          onClick={() => setSidebarOpen(false)}
        />
      )}
      {!isAdmin && (
        <div className={`${styles.dbMobileSidebar} ${sidebarOpen ? styles.dbMobileSidebarOpen : ''}`}>
          <div className={styles.dbMobileSidebarHeader}>
            <span className={styles.dbMobileSidebarLogo}>APEX<span>•</span>MARKETS</span>
            <button className={styles.dbMobileSidebarClose} onClick={() => setSidebarOpen(false)} aria-label="Close menu">
              <ChevronLeft />
            </button>
          </div>
          <div className={styles.dbMobileSidebarContent}>
            <Link href="/dashboard/support" className={styles.dbMobileSidebarRow} onClick={() => setSidebarOpen(false)}>
              <svg width="14" height="14" viewBox="0 0 13 13" fill="none">
                <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.1" />
                <path d="M6.5 7.5V7c.9 0 1.5-.7 1.5-1.5S7.4 4 6.5 4 5 4.7 5 5.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="square" />
                <circle cx="6.5" cy="9.5" r="0.6" fill="currentColor" />
              </svg>
              Support
            </Link>
            <div className={styles.dbMobileSidebarDivider} />
            <Link href="/dashboard/settings" className={styles.dbMobileSidebarRow} onClick={() => setSidebarOpen(false)}>
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.3" />
                <path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.22 4.22l1.42 1.42M14.36 14.36l1.42 1.42M4.22 15.78l1.42-1.42M14.36 5.64l1.42-1.42" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
              Settings
            </Link>
            <div className={styles.dbMobileSidebarDivider} />
            <Link href="/dashboard/notifications" className={styles.dbMobileSidebarRow} onClick={() => setSidebarOpen(false)}>
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                <path d="M10 2a6 6 0 0 1 6 6c0 3 1 4 1 4H3s1-1 1-4a6 6 0 0 1 6-6z" stroke="currentColor" strokeWidth="1.3" />
                <path d="M8.5 16a1.5 1.5 0 0 0 3 0" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
              Alerts
            </Link>
            <div className={styles.dbMobileSidebarDivider} />
            <Link href="/dashboard/kyc" className={styles.dbMobileSidebarRow} onClick={() => setSidebarOpen(false)}>
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                <rect x="3" y="5" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.3" />
                <circle cx="7.5" cy="9.5" r="1.5" stroke="currentColor" strokeWidth="1.1" />
                <path d="M11 8h4M11 11h3" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
              </svg>
              KYC
            </Link>
            <div className={styles.dbMobileSidebarDivider} />
            <Link href="/dashboard/subscription" className={styles.dbMobileSidebarRow} onClick={() => setSidebarOpen(false)}>
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                <rect x="3" y="4" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.3" />
                <path d="M3 8h14" stroke="currentColor" strokeWidth="1.3" />
                <circle cx="10" cy="12" r="1.2" fill="currentColor" />
              </svg>
              Subscription
            </Link>
          </div>
          <div className={styles.dbMobileSidebarFooter}>
            <button
              className={styles.dbMobileSidebarRow}
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
      )}

      {/* BOTTOM NAV + MORE SHEET — both guarded by the same !isAdmin condition */}
      {!isAdmin && (
        <>
          <nav className={styles.dbBottomNav}>
            <div className={styles.dbBottomNavInner}>

              <Link href="/dashboard" className={`${styles.dbBnItem} ${pathname === '/dashboard' ? styles.dbBnItemActive : ''}`}>
                <svg width="18" height="18" viewBox="0 0 13 13" fill="none">
                  <rect x="1" y="1" width="5" height="5" stroke="currentColor" strokeWidth="1.1" />
                  <rect x="7" y="1" width="5" height="5" stroke="currentColor" strokeWidth="1.1" />
                  <rect x="1" y="7" width="5" height="5" stroke="currentColor" strokeWidth="1.1" />
                  <rect x="7" y="7" width="5" height="5" stroke="currentColor" strokeWidth="1.1" />
                </svg>
                <span className={styles.dbBnLabel}>Home</span>
              </Link>

              <Link href="/dashboard/markets" className={`${styles.dbBnItem} ${pathname === '/dashboard/markets' ? styles.dbBnItemActive : ''}`}>
                <svg width="18" height="18" viewBox="0 0 13 13" fill="none">
                  <path d="M1 10l3-4 2.5 2 3.5-5 2 2.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="square" strokeLinejoin="miter" />
                </svg>
                <span className={styles.dbBnLabel}>Markets</span>
              </Link>

              <Link href="/dashboard/trade" className={`${styles.dbBnItem} ${pathname === '/dashboard/trade' ? styles.dbBnItemActive : ''}`}>
                <svg width="18" height="18" viewBox="0 0 13 13" fill="none">
                  <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.1" />
                  <path d="M6.5 4v3l2 1.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="square" />
                </svg>
                <span className={styles.dbBnLabel}>Trade</span>
              </Link>

              <Link href="/dashboard/assets" className={`${styles.dbBnItem} ${walletActive ? styles.dbBnItemActive : ''}`}>
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                  <rect x="2" y="5" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.3" />
                  <path d="M2 8h16" stroke="currentColor" strokeWidth="1.3" />
                  <circle cx="14.5" cy="12" r="1.2" fill="currentColor" />
                  <path d="M6 3l8 0" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                </svg>
                <span className={styles.dbBnLabel}>Wallet</span>
              </Link>

              <button
                className={`${styles.dbBnItem} ${moreActive ? styles.dbBnItemActive : ''}`}
                onClick={() => setMoreOpen(true)}
              >
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                  <circle cx="4" cy="10" r="1.5" fill="currentColor" />
                  <circle cx="10" cy="10" r="1.5" fill="currentColor" />
                  <circle cx="16" cy="10" r="1.5" fill="currentColor" />
                </svg>
                <span className={styles.dbBnLabel}>Account</span>
              </button>

            </div>
          </nav>

          {/* MORE SHEET */}
          {moreOpen && (
            <>
              <div className={styles.dbSheetOverlay} onClick={() => setMoreOpen(false)} />
              <div className={styles.dbSheet}>
                <div className={styles.dbSheetHandle} />
                <div className={styles.dbSheetTitle}>More</div>
                <div className={styles.dbSheetRows}>
                  <Link href="/dashboard/support" className={styles.dbSheetRow} onClick={() => setMoreOpen(false)}>
                    <div className={styles.dbSheetRowIcon} style={{ color: 'var(--ink-dim)' }}>
                      <svg width="14" height="14" viewBox="0 0 13 13" fill="none">
                        <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.1" />
                        <path d="M6.5 7.5V7c.9 0 1.5-.7 1.5-1.5S7.4 4 6.5 4 5 4.7 5 5.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="square" />
                        <circle cx="6.5" cy="9.5" r="0.6" fill="currentColor" />
                      </svg>
                    </div>
                    <div className={styles.dbSheetRowText}>
                      <span className={styles.dbSheetRowLabel}>Support</span>
                      <span className={styles.dbSheetRowSub}>Get help or contact us</span>
                    </div>
                    <div className={styles.dbSheetRowArrow}><ChevronRight /></div>
                  </Link>
                  <div className={styles.dbSheetRowDivider} />
                  <Link href="/dashboard/settings" className={styles.dbSheetRow} onClick={() => setMoreOpen(false)}>
                    <div className={styles.dbSheetRowIcon} style={{ color: 'var(--ink-dim)' }}>
                      <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                        <circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.3" />
                        <path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.22 4.22l1.42 1.42M14.36 14.36l1.42 1.42M4.22 15.78l1.42-1.42M14.36 5.64l1.42-1.42" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                      </svg>
                    </div>
                    <div className={styles.dbSheetRowText}>
                      <span className={styles.dbSheetRowLabel}>Settings</span>
                      <span className={styles.dbSheetRowSub}>Account preferences</span>
                    </div>
                    <div className={styles.dbSheetRowArrow}><ChevronRight /></div>
                  </Link>
                  <div className={styles.dbSheetRowDivider} />
                  <Link href="/dashboard/notifications" className={styles.dbSheetRow} onClick={() => setMoreOpen(false)}>
                    <div className={styles.dbSheetRowIcon} style={{ color: 'var(--ink-dim)' }}>
                      <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                        <path d="M10 2a6 6 0 0 1 6 6c0 3 1 4 1 4H3s1-1 1-4a6 6 0 0 1 6-6z" stroke="currentColor" strokeWidth="1.3" />
                        <path d="M8.5 16a1.5 1.5 0 0 0 3 0" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                      </svg>
                    </div>
                    <div className={styles.dbSheetRowText}>
                      <span className={styles.dbSheetRowLabel}>Alerts</span>
                      <span className={styles.dbSheetRowSub}>Notifications &amp; price alerts</span>
                    </div>
                    <div className={styles.dbSheetRowArrow}><ChevronRight /></div>
                  </Link>
                  <div className={styles.dbSheetRowDivider} />
                  <Link href="/dashboard/kyc" className={styles.dbSheetRow} onClick={() => setMoreOpen(false)}>
                    <div className={styles.dbSheetRowIcon} style={{ color: 'var(--ink-dim)' }}>
                      <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                        <rect x="3" y="5" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.3" />
                        <circle cx="7.5" cy="9.5" r="1.5" stroke="currentColor" strokeWidth="1.1" />
                        <path d="M11 8h4M11 11h3" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
                      </svg>
                    </div>
                    <div className={styles.dbSheetRowText}>
                      <span className={styles.dbSheetRowLabel}>KYC</span>
                      <span className={styles.dbSheetRowSub}>Identity verification</span>
                    </div>
                    <div className={styles.dbSheetRowArrow}><ChevronRight /></div>
                  </Link>
                  <div className={styles.dbSheetRowDivider} />
                  <Link href="/dashboard/subscription" className={styles.dbSheetRow} onClick={() => setMoreOpen(false)}>
                    <div className={styles.dbSheetRowIcon} style={{ color: 'var(--ink-dim)' }}>
                      <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                        <rect x="3" y="4" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.3" />
                        <path d="M3 8h14" stroke="currentColor" strokeWidth="1.3" />
                        <circle cx="10" cy="12" r="1.2" fill="currentColor" />
                      </svg>
                    </div>
                    <div className={styles.dbSheetRowText}>
                      <span className={styles.dbSheetRowLabel}>Subscription</span>
                      <span className={styles.dbSheetRowSub}>Manage your plan</span>
                    </div>
                    <div className={styles.dbSheetRowArrow}><ChevronRight /></div>
                  </Link>
                </div>
                <button
                  className={styles.dbSheetSignoutRow}
                  onClick={() => { setMoreOpen(false); signOut({ callbackUrl: '/login' }); }}
                >
                  <div className={styles.dbSheetRowIcon} style={{ color: 'var(--red)' }}>
                    <svg width="14" height="14" viewBox="0 0 13 13" fill="none">
                      <path d="M5 2H2v9h3M8 9l3-2.5L8 4M11 6.5H5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="square" />
                    </svg>
                  </div>
                  <span className={styles.dbSheetSignoutLabel}>Sign Out</span>
                </button>
              </div>
            </>
          )}
        </>
      )}

    </div>
  );
}
