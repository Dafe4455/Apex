'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Toaster, toast } from 'react-hot-toast';
import {
    ArrowLeft,
    Plus,
    Loader2,
    Trash2,
    Edit2,
    CheckCircle2,
    XCircle,
    Save,
    X,
    Shield,
    Zap,
    Crown,
    RefreshCw,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

type Plan = {
    id: string;
    name: string;
    tier: string;
    description: string;
    price: number;
    minInvestment: number;
    weeklyReturnRate: number;
    interval: string;
    features: string[];
    isActive: boolean;
    highlight?: string | null;
    createdAt: string;
};

const emptyPlan: Omit<Plan, 'id' | 'createdAt'> = {
    name: '',
    tier: 'basic',
    description: '',
    price: 0,
    minInvestment: 0,
    weeklyReturnRate: 0,
    interval: 'WEEKLY',
    features: [],
    isActive: true,
    highlight: '',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmtUsd = (n: number) =>
    new Intl.NumberFormat('en-US', {
        style: 'currency', currency: 'USD',
        minimumFractionDigits: 2, maximumFractionDigits: 2,
    }).format(n);

const tierIcon = (tier: string) => {
    const t = tier.toLowerCase();
    if (t === 'platinum') return Crown;
    if (t === 'advanced') return Zap;
    return Shield;
};

const tierColor = (tier: string) => {
    const t = tier.toLowerCase();
    if (t === 'platinum') return 'var(--gold)';
    if (t === 'advanced') return 'var(--accent)';
    return 'var(--ink-faint)';
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function AdminSubscriptionsPage() {
    const router = useRouter();
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [featureInput, setFeatureInput] = useState('');

    const loadPlans = useCallback(async () => {
        try {
            const res = await fetch('/api/admin/subscriptions/plans');
            if (!res.ok) throw new Error();
            setPlans(await res.json());
        } catch {
            toast.error('Failed to load plans');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadPlans(); }, [loadPlans]);

    const savePlan = async () => {
        if (!editingPlan) return;
        if (!editingPlan.name || editingPlan.price < 0) {
            toast.error('Name and valid price required');
            return;
        }

        setSaving(true);
        try {
            const res = await fetch('/api/admin/subscriptions/plans', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editingPlan),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            toast.success(isCreating ? 'Plan created' : 'Plan updated');
            setEditingPlan(null);
            setIsCreating(false);
            await loadPlans();
            router.refresh();
        } catch (err: any) {
            toast.error(err.message || 'Save failed');
        } finally {
            setSaving(false);
        }
    };

    const deletePlan = async (id: string) => {
        if (!confirm('Delete this plan? If active subscribers exist, it will be deactivated instead.')) return;
        try {
            const res = await fetch(`/api/admin/subscriptions/plans?id=${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            toast.success(data.message || 'Plan removed');
            await loadPlans();
            router.refresh();
        } catch (err: any) {
            toast.error(err.message || 'Delete failed');
        }
    };

    const toggleActive = async (plan: Plan) => {
        try {
            const res = await fetch('/api/admin/subscriptions/plans/toggle', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: plan.id, isActive: !plan.isActive }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            toast.success(plan.isActive ? 'Plan deactivated' : 'Plan activated');
            await loadPlans();
            router.refresh();
        } catch (err: any) {
            toast.error(err.message || 'Toggle failed');
        }
    };

    const startCreate = () => {
        setIsCreating(true);
        setEditingPlan({ ...emptyPlan, id: '', createdAt: '' } as Plan);
        setFeatureInput('');
    };

    const startEdit = (plan: Plan) => {
        setIsCreating(false);
        setEditingPlan({ ...plan });
        setFeatureInput('');
    };

    const addFeature = () => {
        if (!featureInput.trim() || !editingPlan) return;
        setEditingPlan({
            ...editingPlan,
            features: [...editingPlan.features, featureInput.trim()],
        });
        setFeatureInput('');
    };

    const removeFeature = (idx: number) => {
        if (!editingPlan) return;
        setEditingPlan({
            ...editingPlan,
            features: editingPlan.features.filter((_, i) => i !== idx),
        });
    };

    const updateField = <K extends keyof Plan>(field: K, value: Plan[K]) => {
        if (!editingPlan) return;
        setEditingPlan({ ...editingPlan, [field]: value });
    };

    // ── Render ────────────────────────────────────────────────────────────────

    if (loading) {
        return (
            <div style={styles.page}>
                <div style={styles.inner}>
                    <div style={{ ...styles.skeletonBox, width: 200, height: 28 }} />
                    {[1, 2, 3].map(i => (
                        <div key={i} style={{ ...styles.card, height: 100, ...styles.skeletonBox, marginTop: 12 }} />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <>
            <Toaster position="top-center" />

            <div style={styles.page}>
                <div style={styles.inner}>

                    {/* Header */}
                    <div style={styles.header}>
                        <div style={styles.headerLeft}>
                            <Link href="/dashboard/admin" style={styles.backLink}>
                                <ArrowLeft size={14} />
                                <span>Admin</span>
                            </Link>
                            <h1 style={styles.pageTitle}>Subscription Plans</h1>
                            <p style={styles.pageSub}>
                                {plans.filter(p => p.isActive).length} active · {plans.length} total
                            </p>
                        </div>
                        <button style={styles.createBtn} onClick={startCreate}>
                            <Plus size={14} />
                            New Plan
                        </button>
                    </div>

                    {/* Plans List */}
                    {plans.map(plan => {
                        const Icon = tierIcon(plan.tier);
                        const tColor = tierColor(plan.tier);

                        return (
                            <div key={plan.id} style={{
                                ...styles.card,
                                opacity: plan.isActive ? 1 : 0.6,
                                borderColor: plan.isActive ? 'var(--line-strong)' : 'var(--line)',
                            }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                                    <div style={{ ...styles.planIcon, color: tColor }}>
                                        <Icon size={20} />
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                            <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--ink)' }}>
                                                {plan.name}
                                            </span>
                                            <span style={{
                                                fontFamily: 'var(--mono)', fontSize: '0.58rem',
                                                textTransform: 'uppercase', letterSpacing: '0.08em',
                                                color: 'var(--ink-faint)',
                                            }}>
                                                {plan.tier}
                                            </span>
                                            {plan.highlight && (
                                                <span style={{
                                                    background: 'var(--accent-l)', color: 'var(--accent)',
                                                    border: '1px solid var(--accent)', opacity: 0.9,
                                                    borderRadius: 6, padding: '1px 8px',
                                                    fontFamily: 'var(--mono)', fontSize: '0.55rem', fontWeight: 700,
                                                }}>
                                                    {plan.highlight}
                                                </span>
                                            )}
                                            {!plan.isActive && (
                                                <span style={{
                                                    background: 'var(--red-l)', color: 'var(--red)',
                                                    border: '1px solid var(--red)', opacity: 0.85,
                                                    borderRadius: 6, padding: '1px 8px',
                                                    fontFamily: 'var(--mono)', fontSize: '0.55rem', fontWeight: 700,
                                                }}>
                                                    Inactive
                                                </span>
                                            )}
                                        </div>

                                        <div style={{
                                            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                                            gap: 8, marginTop: 10,
                                        }}>
                                            <div>
                                                <span style={styles.metricLabel}>Price</span>
                                                <span style={styles.metricValue}>{fmtUsd(plan.price)}</span>
                                            </div>
                                            <div>
                                                <span style={styles.metricLabel}>Min. investment</span>
                                                <span style={styles.metricValue}>{fmtUsd(plan.minInvestment)}</span>
                                            </div>
                                            <div>
                                                <span style={styles.metricLabel}>Weekly return</span>
                                                <span style={{ ...styles.metricValue, color: 'var(--green)' }}>
                                                    +{plan.weeklyReturnRate.toFixed(2)}%
                                                </span>
                                            </div>
                                            <div>
                                                <span style={styles.metricLabel}>Interval</span>
                                                <span style={styles.metricValue}>{plan.interval}</span>
                                            </div>
                                        </div>

                                        <p style={{ fontSize: '0.78rem', color: 'var(--ink-dim)', marginTop: 8, lineHeight: 1.5 }}>
                                            {plan.description}
                                        </p>

                                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                                            {plan.features.map((f, i) => (
                                                <span key={i} style={{
                                                    fontFamily: 'var(--mono)', fontSize: '0.6rem',
                                                    color: 'var(--ink-dim)', background: 'var(--surface)',
                                                    border: '1px solid var(--line-strong)', borderRadius: 6,
                                                    padding: '3px 8px',
                                                }}>
                                                    {f}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
                                        <button style={styles.iconBtn} onClick={() => startEdit(plan)} title="Edit">
                                            <Edit2 size={14} />
                                        </button>
                                        <button style={styles.iconBtn} onClick={() => toggleActive(plan)} title={plan.isActive ? 'Deactivate' : 'Activate'}>
                                            {plan.isActive ? <XCircle size={14} color="var(--red)" /> : <CheckCircle2 size={14} color="var(--green)" />}
                                        </button>
                                        <button style={styles.iconBtn} onClick={() => deletePlan(plan.id)} title="Delete">
                                            <Trash2 size={14} color="var(--red)" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    <div style={{ height: 40 }} />
                </div>
            </div>

            {/* Edit/Create Modal */}
            {editingPlan && (
                <div className="modal-overlay" onClick={() => { setEditingPlan(null); setIsCreating(false); }}>
                    <div className="modal-card" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">{isCreating ? 'New Plan' : 'Edit Plan'}</h3>
                            <button className="modal-close" onClick={() => { setEditingPlan(null); setIsCreating(false); }}>
                                <X size={16} />
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <div style={styles.fieldRow}>
                                <label style={styles.label}>Name</label>
                                <input
                                    style={styles.input}
                                    value={editingPlan.name}
                                    onChange={e => updateField('name', e.target.value)}
                                    placeholder="e.g. Growth"
                                />
                            </div>

                            <div style={styles.fieldRow}>
                                <label style={styles.label}>Tier</label>
                                <select
                                    style={styles.input}
                                    value={editingPlan.tier}
                                    onChange={e => updateField('tier', e.target.value)}
                                >
                                    <option value="basic">Basic</option>
                                    <option value="advanced">Advanced</option>
                                    <option value="platinum">Platinum</option>
                                </select>
                            </div>

                            <div style={styles.fieldRow}>
                                <label style={styles.label}>Description</label>
                                <input
                                    style={styles.input}
                                    value={editingPlan.description}
                                    onChange={e => updateField('description', e.target.value)}
                                    placeholder="What this plan offers..."
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                <div style={styles.fieldRow}>
                                    <label style={styles.label}>Price ($)</label>
                                    <input
                                        style={styles.input}
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={editingPlan.price}
                                        onChange={e => updateField('price', parseFloat(e.target.value) || 0)}
                                    />
                                </div>
                                <div style={styles.fieldRow}>
                                    <label style={styles.label}>Min Investment ($)</label>
                                    <input
                                        style={styles.input}
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={editingPlan.minInvestment}
                                        onChange={e => updateField('minInvestment', parseFloat(e.target.value) || 0)}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                <div style={styles.fieldRow}>
                                    <label style={styles.label}>Weekly Return (%)</label>
                                    <input
                                        style={styles.input}
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={editingPlan.weeklyReturnRate}
                                        onChange={e => updateField('weeklyReturnRate', parseFloat(e.target.value) || 0)}
                                    />
                                </div>
                                <div style={styles.fieldRow}>
                                    <label style={styles.label}>Interval</label>
                                    <select
                                        style={styles.input}
                                        value={editingPlan.interval}
                                        onChange={e => updateField('interval', e.target.value)}
                                    >
                                        <option value="DAILY">Daily</option>
                                        <option value="WEEKLY">Weekly</option>
                                        <option value="MONTHLY">Monthly</option>
                                    </select>
                                </div>
                            </div>

                            <div style={styles.fieldRow}>
                                <label style={styles.label}>Highlight Badge (optional)</label>
                                <input
                                    style={styles.input}
                                    value={editingPlan.highlight || ''}
                                    onChange={e => updateField('highlight', e.target.value || null)}
                                    placeholder="e.g. Most Popular"
                                />
                            </div>

                            <div style={styles.fieldRow}>
                                <label style={styles.label}>Features</label>
                                <div style={{ display: 'flex', gap: 6 }}>
                                    <input
                                        style={{ ...styles.input, flex: 1 }}
                                        value={featureInput}
                                        onChange={e => setFeatureInput(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                                        placeholder="Add feature..."
                                    />
                                    <button style={styles.addFeatureBtn} onClick={addFeature}>
                                        <Plus size={14} />
                                    </button>
                                </div>
                                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                                    {editingPlan.features.map((f, i) => (
                                        <span key={i} style={{
                                            display: 'flex', alignItems: 'center', gap: 4,
                                            fontFamily: 'var(--mono)', fontSize: '0.62rem',
                                            color: 'var(--ink-dim)', background: 'var(--surface)',
                                            border: '1px solid var(--line-strong)', borderRadius: 6,
                                            padding: '3px 8px',
                                        }}>
                                            {f}
                                            <button onClick={() => removeFeature(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--red)', display: 'flex' }}>
                                                <X size={10} />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                                <input
                                    type="checkbox"
                                    id="isActive"
                                    checked={editingPlan.isActive}
                                    onChange={e => updateField('isActive', e.target.checked)}
                                    style={{ accentColor: 'var(--accent)', width: 16, height: 16 }}
                                />
                                <label htmlFor="isActive" style={{ fontSize: '0.82rem', color: 'var(--ink-dim)', cursor: 'pointer' }}>
                                    Active (visible to users)
                                </label>
                            </div>
                        </div>

                        <div className="modal-actions" style={{ marginTop: 20 }}>
                            <button className="btn-secondary" onClick={() => { setEditingPlan(null); setIsCreating(false); }}>
                                Cancel
                            </button>
                            <button className="btn-primary" onClick={savePlan} disabled={saving}>
                                {saving ? <Loader2 className="spin" size={14} /> : <><Save size={14} /> Save</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes shimmer { to { background-position: -200% 0; } }

                .modal-overlay {
                    position: fixed; inset: 0;
                    background: rgba(0, 0, 0, 0.55);
                    display: flex; justify-content: center; align-items: center;
                    z-index: 100; padding: 16px;
                    backdrop-filter: blur(4px);
                }
                .modal-card {
                    background: var(--card);
                    border: 1px solid var(--line-strong);
                    border-radius: 14px; padding: 24px;
                    max-width: 480px; width: 100%;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                    max-height: 90vh; overflow-y: auto;
                }
                .modal-header {
                    display: flex; align-items: center; gap: 10px;
                    margin-bottom: 18px;
                }
                .modal-title {
                    font-size: 1.05rem; font-weight: 600; flex: 1;
                    color: var(--ink); font-family: var(--sans);
                }
                .modal-close {
                    background: none; border: none; cursor: pointer;
                    color: var(--ink-faint); padding: 4px; border-radius: 6px;
                    transition: 0.15s;
                }
                .modal-close:hover { color: var(--ink-dim); background: var(--surface); }
                .modal-actions {
                    display: flex; gap: 10px; margin-top: 16px;
                }
                .modal-actions button {
                    flex: 1; padding: 10px 14px; border-radius: 10px;
                    border: none; font-weight: 600; cursor: pointer;
                    transition: 0.15s; font-size: 0.82rem;
                    display: flex; justify-content: center; align-items: center; gap: 5px;
                    font-family: var(--sans);
                }
                .btn-secondary {
                    background: var(--surface); color: var(--ink-dim);
                    border: 1px solid var(--line-strong);
                }
                .btn-secondary:hover { background: var(--surface-hover); color: var(--ink); }
                .btn-primary {
                    background: var(--accent); color: var(--bg);
                }
                .btn-primary:hover { opacity: 0.9; }
                .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
            `}</style>
        </>
    );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
    page: {
        minHeight: '100vh',
        background: 'var(--bg)',
        padding: '20px 16px',
    },
    inner: {
        maxWidth: 900,
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
    },
    header: {
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    headerLeft: {
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
    },
    backLink: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        textDecoration: 'none',
        color: 'var(--ink-faint)',
        fontFamily: 'var(--mono)',
        fontSize: '0.6rem',
        letterSpacing: '0.1em',
        textTransform: 'uppercase' as const,
        marginBottom: 10,
        transition: '0.15s',
    },
    pageTitle: {
        fontFamily: 'var(--sans)',
        fontSize: '1.45rem',
        fontWeight: 700,
        color: 'var(--ink)',
    },
    pageSub: {
        fontFamily: 'var(--mono)',
        fontSize: '0.62rem',
        color: 'var(--ink-faint)',
        letterSpacing: '0.08em',
        marginTop: 4,
    },
    createBtn: {
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        background: 'var(--accent)',
        color: 'var(--bg)',
        border: 'none',
        borderRadius: 10,
        padding: '10px 16px',
        fontFamily: 'var(--sans)',
        fontSize: '0.82rem',
        fontWeight: 600,
        cursor: 'pointer',
        transition: '0.15s',
    },
    skeletonBox: {
        background: 'linear-gradient(90deg, var(--bg-3) 25%, var(--card) 50%, var(--bg-3) 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.4s infinite',
        borderRadius: 10,
    },
    card: {
        background: 'var(--card)',
        border: '1px solid var(--line-strong)',
        borderRadius: 14,
        padding: '18px',
        transition: '0.15s',
    },
    planIcon: {
        width: 40,
        height: 40,
        borderRadius: 10,
        background: 'var(--surface)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexShrink: 0,
    },
    metricLabel: {
        display: 'block',
        fontFamily: 'var(--mono)',
        fontSize: '0.55rem',
        letterSpacing: '0.1em',
        textTransform: 'uppercase' as const,
        color: 'var(--ink-faint)',
        marginBottom: 2,
    },
    metricValue: {
        display: 'block',
        fontFamily: 'var(--mono)',
        fontSize: '0.88rem',
        fontWeight: 700,
        color: 'var(--ink)',
        fontVariantNumeric: 'tabular-nums',
    },
    iconBtn: {
        background: 'var(--surface)',
        border: '1px solid var(--line-strong)',
        borderRadius: 8,
        padding: '7px',
        cursor: 'pointer',
        color: 'var(--ink-dim)',
        transition: '0.15s',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    fieldRow: {
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
    },
    label: {
        fontFamily: 'var(--mono)',
        fontSize: '0.58rem',
        letterSpacing: '0.1em',
        textTransform: 'uppercase' as const,
        color: 'var(--ink-faint)',
    },
    input: {
        background: 'var(--bg)',
        border: '1px solid var(--line-strong)',
        borderRadius: 8,
        padding: '9px 12px',
        color: 'var(--ink)',
        fontFamily: 'var(--sans)',
        fontSize: '0.85rem',
        outline: 'none',
        transition: '0.15s',
    },
    addFeatureBtn: {
        background: 'var(--accent)',
        color: 'var(--bg)',
        border: 'none',
        borderRadius: 8,
        padding: '9px 12px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: '0.15s',
    },
};
