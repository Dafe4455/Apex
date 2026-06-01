'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Edit, Loader2, CheckCircle,
  XCircle, User, Mail, ShieldCheck, Wallet,
  Calendar, KeyRound, Save, X,
} from 'lucide-react';
import Link from 'next/link';

// ── Types ─────────────────────────────────────────────────────────────────────
type KycStatus = 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED';

interface UserDetail {
  id: string;
  name: string;
  email: string;
  role: string;
  kycStatus: KycStatus;
  portfolioBalance: number;
  createdAt: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function initials(name?: string | null, email?: string) {
  if (name) return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  if (email) return email.slice(0, 2).toUpperCase();
  return '??';
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString([], { year: 'numeric', month: 'long', day: 'numeric' });
}

function KycBadge({ status }: { status: KycStatus }) {
  const map: Record<KycStatus, [string, string]> = {
    NONE:     ['var(--bg-2)',    'var(--ink-faint)'],
    PENDING:  ['var(--gold-l)', 'var(--gold)'],
    APPROVED: ['var(--green-l)','var(--green)'],
    REJECTED: ['var(--red-l)',  'var(--red)'],
  };
  const [bg, col] = map[status];
  return (
    <span style={{
      background: bg, color: col,
      padding: '3px 10px', borderRadius: 20,
      fontSize: '0.55rem', fontWeight: 700,
      letterSpacing: '0.1em', textTransform: 'uppercase',
      fontFamily: 'var(--mono)',
    }}>
      {status}
    </span>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AdminUserDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;

  const [user, setUser]       = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  // Edit state
  const [editing, setEditing]   = useState(false);
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [kycStatus, setKyc]     = useState<KycStatus>('NONE');
  const [balance, setBalance]   = useState('');
  const [saving, setSaving]     = useState(false);
  const [saveErr, setSaveErr]   = useState('');
  const [toast, setToast]       = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchUser = useCallback(async () => {
    if (!id) return;
    setLoading(true); setError('');
    try {
      const res = await fetch(`/api/admin/users/${id}`, { cache: 'no-store' });
      if (!res.ok) { setError('User not found'); return; }
      const data = await res.json();
      setUser(data.user);
      // seed edit fields
      setName(data.user.name ?? '');
      setEmail(data.user.email ?? '');
      setKyc(data.user.kycStatus ?? 'NONE');
      setBalance(String(data.user.portfolioBalance ?? 0));
    } catch { setError('Network error'); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { fetchUser(); }, [fetchUser]);

  const openEdit = () => { setSaveErr(''); setEditing(true); };
  const cancelEdit = () => { setEditing(false); setSaveErr(''); };

  const handleSave = async () => {
    setSaving(true); setSaveErr('');
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:             name || undefined,
          email:            email || undefined,
          kycStatus:        kycStatus,
          portfolioBalance: Number(balance),
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setSaveErr(d.error ?? 'Failed to save');
        return;
      }
      const data = await res.json();
      setUser(data.user);
      setEditing(false);
      showToast('User updated successfully');
    } catch { setSaveErr('Network error'); }
    finally { setSaving(false); }
  };

  const KYC_OPTIONS: KycStatus[] = ['NONE', 'PENDING', 'APPROVED', 'REJECTED'];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');

        :root {
          --bg:        #f0ece6;
          --bg-1:      #e8e3db;
          --bg-2:      #ddd7cd;
          --bg-3:      #cbc4b8;
          --card:      #eeeae4;
          --white:     #ffffff;
          --ink:       #1c1a17;
          --ink-2:     #2e2b26;
          --ink-dim:   #6b6457;
          --ink-faint: #9e9485;
          --orange:    #e85c0d;
          --orange-l:  #fde8dc;
          --orange-m:  #f5c4a8;
          --green:     #2e7d4f;
          --green-l:   #e4f2ea;
          --red:       #b83232;
          --red-l:     #faeaea;
          --gold-l:    #fdf3d0;
          --gold:      #8a6800;
          --sans: 'DM Sans', system-ui, sans-serif;
          --mono: 'DM Mono', 'SF Mono', monospace;
          --r: 14px;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: var(--bg); font-family: var(--sans); }

        .ud-wrap { max-width: 560px; margin: 0 auto; padding: 24px 16px 60px; }

        /* back + header */
        .ud-back {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 0.7rem; font-weight: 600; color: var(--ink-dim);
          text-decoration: none; margin-bottom: 20px;
          padding: 6px 12px; background: var(--card);
          border: 1px solid var(--bg-2); border-radius: 8px;
          transition: background 0.12s;
        }
        .ud-back:hover { background: var(--bg-2); }

        .ud-brand { font-family: var(--mono); font-size: 0.58rem; letter-spacing: 0.18em; color: var(--orange); text-transform: uppercase; margin-bottom: 4px; }
        .ud-title { font-size: 1.4rem; font-weight: 700; color: var(--ink); letter-spacing: -0.02em; margin-bottom: 20px; }

        /* profile card */
        .ud-profile {
          background: var(--card); border: 1px solid var(--bg-2);
          border-radius: var(--r); padding: 22px 20px; margin-bottom: 12px;
          position: relative; overflow: hidden;
        }
        .ud-profile-stripe { position: absolute; top: 0; left: 0; bottom: 0; width: 3px; background: var(--orange); border-radius: 3px 0 0 3px; }

        .ud-avatar {
          width: 56px; height: 56px; border-radius: 50%;
          background: var(--orange); color: #fff;
          display: flex; align-items: center; justify-content: center;
          font-size: 1.1rem; font-weight: 700; flex-shrink: 0;
        }

        .ud-edit-btn {
          display: flex; align-items: center; gap: 6px;
          padding: 7px 14px; background: var(--orange-l);
          color: var(--orange); border: 1px solid var(--orange-m);
          border-radius: 8px; font-family: var(--sans);
          font-size: 0.68rem; font-weight: 600; cursor: pointer;
          transition: background 0.12s; flex-shrink: 0;
        }
        .ud-edit-btn:hover { background: var(--orange-m); }

        /* info rows */
        .ud-info-grid {
          background: var(--card); border: 1px solid var(--bg-2);
          border-radius: var(--r); overflow: hidden; margin-bottom: 12px;
        }
        .ud-info-row {
          display: flex; align-items: center; gap: 14px;
          padding: 14px 18px; border-bottom: 1px solid var(--bg-2);
        }
        .ud-info-row:last-child { border-bottom: none; }
        .ud-info-ico {
          width: 32px; height: 32px; border-radius: 8px;
          background: var(--bg-1); border: 1px solid var(--bg-2);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; color: var(--ink-faint);
        }
        .ud-info-label {
          font-size: 0.58rem; font-weight: 600; color: var(--ink-faint);
          text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 3px;
        }
        .ud-info-val {
          font-size: 0.82rem; font-weight: 500; color: var(--ink);
        }
        .ud-info-val.mono { font-family: var(--mono); font-size: 0.75rem; }
        .ud-info-val.large {
          font-size: 1.3rem; font-weight: 700; color: var(--ink);
          letter-spacing: -0.02em; font-family: var(--mono);
        }

        /* edit form */
        .ud-form {
          background: var(--card); border: 1px solid var(--bg-2);
          border-radius: var(--r); padding: 20px; margin-bottom: 12px;
        }
        .ud-form-title {
          font-size: 0.88rem; font-weight: 700; color: var(--ink);
          margin-bottom: 18px; display: flex; align-items: center;
          justify-content: space-between;
        }
        .ud-field { margin-bottom: 14px; }
        .ud-field-label {
          display: block; font-size: 0.58rem; font-weight: 600;
          color: var(--ink-faint); text-transform: uppercase;
          letter-spacing: 0.08em; margin-bottom: 6px;
        }
        .ud-input {
          width: 100%; background: var(--bg-1); border: 1.5px solid var(--bg-2);
          border-radius: 10px; padding: 10px 13px;
          font-family: var(--sans); font-size: 0.8rem; color: var(--ink);
          outline: none; transition: border-color 0.15s;
        }
        .ud-input:focus { border-color: var(--orange); background: #fff; }
        .ud-input::placeholder { color: var(--bg-3); }

        .ud-select {
          width: 100%; background: var(--bg-1); border: 1.5px solid var(--bg-2);
          border-radius: 10px; padding: 10px 13px;
          font-family: var(--sans); font-size: 0.8rem; color: var(--ink);
          outline: none; transition: border-color 0.15s;
          appearance: none; cursor: pointer;
        }
        .ud-select:focus { border-color: var(--orange); background: #fff; }

        /* kyc pills in edit */
        .ud-kyc-pills { display: flex; gap: 8px; flex-wrap: wrap; }
        .ud-kyc-pill {
          padding: 6px 14px; border-radius: 20px; border: 1.5px solid var(--bg-2);
          background: var(--card); font-family: var(--sans); font-size: 0.65rem;
          font-weight: 600; cursor: pointer; transition: all 0.12s;
          color: var(--ink-dim);
        }
        .ud-kyc-pill:hover { border-color: var(--bg-3); }
        .ud-kyc-pill.sel-NONE     { background: var(--bg-2);    border-color: var(--bg-3);    color: var(--ink-dim); }
        .ud-kyc-pill.sel-PENDING  { background: var(--gold-l);  border-color: #e8d48a;        color: var(--gold); }
        .ud-kyc-pill.sel-APPROVED { background: var(--green-l); border-color: #a8d8b8;        color: var(--green); }
        .ud-kyc-pill.sel-REJECTED { background: var(--red-l);   border-color: #e8b8b8;        color: var(--red); }

        .ud-form-btns { display: flex; gap: 10px; margin-top: 20px; }
        .ud-btn-save {
          flex: 1; background: var(--orange); color: #fff; border: none;
          border-radius: 10px; padding: 12px;
          font-family: var(--sans); font-size: 0.78rem; font-weight: 700;
          cursor: pointer; transition: opacity 0.15s;
          display: flex; align-items: center; justify-content: center; gap: 6px;
        }
        .ud-btn-save:hover { opacity: 0.88; }
        .ud-btn-save:disabled { opacity: 0.4; cursor: not-allowed; }
        .ud-btn-cancel {
          background: var(--bg-2); color: var(--ink-dim); border: none;
          border-radius: 10px; padding: 12px 18px;
          font-family: var(--sans); font-size: 0.78rem; font-weight: 600;
          cursor: pointer; display: flex; align-items: center; gap: 6px;
        }

        .ud-err { font-size: 0.65rem; color: var(--red); margin-top: 8px; }

        /* spin */
        .ud-spin { animation: spin 0.7s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* loading / error */
        .ud-center {
          display: flex; flex-direction: column; align-items: center;
          justify-content: center; min-height: 60vh; gap: 10px;
          color: var(--ink-faint);
        }

        /* toast */
        .ud-toast {
          position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
          background: var(--ink); color: #f0ece6;
          padding: 9px 18px; border-radius: 20px; z-index: 300;
          font-size: 0.72rem; font-weight: 500; white-space: nowrap;
          animation: fadein 0.2s; box-shadow: 0 4px 20px rgba(28,26,23,0.2);
        }
        .ud-toast.ok  { background: var(--green); }
        .ud-toast.err { background: var(--red); }
        @keyframes fadein { from { opacity: 0; } to { opacity: 1; } }

        /* role badge */
        .ud-role {
          font-family: var(--mono); font-size: 0.5rem; font-weight: 700;
          letter-spacing: 0.1em; text-transform: uppercase;
          padding: 2px 8px; border-radius: 20px;
          background: var(--bg-2); color: var(--ink-dim);
        }
        .ud-role.admin { background: #ede8f8; color: #6b5ce7; }
      `}</style>

      <div className="ud-wrap">

        {/* Back */}
        <Link href="/dashboard/admin" className="ud-back">
          <ArrowLeft size={13} /> Back to Admin
        </Link>

        {/* Header */}
        <p className="ud-brand">Apex · Markets</p>
        <h1 className="ud-title">User Detail</h1>

        {/* Loading */}
        {loading && (
          <div className="ud-center">
            <Loader2 size={24} className="ud-spin" />
            <p style={{ fontSize: '0.72rem' }}>Loading user…</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="ud-center">
            <XCircle size={28} style={{ opacity: 0.3 }} />
            <p style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--ink)' }}>{error}</p>
            <Link href="/dashboard/admin" className="ud-back" style={{ marginTop: 8 }}>
              <ArrowLeft size={13} /> Go back
            </Link>
          </div>
        )}

        {/* Content */}
        {!loading && user && !editing && (
          <>
            {/* Profile card */}
            <div className="ud-profile">
              <div className="ud-profile-stripe" />
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div className="ud-avatar">
                  {initials(user.name, user.email)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.02em', marginBottom: 3 }}>
                    {user.name || 'Unnamed User'}
                  </p>
                  <p style={{ fontSize: '0.7rem', color: 'var(--ink-faint)', marginBottom: 6 }}>{user.email}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <KycBadge status={user.kycStatus} />
                    <span className={`ud-role${user.role === 'ADMIN' ? ' admin' : ''}`}>{user.role}</span>
                  </div>
                </div>
                <button className="ud-edit-btn" onClick={openEdit}>
                  <Edit size={12} /> Edit
                </button>
              </div>
            </div>

            {/* Info rows */}
            <div className="ud-info-grid">
              <div className="ud-info-row">
                <div className="ud-info-ico"><Wallet size={15} /></div>
                <div style={{ flex: 1 }}>
                  <p className="ud-info-label">Portfolio Balance</p>
                  <p className="ud-info-val large">${(user.portfolioBalance ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                </div>
              </div>

              <div className="ud-info-row">
                <div className="ud-info-ico"><Mail size={15} /></div>
                <div style={{ flex: 1 }}>
                  <p className="ud-info-label">Email Address</p>
                  <p className="ud-info-val">{user.email}</p>
                </div>
              </div>

              <div className="ud-info-row">
                <div className="ud-info-ico"><ShieldCheck size={15} /></div>
                <div style={{ flex: 1 }}>
                  <p className="ud-info-label">KYC Status</p>
                  <div style={{ marginTop: 2 }}><KycBadge status={user.kycStatus} /></div>
                </div>
              </div>

              <div className="ud-info-row">
                <div className="ud-info-ico"><User size={15} /></div>
                <div style={{ flex: 1 }}>
                  <p className="ud-info-label">Role</p>
                  <p className="ud-info-val">{user.role}</p>
                </div>
              </div>

              <div className="ud-info-row">
                <div className="ud-info-ico"><KeyRound size={15} /></div>
                <div style={{ flex: 1 }}>
                  <p className="ud-info-label">User ID</p>
                  <p className="ud-info-val mono">{user.id}</p>
                </div>
              </div>

              <div className="ud-info-row">
                <div className="ud-info-ico"><Calendar size={15} /></div>
                <div style={{ flex: 1 }}>
                  <p className="ud-info-label">Member Since</p>
                  <p className="ud-info-val">{fmtDate(user.createdAt)}</p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Edit Form */}
        {!loading && user && editing && (
          <div className="ud-form">
            <div className="ud-form-title">
              Edit User
              <button onClick={cancelEdit} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-faint)', display: 'flex', alignItems: 'center' }}>
                <X size={16} />
              </button>
            </div>

            <div className="ud-field">
              <label className="ud-field-label">Full Name</label>
              <input className="ud-input" value={name} onChange={e => setName(e.target.value)} placeholder="User's full name" />
            </div>

            <div className="ud-field">
              <label className="ud-field-label">Email Address</label>
              <input className="ud-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="user@example.com" />
            </div>

            <div className="ud-field">
              <label className="ud-field-label">Portfolio Balance (USD)</label>
              <input className="ud-input" type="number" value={balance} onChange={e => setBalance(e.target.value)} placeholder="0.00" min="0" step="0.01" />
            </div>

            <div className="ud-field">
              <label className="ud-field-label">KYC Status</label>
              <div className="ud-kyc-pills" style={{ marginTop: 6 }}>
                {KYC_OPTIONS.map(opt => (
                  <button
                    key={opt}
                    className={`ud-kyc-pill${kycStatus === opt ? ` sel-${opt}` : ''}`}
                    onClick={() => setKyc(opt)}
                  >
                    {opt}
                  </button>
                ))}
              </div>
              <p style={{ fontSize: '0.58rem', color: 'var(--ink-faint)', marginTop: 8, lineHeight: 1.5 }}>
                NONE → user hasn't started KYC · PENDING → docs submitted, awaiting review · APPROVED / REJECTED → admin decision
              </p>
            </div>

            {saveErr && <p className="ud-err">✕ {saveErr}</p>}

            <div className="ud-form-btns">
              <button className="ud-btn-cancel" onClick={cancelEdit}>
                <X size={13} /> Cancel
              </button>
              <button className="ud-btn-save" disabled={saving} onClick={handleSave}>
                {saving
                  ? <><Loader2 size={14} className="ud-spin" /> Saving…</>
                  : <><Save size={14} /> Save Changes</>
                }
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Toast */}
      {toast && (
        <div className={`ud-toast ${toast.ok ? 'ok' : 'err'}`}>
          {toast.ok ? '✓' : '✕'} {toast.msg}
        </div>
      )}
    </>
  );
}
