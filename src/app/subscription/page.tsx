'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Toaster, toast } from 'react-hot-toast';
import {
    ArrowLeft,
    Shield,
    Zap,
    Crown,
    Loader2,
    CheckCircle2,
    Wallet,
    TrendingUp,
    ArrowUpRight,
    X,
    AlertTriangle,
    ChevronRight,
    Sparkles,
    BarChart3,
    Lock,
    Unlock
} from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────────────

type PlanTier = 'basic' | 'advanced' | 'platinum';

type Plan = {
    id: string;
    name: string;
    tier: PlanTier;
    description: string;
    price: number;           // weekly subscription fee
    minInvestment: number;   // minimum capital required
    weeklyReturnRate: number; // expected weekly return %
    interval: string;
    features: string[];
    isActive: boolean;
    highlight?: string;      // e.g. "Best for beginners"
};

type UserSubscription = {
    id: string;
    planId: string;
    status: 'active' | 'cancelled' | 'expired' | 'pending';
    currentPeriodEnd: string;
    autoRenew: boolean;
    plan: {
        name: string;
        tier: PlanTier;
        price: number;
        interval: string;
    };
};

// ─── Helpers ───────────────────────────────────────────────────────

const money = (value: number) =>
    value.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

const pct = (value: number) =>
    `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;

const tierIcon = (tier: PlanTier) => {
    switch (tier) {
        case 'basic': return Shield;
        case 'advanced': return Zap;
        case 'platinum': return Crown;
    }
};

const tierColor = (tier: PlanTier) => {
    switch (tier) {
        case 'basic': return 'var(--kimi-color-text-secondary)';
        case 'advanced': return 'var(--kimi-color-accent)';
        case 'platinum': return 'var(--kimi-color-warning)';
    }
};

// ─── Component ─────────────────────────────────────────────────────

export default function SubscriptionPage() {
    const router = useRouter();

    const [plans, setPlans] = useState<Plan[]>([]);
    const [subscription, setSubscription] = useState<UserSubscription | null>(null);
    const [portfolioBalance, setPortfolioBalance] = useState(0);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState<string | null>(null);
    const [confirmAction, setConfirmAction] = useState<{
        type: 'cancel' | 'upgrade' | 'downgrade';
        plan?: Plan;
    } | null>(null);

    // ─── Data Loading ──────────────────────────────────────────────

    const loadPage = useCallback(async () => {
        try {
            const [plansRes, subRes, assetsRes] = await Promise.all([
                fetch('/api/subscriptions/plans'),
                fetch('/api/subscriptions/mine'),
                fetch('/api/assets')
            ]);

            if (plansRes.ok) setPlans(await plansRes.json());
            if (subRes.ok) setSubscription(await subRes.json());
            if (assetsRes.ok) {
                const data = await assetsRes.json();
                setPortfolioBalance(data.portfolioBalance ?? 0);
            }
        } catch (err) {
            console.error(err);
            toast.error('Unable to load subscription data.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadPage(); }, [loadPage]);

    // ─── Actions ─────────────────────────────────────────────────────

    const activatePlan = async (plan: Plan) => {
        setProcessing(plan.id);
        try {
            const res = await fetch('/api/subscriptions/activate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ planId: plan.id })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            toast.success(`${plan.name} activated successfully`);
            await loadPage();
            router.refresh();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Activation failed');
        } finally {
            setProcessing(null);
        }
    };

    const cancelSubscription = async () => {
        if (!subscription) return;
        setProcessing(subscription.planId);
        try {
            const res = await fetch('/api/subscriptions/cancel', { method: 'POST' });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            toast.success('Subscription cancelled');
            await loadPage();
            router.refresh();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Cancellation failed');
        } finally {
            setProcessing(null);
            setConfirmAction(null);
        }
    };

    const upgradePlan = async (plan: Plan) => {
        setProcessing(plan.id);
        try {
            const res = await fetch('/api/subscriptions/upgrade', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ planId: plan.id })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            toast.success(`Upgraded to ${plan.name}`);
            await loadPage();
            router.refresh();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Upgrade failed');
        } finally {
            setProcessing(null);
            setConfirmAction(null);
        }
    };

    // ─── Derived State ───────────────────────────────────────────────

    const currentPlan = useMemo(() =>
        plans.find(p => p.id === subscription?.planId),
        [plans, subscription]
    );

    const tierOrder: PlanTier[] = ['basic', 'advanced', 'platinum'];

    const getPlanAction = (plan: Plan): {
        label: string;
        variant: 'current' | 'upgrade' | 'downgrade' | 'activate' | 'disabled';
        handler?: () => void;
    } => {
        const isCurrent = subscription?.planId === plan.id && subscription?.status === 'active';
        const insufficient = portfolioBalance < plan.price;

        if (isCurrent) {
            return { label: 'Current Plan', variant: 'current' };
        }

        if (insufficient) {
            return { label: 'Insufficient Balance', variant: 'disabled' };
        }

        if (!subscription || subscription.status !== 'active') {
            return { label: 'Activate Plan', variant: 'activate', handler: () => activatePlan(plan) };
        }

        const currentTierIdx = tierOrder.indexOf(currentPlan?.tier ?? 'basic');
        const planTierIdx = tierOrder.indexOf(plan.tier);

        if (planTierIdx > currentTierIdx) {
            return {
                label: 'Upgrade',
                variant: 'upgrade',
                handler: () => setConfirmAction({ type: 'upgrade', plan })
            };
        }

        if (planTierIdx < currentTierIdx) {
            return {
                label: 'Downgrade',
                variant: 'downgrade',
                handler: () => setConfirmAction({ type: 'downgrade', plan })
            };
        }

        return { label: 'Activate Plan', variant: 'activate', handler: () => activatePlan(plan) };
    };

    const projectedWeeklyReturn = useMemo(() => {
        if (!currentPlan) return 0;
        return portfolioBalance * (currentPlan.weeklyReturnRate / 100);
    }, [currentPlan, portfolioBalance]);

    // ─── Render ──────────────────────────────────────────────────────

    if (loading) {
        return (
            <div className="sub-loading">
                <Loader2 className="spin" size={28} />
            </div>
        );
    }

    return (
        <>
            <Toaster position="top-center" />

            {/* Confirmation Modal */}
            {confirmAction && (
                <div className="modal-overlay" onClick={() => setConfirmAction(null)}>
                    <div className="modal-card" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <AlertTriangle size={20} />
                            <h3>
                                {confirmAction.type === 'cancel' && 'Cancel subscription?'}
                                {confirmAction.type === 'upgrade' && `Upgrade to ${confirmAction.plan?.name}?`}
                                {confirmAction.type === 'downgrade' && `Downgrade to ${confirmAction.plan?.name}?`}
                            </h3>
                            <button className="modal-close" onClick={() => setConfirmAction(null)}>
                                <X size={18} />
                            </button>
                        </div>
                        <p className="modal-body">
                            {confirmAction.type === 'cancel' &&
                                'Your current plan will remain active until the end of the billing period. You can reactivate anytime.'}
                            {confirmAction.type === 'upgrade' &&
                                `You'll be charged the prorated difference immediately. Your new weekly return rate will be ${pct(confirmAction.plan?.weeklyReturnRate ?? 0)}.`}
                            {confirmAction.type === 'downgrade' &&
                                `Your new plan will take effect at the next billing cycle. Your weekly return rate will adjust to ${pct(confirmAction.plan?.weeklyReturnRate ?? 0)}.`}
                        </p>
                        <div className="modal-actions">
                            <button className="btn-secondary" onClick={() => setConfirmAction(null)}>
                                Keep Current
                            </button>
                            <button
                                className={confirmAction.type === 'cancel' ? 'btn-danger' : 'btn-primary'}
                                onClick={() => {
                                    if (confirmAction.type === 'cancel') cancelSubscription();
                                    else if (confirmAction.plan) upgradePlan(confirmAction.plan);
                                }}
                                disabled={processing !== null}
                            >
                                {processing !== null ? (
                                    <Loader2 className="spin" size={15} />
                                ) : confirmAction.type === 'cancel' ? (
                                    'Confirm Cancel'
                                ) : (
                                    'Confirm Change'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="sub-wrap">
                <div className="sub-inner">

                    {/* Header */}
                    <div className="sub-header">
                        <Link href="/dashboard" className="back-link">
                            <ArrowLeft size={16} />
                            Dashboard
                        </Link>
                        <h1 className="sub-title">Investment Subscriptions</h1>
                        <p className="sub-description">
                            Choose a tier that matches your capital and risk appetite.
                            Weekly returns are projected based on your portfolio balance.
                        </p>
                    </div>

                    {/* Summary Cards */}
                    <div className="summary-grid">
                        <div className="summary-card">
                            <div className="summary-label">
                                <Wallet size={16} />
                                Portfolio Balance
                            </div>
                            <div className="summary-value">${money(portfolioBalance)}</div>
                            <div className="summary-small">
                                Subscription fees are deducted from your balance weekly.
                            </div>
                        </div>

                        <div className="summary-card">
                            <div className="summary-label">
                                <CheckCircle2 size={16} />
                                Current Plan
                            </div>
                            {subscription && subscription.status === 'active' ? (
                                <>
                                    <div className="summary-value">{subscription.plan.name}</div>
                                    <div className="summary-small">
                                        {subscription.autoRenew
                                            ? `Renews ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`
                                            : `Ends ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`}
                                    </div>
                                    {subscription.autoRenew && (
                                        <button
                                            className="cancel-btn"
                                            onClick={() => setConfirmAction({ type: 'cancel' })}
                                            disabled={processing === subscription.planId}
                                        >
                                            {processing === subscription.planId ? (
                                                <Loader2 className="spin" size={15} />
                                            ) : (
                                                'Cancel Subscription'
                                            )}
                                        </button>
                                    )}
                                </>
                            ) : (
                                <>
                                    <div className="summary-value">No Active Plan</div>
                                    <div className="summary-small">
                                        Choose a tier below to start earning weekly returns.
                                    </div>
                                </>
                            )}
                        </div>

                        {currentPlan && (
                            <div className="summary-card highlight">
                                <div className="summary-label">
                                    <TrendingUp size={16} />
                                    Projected Weekly Return
                                </div>
                                <div className="summary-value" style={{ color: 'var(--kimi-color-positive)' }}>
                                    +${money(projectedWeeklyReturn)}
                                </div>
                                <div className="summary-small">
                                    Based on {pct(currentPlan.weeklyReturnRate)} weekly rate
                                    on your ${money(portfolioBalance)} balance.
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Plans Grid */}
                    <div className="plans-section">
                        <h2 className="section-title">
                            <Sparkles size={18} />
                            Available Tiers
                        </h2>

                        <div className="plans-grid">
                            {plans.map(plan => {
                                const action = getPlanAction(plan);
                                const Icon = tierIcon(plan.tier);
                                const tColor = tierColor(plan.tier);
                                const isRecommended = plan.highlight?.toLowerCase().includes('popular');

                                return (
                                    <div
                                        key={plan.id}
                                        className={`plan-card ${action.variant === 'current' ? 'current' : ''} ${isRecommended ? 'recommended' : ''}`}
                                    >
                                        {isRecommended && (
                                            <div className="recommended-badge">Most Popular</div>
                                        )}

                                        <div className="plan-header">
                                            <div className="plan-icon" style={{ color: tColor }}>
                                                <Icon size={24} />
                                            </div>
                                            <div className="plan-meta">
                                                <h3 className="plan-title">{plan.name}</h3>
                                                <span className="plan-tier-label">{plan.tier}</span>
                                            </div>
                                        </div>

                                        <div className="plan-returns">
                                            <div className="return-block">
                                                <span className="return-label">Weekly return</span>
                                                <span className="return-value" style={{ color: 'var(--kimi-color-positive)' }}>
                                                    {pct(plan.weeklyReturnRate)}
                                                </span>
                                            </div>
                                            <div className="return-block">
                                                <span className="return-label">Min. investment</span>
                                                <span className="return-value">${money(plan.minInvestment)}</span>
                                            </div>
                                        </div>

                                        <div className="plan-price-block">
                                            <span className="plan-price">${money(plan.price)}</span>
                                            <span className="plan-interval">/{plan.interval.toLowerCase()}</span>
                                        </div>

                                        <p className="plan-description">{plan.description}</p>

                                        <ul className="feature-list">
                                            {plan.features.map((feature, idx) => (
                                                <li key={`${plan.id}-f-${idx}`}>
                                                    <CheckCircle2 size={14} className="feature-icon" />
                                                    {feature}
                                                </li>
                                            ))}
                                        </ul>

                                        <button
                                            onClick={action.handler}
                                            disabled={action.variant === 'current' || action.variant === 'disabled' || processing === plan.id}
                                            className={`plan-btn btn-${action.variant}`}
                                        >
                                            {processing === plan.id ? (
                                                <Loader2 className="spin" size={16} />
                                            ) : action.variant === 'upgrade' ? (
                                                <>
                                                    Upgrade <ArrowUpRight size={14} />
                                                </>
                                            ) : action.variant === 'downgrade' ? (
                                                <>
                                                    Downgrade <ChevronRight size={14} />
                                                </>
                                            ) : (
                                                action.label
                                            )}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Comparison Table */}
                    <div className="comparison-section">
                        <h2 className="section-title">
                            <BarChart3 size={18} />
                            Tier Comparison
                        </h2>
                        <div className="comparison-table-wrap">
                            <table className="comparison-table">
                                <thead>
                                    <tr>
                                        <th>Feature</th>
                                        {plans.map(plan => (
                                            <th key={plan.id} className={plan.tier}>
                                                {plan.name}
                                                {subscription?.planId === plan.id && (
                                                    <span className="current-tag">Current</span>
                                                )}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>Weekly fee</td>
                                        {plans.map(plan => (
                                            <td key={plan.id}>${money(plan.price)}</td>
                                        ))}
                                    </tr>
                                    <tr>
                                        <td>Min. investment</td>
                                        {plans.map(plan => (
                                            <td key={plan.id}>${money(plan.minInvestment)}</td>
                                        ))}
                                    </tr>
                                    <tr>
                                        <td>Expected weekly return</td>
                                        {plans.map(plan => (
                                            <td key={plan.id} className="positive">
                                                {pct(plan.weeklyReturnRate)}
                                            </td>
                                        ))}
                                    </tr>
                                    <tr>
                                        <td>Annualized (approx.)</td>
                                        {plans.map(plan => (
                                            <td key={plan.id} className="positive">
                                                {pct(plan.weeklyReturnRate * 52)}
                                            </td>
                                        ))}
                                    </tr>
                                    <tr>
                                        <td>Auto-trading</td>
                                        {plans.map(plan => (
                                            <td key={plan.id}>
                                                {plan.tier === 'basic' ? (
                                                    <Lock size={14} />
                                                ) : (
                                                    <Unlock size={14} className="positive" />
                                                )}
                                            </td>
                                        ))}
                                    </tr>
                                    <tr>
                                        <td>Priority support</td>
                                        {plans.map(plan => (
                                            <td key={plan.id}>
                                                {plan.tier === 'platinum' ? (
                                                    <CheckCircle2 size={14} className="positive" />
                                                ) : (
                                                    <span className="muted">—</span>
                                                )}
                                            </td>
                                        ))}
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>
            </div>

            <style jsx global>{`
                :root {
                    --radius: 12px;
                }

                .sub-wrap {
                    padding: 24px 24px 80px;
                    color: var(--kimi-color-text-primary);
                    font-family: var(--kimi-font-sans);
                    min-height: 100vh;
                }

                .sub-inner {
                    max-width: 1200px;
                    margin: 0 auto;
                }

                .sub-loading {
                    min-height: 100vh;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    color: var(--kimi-color-accent);
                }

                .spin {
                    animation: spin 0.8s linear infinite;
                }

                @keyframes spin {
                    to { transform: rotate(360deg); }
                }

                /* ---------- Modal ---------- */
                .modal-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.45);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 100;
                    padding: 20px;
                    backdrop-filter: blur(4px);
                }

                .modal-card {
                    background: var(--kimi-color-surface-raised);
                    border: 1px solid var(--kimi-color-border);
                    border-radius: 16px;
                    padding: 28px;
                    max-width: 440px;
                    width: 100%;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
                }

                .modal-header {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin-bottom: 16px;
                }

                .modal-header h3 {
                    font-size: 1.1rem;
                    font-weight: 500;
                    flex: 1;
                }

                .modal-header svg {
                    color: var(--kimi-color-warning);
                }

                .modal-close {
                    background: none;
                    border: none;
                    cursor: pointer;
                    color: var(--kimi-color-text-tertiary);
                    padding: 4px;
                    border-radius: 6px;
                    transition: 0.15s;
                }

                .modal-close:hover {
                    color: var(--kimi-color-text-primary);
                    background: var(--kimi-color-surface-muted);
                }

                .modal-body {
                    color: var(--kimi-color-text-secondary);
                    line-height: 1.6;
                    font-size: 0.92rem;
                    margin-bottom: 24px;
                }

                .modal-actions {
                    display: flex;
                    gap: 12px;
                }

                .modal-actions button {
                    flex: 1;
                    padding: 12px 16px;
                    border-radius: 10px;
                    border: none;
                    font-weight: 500;
                    cursor: pointer;
                    transition: 0.15s;
                    font-size: 0.9rem;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    gap: 6px;
                }

                .btn-secondary {
                    background: var(--kimi-color-surface-muted);
                    color: var(--kimi-color-text-primary);
                }

                .btn-secondary:hover {
                    background: var(--kimi-color-surface-strong);
                }

                .btn-primary {
                    background: var(--kimi-color-text-primary);
                    color: var(--kimi-color-surface);
                }

                .btn-primary:hover {
                    opacity: 0.9;
                }

                .btn-danger {
                    background: color-mix(in srgb, var(--kimi-color-danger) 12%, transparent);
                    color: var(--kimi-color-danger);
                }

                .btn-danger:hover {
                    background: var(--kimi-color-danger);
                    color: white;
                }

                /* ---------- Header ---------- */
                .sub-header {
                    margin-bottom: 32px;
                }

                .back-link {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    text-decoration: none;
                    color: var(--kimi-color-text-tertiary);
                    font-family: var(--kimi-font-mono);
                    font-size: 0.72rem;
                    margin-bottom: 20px;
                    transition: 0.15s;
                }

                .back-link:hover {
                    color: var(--kimi-color-text-primary);
                }

                .sub-title {
                    font-size: 1.75rem;
                    font-weight: 500;
                    color: var(--kimi-color-text-primary);
                    letter-spacing: 0;
                }

                .sub-description {
                    margin-top: 8px;
                    max-width: 560px;
                    color: var(--kimi-color-text-secondary);
                    line-height: 1.6;
                    font-size: 0.92rem;
                }

                /* ---------- Section Title ---------- */
                .section-title {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 1.05rem;
                    font-weight: 500;
                    color: var(--kimi-color-text-primary);
                    margin-bottom: 20px;
                    margin-top: 40px;
                }

                .section-title svg {
                    color: var(--kimi-color-text-tertiary);
                }

                /* ---------- Summary ---------- */
                .summary-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                    gap: 16px;
                    margin-bottom: 8px;
                }

                .summary-card {
                    background: var(--kimi-color-surface);
                    border: 1px solid var(--kimi-color-border);
                    border-radius: 14px;
                    padding: 22px;
                    transition: 0.2s;
                }

                .summary-card.highlight {
                    border-color: color-mix(in srgb, var(--kimi-color-positive) 25%, var(--kimi-color-border));
                    background: color-mix(in srgb, var(--kimi-color-positive) 4%, var(--kimi-color-surface));
                }

                .summary-label {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    color: var(--kimi-color-text-tertiary);
                    font-size: 0.72rem;
                    text-transform: uppercase;
                    letter-spacing: 0.06em;
                    font-family: var(--kimi-font-mono);
                }

                .summary-value {
                    margin-top: 12px;
                    font-size: 1.7rem;
                    font-weight: 500;
                    color: var(--kimi-color-text-primary);
                    font-variant-numeric: tabular-nums;
                    font-feature-settings: "tnum" 1;
                }

                .summary-small {
                    margin-top: 8px;
                    color: var(--kimi-color-text-tertiary);
                    line-height: 1.5;
                    font-size: 0.8rem;
                }

                .cancel-btn {
                    margin-top: 16px;
                    border: none;
                    background: color-mix(in srgb, var(--kimi-color-danger) 10%, transparent);
                    color: var(--kimi-color-danger);
                    padding: 9px 16px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 500;
                    font-size: 0.82rem;
                    transition: 0.15s;
                }

                .cancel-btn:hover {
                    background: var(--kimi-color-danger);
                    color: white;
                }

                /* ---------- Plans ---------- */
                .plans-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
                    gap: 20px;
                }

                .plan-card {
                    position: relative;
                    display: flex;
                    flex-direction: column;
                    background: var(--kimi-color-surface);
                    border: 1px solid var(--kimi-color-border);
                    border-radius: 16px;
                    padding: 26px;
                    transition: 0.2s;
                }

                .plan-card:hover {
                    border-color: var(--kimi-color-text-secondary);
                    transform: translateY(-3px);
                }

                .plan-card.recommended {
                    border: 2px solid var(--kimi-color-accent);
                }

                .plan-card.current {
                    border-color: var(--kimi-color-positive);
                    background: color-mix(in srgb, var(--kimi-color-positive) 3%, var(--kimi-color-surface));
                }

                .recommended-badge {
                    position: absolute;
                    top: 14px;
                    right: 14px;
                    background: var(--kimi-color-accent);
                    color: white;
                    padding: 4px 10px;
                    border-radius: 999px;
                    font-size: 0.6rem;
                    font-family: var(--kimi-font-mono);
                    letter-spacing: 0.06em;
                    font-weight: 500;
                }

                .plan-header {
                    display: flex;
                    align-items: center;
                    gap: 14px;
                    margin-bottom: 20px;
                }

                .plan-icon {
                    width: 48px;
                    height: 48px;
                    border-radius: 12px;
                    background: var(--kimi-color-surface-muted);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }

                .plan-meta {
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                }

                .plan-title {
                    font-size: 1.15rem;
                    font-weight: 500;
                    color: var(--kimi-color-text-primary);
                }

                .plan-tier-label {
                    font-size: 0.7rem;
                    text-transform: uppercase;
                    letter-spacing: 0.08em;
                    color: var(--kimi-color-text-quaternary);
                    font-family: var(--kimi-font-mono);
                }

                .plan-returns {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 12px;
                    margin-bottom: 16px;
                    padding: 14px;
                    background: var(--kimi-color-surface-muted);
                    border-radius: 10px;
                }

                .return-block {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }

                .return-label {
                    font-size: 0.7rem;
                    color: var(--kimi-color-text-quaternary);
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    font-family: var(--kimi-font-mono);
                }

                .return-value {
                    font-size: 1.1rem;
                    font-weight: 500;
                    color: var(--kimi-color-text-primary);
                    font-variant-numeric: tabular-nums;
                }

                .plan-price-block {
                    display: flex;
                    align-items: baseline;
                    gap: 6px;
                    margin-bottom: 12px;
                }

                .plan-price {
                    font-size: 1.8rem;
                    font-weight: 500;
                    color: var(--kimi-color-text-primary);
                    font-variant-numeric: tabular-nums;
                }

                .plan-interval {
                    font-size: 0.85rem;
                    color: var(--kimi-color-text-tertiary);
                }

                .plan-description {
                    color: var(--kimi-color-text-secondary);
                    line-height: 1.6;
                    font-size: 0.88rem;
                    min-height: 44px;
                }

                /* ---------- Features ---------- */
                .feature-list {
                    margin: 20px 0;
                    padding: 0;
                    list-style: none;
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }

                .feature-list li {
                    display: flex;
                    align-items: flex-start;
                    gap: 8px;
                    color: var(--kimi-color-text-secondary);
                    line-height: 1.4;
                    font-size: 0.85rem;
                }

                .feature-icon {
                    color: var(--kimi-color-positive);
                    margin-top: 2px;
                    flex-shrink: 0;
                }

                /* ---------- Buttons ---------- */
                .plan-btn {
                    margin-top: auto;
                    width: 100%;
                    border: none;
                    border-radius: 10px;
                    padding: 13px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: 0.15s;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    gap: 6px;
                    font-size: 0.9rem;
                }

                .plan-btn:disabled {
                    cursor: not-allowed;
                    opacity: 0.6;
                }

                .btn-activate {
                    background: var(--kimi-color-text-primary);
                    color: var(--kimi-color-surface);
                }

                .btn-activate:hover:not(:disabled) {
                    opacity: 0.9;
                }

                .btn-upgrade {
                    background: var(--kimi-color-accent);
                    color: white;
                }

                .btn-upgrade:hover:not(:disabled) {
                    opacity: 0.9;
                }

                .btn-downgrade {
                    background: var(--kimi-color-surface-muted);
                    color: var(--kimi-color-text-primary);
                    border: 1px solid var(--kimi-color-border);
                }

                .btn-downgrade:hover:not(:disabled) {
                    background: var(--kimi-color-surface-strong);
                }

                .btn-current {
                    background: color-mix(in srgb, var(--kimi-color-positive) 12%, transparent);
                    color: var(--kimi-color-positive);
                    cursor: default;
                }

                .btn-disabled {
                    background: var(--kimi-color-surface-muted);
                    color: var(--kimi-color-text-quaternary);
                    cursor: not-allowed;
                }

                /* ---------- Comparison Table ---------- */
                .comparison-section {
                    margin-top: 48px;
                }

                .comparison-table-wrap {
                    overflow-x: auto;
                    border: 1px solid var(--kimi-color-border);
                    border-radius: 14px;
                    background: var(--kimi-color-surface);
                }

                .comparison-table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 0.88rem;
                }

                .comparison-table th,
                .comparison-table td {
                    padding: 14px 18px;
                    text-align: left;
                    border-bottom: 1px solid var(--kimi-color-border);
                }

                .comparison-table th {
                    font-weight: 500;
                    color: var(--kimi-color-text-primary);
                    background: var(--kimi-color-surface-muted);
                    font-size: 0.85rem;
                    position: relative;
                }

                .comparison-table th.basic { color: var(--kimi-color-text-secondary); }
                .comparison-table th.advanced { color: var(--kimi-color-accent); }
                .comparison-table th.platinum { color: var(--kimi-color-warning); }

                .current-tag {
                    display: inline-block;
                    margin-left: 6px;
                    background: color-mix(in srgb, var(--kimi-color-positive) 15%, transparent);
                    color: var(--kimi-color-positive);
                    padding: 2px 8px;
                    border-radius: 6px;
                    font-size: 0.65rem;
                    font-family: var(--kimi-font-mono);
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }

                .comparison-table td {
                    color: var(--kimi-color-text-secondary);
                }

                .comparison-table td.positive {
                    color: var(--kimi-color-positive);
                    font-weight: 500;
                }

                .comparison-table td .muted {
                    color: var(--kimi-color-text-quaternary);
                }

                .comparison-table tr:last-child td,
                .comparison-table tr:last-child th {
                    border-bottom: none;
                }

                /* ---------- Responsive ---------- */
                @media (max-width: 768px) {
                    .sub-wrap {
                        padding: 16px;
                    }

                    .sub-title {
                        font-size: 1.4rem;
                    }

                    .summary-value {
                        font-size: 1.4rem;
                    }

                    .plan-card {
                        padding: 20px;
                    }

                    .modal-actions {
                        flex-direction: column;
                    }

                    .comparison-table th,
                    .comparison-table td {
                        padding: 10px 12px;
                        font-size: 0.8rem;
                    }
                }
            `}</style>
        </>
    );
}
