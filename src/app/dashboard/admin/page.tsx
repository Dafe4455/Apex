'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Users, MessageSquare, Send, X, ChevronRight,
  CheckCircle, XCircle, ArrowUpToLine, Search,
  Edit, Loader2, Bell, ShieldAlert,
  Clock, KeyRound, InboxIcon, CheckCircle2,
  RefreshCw, Circle, MessageCircle, Settings,
  TrendingUp, Plus, Trash2, ToggleLeft, ToggleRight,
} from 'lucide-react';
import Link from 'next/link';

// ── Types ─────────────────────────────────────────────────────────────────────
interface Ticket {
  id: string;
  subject: string;
  status: 'OPEN' | 'CLOSED';
  updatedAt: string;
  createdAt: string;
  user?: { id: string; email: string; name?: string | null };
  messages?: { id: string; sender: 'USER' | 'ADMIN'; body: string; createdAt: string }[];
}

interface Withdrawal {
  id: string;
  amount: number;
  currency: string;
  status: string;
  note?: string;
  adminNote?: string;
  createdAt: string;
  updatedAt: string;
  user: { name?: string; email?: string };
}

interface Deposit {
  id: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'COMPLETED' | 'REJECTED';
  methodLabel?: string;
  note?: string;
  adminNote?: string;
  createdAt: string;
  updatedAt: string;
  user: { name?: string; email?: string };
}

interface DepositMethod {
  id: string;
  label: string;
  icon: string;
  address: string;
  network: string | null;
  note: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
}

type FormState = {
  label: string; icon: string; address: string;
  network: string; note: string; isActive: boolean; sortOrder: number;
};

const EMPTY_FORM: FormState = {
  label: '', icon: '₿', address: '', network: '', note: '', isActive: true, sortOrder: 0,
};
const ICON_PRESETS = ['₿', 'Ξ', '◎', '💳', '🏦', 'T', '$', '🔗'];

// ── Helpers ───────────────────────────────────────────────────────────────────
function countUnread(tickets: Ticket[]) {
  let n = 0;
  for (const t of tickets) {
    if (t.status === 'CLOSED') continue;
    const msgs = t.messages ?? [];
    const lastAdmin = msgs.map(m => m.sender).lastIndexOf('ADMIN');
    n += msgs.filter((m, i) => m.sender === 'USER' && i > lastAdmin).length;
  }
  return n;
}

function cn(...c: (string | boolean | undefined)[]) { return c.filter(Boolean).join(' '); }
function fmtTime(d: string) { return new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }
function fmtDate(d: string) {
  const dt = new Date(d), today = new Date(), yest = new Date();
  yest.setDate(today.getDate() - 1);
  if (dt.toDateString() === today.toDateString()) return 'Today';
  if (dt.toDateString() === yest.toDateString()) return 'Yesterday';
  return dt.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
}
function groupByDate(msgs: NonNullable<Ticket['messages']>) {
  const g: { date: string; messages: typeof msgs }[] = [];
  msgs.forEach(m => {
    const d = new Date(m.createdAt).toDateString();
    const last = g[g.length - 1];
    if (last?.date === d) last.messages.push(m);
    else g.push({ date: d, messages: [m] });
  });
  return g;
}
function initials(name?: string | null, email?: string) {
  if (name) return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  if (email) return email.slice(0, 2).toUpperCase();
  return '??';
}
function fmtMoney(cents: number, currency = 'USD') {
  return `${currency === 'USD' ? '$' : '€'}${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
}

// ── Withdrawal actions ────────────────────────────────────────────────────────
function WithdrawalActions({ id, onDone }: { id: string; onDone: () => void }) {
  const [note, setNote]   = useState('');
  const [loading, setL]   = useState<'APPROVED' | 'REJECTED' | null>(null);
  const [error, setError] = useState('');
  const [done, setDone]   = useState(false);

  const act = async (action: 'APPROVED' | 'REJECTED') => {
    setL(action); setError('');
    const res = await fetch(`/api/admin/withdrawals/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, adminNote: note || undefined }),
    });
    setL(null);
    if (!res.ok) { setError((await res.json()).error ?? 'Failed'); return; }
    setDone(true); onDone();
  };

  if (done) return <p className="adm-done-ok">✓ Processed</p>;
  return (
    <div className="adm-action-wrap">
      <input value={note} onChange={e => setNote(e.target.value)} maxLength={200}
        placeholder="Admin note (optional)" className="adm-note-input" />
      {error && <p className="adm-err">{error}</p>}
      <div className="adm-action-btns">
        <button onClick={() => act('APPROVED')} disabled={!!loading} className="adm-btn-approve">
          {loading === 'APPROVED' ? <Loader2 className="adm-spin" size={14} /> : <CheckCircle size={14} />} Approve
        </button>
        <button onClick={() => act('REJECTED')} disabled={!!loading} className="adm-btn-reject">
          {loading === 'REJECTED' ? <Loader2 className="adm-spin" size={14} /> : <XCircle size={14} />} Reject
        </button>
      </div>
    </div>
  );
}

// ── Deposit actions ───────────────────────────────────────────────────────────
function DepositActions({ id, onDone }: { id: string; onDone: () => void }) {
  const [note, setNote]   = useState('');
  const [loading, setL]   = useState<'COMPLETED' | 'REJECTED' | null>(null);
  const [error, setError] = useState('');
  const [done, setDone]   = useState(false);

  const act = async (action: 'COMPLETED' | 'REJECTED') => {
    setL(action); setError('');
    const res = await fetch(`/api/admin/deposits/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, adminNote: note || undefined }),
    });
    setL(null);
    if (!res.ok) { setError((await res.json()).error ?? 'Failed'); return; }
    setDone(true); onDone();
  };

  if (done) return <p className="adm-done-ok">✓ Processed</p>;
  return (
    <div className="adm-action-wrap">
      <input value={note} onChange={e => setNote(e.target.value)} maxLength={200}
        placeholder="Admin note (optional)" className="adm-note-input" />
      {error && <p className="adm-err">{error}</p>}
      <div className="adm-action-btns">
        <button onClick={() => act('COMPLETED')} disabled={!!loading} className="adm-btn-approve">
          {loading === 'COMPLETED' ? <Loader2 className="adm-spin" size={14} /> : <CheckCircle size={14} />} Confirm
        </button>
        <button onClick={() => act('REJECTED')} disabled={!!loading} className="adm-btn-reject">
          {loading === 'REJECTED' ? <Loader2 className="adm-spin" size={14} /> : <XCircle size={14} />} Reject
        </button>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  type Tab = 'chat' | 'users' | 'deposits' | 'withdrawals' | 'settings';
  const [tab, setTab] = useState<Tab>('chat');

  // Support
  const [tickets, setTickets]       = useState<Ticket[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [statusFilter, setFilter]   = useState<'OPEN' | 'CLOSED'>('OPEN');
  const [loadingTix, setLoadingTix] = useState(true);
  const [detailLoading, setDL]      = useState(false);
  const [tixErr, setTixErr]         = useState('');
  const [detailErr, setDetailErr]   = useState('');
  const [reply, setReply]           = useState('');
  const [replying, setReplying]     = useState(false);
  const bottomRef   = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Users
  const [users, setUsers]         = useState<any[]>([]);
  const [search, setSearch]       = useState('');
  const [loadingUsers, setLUsers] = useState(true);

  // Deposits
  const [deposits, setDeposits]   = useState<Deposit[]>([]);
  const [loadingDep, setLDep]     = useState(true);

  // Withdrawals
  const [pendingV, setPendingV]   = useState<Withdrawal[]>([]);
  const [pending, setPending]     = useState<Withdrawal[]>([]);
  const [processed, setProcessed] = useState<Withdrawal[]>([]);
  const [loadingWd, setLWd]       = useState(true);

  // Settings — deposit methods
  const [methods, setMethods]     = useState<DepositMethod[]>([]);
  const [loadingM, setLM]         = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [editId, setEditId]       = useState<string | null>(null);
  const [form, setForm]           = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving]       = useState(false);
  const [deleting, setDeleting]   = useState<string | null>(null);
  const [toast, setToast]         = useState<{ msg: string; ok: boolean } | null>(null);

  const selectedTicket = useMemo(() => tickets.find(t => t.id === selectedId) ?? null, [tickets, selectedId]);
  const unread         = countUnread(tickets);
  const pendingDeps    = deposits.filter(d => d.status === 'PENDING');
  const actionableWd   = pendingV.length + pending.length;

  // ── Fetchers ──
  const fetchTickets = useCallback(async (f = statusFilter, silent = false) => {
    if (!silent) setLoadingTix(true); setTixErr('');
    try {
      const res = await fetch(`/api/admin/support/tickets?status=${f}`, { cache: 'no-store' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setTixErr(data.error || 'Failed'); return; }
      setTickets(Array.isArray(data?.tickets) ? data.tickets : []);
    } catch { setTixErr('Network error'); }
    finally { if (!silent) setLoadingTix(false); }
  }, [statusFilter]);

  const fetchTicketDetail = useCallback(async (id: string, silent = false) => {
    if (!silent) setDL(true); setDetailErr('');
    try {
      const res = await fetch(`/api/admin/support/tickets/${id}`, { cache: 'no-store' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setDetailErr(data.error || 'Failed'); return; }
      const t = data?.ticket as Ticket | undefined;
      if (!t) { setDetailErr('Not found'); return; }
      setTickets(prev => prev.map(x => x.id === t.id ? t : x));
    } catch { setDetailErr('Network error'); }
    finally { if (!silent) setDL(false); }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/users', { cache: 'no-store' });
      const data = await res.json();
      if (Array.isArray(data)) setUsers(data);
    } catch {} finally { setLUsers(false); }
  }, []);

  const fetchDeposits = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/deposits');
      if (res.ok) { const d = await res.json(); setDeposits(d.deposits ?? []); }
    } catch {} finally { setLDep(false); }
  }, []);

  const fetchWithdrawals = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/withdrawals');
      if (res.ok) {
        const all: Withdrawal[] = (await res.json()).withdrawals ?? [];
        setPendingV(all.filter(w => w.status === 'PENDING_VERIFICATION'));
        setPending(all.filter(w => w.status === 'PENDING'));
        setProcessed(all.filter(w => w.status === 'APPROVED' || w.status === 'REJECTED'));
      }
    } catch {} finally { setLWd(false); }
  }, []);

  const fetchMethods = useCallback(async () => {
    setLM(true);
    try {
      const res = await fetch('/api/admin/deposit-methods/manage');
      if (res.ok) setMethods(await res.json());
    } catch {} finally { setLM(false); }
  }, []);

  // ── Effects ──
  useEffect(() => { fetchUsers(); fetchDeposits(); fetchWithdrawals(); fetchMethods(); }, []);
  useEffect(() => { fetchTickets(statusFilter); }, [statusFilter]);
  useEffect(() => { const i = setInterval(() => fetchTickets(statusFilter, true), 10_000); return () => clearInterval(i); }, [fetchTickets, statusFilter]);
  useEffect(() => { if (!selectedId) return; const i = setInterval(() => fetchTicketDetail(selectedId, true), 5_000); return () => clearInterval(i); }, [fetchTicketDetail, selectedId]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [selectedTicket?.messages]);

  // ── Support handlers ──
  const handleSelect = (id: string) => { setSelectedId(id); fetchTicketDetail(id); };
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setReply(e.target.value);
    const el = textareaRef.current;
    if (el) { el.style.height = 'auto'; el.style.height = `${Math.min(el.scrollHeight, 120)}px`; }
  };
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleReply(); }
  };
  const handleReply = async () => {
    if (!selectedTicket || !reply.trim() || replying) return;
    setReplying(true); setDetailErr('');
    try {
      const res = await fetch(`/api/admin/support/tickets/${selectedTicket.id}/messages`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: reply }),
      });
      if (!res.ok) { setDetailErr((await res.json().catch(() => ({}))).error || 'Failed'); return; }
      setReply(''); if (textareaRef.current) textareaRef.current.style.height = 'auto';
      await fetchTicketDetail(selectedTicket.id);
      await fetchTickets(statusFilter);
    } catch { setDetailErr('Network error'); }
    finally { setReplying(false); }
  };
  const handleStatus = async (next: 'OPEN' | 'CLOSED') => {
    if (!selectedTicket) return;
    await fetch(`/api/admin/support/tickets/${selectedTicket.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next }),
    });
    await fetchTicketDetail(selectedTicket.id);
    await fetchTickets(statusFilter);
  };

  // ── Settings handlers ──
  const showToast = (msg: string, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3000); };
  const openNew   = () => { setEditId(null); setForm(EMPTY_FORM); setShowForm(true); };
  const openEdit  = (m: DepositMethod) => { setEditId(m.id); setForm({ label: m.label, icon: m.icon, address: m.address, network: m.network ?? '', note: m.note ?? '', isActive: m.isActive, sortOrder: m.sortOrder }); setShowForm(true); };
  const f         = (k: keyof FormState, v: string | boolean | number) => setForm(p => ({ ...p, [k]: v }));

  const saveMethods = async () => {
    if (!form.label.trim() || !form.address.trim()) { showToast('Label and address required', false); return; }
    setSaving(true);
    try {
      const body = { ...form, network: form.network || null, note: form.note || null, ...(editId ? { id: editId } : {}) };
      const res  = await fetch('/api/admin/deposit-methods/manage', {
        method: editId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) { showToast(editId ? 'Method updated' : 'Method created'); setShowForm(false); fetchMethods(); }
      else showToast((await res.json()).error ?? 'Failed', false);
    } finally { setSaving(false); }
  };

  const toggleActive = async (m: DepositMethod) => {
    await fetch('/api/admin/deposit-methods/manage', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: m.id, isActive: !m.isActive }),
    });
    fetchMethods();
  };

  const removeMethod = async (id: string) => {
    if (!confirm('Delete this deposit method?')) return;
    setDeleting(id);
    const res = await fetch(`/api/admin/deposit-methods/manage?id=${id}`, { method: 'DELETE' });
    if (res.ok) { showToast('Deleted'); fetchMethods(); } else showToast('Failed', false);
    setDeleting(null);
  };

  const grouped = groupByDate(selectedTicket?.messages ?? []);

  const tabs = [
    { id: 'chat',        label: 'Support',     icon: MessageSquare, badge: unread,             color: '#e85c0d' },
    { id: 'users',       label: 'Users',       icon: Users,         badge: users.length,       color: '#6b5ce7' },
    { id: 'deposits',    label: 'Deposits',    icon: TrendingUp,    badge: pendingDeps.length, color: '#2e7d4f' },
    { id: 'withdrawals', label: 'Withdrawals', icon: ArrowUpToLine, badge: actionableWd,       color: '#b85c0d' },
    { id: 'settings',    label: 'Settings',    icon: Settings,      badge: 0,                  color: '#6b6457' },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');

       
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: var(--bg); font-family: var(--sans); }

        .adm { max-width: 900px; margin: 0 auto; padding: 24px 16px 60px; }

        /* ── header ── */
        .adm-hdr { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 22px; }
        .adm-brand { font-family: var(--mono); font-size: 0.58rem; letter-spacing: 0.18em; color: var(--orange); text-transform: uppercase; margin-bottom: 4px; }
        .adm-title { font-size: 1.4rem; font-weight: 700; color: var(--ink); letter-spacing: -0.02em; }
        .adm-bell { position: relative; width: 38px; height: 38px; border-radius: 50%; background: var(--card); border: 1px solid var(--bg-2); display: flex; align-items: center; justify-content: center; cursor: pointer; }
        .adm-bell-badge { position: absolute; top: -3px; right: -3px; width: 18px; height: 18px; background: var(--orange); border-radius: 50%; color: #fff; font-size: 0.52rem; font-weight: 700; display: flex; align-items: center; justify-content: center; }

        /* ── tab grid ── */
        .adm-tabs { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; margin-bottom: 20px; }
        .adm-tab {
          position: relative; display: flex; flex-direction: column; align-items: center;
          justify-content: center; gap: 6px; padding: 14px 8px; border-radius: var(--r);
          border: 1px solid var(--bg-2); background: var(--card);
          font-family: var(--sans); font-size: 0.65rem; font-weight: 600;
          color: var(--ink-faint); cursor: pointer; transition: all 0.15s;
        }
        .adm-tab:hover { border-color: var(--bg-3); color: var(--ink-dim); }
        .adm-tab.active { border-color: transparent; color: #fff; }
        .adm-tab-badge {
          position: absolute; top: 8px; right: 8px;
          min-width: 16px; height: 16px; padding: 0 4px;
          border-radius: 8px; font-size: 0.5rem; font-weight: 700;
          display: flex; align-items: center; justify-content: center;
        }
        .adm-tab.active .adm-tab-badge { background: rgba(255,255,255,0.25); color: #fff; }
        .adm-tab:not(.active) .adm-tab-badge { background: var(--orange); color: #fff; }

        /* ── shared card ── */
        .adm-card {
          background: var(--card); border: 1px solid var(--bg-2);
          border-radius: var(--r); padding: 18px 20px; margin-bottom: 10px;
          position: relative; overflow: hidden;
        }
        .adm-card-stripe { position: absolute; top: 0; left: 0; bottom: 0; width: 3px; border-radius: 3px 0 0 3px; }

        /* ── action components ── */
        .adm-action-wrap { display: flex; flex-direction: column; gap: 10px; padding-top: 14px; border-top: 1px solid var(--bg-2); margin-top: 14px; }
        .adm-note-input { width: 100%; padding: 9px 13px; border: 1.5px solid var(--bg-2); border-radius: 10px; background: var(--bg-1); font-family: var(--sans); font-size: 0.75rem; color: var(--ink); outline: none; transition: border-color 0.15s; }
        .adm-note-input:focus { border-color: var(--orange); background: #fff; }
        .adm-note-input::placeholder { color: var(--ink-faint); }
        .adm-action-btns { display: flex; gap: 8px; }
        .adm-btn-approve { flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px; padding: 9px; border-radius: 10px; background: var(--green); color: #fff; border: none; font-family: var(--sans); font-size: 0.72rem; font-weight: 600; cursor: pointer; transition: opacity 0.15s; }
        .adm-btn-approve:hover { opacity: 0.85; }
        .adm-btn-approve:disabled { opacity: 0.4; cursor: not-allowed; }
        .adm-btn-reject { flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px; padding: 9px; border-radius: 10px; background: #fff; color: var(--red); border: 1px solid #e8c8c8; font-family: var(--sans); font-size: 0.72rem; font-weight: 600; cursor: pointer; transition: background 0.15s; }
        .adm-btn-reject:hover { background: var(--red-l); }
        .adm-btn-reject:disabled { opacity: 0.4; cursor: not-allowed; }
        .adm-done-ok { font-size: 0.72rem; font-weight: 600; color: var(--green); text-align: center; padding: 8px 0; }
        .adm-err { font-size: 0.65rem; color: var(--red); }
        .adm-spin { animation: spin 0.7s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ── user/tx row ── */
        .adm-avatar { width: 36px; height: 36px; border-radius: 50%; background: var(--orange); display: flex; align-items: center; justify-content: center; color: #fff; font-size: 0.7rem; font-weight: 700; flex-shrink: 0; }
        .adm-avatar.green { background: var(--green); }

        /* ── badge ── */
        .adm-status { font-family: var(--mono); font-size: 0.52rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; padding: 2px 8px; border-radius: 20px; display: inline-block; }
        .adm-status.pending  { background: var(--gold-l);  color: var(--gold); }
        .adm-status.ok       { background: var(--green-l); color: var(--green); }
        .adm-status.bad      { background: var(--red-l);   color: var(--red); }
        .adm-status.grey     { background: var(--bg-2);    color: var(--ink-faint); }

        /* ── section label ── */
        .adm-sec-label { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
        .adm-sec-label span { font-size: 0.6rem; font-weight: 700; color: var(--ink-dim); text-transform: uppercase; letter-spacing: 0.1em; }

        /* ── empty ── */
        .adm-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px 20px; gap: 8px; background: var(--card); border: 1px solid var(--bg-2); border-radius: var(--r); }
        .adm-empty p { font-size: 0.72rem; color: var(--ink-faint); font-weight: 300; }

        /* ── search ── */
        .adm-search-wrap { position: relative; }
        .adm-search-wrap svg { position: absolute; left: 11px; top: 50%; transform: translateY(-50%); color: var(--ink-faint); }
        .adm-search { width: 100%; padding: 8px 12px 8px 34px; border: 1.5px solid var(--bg-2); border-radius: 10px; background: var(--card); font-family: var(--sans); font-size: 0.75rem; color: var(--ink); outline: none; transition: border-color 0.15s; }
        .adm-search:focus { border-color: var(--orange); background: #fff; }

        /* ── support ── */
        .adm-chat-grid { display: grid; grid-template-columns: 1fr 2fr; gap: 12px; }
        @media (max-width: 640px) { .adm-chat-grid { grid-template-columns: 1fr; } .adm-tabs { grid-template-columns: repeat(3, 1fr); } }

        .adm-ticket-list { background: var(--card); border: 1px solid var(--bg-2); border-radius: var(--r); overflow: hidden; min-height: 500px; display: flex; flex-direction: column; }
        .adm-ticket-head { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; border-bottom: 1px solid var(--bg-2); }
        .adm-ticket-head-title { font-size: 0.75rem; font-weight: 700; color: var(--ink); }
        .adm-filter-toggle { display: flex; gap: 2px; background: var(--bg-1); border: 1px solid var(--bg-2); border-radius: 8px; padding: 2px; }
        .adm-filter-btn { padding: 4px 10px; border-radius: 6px; border: none; background: transparent; font-family: var(--sans); font-size: 0.6rem; font-weight: 600; color: var(--ink-faint); cursor: pointer; transition: all 0.12s; }
        .adm-filter-btn.active-open { background: var(--orange); color: #fff; }
        .adm-filter-btn.active-closed { background: var(--bg-2); color: var(--ink-dim); }

        .adm-ticket-item { width: 100%; text-align: left; padding: 13px 16px; border-bottom: 1px solid var(--bg-2); background: transparent; border-left: none; border-right: none; cursor: pointer; transition: background 0.12s; display: flex; align-items: flex-start; gap: 10px; }
        .adm-ticket-item:hover { background: var(--bg-1); }
        .adm-ticket-item.sel { background: var(--orange-l); }

        .adm-thread { background: var(--card); border: 1px solid var(--bg-2); border-radius: var(--r); overflow: hidden; min-height: 500px; display: flex; flex-direction: column; }
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');

* { box-sizing: border-box; margin: 0; padding: 0; }
body { background: var(--bg); font-family: var(--sans); }

.adm { max-width: 900px; margin: 0 auto; padding: 24px 16px 60px; }

/* ── header ── */
.adm-hdr { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 22px; }
.adm-brand { font-family: var(--mono); font-size: 0.58rem; letter-spacing: 0.18em; color: var(--accent); text-transform: uppercase; margin-bottom: 4px; }
.adm-title { font-size: 1.4rem; font-weight: 700; color: var(--ink); letter-spacing: -0.02em; }
.adm-bell { position: relative; width: 38px; height: 38px; border-radius: 50%; background: var(--card); border: 1px solid var(--line-strong); display: flex; align-items: center; justify-content: center; cursor: pointer; }
.adm-bell-badge { position: absolute; top: -3px; right: -3px; width: 18px; height: 18px; background: var(--accent); border-radius: 50%; color: var(--bg); font-size: 0.52rem; font-weight: 700; display: flex; align-items: center; justify-content: center; }

/* ── tab grid ── */
.adm-tabs { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; margin-bottom: 20px; }
.adm-tab {
  position: relative; display: flex; flex-direction: column; align-items: center;
  justify-content: center; gap: 6px; padding: 14px 8px; border-radius: 14px;
  border: 1px solid var(--line-strong); background: var(--card);
  font-family: var(--sans); font-size: 0.65rem; font-weight: 600;
  color: var(--ink-faint); cursor: pointer; transition: all 0.15s;
}
.adm-tab:hover { border-color: var(--accent); color: var(--ink-dim); }
.adm-tab.active { border-color: var(--accent); background: var(--surface); color: var(--accent); }
.adm-tab-badge {
  position: absolute; top: 8px; right: 8px;
  min-width: 16px; height: 16px; padding: 0 4px;
  border-radius: 8px; font-size: 0.5rem; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  background: var(--accent); color: var(--bg);
}

/* ── shared card ── */
.adm-card {
  background: var(--card); border: 1px solid var(--line-strong);
  border-radius: 14px; padding: 18px 20px; margin-bottom: 10px;
  position: relative; overflow: hidden;
}
.adm-card-stripe { position: absolute; top: 0; left: 0; bottom: 0; width: 3px; border-radius: 3px 0 0 3px; }

/* ── action components ── */
.adm-action-wrap { display: flex; flex-direction: column; gap: 10px; padding-top: 14px; border-top: 1px solid var(--line-strong); margin-top: 14px; }
.adm-note-input { width: 100%; padding: 9px 13px; border: 1.5px solid var(--line-strong); border-radius: 10px; background: var(--surface); font-family: var(--sans); font-size: 0.75rem; color: var(--ink); outline: none; transition: border-color 0.15s; }
.adm-note-input:focus { border-color: var(--accent); background: var(--card); }
.adm-note-input::placeholder { color: var(--ink-faint); }
.adm-action-btns { display: flex; gap: 8px; }
.adm-btn-approve { flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px; padding: 9px; border-radius: 10px; background: var(--green); color: var(--bg); border: none; font-family: var(--sans); font-size: 0.72rem; font-weight: 600; cursor: pointer; transition: opacity 0.15s; }
.adm-btn-approve:hover { opacity: 0.85; }
.adm-btn-approve:disabled { opacity: 0.4; cursor: not-allowed; }
.adm-btn-reject { flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px; padding: 9px; border-radius: 10px; background: transparent; color: var(--red); border: 1px solid var(--red); font-family: var(--sans); font-size: 0.72rem; font-weight: 600; cursor: pointer; transition: background 0.15s; }
.adm-btn-reject:hover { background: var(--red-l); }
.adm-btn-reject:disabled { opacity: 0.4; cursor: not-allowed; }
.adm-done-ok { font-size: 0.72rem; font-weight: 600; color: var(--green); text-align: center; padding: 8px 0; }
.adm-err { font-size: 0.65rem; color: var(--red); }
.adm-spin { animation: spin 0.7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* ── avatar ── */
.adm-avatar { width: 36px; height: 36px; border-radius: 50%; background: var(--accent); display: flex; align-items: center; justify-content: center; color: var(--bg); font-size: 0.7rem; font-weight: 700; flex-shrink: 0; }
.adm-avatar.green { background: var(--green); }

/* ── badge ── */
.adm-status { font-family: var(--mono); font-size: 0.52rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; padding: 2px 8px; border-radius: 20px; display: inline-block; }
.adm-status.pending  { background: var(--gold-l);  color: var(--gold); }
.adm-status.ok       { background: var(--green-l); color: var(--green); }
.adm-status.bad      { background: var(--red-l);   color: var(--red); }
.adm-status.grey     { background: var(--surface);  color: var(--ink-faint); }

/* ── section label ── */
.adm-sec-label { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
.adm-sec-label span { font-size: 0.6rem; font-weight: 700; color: var(--ink-dim); text-transform: uppercase; letter-spacing: 0.1em; }

/* ── empty ── */
.adm-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px 20px; gap: 8px; background: var(--card); border: 1px solid var(--line-strong); border-radius: 14px; }
.adm-empty p { font-size: 0.72rem; color: var(--ink-faint); font-weight: 300; }

/* ── search ── */
.adm-search-wrap { position: relative; }
.adm-search-wrap svg { position: absolute; left: 11px; top: 50%; transform: translateY(-50%); color: var(--ink-faint); }
.adm-search { width: 100%; padding: 8px 12px 8px 34px; border: 1.5px solid var(--line-strong); border-radius: 10px; background: var(--card); font-family: var(--sans); font-size: 0.75rem; color: var(--ink); outline: none; transition: border-color 0.15s; }
.adm-search:focus { border-color: var(--accent); background: var(--surface); }

/* ── support ── */
.adm-chat-grid { display: grid; grid-template-columns: 1fr 2fr; gap: 12px; }
@media (max-width: 640px) { .adm-chat-grid { grid-template-columns: 1fr; } .adm-tabs { grid-template-columns: repeat(3, 1fr); } }

.adm-ticket-list { background: var(--card); border: 1px solid var(--line-strong); border-radius: 14px; overflow: hidden; min-height: 500px; display: flex; flex-direction: column; }
.adm-ticket-head { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; border-bottom: 1px solid var(--line-strong); }
.adm-ticket-head-title { font-size: 0.75rem; font-weight: 700; color: var(--ink); }
.adm-filter-toggle { display: flex; gap: 2px; background: var(--surface); border: 1px solid var(--line-strong); border-radius: 8px; padding: 2px; }
.adm-filter-btn { padding: 4px 10px; border-radius: 6px; border: none; background: transparent; font-family: var(--sans); font-size: 0.6rem; font-weight: 600; color: var(--ink-faint); cursor: pointer; transition: all 0.12s; }
.adm-filter-btn.active-open { background: var(--accent); color: var(--bg); }
.adm-filter-btn.active-closed { background: var(--surface-hover); color: var(--ink-dim); }

.adm-ticket-item { width: 100%; text-align: left; padding: 13px 16px; border-bottom: 1px solid var(--line); background: transparent; border-left: none; border-right: none; cursor: pointer; transition: background 0.12s; display: flex; align-items: flex-start; gap: 10px; }
.adm-ticket-item:hover { background: var(--surface); }
.adm-ticket-item.sel { background: var(--surface-hover); border-left: 2px solid var(--accent); }

.adm-thread { background: var(--card); border: 1px solid var(--line-strong); border-radius: 14px; overflow: hidden; min-height: 500px; display: flex; flex-direction: column; }
.adm-thread-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 14px 16px; border-bottom: 1px solid var(--line-strong); }
.adm-thread-msgs { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 12px; }
.adm-thread-input { border-top: 1px solid var(--line-strong); padding: 12px 14px; display: flex; gap: 10px; align-items: flex-end; }
.adm-textarea { flex: 1; resize: none; background: var(--surface); border: 1.5px solid var(--line-strong); border-radius: 10px; padding: 9px 13px; font-family: var(--sans); font-size: 0.78rem; color: var(--ink); outline: none; transition: all 0.15s; min-height: 40px; max-height: 120px; }
.adm-textarea:focus { border-color: var(--accent); background: var(--card); }
.adm-send-btn { width: 38px; height: 38px; border-radius: 10px; background: var(--accent); color: var(--bg); border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; transition: opacity 0.15s; }
.adm-send-btn:hover { opacity: 0.85; }
.adm-send-btn:disabled { opacity: 0.3; cursor: not-allowed; }

.adm-msg-row { display: flex; }
.adm-msg-row.admin { justify-content: flex-end; }
.adm-bubble { max-width: 72%; width: fit-content; min-width: 48px; padding: 9px 13px; border-radius: 14px; font-size: 0.75rem; line-height: 1.5; word-break: break-word; }
.adm-bubble.user  { background: var(--surface); border: 1px solid var(--line-strong); color: var(--ink); border-bottom-left-radius: 4px; }
.adm-bubble.admin { background: var(--accent); color: var(--bg); border-bottom-right-radius: 4px; }
.adm-msg-time { font-size: 0.55rem; color: var(--ink-faint); margin-top: 3px; padding: 0 4px; }

.adm-divider { display: flex; align-items: center; gap: 10px; margin: 8px 0; }
.adm-divider-line { flex: 1; height: 1px; background: var(--line-strong); }
.adm-divider-label { font-size: 0.58rem; color: var(--ink-faint); font-weight: 500; }

.adm-status-btn { display: flex; align-items: center; gap: 5px; font-size: 0.62rem; font-weight: 600; padding: 5px 12px; border-radius: 20px; border: 1px solid var(--line-strong); background: transparent; color: var(--ink-faint); cursor: pointer; transition: all 0.15s; }
.adm-status-btn:hover { border-color: var(--accent); color: var(--accent); }

/* ── settings ── */
.adm-method-card { background: var(--card); border: 1px solid var(--line-strong); border-radius: 14px; padding: 16px 18px; margin-bottom: 10px; display: flex; align-items: center; gap: 14px; position: relative; overflow: hidden; }
.adm-method-ico { width: 42px; height: 42px; border-radius: 10px; background: var(--surface); border: 1px solid var(--line-strong); display: flex; align-items: center; justify-content: center; font-size: 1.2rem; flex-shrink: 0; }
.adm-method-addr { margin-top: 6px; padding: 7px 10px; background: var(--surface); border-radius: 7px; font-family: var(--mono); font-size: 0.6rem; color: var(--ink-dim); word-break: break-all; line-height: 1.6; }
.adm-icon-btn { width: 32px; height: 32px; border-radius: 8px; border: 1px solid var(--line-strong); background: var(--surface); cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; transition: all 0.12s; color: var(--ink-dim); flex-shrink: 0; }
.adm-icon-btn:hover { background: var(--surface-hover); color: var(--ink); }
.adm-icon-btn.danger:hover { background: var(--red-l); border-color: var(--red); color: var(--red); }

.adm-toggle { position: relative; width: 36px; height: 20px; cursor: pointer; flex-shrink: 0; }
.adm-toggle input { opacity: 0; width: 0; height: 0; }
.adm-toggle-track { position: absolute; inset: 0; background: var(--surface-hover); border-radius: 10px; transition: background 0.2s; }
.adm-toggle-track::before { content: ''; position: absolute; width: 14px; height: 14px; left: 3px; top: 3px; background: var(--ink-faint); border-radius: 50%; transition: transform 0.2s; }
.adm-toggle input:checked + .adm-toggle-track { background: var(--green); }
.adm-toggle input:checked + .adm-toggle-track::before { transform: translateX(16px); background: var(--bg); }

/* ── drawer ── */
.adm-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 200; backdrop-filter: blur(2px); animation: fadein 0.2s; }
@keyframes fadein { from { opacity: 0; } to { opacity: 1; } }
.adm-drawer { position: fixed; bottom: 0; left: 0; right: 0; max-width: 560px; margin: 0 auto; background: var(--bg-3); border-radius: 22px 22px 0 0; border-top: 1px solid var(--line-strong); padding: 0 22px 44px; z-index: 201; max-height: 92vh; overflow-y: auto; animation: slideup 0.3s cubic-bezier(0.32,0.72,0,1); }
@keyframes slideup { from { transform: translateY(100%); } to { transform: translateY(0); } }
.adm-drawer-handle { width: 36px; height: 4px; background: var(--line-strong); border-radius: 2px; margin: 12px auto 20px; }
.adm-drawer-title { font-size: 1rem; font-weight: 700; color: var(--ink); letter-spacing: -0.02em; margin-bottom: 20px; }

.adm-field { margin-bottom: 14px; }
.adm-field-label { display: block; font-size: 0.58rem; font-weight: 600; color: var(--ink-faint); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 6px; }
.adm-input { width: 100%; background: var(--card); border: 1.5px solid var(--line-strong); border-radius: 10px; padding: 10px 13px; font-family: var(--sans); font-size: 0.8rem; color: var(--ink); outline: none; transition: border-color 0.15s; }
.adm-input:focus { border-color: var(--accent); }
.adm-input::placeholder { color: var(--ink-faint); }
textarea.adm-input { resize: vertical; min-height: 76px; line-height: 1.5; font-family: var(--mono); font-size: 0.7rem; }
.adm-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.adm-icon-row { display: flex; gap: 6px; flex-wrap: wrap; }
.adm-icon-pick { width: 36px; height: 36px; border-radius: 8px; background: var(--card); border: 1.5px solid var(--line-strong); display: flex; align-items: center; justify-content: center; font-size: 1rem; cursor: pointer; transition: all 0.12s; }
.adm-icon-pick.sel { border-color: var(--accent); background: var(--surface); }
.adm-checkbox-row { display: flex; align-items: center; gap: 10px; padding: 11px 13px; background: var(--card); border: 1.5px solid var(--line-strong); border-radius: 10px; cursor: pointer; }
.adm-checkbox-row input { width: 15px; height: 15px; accent-color: var(--accent); cursor: pointer; }
.adm-drawer-footer { display: flex; gap: 10px; margin-top: 20px; }
.adm-btn-save { flex: 1; background: var(--accent); color: var(--bg); border: none; border-radius: 10px; padding: 12px; font-family: var(--sans); font-size: 0.78rem; font-weight: 700; cursor: pointer; transition: opacity 0.15s; }
.adm-btn-save:hover { opacity: 0.88; }
.adm-btn-save:disabled { opacity: 0.4; cursor: not-allowed; }
.adm-btn-cancel { background: var(--surface); color: var(--ink-dim); border: 1px solid var(--line-strong); border-radius: 10px; padding: 12px 18px; font-family: var(--sans); font-size: 0.78rem; font-weight: 600; cursor: pointer; }

/* ── toast ── */
.adm-toast { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); background: var(--card); border: 1px solid var(--line-strong); color: var(--ink); padding: 9px 18px; border-radius: 20px; z-index: 300; font-size: 0.72rem; font-weight: 500; white-space: nowrap; animation: fadein 0.2s; box-shadow: 0 4px 20px rgba(0,0,0,0.3); }
.adm-toast.ok  { background: var(--green-l); color: var(--green); border-color: var(--green); }
.adm-toast.err { background: var(--red-l); color: var(--red); border-color: var(--red); }

.adm-add-btn { display: flex; align-items: center; gap: 6px; padding: 9px 16px; background: var(--accent); color: var(--bg); border: none; border-radius: 10px; font-family: var(--sans); font-size: 0.72rem; font-weight: 700; cursor: pointer; transition: opacity 0.15s; }
.adm-add-btn:hover { opacity: 0.88; }
      `}</style>

      <div className="adm">

        {/* ── Header ── */}
        <div className="adm-hdr">
          <div>
            <p className="adm-brand">Apex · Markets</p>
            <h1 className="adm-title">Admin Panel</h1>
          </div>
          {unread > 0 && (
            <div className="adm-bell" onClick={() => setTab('chat')}>
              <Bell size={16} color="var(--ink-dim)" />
              <span className="adm-bell-badge">{unread}</span>
            </div>
          )}
        </div>

        {/* ── Tabs ── */}
        <div className="adm-tabs">
          {tabs.map(({ id, label, icon: Icon, badge, color }) => (
            <button
              key={id}
              className={`adm-tab${tab === id ? ' active' : ''}`}
              style={tab === id ? { background: color, borderColor: color } : {}}
              onClick={() => setTab(id as Tab)}
            >
              {badge > 0 && <span className="adm-tab-badge">{badge}</span>}
              <Icon size={18} strokeWidth={1.75} />
              {label}
            </button>
          ))}
        </div>

        {/* ══ Support ══ */}
        {tab === 'chat' && (
          <div className="adm-chat-grid">
            {/* Ticket list */}
            <div className="adm-ticket-list">
              <div className="adm-ticket-head">
                <span className="adm-ticket-head-title">Conversations</span>
                <div className="adm-filter-toggle">
                  {(['OPEN', 'CLOSED'] as const).map(s => (
                    <button
                      key={s}
                      className={`adm-filter-btn${statusFilter === s ? (s === 'OPEN' ? ' active-open' : ' active-closed') : ''}`}
                      onClick={() => { setFilter(s); setSelectedId(null); }}
                    >
                      {s === 'OPEN' ? 'Open' : 'Closed'}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {tixErr && <p style={{ padding: '12px 16px', fontSize: '0.65rem', color: 'var(--red)' }}>{tixErr}</p>}
                {loadingTix ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px', gap: 8, color: 'var(--ink-faint)' }}>
                    <Loader2 size={16} className="adm-spin" /> Loading…
                  </div>
                ) : tickets.length === 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 20px', gap: 8, color: 'var(--ink-faint)' }}>
                    <MessageCircle size={24} style={{ opacity: 0.3 }} />
                    <p style={{ fontSize: '0.72rem' }}>No {statusFilter.toLowerCase()} tickets</p>
                  </div>
                ) : tickets.map(t => {
                  const last = t.messages?.[t.messages.length - 1];
                  return (
                    <button key={t.id} className={`adm-ticket-item${selectedId === t.id ? ' sel' : ''}`} onClick={() => handleSelect(t.id)}>
                      <div className="adm-avatar" style={{ width: 32, height: 32, fontSize: '0.6rem' }}>
                        {initials(t.user?.name, t.user?.email)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 4 }}>
                          <p style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {t.user?.name || t.user?.email || 'Unknown'}
                          </p>
                          <span style={{ fontSize: '0.55rem', color: 'var(--ink-faint)', flexShrink: 0 }}>{fmtTime(t.updatedAt)}</span>
                        </div>
                        <p style={{ fontSize: '0.65rem', color: 'var(--ink-faint)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>{t.subject}</p>
                        {last && <p style={{ fontSize: '0.6rem', color: 'var(--bg-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1 }}>{last.sender === 'ADMIN' ? 'You: ' : ''}{last.body}</p>}
                      </div>
                      <Circle size={8} style={{ fill: t.status === 'OPEN' ? 'var(--orange)' : 'var(--bg-3)', color: t.status === 'OPEN' ? 'var(--orange)' : 'var(--bg-3)', flexShrink: 0, marginTop: 4 }} />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Thread */}
            <div className="adm-thread">
              {!selectedTicket ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '40px', color: 'var(--ink-faint)' }}>
                  <MessageCircle size={28} style={{ opacity: 0.25 }} />
                  <p style={{ fontSize: '0.75rem', fontWeight: 500 }}>Select a conversation</p>
                </div>
              ) : (
                <>
                  <div className="adm-thread-head">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="adm-avatar" style={{ width: 34, height: 34, fontSize: '0.62rem' }}>
                        {initials(selectedTicket.user?.name, selectedTicket.user?.email)}
                      </div>
                      <div>
                        <p style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--ink)' }}>{selectedTicket.user?.name || selectedTicket.user?.email || 'Unknown'}</p>
                        <p style={{ fontSize: '0.6rem', color: 'var(--ink-faint)' }}>{selectedTicket.user?.email}</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className={`adm-status ${selectedTicket.status === 'OPEN' ? 'ok' : 'grey'}`}>
                        {selectedTicket.status === 'OPEN' ? '● Open' : 'Closed'}
                      </span>
                      {selectedTicket.status === 'OPEN' ? (
                        <button className="adm-status-btn" onClick={() => handleStatus('CLOSED')}>
                          <CheckCircle2 size={12} /> Close
                        </button>
                      ) : (
                        <button className="adm-status-btn" onClick={() => handleStatus('OPEN')}>
                          <RefreshCw size={12} /> Reopen
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="adm-thread-msgs">
                    {detailLoading && <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}><Loader2 size={16} className="adm-spin" style={{ color: 'var(--ink-faint)' }} /></div>}
                    {detailErr && <p style={{ fontSize: '0.65rem', color: 'var(--red)', textAlign: 'center' }}>{detailErr}</p>}
                    {grouped.map(({ date, messages: dms }) => (
                      <div key={date}>
                        <div className="adm-divider">
                          <div className="adm-divider-line" />
                          <span className="adm-divider-label">{fmtDate(dms[0].createdAt)}</span>
                          <div className="adm-divider-line" />
                        </div>
                        {dms.map(msg => {
                          const isAdm = msg.sender === 'ADMIN';
                          return (
                            <div key={msg.id} className={`adm-msg-row${isAdm ? ' admin' : ''}`} style={{ marginBottom: 8 }}>
                              {!isAdm && (
                                <div className="adm-avatar" style={{ width: 26, height: 26, fontSize: '0.52rem', marginRight: 6, alignSelf: 'flex-end' }}>
                                  {initials(selectedTicket.user?.name, selectedTicket.user?.email)}
                                </div>
                              )}
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: isAdm ? 'flex-end' : 'flex-start' }}>
                                <div className={`adm-bubble ${isAdm ? 'admin' : 'user'}`}>
                                  <p style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{msg.body}</p>
                                </div>
                                <span className="adm-msg-time">{isAdm ? 'You · ' : ''}{fmtTime(msg.createdAt)}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                    <div ref={bottomRef} />
                  </div>

                  <div className="adm-thread-input">
                    <textarea
                      ref={textareaRef}
                      value={reply}
                      onChange={handleInputChange}
                      onKeyDown={handleKeyDown}
                      rows={1}
                      placeholder="Reply… (Enter to send, Shift+Enter for new line)"
                      className="adm-textarea"
                    />
                    <button className="adm-send-btn" disabled={!reply.trim() || replying} onClick={handleReply}>
                      {replying ? <Loader2 size={14} className="adm-spin" /> : <Send size={14} />}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ══ Users ══ */}
        {tab === 'users' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <p style={{ fontSize: '0.72rem', color: 'var(--ink-faint)' }}>{users.length} total users</p>
              <div className="adm-search-wrap" style={{ width: 200 }}>
                <Search size={13} />
                <input className="adm-search" placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
            </div>
            <div style={{ background: 'var(--card)', border: '1px solid var(--bg-2)', borderRadius: 'var(--r)', overflow: 'hidden' }}>
              {loadingUsers ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 32, gap: 8, color: 'var(--ink-faint)' }}>
                  <Loader2 size={16} className="adm-spin" /> Loading…
                </div>
              ) : users.filter(u => u.email?.toLowerCase().includes(search.toLowerCase()) || u.name?.toLowerCase().includes(search.toLowerCase())).length === 0 ? (
                <p style={{ padding: '32px', textAlign: 'center', fontSize: '0.72rem', color: 'var(--ink-faint)' }}>No users found</p>
              ) : users
                .filter(u => u.email?.toLowerCase().includes(search.toLowerCase()) || u.name?.toLowerCase().includes(search.toLowerCase()))
                .map((u: any) => (
                  <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 18px', borderBottom: '1px solid var(--bg-2)' }}>
                    <div className="adm-avatar">{u.name ? u.name[0].toUpperCase() : 'U'}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name || 'Unnamed'}</p>
                      <p style={{ fontSize: '0.65rem', color: 'var(--ink-faint)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                      <p style={{ fontFamily: 'var(--mono)', fontSize: '0.75rem', fontWeight: 700, color: 'var(--ink)' }}>
                        ${(u.portfolioBalance || 0).toLocaleString()}
                      </p>
                      <Link href={`/dashboard/admin/users/${u.id}`}
                        style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 10px', background: 'var(--ink)', color: 'var(--orange)', borderRadius: 6, fontSize: '0.6rem', fontWeight: 600, textDecoration: 'none', border: '1px solid var(--orange-m)' }}>
                        <Edit size={10} /> Edit
                      </Link>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* ══ Deposits ══ */}
        {tab === 'deposits' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {loadingDep ? (
              <div className="adm-empty"><Loader2 size={18} className="adm-spin" style={{ color: 'var(--ink-faint)' }} /></div>
            ) : pendingDeps.length === 0 && deposits.filter(d => d.status !== 'PENDING').length === 0 ? (
              <div className="adm-empty">
                <TrendingUp size={28} style={{ opacity: 0.25 }} />
                <p>No deposit submissions yet</p>
              </div>
            ) : (
              <>
                {pendingDeps.length > 0 && (
                  <div>
                    <div className="adm-sec-label">
                      <Clock size={13} style={{ color: 'var(--orange)' }} />
                      <span>Awaiting Confirmation</span>
                      <span className="adm-status pending">{pendingDeps.length}</span>
                    </div>
                    {pendingDeps.map(d => (
                      <div key={d.id} className="adm-card">
                        <div className="adm-card-stripe" style={{ background: 'var(--orange)' }} />
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div className="adm-avatar">{(d.user?.name || d.user?.email || '?')[0].toUpperCase()}</div>
                            <div>
                              <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--ink)' }}>{d.user?.name || 'Unknown'}</p>
                              <p style={{ fontSize: '0.65rem', color: 'var(--ink-faint)' }}>{d.user?.email}</p>
                              {d.methodLabel && <p style={{ fontSize: '0.6rem', color: 'var(--ink-faint)', marginTop: 2 }}>via {d.methodLabel}</p>}
                              <p style={{ fontSize: '0.6rem', color: 'var(--ink-faint)', marginTop: 2 }}>
                                {new Date(d.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>
                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <p style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--ink)' }}>${(d.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                            <p style={{ fontSize: '0.6rem', color: 'var(--ink-faint)' }}>{d.currency || 'USD'}</p>
                          </div>
                        </div>
                        {d.note && (
                          <p style={{ marginTop: 10, padding: '7px 12px', background: 'var(--gold-l)', borderRadius: 8, fontSize: '0.65rem', color: 'var(--gold)', fontStyle: 'italic' }}>"{d.note}"</p>
                        )}
                        <DepositActions id={d.id} onDone={fetchDeposits} />
                      </div>
                    ))}
                  </div>
                )}

                {deposits.filter(d => d.status !== 'PENDING').length > 0 && (
                  <div>
                    <div className="adm-sec-label"><span>Processed</span></div>
                    <div style={{ background: 'var(--card)', border: '1px solid var(--bg-2)', borderRadius: 'var(--r)', overflow: 'hidden' }}>
                      {deposits.filter(d => d.status !== 'PENDING').slice(0, 20).map(d => (
                        <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: '1px solid var(--bg-2)' }}>
                          <div className={`adm-avatar${d.status === 'COMPLETED' ? ' green' : ''}`} style={{ width: 32, height: 32, fontSize: '0.6rem' }}>
                            {d.status === 'COMPLETED' ? <CheckCircle size={14} /> : <XCircle size={14} />}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--ink)' }}>{d.user?.name}</p>
                            <p style={{ fontSize: '0.6rem', color: 'var(--ink-faint)' }}>{new Date(d.updatedAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <p style={{ fontFamily: 'var(--mono)', fontSize: '0.75rem', fontWeight: 700, color: 'var(--ink)' }}>${(d.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                            <span className={`adm-status ${d.status === 'COMPLETED' ? 'ok' : 'bad'}`}>{d.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ══ Withdrawals ══ */}
        {tab === 'withdrawals' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {pendingV.length > 0 && (
              <div>
                <div className="adm-sec-label">
                  <ShieldAlert size={13} style={{ color: 'var(--red)' }} />
                  <span>Awaiting Verification</span>
                  <span className="adm-status bad">{pendingV.length}</span>
                </div>
                {pendingV.map(w => (
                  <div key={w.id} className="adm-card">
                    <div className="adm-card-stripe" style={{ background: 'var(--red)' }} />
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="adm-avatar">{(w.user?.name || '?')[0].toUpperCase()}</div>
                        <div>
                          <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--ink)' }}>{w.user?.name || 'Unknown'}</p>
                          <p style={{ fontSize: '0.65rem', color: 'var(--ink-faint)' }}>{w.user?.email}</p>
                          <p style={{ fontSize: '0.6rem', color: 'var(--ink-faint)', marginTop: 2 }}>{new Date(w.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                      </div>
                      <p style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--ink)', flexShrink: 0 }}>{fmtMoney(w.amount, w.currency)}</p>
                    </div>
                    {w.note && <p style={{ marginTop: 10, padding: '7px 12px', background: 'var(--bg-1)', borderRadius: 8, fontSize: '0.65rem', color: 'var(--ink-dim)', fontStyle: 'italic' }}>"{w.note}"</p>}
                    <WithdrawalActions id={w.id} onDone={fetchWithdrawals} />
                  </div>
                ))}
              </div>
            )}

            <div>
              <div className="adm-sec-label">
                <Clock size={13} style={{ color: 'var(--gold)' }} />
                <span>Pending</span>
                {pending.length > 0 && <span className="adm-status pending">{pending.length}</span>}
              </div>
              {loadingWd ? (
                <div className="adm-empty"><Loader2 size={18} className="adm-spin" style={{ color: 'var(--ink-faint)' }} /></div>
              ) : pending.length === 0 ? (
                <div className="adm-empty"><InboxIcon size={24} style={{ opacity: 0.25 }} /><p>No pending withdrawals</p></div>
              ) : pending.map(w => (
                <div key={w.id} className="adm-card">
                  <div className="adm-card-stripe" style={{ background: 'var(--gold)' }} />
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="adm-avatar">{(w.user?.name || '?')[0].toUpperCase()}</div>
                      <div>
                        <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--ink)' }}>{w.user?.name || 'Unknown'}</p>
                        <p style={{ fontSize: '0.65rem', color: 'var(--ink-faint)' }}>{w.user?.email}</p>
                      </div>
                    </div>
                    <p style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--ink)', flexShrink: 0 }}>{fmtMoney(w.amount, w.currency)}</p>
                  </div>
                  <WithdrawalActions id={w.id} onDone={fetchWithdrawals} />
                </div>
              ))}
            </div>

            {processed.length > 0 && (
              <div>
                <div className="adm-sec-label"><span>Recently Processed</span></div>
                <div style={{ background: 'var(--card)', border: '1px solid var(--bg-2)', borderRadius: 'var(--r)', overflow: 'hidden' }}>
                  {processed.slice(0, 20).map(w => (
                    <div key={w.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: '1px solid var(--bg-2)' }}>
                      <div className={`adm-avatar${w.status === 'APPROVED' ? ' green' : ''}`} style={{ width: 32, height: 32, fontSize: '0.6rem', background: w.status === 'APPROVED' ? 'var(--green)' : 'var(--red)' }}>
                        {w.status === 'APPROVED' ? <CheckCircle size={14} /> : <XCircle size={14} />}
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--ink)' }}>{w.user?.name}</p>
                        <p style={{ fontSize: '0.6rem', color: 'var(--ink-faint)' }}>{new Date(w.updatedAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                        {w.adminNote && <p style={{ fontSize: '0.6rem', color: 'var(--ink-faint)', fontStyle: 'italic' }}>"{w.adminNote}"</p>}
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <p style={{ fontFamily: 'var(--mono)', fontSize: '0.75rem', fontWeight: 700, color: 'var(--ink)' }}>{fmtMoney(w.amount, w.currency)}</p>
                        <span className={`adm-status ${w.status === 'APPROVED' ? 'ok' : 'bad'}`}>{w.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══ Settings ══ */}
        {tab === 'settings' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--ink)' }}>Deposit Methods</p>
                <p style={{ fontSize: '0.65rem', color: 'var(--ink-faint)', marginTop: 2 }}>Addresses shown to users on the deposit sheet</p>
              </div>
              <button className="adm-add-btn" onClick={openNew}>
                <Plus size={12} /> Add Method
              </button>
            </div>

            {loadingM ? (
              <div className="adm-empty"><Loader2 size={18} className="adm-spin" style={{ color: 'var(--ink-faint)' }} /></div>
            ) : methods.length === 0 ? (
              <div className="adm-empty" style={{ border: '1.5px dashed var(--bg-3)' }}>
                <Settings size={24} style={{ opacity: 0.2 }} />
                <p>No deposit methods yet — add one above</p>
              </div>
            ) : methods.map(m => (
              <div key={m.id} className="adm-method-card">
                <div className="adm-card-stripe" style={{ background: m.isActive ? 'var(--orange)' : 'var(--bg-3)' }} />
                <div className="adm-method-ico">{m.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <p style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--ink)' }}>{m.label}</p>
                    {m.network && <span className="adm-status grey" style={{ fontSize: '0.48rem' }}>{m.network}</span>}
                    <span className={`adm-status ${m.isActive ? 'ok' : 'grey'}`} style={{ fontSize: '0.48rem' }}>{m.isActive ? 'Active' : 'Inactive'}</span>
                  </div>
                  <div className="adm-method-addr">{m.address}</div>
                  {m.note && <p style={{ marginTop: 5, fontSize: '0.6rem', color: 'var(--gold)', background: 'var(--gold-l)', padding: '4px 8px', borderRadius: 6 }}>⚠️ {m.note}</p>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  <label className="adm-toggle" title={m.isActive ? 'Deactivate' : 'Activate'}>
                    <input type="checkbox" checked={m.isActive} onChange={() => toggleActive(m)} />
                    <span className="adm-toggle-track" />
                  </label>
                  <button className="adm-icon-btn" onClick={() => openEdit(m)} title="Edit"><Edit size={13} /></button>
                  <button className="adm-icon-btn danger" onClick={() => removeMethod(m.id)} disabled={deleting === m.id} title="Delete">
                    {deleting === m.id ? <Loader2 size={13} className="adm-spin" /> : <Trash2 size={13} />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* ── Add/Edit Drawer ── */}
      {showForm && (
        <>
          <div className="adm-overlay" onClick={() => setShowForm(false)} />
          <div className="adm-drawer">
            <div className="adm-drawer-handle" />
            <p className="adm-drawer-title">{editId ? 'Edit Method' : 'New Deposit Method'}</p>

            <div className="adm-field">
              <label className="adm-field-label">Icon</label>
              <div className="adm-icon-row">
                {ICON_PRESETS.map(ic => (
                  <div key={ic} className={`adm-icon-pick${form.icon === ic ? ' sel' : ''}`} onClick={() => f('icon', ic)}>{ic}</div>
                ))}
                <input className="adm-input" style={{ width: 72, padding: '6px 10px', textAlign: 'center' }} value={form.icon} maxLength={4} onChange={e => f('icon', e.target.value)} placeholder="Custom" />
              </div>
            </div>

            <div className="adm-field">
              <label className="adm-field-label">Label *</label>
              <input className="adm-input" value={form.label} onChange={e => f('label', e.target.value)} placeholder="e.g. Bitcoin (BTC)" />
            </div>

            <div className="adm-field">
              <label className="adm-field-label">Address / Account Details *</label>
              <textarea className="adm-input" value={form.address} onChange={e => f('address', e.target.value)} placeholder="Wallet address, IBAN, or payment details" />
            </div>

            <div className="adm-row-2">
              <div className="adm-field">
                <label className="adm-field-label">Network (optional)</label>
                <input className="adm-input" value={form.network} onChange={e => f('network', e.target.value)} placeholder="e.g. ERC-20" />
              </div>
              <div className="adm-field">
                <label className="adm-field-label">Display Order</label>
                <input className="adm-input" type="number" value={form.sortOrder} onChange={e => f('sortOrder', Number(e.target.value))} min={0} />
              </div>
            </div>

            <div className="adm-field">
              <label className="adm-field-label">Warning Note (optional)</label>
              <input className="adm-input" value={form.note} onChange={e => f('note', e.target.value)} placeholder="e.g. Min deposit $50 · 2 confirmations required" />
            </div>

            <div className="adm-field">
              <label className="adm-checkbox-row" onClick={() => f('isActive', !form.isActive)}>
                <input type="checkbox" checked={form.isActive} readOnly />
                <div>
                  <p style={{ fontSize: '0.78rem', fontWeight: 500, color: 'var(--ink)' }}>Active</p>
                  <p style={{ fontSize: '0.6rem', color: 'var(--ink-faint)', marginTop: 1 }}>Show this method to users on the deposit sheet</p>
                </div>
              </label>
            </div>

            <div className="adm-drawer-footer">
              <button className="adm-btn-cancel" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="adm-btn-save" disabled={saving} onClick={saveMethods}>
                {saving ? 'Saving…' : editId ? 'Save Changes' : 'Create Method'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── Toast ── */}
      {toast && <div className={`adm-toast ${toast.ok ? 'ok' : 'err'}`}>{toast.ok ? '✓' : '✕'} {toast.msg}</div>}
    </>
  );
}
