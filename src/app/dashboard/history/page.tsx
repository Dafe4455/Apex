'use client';

import { useState, useEffect, useMemo } from 'react';
import { RefreshCw, ArrowDownLeft, ArrowUpRight, Zap, Activity, Search, SlidersHorizontal } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

type EventKind = 'trade' | 'deposit' | 'withdrawal' | 'activity';

type TimelineEvent = {
  id: string;
  kind: EventKind;
  title: string;
  description: string;
  amount: number | null;
  status: string | null;
  createdAt: string;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

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

// ── Kind config ───────────────────────────────────────────────────────────────

const KIND_CONFIG = {
  trade: {
    label: 'Trade',
    icon: (action: string) => action.startsWith('BUY') ? '↑' : '↓',
    bg: (action: string) => action.startsWith('BUY') ? 'rgba(34,212,122,0.1)' : 'rgba(248,113,113,0.1)',
    col: (action: string) => action.startsWith('BUY') ? '#22d47a' : '#f87171',
    filterBg: 'rgba(34,212,122,0.1)',
    filterCol: '#22d47a',
  },
  deposit: {
    label: 'Deposit',
    icon: () => '↓',
    bg: () => 'rgba(56,189,248,0.1)',
    col: () => '#38bdf8',
    filterBg: 'rgba(56,189,248,0.1)',
    filterCol: '#38bdf8',
  },
  withdrawal: {
    label: 'Withdrawal',
    icon: () => '↑',
    bg: () => 'rgba(251,191,36,0.1)',
    col: () => '#fbbf24',
    filterBg: 'rgba(251,191,36,0.1)',
    filterCol: '#fbbf24',
  },
  activity: {
    label: 'Activity',
    icon: () => '·',
    bg: () => 'rgba(148,163,184,0.1)',
    col: () => '#94a3b8',
    filterBg: 'rgba(148,163,184,0.1)',
    filterCol: '#94a3b8',
  },
};

function StatusPill({ status }: { status: string }) {
  const ok = status === 'COMPLETED' || status === 'APPROVED';
  const pending = status === 'PENDING' || status === 'PENDING_VERIFICATION';
  const col = ok ? '#22d47a' : pending ? '#fbbf24' : '#f87171';
  const bg  = ok ? 'rgba(34,212,122,0.08)' : pending ? 'rgba(251,191,36,0.08)' : 'rgba(248,113,113,0.08)';
  return (
    <span style={{
      fontFamily: 'var(--mono)', fontSize: '0.55rem', fontWeight: 700,
      padding: '2px 7px', borderRadius: 4,
      background: bg, color: col,
      border: `1px solid ${col}33`,
      whiteSpace: 'nowrap',
    }}>
      {status.replace('_', ' ')}
    </span>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function HistoryPage() {
  const [events, setEvents]       = useState<TimelineEvent[]>([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch]       = useState('');
  const [filter, setFilter]       = useState<EventKind | 'all'>('all');

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

  // ── Filtered + searched events ────────────────────────────────────────────

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

  const grouped = useMemo(() => groupByDate(filtered), [filtered]);
  const dateKeys = Object.keys(grouped);

  // ── Stats ─────────────────────────────────────────────────────────────────

  const stats = useMemo(() => ({
    trades:      events.filter(e => e.kind === 'trade').length,
    deposits:    events.filter(e => e.kind === 'deposit').length,
    withdrawals: events.filter(e => e.kind === 'withdrawal').length,
    totalIn:     events.filter(e => e.kind === 'deposit' && e.amount).reduce((s, e) => s + (e.amount ?? 0), 0),
    totalOut:    events.filter(e => e.kind === 'withdrawal' && e.amount).reduce((s, e) => s + (e.amount ?? 0), 0),
  }), [events]);

  if (loading) return (
    <div style={styles.page}>
      {[1,2,3,4,5].map(i => (
        <div key={i} style={{ ...styles.skeletonBox, height: 64, borderRadius: 12, marginBottom: 8 }} />
      ))}
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Space+Mono:wght@400;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --bg:      #0b1623;
          --card:    #0f1e2e;
          --border:  rgba(255,255,255,0.07);
          --cyan:    #00c9b1;
          --text:    #e2eaf4;
          --mid:     #7b9ab5;
          --dim:     #4a6a84;
          --green:   #22d47a;
          --red:     #f87171;
          --yellow:  #fbbf24;
          --blue:    #38bdf8;
          --mono:    'Space Mono', monospace;
          --sans:    'Space Grotesk', sans-serif;
        }
        body { background: var(--bg); font-family: var(--sans); color: var(--text); }

        .filter-btn {
          background: none; border: 1px solid var(--border); cursor: pointer;
          font-family: var(--mono); font-size: 0.6rem; font-weight: 700;
          letter-spacing: 0.1em; text-transform: uppercase;
          color: var(--dim); padding: 6px 12px; border-radius: 20px;
          transition: all 0.15s; white-space: nowrap;
        }
        .filter-btn:hover { color: var(--mid); border-color: rgba(255,255,255,0.15); }
        .filter-btn.active-all    { background: rgba(0,201,177,0.12); color: var(--cyan); border-color: rgba(0,201,177,0.3); }
        .filter-btn.active-trade  { background: rgba(34,212,122,0.1); color: var(--green); border-color: rgba(34,212,122,0.3); }
        .filter-btn.active-deposit { background: rgba(56,189,248,0.1); color: var(--blue); border-color: rgba(56,189,248,0.3); }
        .filter-btn.active-withdrawal { background: rgba(251,191,36,0.1); color: var(--yellow); border-color: rgba(251,191,36,0.3); }
        .filter-btn.active-activity { background: rgba(148,163,184,0.1); color: #94a3b8; border-color: rgba(148,163,184,0.3); }

        .event-row {
          display: flex; align-items: center; gap: 12px;
          padding: 13px 16px; border-bottom: 1px solid var(--border);
          transition: background 0.12s; overflow: hidden;
        }
        .event-row:last-child { border-bottom: none; }
        .event-row:hover { background: rgba(255,255,255,0.02); }

        .search-box {
          flex: 1; display: flex; align-items: center; gap: 8px;
          background: var(--card); border: 1px solid var(--border);
          border-radius: 10px; padding: 9px 14px;
          transition: border-color 0.15s;
        }
        .search-box:focus-within { border-color: var(--cyan); }
        .search-box input {
          background: none; border: none; outline: none;
          font-family: var(--mono); font-size: 0.72rem;
          color: var(--text); width: 100%;
        }
        .search-box input::placeholder { color: var(--dim); }

        .date-label {
          font-family: var(--mono); font-size: 0.58rem; font-weight: 700;
          letter-spacing: 0.12em; text-transform: uppercase;
          color: var(--dim); padding: 10px 16px 6px;
          border-bottom: 1px solid var(--border);
          background: rgba(255,255,255,0.01);
        }

        /* Timeline connector line on desktop */
        @media (min-width: 600px) {
          .event-icon-wrap { position: relative; }
          .event-icon-wrap::after {
            content: ''; position: absolute;
            left: 50%; top: 100%; transform: translateX(-50%);
            width: 1px; height: 100%;
            background: var(--border);
          }
        }

        @keyframes shimmer { to { background-position: -200% 0; } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div style={styles.page}>

        {/* ── HEADER ── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 }}>
          <div>
            <h1 style={{ fontFamily: 'var(--sans)', fontSize: '1.45rem', fontWeight: 700, color: 'var(--text)' }}>
              History
            </h1>
            <p style={{ fontFamily: 'var(--mono)', fontSize: '0.62rem', color: 'var(--dim)', letterSpacing: '0.08em', marginTop: 2 }}>
              {events.length} events total
            </p>
          </div>
          <button
            onClick={() => load(true)} disabled={refreshing}
            style={{
              background: 'none', border: '1px solid var(--border)',
              borderRadius: 8, padding: '8px 10px', cursor: 'pointer',
              color: refreshing ? 'var(--cyan)' : 'var(--dim)',
            }}
          >
            <RefreshCw size={15} style={{ animation: refreshing ? 'spin 0.8s linear infinite' : 'none' }} />
          </button>
        </div>

        {/* ── STATS STRIP ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {[
            { label: 'Trades',     value: stats.trades,               col: 'var(--green)' },
            { label: 'Deposited',  value: fmtUsd(stats.totalIn),      col: 'var(--blue)'  },
            { label: 'Withdrawn',  value: fmtUsd(stats.totalOut),     col: 'var(--yellow)'},
          ].map(s => (
            <div key={s.label} style={{
              background: 'var(--card)', border: '1px solid var(--border)',
              borderRadius: 12, padding: '12px 14px',
              display: 'flex', flexDirection: 'column', gap: 4, overflow: 'hidden',
            }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: '0.55rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--dim)' }}>
                {s.label}
              </span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: '0.88rem', fontWeight: 700, color: s.col, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {s.value}
              </span>
            </div>
          ))}
        </div>

        {/* ── SEARCH + FILTERS ── */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div className="search-box">
            <Search size={13} style={{ color: 'var(--dim)', flexShrink: 0 }} />
            <input
              placeholder="Search history…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
          {([
            { key: 'all',        label: 'All' },
            { key: 'trade',      label: 'Trades' },
            { key: 'deposit',    label: 'Deposits' },
            { key: 'withdrawal', label: 'Withdrawals' },
            { key: 'activity',   label: 'Activity' },
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

        {/* ── TIMELINE ── */}
        {dateKeys.length === 0 ? (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            gap: 12, padding: '48px 24px',
            background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14,
          }}>
            <Activity size={32} strokeWidth={1.2} color="var(--dim)" />
            <p style={{ fontFamily: 'var(--mono)', fontSize: '0.72rem', color: 'var(--dim)', letterSpacing: '0.06em' }}>
              {search ? `No results for "${search}"` : 'No history yet.'}
            </p>
          </div>
        ) : dateKeys.map(dateKey => (
          <div key={dateKey} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
            <div className="date-label">{dateKey}</div>
            {grouped[dateKey].map(event => {
              const cfg = KIND_CONFIG[event.kind];
              const iconChar = cfg.icon(event.description);
              const iconBg   = cfg.bg(event.description);
              const iconCol  = cfg.col(event.description);

              return (
                <div className="event-row" key={event.id}>
                  {/* Icon */}
                  <div style={{
                    width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                    background: iconBg, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: '1rem', color: iconCol, fontWeight: 700,
                  }}>
                    {event.kind === 'deposit'    && <ArrowDownLeft size={16} />}
                    {event.kind === 'withdrawal' && <ArrowUpRight  size={16} />}
                    {event.kind === 'trade'      && <Zap           size={16} />}
                    {event.kind === 'activity'   && <Activity      size={14} />}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {event.kind === 'trade'
                          ? event.title.split(':')[1] ?? event.title
                          : event.title
                        }
                      </span>
                      <span style={{
                        fontFamily: 'var(--mono)', fontSize: '0.55rem', fontWeight: 700,
                        padding: '1px 6px', borderRadius: 4,
                        background: iconBg, color: iconCol,
                        border: `1px solid ${iconCol}33`,
                        flexShrink: 0,
                      }}>
                        {cfg.label}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3, flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: '0.62rem', color: 'var(--dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 220 }}>
                        {event.description}
                      </span>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: '0.58rem', color: 'var(--dim)', flexShrink: 0 }}>
                        {fmtTime(event.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Right side: amount + status */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                    {event.amount !== null && (
                      <span style={{
                        fontFamily: 'var(--mono)', fontSize: '0.78rem', fontWeight: 700,
                        color: event.kind === 'deposit' ? 'var(--blue)'
                          : event.kind === 'withdrawal' ? 'var(--yellow)'
                          : 'var(--text)',
                      }}>
                        {event.kind === 'deposit' ? '+' : event.kind === 'withdrawal' ? '-' : ''}{fmtUsd(event.amount)}
                      </span>
                    )}
                    {event.status && <StatusPill status={event.status} />}
                  </div>
                </div>
              );
            })}
          </div>
        ))}

        <div style={{ height: 80 }} />
      </div>
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh', background: 'var(--bg)',
    padding: '20px 16px', display: 'flex', flexDirection: 'column',
    gap: 12, maxWidth: 600, margin: '0 auto',
  },
  skeletonBox: {
    background: 'linear-gradient(90deg, #0f1e2e 25%, #162030 50%, #0f1e2e 75%)',
    backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite',
  },
};
