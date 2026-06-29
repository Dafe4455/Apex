'use client';

import { useState, useEffect, useMemo } from 'react';
import { RefreshCw, ArrowDownLeft, ArrowUpRight, Zap, Activity, Search } from 'lucide-react';

type EventKind = 'trade' | 'deposit' | 'withdrawal' | 'activity';
type Outcome = 'profit' | 'loss' | null;

type TimelineEvent = {
  id: string;
  kind: EventKind;
  title: string;
  description: string;
  amount: number | null;
  outcome: Outcome;
  status: string | null;
  createdAt: string;
};

function fmtUsd(n: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD',
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(n);
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit',
  });
}

function groupByDate(events: TimelineEvent[]) {
  const groups: Record<string, TimelineEvent[]> = {};
  for (const e of events) {
    const key = fmtDate(e.createdAt);
    if (!groups[key]) groups[key] = [];
    groups[key].push(e);
  }
  return groups;
}

function outcomeColors(outcome: Outcome) {
  if (outcome === 'profit') return { bg: 'var(--green-l)', col: 'var(--green)' };
  if (outcome === 'loss')   return { bg: 'var(--red-l)',   col: 'var(--red)'   };
  return { bg: 'var(--surface)', col: 'var(--ink-dim)' };
}

const KIND_CONFIG: Record<EventKind, { label: string }> = {
  trade:      { label: 'Trade' },
  deposit:    { label: 'Deposit' },
  withdrawal: { label: 'Withdrawal' },
  activity:   { label: 'Activity' },
};

function kindBaseColors(kind: EventKind) {
  switch (kind) {
    case 'deposit':    return { bg: 'var(--accent-l)', col: 'var(--accent)' };
    case 'withdrawal': return { bg: 'var(--gold-l)',    col: 'var(--gold)'   };
    case 'activity':   return { bg: 'var(--surface)',   col: 'var(--ink-dim)' };
    default:           return { bg: 'var(--surface)',   col: 'var(--ink-dim)' };
  }
}

function StatusPill({ status }: { status: string }) {
  const ok      = status === 'COMPLETED' || status === 'APPROVED';
  const pending = status === 'PENDING'   || status === 'PENDING_VERIFICATION';
  const col = ok ? 'var(--green)' : pending ? 'var(--gold)' : 'var(--red)';
  const bg  = ok ? 'var(--green-l)' : pending ? 'var(--gold-l)' : 'var(--red-l)';
  return (
    <span style={{
      fontFamily: 'var(--mono)', fontSize: '0.55rem', fontWeight: 700,
      padding: '2px 7px', borderRadius: 4,
      background: bg, color: col, whiteSpace: 'nowrap', flexShrink: 0,
    }}>
      {status.replace('_', ' ')}
    </span>
  );
}

export default function HistoryPage() {
  const [events, setEvents]         = useState<TimelineEvent[]>([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch]         = useState('');
  const [filter, setFilter]         = useState<EventKind | 'all'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const res = await fetch('/api/history');
      if (!res.ok) throw new Error();
      const data = await res.json();
      setEvents(data.timeline ?? []);
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    let list = events;
    if (filter !== 'all') list = list.filter(e => e.kind === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(e =>
        e.title.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q)
      );
    }
    return list;
  }, [events, filter, search]);

  const grouped  = useMemo(() => groupByDate(filtered), [filtered]);
  const dateKeys = Object.keys(grouped);

  const stats = useMemo(() => ({
    trades:   events.filter(e => e.kind === 'trade').length,
    totalIn:  events.filter(e => e.kind === 'deposit').reduce((s, e) => s + (e.amount ?? 0), 0),
    totalOut: events.filter(e => e.kind === 'withdrawal').reduce((s, e) => s + (e.amount ?? 0), 0),
  }), [events]);

  if (loading) return (
    <div className="hy-page">
      <div className="hy-inner">
        {[1,2,3,4,5].map(i => (
          <div key={i} className="hy-skeleton" style={{ height: 64, borderRadius: 12, marginBottom: 8 }} />
        ))}
      </div>
    </div>
  );

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        @keyframes shimmer { to { background-position: -200% 0; } }
        @keyframes spin    { to { transform: rotate(360deg); } }

        /* ── Page shell ── */
        .hy-page {
          min-height: 100vh;
          background: var(--bg);
          padding: 20px 16px 80px;
          font-family: var(--sans);
          color: var(--ink);
        }
        .hy-inner {
          max-width: 960px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        /* ── Skeleton ── */
        .hy-skeleton {
          background: var(--card);
          background-size: 200% 100%;
          animation: shimmer 1.4s infinite;
        }

        /* ── Header row ── */
        .hy-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
        }
        .hy-header h1 {
          font-family: var(--sans);
          font-size: 1.45rem;
          font-weight: 700;
          color: var(--ink);
        }
        .hy-header-sub {
          font-family: var(--mono);
          font-size: 0.62rem;
          color: var(--ink-faint);
          letter-spacing: 0.08em;
          margin-top: 2px;
        }
        .hy-refresh-btn {
          background: none;
          border: 1px solid var(--line-strong);
          border-radius: 8px;
          padding: 8px 10px;
          cursor: pointer;
          flex-shrink: 0;
        }

        /* ── Stats ── */
        .hy-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
        }
        .hy-stat-card {
          background: var(--card);
          border: 1px solid var(--line-strong);
          border-radius: 12px;
          padding: 12px 14px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          overflow: hidden;
        }
        .hy-stat-label {
          font-family: var(--mono);
          font-size: 0.55rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--ink-faint);
        }
        .hy-stat-value {
          font-family: var(--mono);
          font-size: 0.88rem;
          font-weight: 700;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        /* ── Controls row: search + filters ── */
        .hy-controls {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        @media (min-width: 640px) {
          .hy-controls {
            flex-direction: row;
            align-items: center;
            gap: 12px;
          }
          .hy-filters {
            flex-shrink: 0;
          }
          /* Wider desktop padding */
          .hy-page {
            padding: 28px 24px 80px;
          }
        }

        /* ── Search box ── */
        .hy-search {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 8px;
          background: var(--card);
          border: 1px solid var(--line-strong);
          border-radius: 10px;
          padding: 9px 14px;
          transition: border-color 0.15s;
        }
        .hy-search:focus-within { border-color: var(--accent); }
        .hy-search input {
          background: none; border: none; outline: none;
          font-family: var(--mono); font-size: 0.72rem;
          color: var(--ink); width: 100%;
        }
        .hy-search input::placeholder { color: var(--ink-faint); }

        /* ── Filter pills ── */
        .hy-filters {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        .filter-btn {
          background: none; border: 1px solid var(--line-strong); cursor: pointer;
          font-family: var(--mono); font-size: 0.6rem; font-weight: 700;
          letter-spacing: 0.1em; text-transform: uppercase;
          color: var(--ink-faint); padding: 6px 12px; border-radius: 20px;
          transition: all 0.15s; white-space: nowrap;
        }
        .filter-btn:hover { color: var(--ink-dim); border-color: var(--line-strong); }
        .filter-btn.active-all        { background: var(--surface);  color: var(--accent);  border-color: var(--accent); }
        .filter-btn.active-trade      { background: var(--surface);  color: var(--ink-dim); border-color: var(--line-strong); }
        .filter-btn.active-deposit    { background: var(--accent-l); color: var(--accent);  border-color: var(--accent); }
        .filter-btn.active-withdrawal { background: var(--gold-l);   color: var(--gold);    border-color: var(--gold); }
        .filter-btn.active-activity   { background: var(--surface);  color: var(--ink-dim); border-color: var(--line-strong); }

        /* ── Date group card ── */
        .hy-group {
          background: var(--card);
          border: 1px solid var(--line-strong);
          border-radius: 14px;
          overflow: hidden;
        }
        .date-label {
          font-family: var(--mono); font-size: 0.58rem; font-weight: 700;
          letter-spacing: 0.12em; text-transform: uppercase;
          color: var(--ink-faint); padding: 10px 16px 6px;
          border-bottom: 1px solid var(--line);
          background: var(--surface);
        }

        /* ── Event row ── */
        .event-row {
          display: flex; align-items: center; gap: 8px;
          padding: 13px 16px; border-bottom: 1px solid var(--line);
          transition: background 0.12s;
          overflow: hidden;
        }
        .event-row:last-child { border-bottom: none; }
        .event-row:hover { background: var(--surface-hover); }

        .event-main { flex: 1 1 auto; min-width: 0; overflow: hidden; }
        .event-title {
          font-weight: 600; font-size: 0.85rem; color: var(--ink);
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
          min-width: 0;
        }
        .event-desc {
          font-family: var(--mono); font-size: 0.62rem; color: var(--ink-faint);
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
          flex: 1 1 auto; min-width: 0;
        }
        .event-amount-col {
          flex: 0 1 auto; max-width: 38%; min-width: 0; overflow: hidden;
          display: flex; flex-direction: column; align-items: flex-end; gap: 4px;
        }
        .event-amount {
          font-family: var(--mono); font-size: 0.78rem; font-weight: 700;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
          max-width: 100%; min-width: 0;
        }

        /* On desktop: slightly more breathing room per row */
        @media (min-width: 640px) {
          .event-row { padding: 15px 20px; gap: 14px; }
          .date-label { padding: 11px 20px 7px; }
          .event-amount { font-size: 0.85rem; }
          .event-title  { font-size: 0.88rem; }
          .hy-stat-card { padding: 14px 18px; }
          .hy-stat-value { font-size: 1rem; }
        }

        /* ── Empty state ── */
        .hy-empty {
          display: flex; flex-direction: column; align-items: center;
          gap: 12px; padding: 48px 24px;
          background: var(--card); border: 1px solid var(--line-strong);
          border-radius: 14px;
        }
        .hy-empty p {
          font-family: var(--mono); font-size: 0.72rem;
          color: var(--ink-faint); letter-spacing: 0.06em;
        }
      `}</style>

      <div className="hy-page">
        <div className="hy-inner">

          {/* HEADER */}
          <div className="hy-header">
            <div>
              <h1>History</h1>
              <p className="hy-header-sub">{events.length} events total</p>
            </div>
            <button
              className="hy-refresh-btn"
              onClick={() => load(true)}
              disabled={refreshing}
              style={{ color: refreshing ? 'var(--accent)' : 'var(--ink-faint)' }}
            >
              <RefreshCw size={15} style={{ animation: refreshing ? 'spin 0.8s linear infinite' : 'none' }} />
            </button>
          </div>

          {/* STATS */}
          <div className="hy-stats">
            {[
              { label: 'Trades',    value: stats.trades,           col: 'var(--green)'  },
              { label: 'Deposited', value: fmtUsd(stats.totalIn),  col: 'var(--accent)' },
              { label: 'Withdrawn', value: fmtUsd(stats.totalOut), col: 'var(--gold)'   },
            ].map(s => (
              <div key={s.label} className="hy-stat-card">
                <span className="hy-stat-label">{s.label}</span>
                <span className="hy-stat-value" style={{ color: s.col }}>{s.value}</span>
              </div>
            ))}
          </div>

          {/* CONTROLS: search + filters in one row on desktop */}
          <div className="hy-controls">
            <div className="hy-search">
              <Search size={13} style={{ color: 'var(--ink-faint)', flexShrink: 0 }} />
              <input
                placeholder="Search history…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="hy-filters">
              {([
                { key: 'all',        label: 'All'         },
                { key: 'trade',      label: 'Trades'      },
                { key: 'deposit',    label: 'Deposits'    },
                { key: 'withdrawal', label: 'Withdrawals' },
                { key: 'activity',   label: 'Activity'    },
              ] as const).map(f => (
                <button
                  key={f.key}
                  className={`filter-btn ${filter === f.key ? `active-${f.key}` : ''}`}
                  onClick={() => setFilter(f.key)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* TIMELINE */}
          {dateKeys.length === 0 ? (
            <div className="hy-empty">
              <Activity size={32} strokeWidth={1.2} color="var(--ink-faint)" />
              <p>{search ? `No results for "${search}"` : 'No history yet.'}</p>
            </div>
          ) : dateKeys.map(dateKey => (
            <div key={dateKey} className="hy-group">
              <div className="date-label">{dateKey}</div>
              {grouped[dateKey].map(event => {
                const label = KIND_CONFIG[event.kind].label;
                const { bg: badgeBg, col: badgeCol } = event.kind === 'trade'
                  ? outcomeColors(event.outcome)
                  : kindBaseColors(event.kind);
                const amountCol = event.kind === 'trade'
                  ? outcomeColors(event.outcome).col
                  : event.kind === 'deposit'
                    ? 'var(--accent)'
                    : event.kind === 'withdrawal'
                      ? 'var(--gold)'
                      : 'var(--ink)';

                const isWithdrawal = event.kind === 'withdrawal';
                const isExpanded   = expandedId === event.id;

                return (
                  <div key={event.id}>
                    <div
                      className="event-row"
                      onClick={isWithdrawal ? () => setExpandedId(isExpanded ? null : event.id) : undefined}
                      style={isWithdrawal ? { cursor: 'pointer' } : undefined}
                    >
                      <div style={{
                        width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                        background: badgeBg, display: 'flex', alignItems: 'center',
                        justifyContent: 'center', color: badgeCol,
                      }}>
                        {event.kind === 'deposit'    && <ArrowDownLeft size={16} />}
                        {event.kind === 'withdrawal' && <ArrowUpRight  size={16} />}
                        {event.kind === 'trade'      && <Zap           size={16} />}
                        {event.kind === 'activity'   && <Activity      size={14} />}
                      </div>
                      <div className="event-main">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                          <span className="event-title">{event.title}</span>
                          <span style={{
                            fontFamily: 'var(--mono)', fontSize: '0.55rem', fontWeight: 700,
                            padding: '1px 6px', borderRadius: 4,
                            background: badgeBg, color: badgeCol, flexShrink: 0,
                          }}>
                            {label}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3, minWidth: 0 }}>
                          {isWithdrawal ? (
                            <span style={{ fontFamily: 'var(--mono)', fontSize: '0.62rem', color: 'var(--ink-faint)' }}>
                              {isExpanded ? 'Tap to hide details' : 'Tap to view details'}
                            </span>
                          ) : (
                            <span className="event-desc">{event.description}</span>
                          )}
                          <span style={{ fontFamily: 'var(--mono)', fontSize: '0.58rem', color: 'var(--ink-faint)', flexShrink: 0 }}>
                            {fmtTime(event.createdAt)}
                          </span>
                        </div>
                      </div>
                      <div className="event-amount-col">
                        {event.amount !== null && (
                          <span className="event-amount" style={{ color: amountCol }}>
                            {event.kind === 'deposit' ? '+'
                              : event.kind === 'withdrawal' ? '-'
                              : event.kind === 'trade' && event.outcome === 'loss' ? '-'
                              : ''}
                            {fmtUsd(event.amount)}
                          </span>
                        )}
                        {event.status && <StatusPill status={event.status} />}
                      </div>
                    </div>
                    {isWithdrawal && isExpanded && (
                      <div style={{
                        padding: '0 16px 13px 64px',
                        borderBottom: '1px solid var(--line)',
                      }}>
                        <p style={{
                          fontFamily: 'var(--mono)', fontSize: '0.62rem', color: 'var(--ink-faint)',
                          lineHeight: 1.5, wordBreak: 'break-word',
                        }}>
                          {event.description}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}

          <div style={{ height: 40 }} />
        </div>
      </div>
    </>
  );
}
