'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

type DepositMethod = {
  id: string;
  label: string;
  icon: string;
  address: string;
  network: string | null;
  note: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
};

type FormState = {
  label: string;
  icon: string;
  address: string;
  network: string;
  note: string;
  isActive: boolean;
  sortOrder: number;
};

const EMPTY_FORM: FormState = {
  label: '', icon: '₿', address: '', network: '', note: '', isActive: true, sortOrder: 0,
};

const ICON_PRESETS = ['₿', 'Ξ', '◎', '💳', '🏦', 'T', '$', '🔗'];

export default function AdminDepositMethodsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [methods, setMethods]     = useState<DepositMethod[]>([]);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [deleting, setDeleting]   = useState<string | null>(null);
  const [editId, setEditId]       = useState<string | null>(null);   // null = new
  const [showForm, setShowForm]   = useState(false);
  const [form, setForm]           = useState<FormState>(EMPTY_FORM);
  const [toast, setToast]         = useState<{ msg: string; ok: boolean } | null>(null);

  /* ── Auth guard ── */
  useEffect(() => {
    if (status === 'loading') return;
    if (!session || (session.user as any)?.role !== 'ADMIN') {
      router.replace('/dashboard');
    }
  }, [session, status, router]);

  /* ── Fetch ── */
  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/deposit-methods/manage');
      if (res.ok) setMethods(await res.json());
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  /* ── Toast helper ── */
  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  /* ── Open form ── */
  const openNew = () => {
    setEditId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (m: DepositMethod) => {
    setEditId(m.id);
    setForm({ label: m.label, icon: m.icon, address: m.address, network: m.network ?? '', note: m.note ?? '', isActive: m.isActive, sortOrder: m.sortOrder });
    setShowForm(true);
  };

  /* ── Save ── */
  const save = async () => {
    if (!form.label.trim() || !form.address.trim()) {
      showToast('Label and address are required', false); return;
    }
    setSaving(true);
    try {
      const body = {
        ...form,
        network: form.network || null,
        note: form.note || null,
        ...(editId ? { id: editId } : {}),
      };
      const res = await fetch('/api/admin/deposit-methods/manage', {
        method: editId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        showToast(editId ? 'Method updated' : 'Method created');
        setShowForm(false);
        load();
      } else {
        const err = await res.json();
        showToast(err.error ?? 'Something went wrong', false);
      }
    } finally { setSaving(false); }
  };

  /* ── Toggle active ── */
  const toggleActive = async (m: DepositMethod) => {
    await fetch('/api/admin/deposit-methods/manage', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: m.id, isActive: !m.isActive }),
    });
    load();
  };

  /* ── Delete ── */
  const remove = async (id: string) => {
    if (!confirm('Delete this deposit method? This cannot be undone.')) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/deposit-methods/manage?id=${id}`, { method: 'DELETE' });
      if (res.ok) { showToast('Method deleted'); load(); }
      else showToast('Delete failed', false);
    } finally { setDeleting(null); }
  };

  const f = (key: keyof FormState, val: string | boolean | number) =>
    setForm(prev => ({ ...prev, [key]: val }));

  if (status === 'loading' || loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ width: 28, height: 28, border: '2.5px solid #e2dbd1', borderTopColor: '#e85c0d', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

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
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: var(--bg); font-family: var(--sans); }

        .adm-wrap { max-width: 720px; margin: 0 auto; padding: 32px 20px 60px; }

        /* ── page header ── */
        .adm-head { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 28px; gap: 12px; }
        .adm-head-left {}
        .adm-breadcrumb { font-size: 0.6rem; font-weight: 500; color: var(--ink-faint); letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 6px; }
        .adm-title { font-size: 1.5rem; font-weight: 700; color: var(--ink); letter-spacing: -0.02em; }
        .adm-sub { font-size: 0.72rem; font-weight: 300; color: var(--ink-dim); margin-top: 4px; }

        .adm-btn-add {
          background: var(--orange); color: #fff; border: none;
          border-radius: 10px; padding: 10px 18px;
          font-family: var(--sans); font-size: 0.75rem; font-weight: 600;
          cursor: pointer; transition: opacity 0.15s; white-space: nowrap;
          display: flex; align-items: center; gap: 6px;
        }
        .adm-btn-add:hover { opacity: 0.88; }

        /* ── empty ── */
        .adm-empty {
          background: var(--card); border: 1.5px dashed var(--bg-3);
          border-radius: 16px; padding: 48px 24px; text-align: center;
        }
        .adm-empty-ico { font-size: 2.4rem; margin-bottom: 12px; }
        .adm-empty-title { font-size: 0.9rem; font-weight: 600; color: var(--ink); margin-bottom: 6px; }
        .adm-empty-sub { font-size: 0.7rem; font-weight: 300; color: var(--ink-faint); }

        /* ── method cards ── */
        .adm-card {
          background: var(--card); border: 1px solid var(--bg-2);
          border-radius: 14px; padding: 18px 20px;
          margin-bottom: 10px; transition: box-shadow 0.15s;
          position: relative; overflow: hidden;
        }
        .adm-card:hover { box-shadow: 0 4px 16px rgba(28,26,23,0.08); }

        .adm-card-accent {
          position: absolute; top: 0; left: 0; bottom: 0; width: 3px;
          background: var(--orange); border-radius: 3px 0 0 3px;
        }
        .adm-card-accent.inactive { background: var(--bg-3); }

        .adm-card-top { display: flex; align-items: center; gap: 14px; }

        .adm-card-ico {
          width: 44px; height: 44px; border-radius: 12px;
          background: var(--bg-1); border: 1px solid var(--bg-2);
          display: flex; align-items: center; justify-content: center;
          font-size: 1.3rem; flex-shrink: 0;
        }

        .adm-card-info { flex: 1; min-width: 0; }

        .adm-card-label { font-size: 0.85rem; font-weight: 600; color: var(--ink); margin-bottom: 2px; }

        .adm-card-meta { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }

        .adm-badge {
          font-family: var(--mono); font-size: 0.52rem; font-weight: 600;
          letter-spacing: 0.1em; text-transform: uppercase;
          padding: 2px 8px; border-radius: 20px; display: inline-block;
        }
        .adm-badge.active  { background: var(--green-l); color: var(--green); }
        .adm-badge.inactive { background: var(--bg-2); color: var(--ink-faint); }
        .adm-badge.network { background: #e4eaf8; color: #1a3d8a; }

        .adm-card-actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }

        .adm-toggle {
          position: relative; width: 38px; height: 22px; cursor: pointer;
        }
        .adm-toggle input { opacity: 0; width: 0; height: 0; }
        .adm-toggle-slider {
          position: absolute; inset: 0; background: var(--bg-3);
          border-radius: 11px; transition: background 0.2s;
        }
        .adm-toggle-slider::before {
          content: ''; position: absolute;
          width: 16px; height: 16px; left: 3px; top: 3px;
          background: #fff; border-radius: 50%; transition: transform 0.2s;
        }
        .adm-toggle input:checked + .adm-toggle-slider { background: var(--green); }
        .adm-toggle input:checked + .adm-toggle-slider::before { transform: translateX(16px); }

        .adm-icon-btn {
          width: 34px; height: 34px; border-radius: 8px; border: 1px solid var(--bg-2);
          background: var(--bg-1); cursor: pointer; display: flex; align-items: center;
          justify-content: center; font-size: 0.8rem; transition: all 0.12s; color: var(--ink-dim);
        }
        .adm-icon-btn:hover { background: var(--bg-2); color: var(--ink); }
        .adm-icon-btn.danger:hover { background: var(--red-l); border-color: var(--red); color: var(--red); }

        .adm-card-address {
          margin-top: 12px; padding: 10px 14px;
          background: var(--bg-1); border-radius: 8px;
          font-family: var(--mono); font-size: 0.62rem; color: var(--ink-dim);
          word-break: break-all; line-height: 1.6;
        }

        .adm-card-note {
          margin-top: 8px; padding: 8px 12px;
          background: var(--gold-l); border-radius: 8px;
          font-size: 0.63rem; color: var(--gold); line-height: 1.5;
        }

        /* ── overlay + drawer ── */
        .adm-overlay {
          position: fixed; inset: 0; background: rgba(28,26,23,0.45);
          z-index: 200; backdrop-filter: blur(2px);
          animation: fadein 0.2s ease;
        }
        @keyframes fadein { from { opacity:0 } to { opacity:1 } }

        .adm-drawer {
          position: fixed; bottom: 0; left: 0; right: 0;
          background: #f0ece6; border-radius: 24px 24px 0 0;
          padding: 0 22px 44px; z-index: 201; max-height: 92vh; overflow-y: auto;
          animation: slideup 0.3s cubic-bezier(0.32,0.72,0,1);
          max-width: 720px; margin: 0 auto;
        }
        @keyframes slideup { from { transform:translateY(100%) } to { transform:translateY(0) } }

        .adm-drawer-handle {
          width: 36px; height: 4px; background: var(--bg-3);
          border-radius: 2px; margin: 12px auto 22px;
        }

        .adm-drawer-title { font-size: 1.1rem; font-weight: 700; color: var(--ink); letter-spacing: -0.02em; margin-bottom: 22px; }

        /* ── form fields ── */
        .adm-field { margin-bottom: 16px; }

        .adm-field-label {
          font-size: 0.6rem; font-weight: 600; color: var(--ink-faint);
          text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 7px; display: block;
        }

        .adm-input {
          width: 100%; background: var(--card); border: 1.5px solid var(--bg-2);
          border-radius: 10px; padding: 11px 14px;
          font-family: var(--sans); font-size: 0.82rem; color: var(--ink); outline: none;
          transition: border-color 0.15s;
        }
        .adm-input:focus { border-color: var(--orange); }
        .adm-input::placeholder { color: var(--bg-3); }

        textarea.adm-input { resize: vertical; min-height: 80px; line-height: 1.5; }

        .adm-input-mono {
          font-family: var(--mono); font-size: 0.75rem;
        }

        .adm-icon-row { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 2px; }

        .adm-icon-pick {
          width: 38px; height: 38px; border-radius: 8px;
          background: var(--card); border: 1.5px solid var(--bg-2);
          display: flex; align-items: center; justify-content: center;
          font-size: 1.1rem; cursor: pointer; transition: all 0.12s;
        }
        .adm-icon-pick.sel { border-color: var(--orange); background: var(--orange-l); }

        .adm-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

        .adm-checkbox-row {
          display: flex; align-items: center; gap: 10px;
          padding: 12px 14px; background: var(--card);
          border: 1.5px solid var(--bg-2); border-radius: 10px;
          cursor: pointer;
        }
        .adm-checkbox-row input { width: 16px; height: 16px; accent-color: var(--orange); cursor: pointer; }
        .adm-checkbox-lbl { font-size: 0.78rem; font-weight: 500; color: var(--ink); }
        .adm-checkbox-sub { font-size: 0.62rem; font-weight: 300; color: var(--ink-faint); margin-top: 1px; }

        .adm-drawer-footer { display: flex; gap: 10px; margin-top: 24px; }

        .adm-btn-save {
          flex: 1; background: var(--orange); color: #fff; border: none;
          border-radius: 10px; padding: 13px;
          font-family: var(--sans); font-size: 0.8rem; font-weight: 700;
          cursor: pointer; transition: opacity 0.15s;
        }
        .adm-btn-save:hover { opacity: 0.88; }
        .adm-btn-save:disabled { opacity: 0.4; cursor: not-allowed; }

        .adm-btn-cancel {
          background: var(--bg-2); color: var(--ink-dim); border: none;
          border-radius: 10px; padding: 13px 20px;
          font-family: var(--sans); font-size: 0.8rem; font-weight: 600;
          cursor: pointer; transition: background 0.15s;
        }
        .adm-btn-cancel:hover { background: var(--bg-3); }

        /* ── toast ── */
        .adm-toast {
          position: fixed; bottom: 28px; left: 50%; transform: translateX(-50%);
          background: var(--ink); color: #f0ece6;
          padding: 10px 20px; border-radius: 20px; z-index: 300;
          font-size: 0.75rem; font-weight: 500; white-space: nowrap;
          animation: fadein 0.2s ease;
          box-shadow: 0 4px 20px rgba(28,26,23,0.25);
        }
        .adm-toast.ok  { background: var(--green); }
        .adm-toast.err { background: var(--red); }

        @media (max-width: 480px) {
          .adm-wrap { padding: 20px 14px 60px; }
          .adm-row-2 { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="adm-wrap">

        {/* ── Page header ── */}
        <div className="adm-head">
          <div className="adm-head-left">
            <p className="adm-breadcrumb">Admin · Settings</p>
            <h1 className="adm-title">Deposit Methods</h1>
            <p className="adm-sub">Manage the deposit addresses shown to users</p>
          </div>
          <button className="adm-btn-add" onClick={openNew}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
            Add Method
          </button>
        </div>

        {/* ── Method list ── */}
        {methods.length === 0 ? (
          <div className="adm-empty">
            <div className="adm-empty-ico">🏦</div>
            <p className="adm-empty-title">No deposit methods yet</p>
            <p className="adm-empty-sub">Add a method above to start accepting deposits</p>
          </div>
        ) : (
          methods.map(m => (
            <div key={m.id} className="adm-card">
              <div className={`adm-card-accent${m.isActive ? '' : ' inactive'}`} />

              <div className="adm-card-top">
                <div className="adm-card-ico">{m.icon}</div>

                <div className="adm-card-info">
                  <p className="adm-card-label">{m.label}</p>
                  <div className="adm-card-meta">
                    <span className={`adm-badge ${m.isActive ? 'active' : 'inactive'}`}>
                      {m.isActive ? 'Active' : 'Inactive'}
                    </span>
                    {m.network && <span className="adm-badge network">{m.network}</span>}
                    <span style={{ fontFamily: 'var(--mono)', fontSize: '0.58rem', color: 'var(--ink-faint)' }}>
                      Order #{m.sortOrder}
                    </span>
                  </div>
                </div>

                <div className="adm-card-actions">
                  {/* Active toggle */}
                  <label className="adm-toggle" title={m.isActive ? 'Deactivate' : 'Activate'}>
                    <input type="checkbox" checked={m.isActive} onChange={() => toggleActive(m)} />
                    <span className="adm-toggle-slider" />
                  </label>

                  {/* Edit */}
                  <button className="adm-icon-btn" onClick={() => openEdit(m)} title="Edit">
                    ✏️
                  </button>

                  {/* Delete */}
                  <button
                    className="adm-icon-btn danger"
                    onClick={() => remove(m.id)}
                    disabled={deleting === m.id}
                    title="Delete"
                  >
                    {deleting === m.id ? '…' : '🗑'}
                  </button>
                </div>
              </div>

              {/* Address */}
              <div className="adm-card-address">{m.address}</div>

              {/* Note */}
              {m.note && <div className="adm-card-note">⚠️ {m.note}</div>}
            </div>
          ))
        )}
      </div>

      {/* ── Add / Edit drawer ── */}
      {showForm && (
        <>
          <div className="adm-overlay" onClick={() => setShowForm(false)} />
          <div className="adm-drawer">
            <div className="adm-drawer-handle" />
            <p className="adm-drawer-title">{editId ? 'Edit Method' : 'New Deposit Method'}</p>

            {/* Icon picker */}
            <div className="adm-field">
              <label className="adm-field-label">Icon</label>
              <div className="adm-icon-row">
                {ICON_PRESETS.map(ic => (
                  <div
                    key={ic}
                    className={`adm-icon-pick${form.icon === ic ? ' sel' : ''}`}
                    onClick={() => f('icon', ic)}
                  >
                    {ic}
                  </div>
                ))}
                <input
                  className="adm-input"
                  style={{ width: 80, padding: '6px 10px', textAlign: 'center' }}
                  value={form.icon}
                  maxLength={4}
                  onChange={e => f('icon', e.target.value)}
                  placeholder="Custom"
                />
              </div>
            </div>

            {/* Label */}
            <div className="adm-field">
              <label className="adm-field-label">Label *</label>
              <input
                className="adm-input"
                value={form.label}
                onChange={e => f('label', e.target.value)}
                placeholder="e.g. Bitcoin (BTC)"
              />
            </div>

            {/* Address */}
            <div className="adm-field">
              <label className="adm-field-label">Address / Account Details *</label>
              <textarea
                className="adm-input adm-input-mono"
                value={form.address}
                onChange={e => f('address', e.target.value)}
                placeholder="Wallet address, IBAN, or payment details"
              />
            </div>

            <div className="adm-row-2">
              {/* Network */}
              <div className="adm-field">
                <label className="adm-field-label">Network (optional)</label>
                <input
                  className="adm-input"
                  value={form.network}
                  onChange={e => f('network', e.target.value)}
                  placeholder="e.g. ERC-20, TRC-20"
                />
              </div>

              {/* Sort order */}
              <div className="adm-field">
                <label className="adm-field-label">Display Order</label>
                <input
                  className="adm-input"
                  type="number"
                  value={form.sortOrder}
                  onChange={e => f('sortOrder', Number(e.target.value))}
                  min={0}
                />
              </div>
            </div>

            {/* Note */}
            <div className="adm-field">
              <label className="adm-field-label">Warning Note (optional)</label>
              <input
                className="adm-input"
                value={form.note}
                onChange={e => f('note', e.target.value)}
                placeholder="e.g. Min deposit $50 · 2 confirmations required"
              />
            </div>

            {/* Active toggle */}
            <div className="adm-field">
              <label className="adm-checkbox-row" onClick={() => f('isActive', !form.isActive)}>
                <input type="checkbox" checked={form.isActive} readOnly />
                <div>
                  <p className="adm-checkbox-lbl">Active</p>
                  <p className="adm-checkbox-sub">Show this method to users on the deposit sheet</p>
                </div>
              </label>
            </div>

            <div className="adm-drawer-footer">
              <button className="adm-btn-cancel" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="adm-btn-save" disabled={saving} onClick={save}>
                {saving ? 'Saving…' : editId ? 'Save Changes' : 'Create Method'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── Toast ── */}
      {toast && (
        <div className={`adm-toast ${toast.ok ? 'ok' : 'err'}`}>
          {toast.ok ? '✓' : '✕'} {toast.msg}
        </div>
      )}
    </>
  );
}
