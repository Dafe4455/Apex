'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

// ... (keep all your types and helper components: Transaction, Market, etc.)
// ... (keep fmt, Sparkline, Badge, FearGreedGauge unchanged)

export default function DashboardPage() {
  const t = useTranslations('dashboard');

  // ... all your existing state and hooks unchanged ...

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f2535' }}>
        <div style={{ width: 32, height: 32, border: '3px solid #1a3a50', borderTopColor: '#38bdf8', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <>
      <style>{`/* ... your existing styles unchanged ... */`}</style>

      <div className="dash-wrap">

        {/* HEADER */}
        <div className="d-header">
          <div>
            <p className="d-greeting">{t('welcomeBack')}</p>
            <p className="d-name">{firstName}</p>
            <p className="d-uid">APEX·MKTS / {userId}</p>
          </div>
          <div className="d-header-right">
            <div className="d-live-chip"><span className="live-dot" />{t('live')}</div>
            <span className="d-clock">{time}</span>
          </div>
        </div>

        {/* HERO BALANCE */}
        <div className="hero-card">
          <p className="bal-eyebrow">{t('netAssetValue')}</p>
          <p className="bal-amount"><sup>$</sup>{fmt(balance, 0)}<span className="cents">.00</span></p>
          <div className="bal-row">
            <span className="bal-change">{profit >= 0 ? '+' : ''}${fmt(profit)} ({changePercent >= 0 ? '+' : ''}{fmt(changePercent)}%)</span>
            <span className="bal-period">{t('currentPeriod')}</span>
          </div>
          <div className="bal-sparkline"><Sparkline positive={profit >= 0} width={140} height={30} /></div>
          <div className="bal-actions">
            <button className="btn-dep" onClick={openDeposit}>{t('deposit')}</button>
            <Link href="/dashboard/withdraw" className="btn-ghost">{t('withdraw')}</Link>
            <button className="btn-ghost" onClick={() => setBalanceOpen(v => !v)}>
              {balanceOpen ? t('hide') : t('history')}
            </button>
          </div>
        </div>

        {/* TX DRAWER */}
        <div className="tx-drawer" style={{ maxHeight: balanceOpen ? 260 : 0 }}>
          <div className="tx-drawer-inner">
            <p className="tx-drawer-label">{t('recentTransactions')}</p>
            {transactions.length === 0
              ? <p style={{ fontSize: '0.65rem', color: 'var(--ink-faint)', fontWeight: 300 }}>{t('noTransactions')}</p>
              : transactions.slice(0, 5).map(tx => (
                <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.68rem' }}>
                  <span style={{ color: tx.type === 'Deposit' ? 'var(--green)' : 'var(--red)', fontWeight: 500 }}>{tx.type}</span>
                  <span style={{ fontFamily: 'var(--mono)', color: 'var(--ink)' }}>${fmt(tx.amount, 0)}</span>
                  <Badge status={tx.status} />
                </div>
              ))}
          </div>
        </div>

        {/* STAT ROW */}
        <div className="stat-row">
          <div className="stat-cell">
            <p className="stat-lbl">{t('pnl')}</p>
            <p className="stat-val pos">{profit >= 0 ? '+' : ''}${fmt(profit)}</p>
            <p className="stat-sub">{t('realised')}</p>
          </div>
          <div className="stat-cell">
            <p className="stat-lbl">{t('positions')}</p>
            <p className="stat-val">{openPositions} {t('open')}</p>
            <p className="stat-sub">{profitPos} {t('profit')} · {lossPos} {t('loss')}</p>
          </div>
          <div className="stat-cell fg-cell">
            <p className="stat-lbl" style={{ textAlign: 'center', marginBottom: 4 }}>{t('sentiment')}</p>
            <FearGreedGauge value={fearGreedValue} />
          </div>
        </div>

        <div className="section-divider" />

        {/* MARKET OVERVIEW */}
        <p className="section-label"><span className="section-label-pip" />{t('marketOverview')}</p>
        <div className="two-col">
          <div className="info-card">
            <p className="ic-label">{t('topMovers')}</p>
            {topMovers.length === 0
              ? <p style={{ fontSize: '0.62rem', color: 'var(--ink-faint)' }}>{t('noData')}</p>
              : topMovers.map(m => (
                <div key={m.symbol} className="movers-item">
                  <span className="mover-sym">
                    <span className="mover-ico" style={{ background: m.iconBg }}>{m.icon}</span>
                    {m.symbol}
                  </span>
                  <span className={`mover-chg ${m.change24h >= 0 ? 'up' : 'dn'}`}>
                    {m.change24h >= 0 ? '+' : ''}{fmt(m.change24h)}%
                  </span>
                </div>
              ))}
          </div>
          <div className="info-card">
            <p className="ic-label">{t('recentActivity')}</p>
            {activityLogs.length === 0
              ? <p style={{ fontSize: '0.62rem', color: 'var(--ink-faint)' }}>{t('noActivity')}</p>
              : activityLogs.slice(0, 4).map(a => (
                <p key={a.id} className="activity-item">{a.description}</p>
              ))}
          </div>
        </div>

        <div className="section-divider" />

        {/* MARKETS */}
        <p className="section-label"><span className="section-label-pip" />{t('markets')}</p>
        <div className="asset-section">
          <div className="asset-table-wrap">
            <div className="asset-thead">
              <span className="asset-th">{t('asset')}</span>
              <span className="asset-th">{t('price')}</span>
              <span className="asset-th">{t('change24h')}</span>
              <span className="asset-th">{t('trade')}</span>
            </div>
            {markets.length === 0
              ? <div style={{ padding: '24px', textAlign: 'center' }}>
                  <p style={{ fontSize: '0.68rem', color: 'var(--ink-faint)', fontWeight: 300 }}>{t('noMarketData')}</p>
                </div>
              : markets.map(a => (
                <div key={a.id} className="asset-row">
                  <div className="asset-name-cell">
                    <div className="asset-ico" style={{ background: a.iconBg }}>{a.icon}</div>
                    <div>
                      <div className="asset-sym">{a.symbol}</div>
                      <div className="asset-nm">{a.name}</div>
                    </div>
                  </div>
                  <span className="asset-price">${fmt(a.price)}</span>
                  <span className={`asset-chg ${a.change24h >= 0 ? 'up' : 'dn'}`}>
                    {a.change24h >= 0 ? '+' : ''}{fmt(a.change24h)}%
                  </span>
                  <div className="trade-btns">
                    <button className="btn-buy">{t('buy')}</button>
                    <button className="btn-sell">{t('sell')}</button>
                  </div>
                </div>
              ))}
          </div>
        </div>

        <div className="section-divider" />

        {/* GLOBAL FINANCE NEWS */}
        <p className="section-label"><span className="section-label-pip" />{t('globalNews')}</p>
        <div className="news-section">
          <div className="news-wrap">
            {newsLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '28px 0', gap: 10 }}>
                <div style={{ width: 22, height: 22, border: '2.5px solid rgba(255,255,255,0.06)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'dspin 0.7s linear infinite' }} />
                <p style={{ fontSize: '0.62rem', color: 'var(--ink-faint)' }}>{t('fetchingNews')}</p>
              </div>
            ) : news.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center' }}>
                <p style={{ fontSize: '0.68rem', color: 'var(--ink-faint)', fontWeight: 300 }}>{t('noNews')}</p>
              </div>
            ) : (
              <>
                {news.map((item, i) => {
                  const [tagBg, tagCol] = tagColors[item.tag] ?? ['#1a1a1a', '#aaa'];
                  return (
                    <div key={i} className="news-item">
                      <span className="news-tag" style={{ background: tagBg, color: tagCol }}>{item.tag}</span>
                      <div className="news-body">
                        <p className="news-headline">{item.headline}</p>
                        <p className="news-meta">{item.source} · {item.time}</p>
                      </div>
                    </div>
                  );
                })}
                <div className="news-pulse">
                  <span className="news-pulse-dot" />
                  <span style={{ fontSize: '0.58rem', color: 'var(--ink-faint)', fontFamily: 'var(--mono)' }}>{t('aiCurated')}</span>
                </div>
              </>
            )}
          </div>
        </div>

      </div>

      {/* QUICK DEPOSIT SHEET */}
      {sheet === 'deposit' && (
        <>
          <div className="sheet-overlay" onClick={closeSheet} />
          <div className="sheet">
            <div className="sheet-handle" />
            <p className="sheet-title">{t('quickDeposit')}</p>
            <p className="sheet-sub">{t('quickDepositSub')}</p>

            {methodsLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '30px 0', gap: 12 }}>
                <div style={{ width: 26, height: 26, border: '2.5px solid rgba(255,255,255,0.06)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'dspin 0.7s linear infinite' }} />
                <p style={{ fontSize: '0.65rem', color: 'var(--ink-faint)' }}>{t('loading')}</p>
              </div>
            ) : depositMethods.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 0' }}>
                <p style={{ fontSize: '1.8rem', marginBottom: 10 }}>🔧</p>
                <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--ink)', marginBottom: 4 }}>{t('noDepositMethods')}</p>
                <p style={{ fontSize: '0.65rem', color: 'var(--ink-faint)', fontWeight: 300 }}>{t('noDepositMethodsSub')}</p>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', gap: 8, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
                  {depositMethods.map(m => (
                    <button key={m.id} onClick={() => setMethod(m.id)} style={{
                      flexShrink: 0, padding: '6px 14px', borderRadius: 20,
                      border: method === m.id ? 'none' : '1px solid rgba(255,255,255,0.08)',
                      background: method === m.id ? 'var(--accent)' : 'var(--card)',
                      color: method === m.id ? '#0a1f2e' : 'var(--ink-dim)',
                      fontFamily: 'var(--sans)', fontSize: '0.7rem', fontWeight: 600,
                      cursor: 'pointer', transition: 'all 0.15s',
                    }}>
                      {m.icon} {m.label}
                    </button>
                  ))}
                </div>
                {activeMethod && (
                  <div style={{ background: 'var(--card)', border: '1.5px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '14px 16px', marginBottom: 12 }}>
                    {activeMethod.network && (
                      <p style={{ fontSize: '0.56rem', fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
                        {t('network')}: {activeMethod.network}
                      </p>
                    )}
                    <p style={{ fontFamily: 'var(--mono)', fontSize: '0.68rem', color: 'var(--ink)', wordBreak: 'break-all', lineHeight: 1.6, marginBottom: 12 }}>
                      {activeMethod.address}
                    </p>
                    <button onClick={() => copyAddress(activeMethod.address)} style={{
                      width: '100%', padding: '9px', borderRadius: 8, border: 'none',
                      background: copied ? 'var(--green-l)' : 'rgba(255,255,255,0.06)',
                      color: copied ? 'var(--green)' : 'var(--ink-dim)',
                      fontFamily: 'var(--sans)', fontSize: '0.72rem', fontWeight: 600,
                      cursor: 'pointer', transition: 'all 0.2s',
                    }}>
                      {copied ? t('copied') : t('copyAddress')}
                    </button>
                  </div>
                )}
                {activeMethod?.note && (
                  <div style={{ display: 'flex', gap: 8, background: 'var(--gold-l)', border: '1px solid #3a2e00', borderRadius: 10, padding: '10px 14px', marginBottom: 4 }}>
                    <span style={{ fontSize: '0.85rem' }}>⚠️</span>
                    <p style={{ fontSize: '0.62rem', color: 'var(--gold)', fontWeight: 400, lineHeight: 1.5 }}>{activeMethod.note}</p>
                  </div>
                )}
              </>
            )}
            <Link href="/dashboard/deposit" className="sheet-full-link" onClick={closeSheet}>
              {t('fullDepositPage')}
            </Link>
          </div>
        </>
      )}
    </>
  );
}
