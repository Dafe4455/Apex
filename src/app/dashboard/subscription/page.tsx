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
    Unlock,
    RefreshCw,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

type PlanTier = 'basic' | 'advanced' | 'platinum';

type Plan = {
    id: string;
    name: string;
    tier: PlanTier;
    description: string;
    price: number;
    minInvestment: number;
    weeklyReturnRate: number;
    interval: string;
    features: string[];
    isActive: boolean;
    highlight?: string;
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
    pendingPlan?: {
        name: string;
        tier: PlanTier;
        price: number;
    } | null;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmtUsd = (n: number, decimals = 2) =>
    new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    }).format(n);

const pct = (value: number) =>
    `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;

const normalizeTier = (tier: string): PlanTier => {
    const t = tier.toLowerCase().trim();
    if (t === 'basic' || t === 'starter') return 'basic';
    if (t === 'advanced' || t === 'growth' || t === 'pro') return 'advanced';
    if (t === 'platinum' || t === 'elite' || t === 'premium') return 'platinum';
    return 'basic';
};

const tierIcon = (tier: PlanTier) => {
    switch (tier) {
        case 'basic': return Shield;
        case 'advanced': return Zap;
        case 'platinum': return Crown;
    }
};

const tierColor = (tier: PlanTier) => {
    switch (tier) {
        case 'basic': return 'var(--ink-faint)';
        case 'advanced': return 'var(--accent)';
        case 'platinum': return 'var(--gold)';
    }
};

const tierOrder: PlanTier[] = ['basic', 'advanced', 'platinum'];

// ── Component ─────────────────────────────────────────────────────────────────

export default function SubscriptionPage() {
    const router = useRouter();

    const [plans, setPlans] = useState<Plan[]>([]);
    const [subscription, setSubscription] = useState<UserSubscription | null>(null);
    const [portfolioBalance, setPortfolioBalance] = useState(0);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [processing, setProcessing] = useState<string | null>(null);
    const [confirmAction, setConfirmAction] = useState<{
        type: 'cancel' | 'upgrade' | 'downgrade';
        plan?: Plan;
    } | null>(null);

    // ─── Data Loading ────────────────────────────────────────────────────────

    const loadPage = useCallback(async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        try {
            const [plansRes, subRes, assetsRes] = await Promise.all([
                fetch('/api/subscriptions/plans'),
                fetch('/api/subscriptions/mine'),
                fetch('/api/assets'),
            ]);

            if (plansRes.ok) {
                const rawPlans = await plansRes.json();
                // Normalize tier casing from DB
                setPlans(rawPlans.map((p: any) => ({
                    ...p,
                    tier: normalizeTier(p.tier || 'basic'),
                    features: Array.isArray(p.features) ? p.features : (p.features ? JSON.parse(p.features) : []),
                })));
            }
            if (subRes.ok) {
                const rawSub = await subRes.json();
                if (rawSub && rawSub.plan) {
                    rawSub.plan.tier = normalizeTier(rawSub.plan.tier);
                    if (rawSub.pendingPlan) {
                        rawSub.pendingPlan.tier = normalizeTier(rawSub.pendingPlan.tier);
                    }
                }
                setSubscription(rawSub);
            }
            if (assetsRes.ok) {
                const data = await assetsRes.json();
                setPortfolioBalance(data.portfolioBalance ?? 0);
            }
        } catch (err) {
            console.error(err);
            toast.error('Unable to load subscription data.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { loadPage(); }, [loadPage]);

    // ─── Actions ─────────────────────────────────────────────────────────────

    const activatePlan = async (plan: Plan) => {
        setProcessing(plan.id);
        try {
            const res = await fetch('/api/subscriptions/activate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ planId: plan.id }),
            });
            const data = await res.json();
            
            // Handle duplicate subscription (409) - it already exists, show success and refresh
            if (res.status === 409) {
                toast.success(`${plan.name} is already active`);
                // Wait a bit then refresh to show the active subscription
                setTimeout(() => {
                    loadPage();
                    router.refresh();
                }, 1000);
                return;
            }
            
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
        setProcessing('cancel');
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
                body: JSON.stringify({ planId: plan.id }),
            });
            const data = await res.json();
            
            // Handle duplicate subscription (409) - already upgrading, refresh and show success
            if (res.status === 409) {
                toast.success(`Already upgrading to ${plan.name}`);
                setTimeout(() => {
                    loadPage();
                    router.refresh();
                }, 1000);
                return;
            }
            
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

    const downgradePlan = async (plan: Plan) => {
        setProcessing(plan.id);
        try {
            const res = await fetch('/api/subscriptions/downgrade', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ planId: plan.id }),
            });
            const data = await res.json();
            
            // Handle duplicate subscription (409) - already downgrading, refresh and show success
            if (res.status === 409) {
                toast.success(`Already downgrading to ${plan.name}`);
                setTimeout(() => {
                    loadPage();
                    router.refresh();
                }, 1000);
                return;
            }
            
            if (!res.ok) throw new Error(data.error);
            toast.success(`Downgrade to ${plan.name} scheduled`);
            await loadPage();
            router.refresh();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Downgrade failed');
        } finally {
            setProcessing(null);
            setConfirmAction(null);
        }
    };

    // ─── Derived State ───────────────────────────────────────────────────────

    const currentPlan = useMemo(() =>
        plans.find(p => p.id === subscription?.planId),
        [plans, subscription]
    );

    const currentTier = useMemo(() =>
        normalizeTier(subscription?.plan?.tier || ''),
        [subscription]
    );

    const getPlanAction = (plan: Plan): {
        label: string;
        variant: 'current' | 'upgrade' | 'downgrade' | 'activate' | 'disabled' | 'pending';
        handler?: () => void;
    } => {
        const isCurrent = subscription?.planId === plan.id && subscription?.status === 'active';
        const isPendingDowngrade = subscription?.pendingPlan?.tier === plan.tier;
        const insufficient = portfolioBalance < plan.price;

        if (isCurrent) {
            return { label: 'Current Plan', variant: 'current' };
        }

        if (isPendingDowngrade) {
            return { label: 'Pending Downgrade', variant: 'pending' };
        }

        if (insufficient) {
            return { label: 'Insufficient Balance', variant: 'disabled' };
        }

        if (!subscription || subscription.status !== 'active') {
            return { label: 'Activate Plan', variant: 'activate', handler: () => activatePlan(plan) };
        }

        const currentTierIdx = tierOrder.indexOf(currentTier);
        const planTierIdx = tierOrder.indexOf(plan.tier);

        if (planTierIdx > currentTierIdx) {
            return {
                label: 'Upgrade',
                variant: 'upgrade',
                handler: () => setConfirmAction({ type: 'upgrade', plan }),
            };
        }

        if (planTierIdx < currentTierIdx) {
            return {
                label: 'Downgrade',
                variant: 'downgrade',
                handler: () => setConfirmAction({ type: 'downgrade', plan }),
            };
        }

        return { label: 'Activate Plan', variant: 'activate', handler: () => activatePlan(plan) };
    };

    const projectedWeeklyReturn = useMemo(() => {
        if (!currentPlan) return 0;
        return portfolioBalance * (currentPlan.weeklyReturnRate / 100);
    }, [currentPlan, portfolioBalance]);

    const hasActiveSubscription = subscription?.status === 'active';
    const hasAnyPlan = subscription?.status === 'active' || subscription?.status === 'cancelled';

    // ─── Render ────────────────────────────────────────────────────────────────

    if (loading) {
        return (
            <div style={styles.page}>
                <div style={styles.inner}>
                    <div style={styles.header}>
                        <div style={styles.headerLeft}>
                            <div style={{ ...styles.skeletonBox, width: 180, height: 24 }} />
                            <div style={{ ...styles.skeletonBox, width: 120, height: 14, marginTop: 6 }} />
                        </div>
                    </div>
                    {[1, 2, 3].map(i => (
                        <div key={i} style={{ ...styles.card, height: 180, ...styles.skeletonBox }} />
                    ))}
                </div>
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
                            <AlertTriangle size={18} color="var(--gold)" />
                            <h3 className="modal-title">
                                {confirmAction.type === 'cancel' && 'Cancel subscription?'}
                                {confirmAction.type === 'upgrade' && `Upgrade to ${confirmAction.plan?.name}?`}
                                {confirmAction.type === 'downgrade' && `Downgrade to ${confirmAction.plan?.name}?`}
                            </h3>
                            <button className="modal-close" onClick={() => setConfirmAction(null)}>
                                <X size={16} />
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
                                    else if (confirmAction.type === 'upgrade' && confirmAction.plan) upgradePlan(confirmAction.plan);
                                    else if (confirmAction.type === 'downgrade' && confirmAction.plan) downgradePlan(confirmAction.plan);
                                }}
                                disabled={processing !== null}
                            >
                                {processing !== null ? (
                                    <Loader2 className="spin" size={14} />
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

            <div style={styles.page}>
                <div style={styles.inner}>

                    {/* Header */}
                    <div style={styles.header}>
                        <div style={styles.headerLeft}>
                            <Link href="/dashboard" style={styles.backLink}>
                                <ArrowLeft size={14} />
                                <span>Dashboard</span>
                            </Link>
                            <h1 style={styles.pageTitle}>Investment Subscriptions</h1>
                            <p style={styles.pageSub}>
                                Choose a tier that matches your capital and risk appetite
                            </p>
                        </div>
                        <button
                            className="refresh-btn"
                            onClick={() => loadPage(true)}
                            disabled={refreshing}
                        >
                            <RefreshCw size={15} style={{ animation: refreshing ? 'spin 0.8s linear infinite' : 'none' }} />
                        </button>
                    </div>

                    {/* Summary Cards */}
                    <div className="summary-grid" style={styles.summaryGrid}>
                        <div style={styles.summaryCard}>
                            <span style={styles.summaryLabel}>
                                <Wallet size={13} style={{ marginRight: 6 }} />
                                Portfolio Balance
                            </span>
                            <span style={styles.summaryValue}>{fmtUsd(portfolioBalance)}</span>
                            <span style={styles.summarySmall}>
                                Subscription fees are deducted from your balance weekly
                            </span>
                        </div>

                        <div style={styles.summaryCard}>
                            <span style={styles.summaryLabel}>
                                <CheckCircle2 size={13} style={{ marginRight: 6 }} />
                                Current Subscription
                            </span>
                            {hasActiveSubscription ? (
                                <>
                                    <span style={styles.summaryValue}>{subscription.plan.name}</span>
                                    <span style={styles.summarySmall}>
                                        {subscription.autoRenew
                                            ? `Renews ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`
                                            : `Ends ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`}
                                        {subscription.pendingPlan && (
                                            <span style={{ color: 'var(--gold)', marginLeft: 8 }}>
                                                → {subscription.pendingPlan.name} pending
                                            </span>
                                        )}
                                    </span>
                                    {/* Cancel button always visible for active subscriptions */}
                                    <button
                                        className="cancel-btn"
                                        onClick={() => setConfirmAction({ type: 'cancel' })}
                                        disabled={processing === 'cancel'}
                                    >
                                        {processing === 'cancel' ? (
                                            <Loader2 className="spin" size={13} />
                                        ) : (
                                            'Cancel Subscription'
                                        )}
                                    </button>
                                </>
                            ) : (
                                <>
                                    <span style={styles.summaryValue}>No Active Plan</span>
                                    <span style={styles.summarySmall}>
                                        Choose a tier below to start earning weekly returns
                                    </span>
                                </>
                            )}
                        </div>

                        {currentPlan && (
                            <div style={{ ...styles.summaryCard, borderColor: 'var(--green)' }}>
                                <span style={styles.summaryLabel}>
                                    <TrendingUp size={13} style={{ marginRight: 6, color: 'var(--green)' }} />
                                    Projected Weekly Return
                                </span>
                                <span style={{ ...styles.summaryValue, color: 'var(--green)' }}>
                                    +{fmtUsd(projectedWeeklyReturn)}
                                </span>
                                <span style={styles.summarySmall}>
                                    Based on {pct(currentPlan.weeklyReturnRate)} weekly rate
                                    on your {fmtUsd(portfolioBalance)} balance
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Plans Section */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, marginBottom: 4 }}>
                        <Sparkles size={15} color="var(--ink-faint)" />
                        <span style={{
                            fontFamily: 'var(--mono)', fontSize: '0.62rem',
                            letterSpacing: '0.1em', textTransform: 'uppercase' as const,
                            color: 'var(--ink-faint)', fontWeight: 700,
                        }}>
                            Available Tiers
                        </span>
                    </div>

                    <div className="plans-grid" style={styles.plansGrid}>
                        {plans.map(plan => {
                            const action = getPlanAction(plan);
                            const Icon = tierIcon(plan.tier);
                            const tColor = tierColor(plan.tier);
                            const isRecommended = plan.highlight?.toLowerCase().includes('popular');

                            return (
                                <div
                                    key={plan.id}
                                    className={`plan-card ${isRecommended ? 'recommended' : ''} ${action.variant === 'current' ? 'current' : ''}`}
                                    style={styles.planCard}
                                >
                                    {isRecommended && (
                                        <div style={styles.recommendedBadge}>Most Popular</div>
                                    )}

                                    <div style={styles.planHeader}>
                                        <div style={{ ...styles.planIcon, color: tColor }}>
                                            <Icon size={22} />
                                        </div>
                                        <div>
                                            <h3 style={styles.planTitle}>{plan.name}</h3>
                                            <span style={styles.planTierLabel}>{plan.tier}</span>
                                        </div>
                                    </div>

                                    <div style={styles.planReturns}>
                                        <div style={styles.returnBlock}>
                                            <span style={styles.returnLabel}>Weekly return</span>
                                            <span style={{ ...styles.returnValue, color: 'var(--green)' }}>
                                                {pct(plan.weeklyReturnRate)}
                                            </span>
                                        </div>
                                        <div style={styles.returnBlock}>
                                            <span style={styles.returnLabel}>Min. investment</span>
                                            <span style={styles.returnValue}>{fmtUsd(plan.minInvestment)}</span>
                                        </div>
                                    </div>

                                    <div style={styles.planPriceBlock}>
                                        <span style={styles.planPrice}>{fmtUsd(plan.price)}</span>
                                        <span style={styles.planInterval}>/{plan.interval.toLowerCase()}</span>
                                    </div>

                                    <p style={styles.planDescription}>{plan.description}</p>

                                    <ul style={styles.featureList}>
                                        {plan.features.map((feature, idx) => (
                                            <li key={`${plan.id}-f-${idx}`} style={styles.featureItem}>
                                                <CheckCircle2 size={13} style={{ color: 'var(--green)', flexShrink: 0, marginTop: 2 }} />
                                                <span style={{ fontSize: '0.8rem', color: 'var(--ink-dim)', lineHeight: 1.4 }}>{feature}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    <button
                                        onClick={action.handler}
                                        disabled={action.variant === 'current' || action.variant === 'disabled' || action.variant === 'pending' || processing === plan.id}
                                        className={`plan-btn btn-${action.variant}`}
                                        style={styles.planBtn}
                                    >
                                        {processing === plan.id ? (
                                            <Loader2 className="spin" size={14} />
                                        ) : action.variant === 'upgrade' ? (
                                            <>
                                                Upgrade <ArrowUpRight size={13} />
                                            </>
                                        ) : action.variant === 'downgrade' ? (
                                            <>
                                                Downgrade <ChevronRight size={13} />
                                            </>
                                        ) : (
                                            action.label
                                        )}
                                    </button>
                                </div>
                            );
                        })}
                    </div>

                    {/* Comparison Table */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 24, marginBottom: 4 }}>
                        <BarChart3 size={15} color="var(--ink-faint)" />
                        <span style={{
                            fontFamily: 'var(--mono)', fontSize: '0.62rem',
                            letterSpacing: '0.1em', textTransform: 'uppercase' as const,
                            color: 'var(--ink-faint)', fontWeight: 700,
                        }}>
                            Tier Comparison
                        </span>
                    </div>

                    <div style={styles.comparisonWrap}>
                        <table style={styles.comparisonTable}>
                            <thead>
                                <tr>
                                    <th style={styles.compTh}>Feature</th>
                                    {plans.map(plan => (
                                        <th key={plan.id} style={{
                                            ...styles.compTh,
                                            color: plan.tier === 'basic' ? 'var(--ink-faint)' :
                                                   plan.tier === 'advanced' ? 'var(--accent)' :
                                                   'var(--gold)',
                                        }}>
                                            {plan.name}
                                            {subscription?.planId === plan.id && (
                                                <span style={{
                                                    display: 'inline-block',
                                                    marginLeft: 6,
                                                    background: 'var(--green-l)',
                                                    color: 'var(--green)',
                                                    padding: '1px 6px',
                                                    borderRadius: 4,
                                                    fontSize: '0.55rem',
                                                    fontFamily: 'var(--mono)',
                                                    textTransform: 'uppercase' as const,
                                                    letterSpacing: '0.06em',
                                                    border: '1px solid var(--green)',
                                                    opacity: 0.85,
                                                }}>
                                                    Current
                                                </span>
                                            )}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td style={styles.compTd}>Weekly fee</td>
                                    {plans.map(plan => (
                                        <td key={plan.id} style={styles.compTd}>{fmtUsd(plan.price)}</td>
                                    ))}
                                </tr>
                                <tr>
                                    <td style={styles.compTd}>Min. investment</td>
                                    {plans.map(plan => (
                                        <td key={plan.id} style={styles.compTd}>{fmtUsd(plan.minInvestment)}</td>
                                    ))}
                                </tr>
                                <tr>
                                    <td style={styles.compTd}>Expected weekly return</td>
                                    {plans.map(plan => (
                                        <td key={plan.id} style={{ ...styles.compTd, color: 'var(--green)', fontWeight: 700 }}>
                                            {pct(plan.weeklyReturnRate)}
                                        </td>
                                    ))}
                                </tr>
                                <tr>
                                    <td style={styles.compTd}>Annualized (approx.)</td>
                                    {plans.map(plan => (
                                        <td key={plan.id} style={{ ...styles.compTd, color: 'var(--green)', fontWeight: 700 }}>
                                            {pct(plan.weeklyReturnRate * 52)}
                                        </td>
                                    ))}
                                </tr>
                                <tr>
                                    <td style={styles.compTd}>Auto-trading</td>
                                    {plans.map(plan => (
                                        <td key={plan.id} style={styles.compTd}>
                                            {plan.tier === 'basic' ? (
                                                <Lock size={13} color="var(--ink-faint)" />
                                            ) : (
                                                <Unlock size={13} color="var(--green)" />
                                            )}
                                        </td>
                                    ))}
                                </tr>
                                <tr>
                                    <td style={styles.compTd}>Priority support</td>
                                    {plans.map(plan => (
                                        <td key={plan.id} style={styles.compTd}>
                                            {plan.tier === 'platinum' ? (
                                                <CheckCircle2 size={13} color="var(--green)" />
                                            ) : (
                                                <span style={{ color: 'var(--ink-faint)', fontSize: '0.8rem' }}>—</span>
                                            )}
                                        </td>
                                    ))}
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div style={{ height: 60 }} />
                </div>
            </div>

            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes shimmer {
                    to { background-position: -200% 0; }
                }

                .modal-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.55);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 100;
                    padding: 16px;
                    backdrop-filter: blur(4px);
                }

                .modal-card {
                    background: var(--card);
                    border: 1px solid var(--line-strong);
                    border-radius: 14px;
                    padding: 24px;
                    max-width: 420px;
                    width: 100%;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                }

                .modal-header {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin-bottom: 14px;
                }

                .modal-title {
                    font-size: 1rem;
                    font-weight: 600;
                    flex: 1;
                    color: var(--ink);
                    font-family: var(--sans);
                }

                .modal-close {
                    background: none;
                    border: none;
                    cursor: pointer;
                    color: var(--ink-faint);
                    padding: 4px;
                    border-radius: 6px;
                    transition: 0.15s;
                }

                .modal-close:hover {
                    color: var(--ink-dim);
                    background: var(--surface);
                }

                .modal-body {
                    color: var(--ink-dim);
                    line-height: 1.6;
                    font-size: 0.85rem;
                    margin-bottom: 20px;
                    font-family: var(--sans);
                }

                .modal-actions {
                    display: flex;
                    gap: 10px;
                }

                .modal-actions button {
                    flex: 1;
                    padding: 10px 14px;
                    border-radius: 10px;
                    border: none;
                    font-weight: 600;
                    cursor: pointer;
                    transition: 0.15s;
                    font-size: 0.82rem;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    gap: 5px;
                    font-family: var(--sans);
                }

                .btn-secondary {
                    background: var(--surface);
                    color: var(--ink-dim);
                    border: 1px solid var(--line-strong);
                }

                .btn-secondary:hover {
                    background: var(--surface-hover);
                    color: var(--ink);
                }

                .btn-primary {
                    background: var(--accent);
                    color: var(--bg);
                }

                .btn-primary:hover {
                    opacity: 0.9;
                }

                .btn-danger {
                    background: var(--red-l);
                    color: var(--red);
                    border: 1px solid var(--red);
                }

                .btn-danger:hover {
                    background: var(--red);
                    color: var(--ink);
                }

                .refresh-btn {
                    background: none;
                    border: 1px solid var(--line-strong);
                    border-radius: 8px;
                    padding: 8px 10px;
                    cursor: pointer;
                    color: var(--ink-faint);
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .refresh-btn:hover {
                    color: var(--ink-dim);
                    border-color: var(--ink-dim);
                }

                .cancel-btn {
                    margin-top: 14px;
                    border: none;
                    background: var(--red-l);
                    color: var(--red);
                    padding: 8px 14px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 600;
                    font-size: 0.72rem;
                    font-family: var(--mono);
                    letter-spacing: 0.06em;
                    transition: 0.15s;
                    border: 1px solid var(--red);
                    opacity: 0.85;
                }

                .cancel-btn:hover {
                    background: var(--red);
                    color: var(--ink);
                    opacity: 1;
                }

                .plan-card {
                    position: relative;
                    transition: border-color 0.2s, transform 0.2s;
                }

                .plan-card:hover {
                    border-color: var(--ink-dim);
                    transform: translateY(-3px);
                }

                .plan-card.recommended {
                    border: 2px solid var(--accent);
                }

                .plan-card.current {
                    border-color: var(--green);
                    background: color-mix(in srgb, var(--green) 4%, var(--card));
                }

                .plan-btn {
                    margin-top: auto;
                    width: 100%;
                    border: none;
                    border-radius: 10px;
                    padding: 12px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: 0.15s;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    gap: 5px;
                    font-size: 0.82rem;
                    font-family: var(--sans);
                }

                .plan-btn:disabled {
                    cursor: not-allowed;
                    opacity: 0.5;
                }

                .btn-activate {
                    background: var(--accent);
                    color: var(--bg);
                }

                .btn-activate:hover:not(:disabled) {
                    opacity: 0.9;
                }

                .btn-upgrade {
                    background: var(--accent);
                    color: var(--bg);
                }

                .btn-upgrade:hover:not(:disabled) {
                    opacity: 0.9;
                }

                .btn-downgrade {
                    background: var(--surface);
                    color: var(--ink-dim);
                    border: 1px solid var(--line-strong);
                }

                .btn-downgrade:hover:not(:disabled) {
                    background: var(--surface-hover);
                    color: var(--ink);
                }

                .btn-current {
                    background: var(--green-l);
                    color: var(--green);
                    border: 1px solid var(--green);
                    cursor: default;
                    opacity: 0.85;
                }

                .btn-pending {
                    background: var(--gold-l);
                    color: var(--gold);
                    border: 1px solid var(--gold);
                    cursor: default;
                    opacity: 0.85;
                }

                .btn-disabled {
                    background: var(--surface);
                    color: var(--ink-faint);
                    border: 1px solid var(--line);
                    cursor: not-allowed;
                }

                .summary-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
                    gap: 10px;
                }

                .plans-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                    gap: 12px;
                }

                @media (min-width: 900px) {
                    .plans-grid {
                        grid-template-columns: repeat(3, 1fr);
                    }
                }

                @media (max-width: 640px) {
                    .modal-actions {
                        flex-direction: column;
                    }
                    .plans-grid {
                        grid-template-columns: 1fr;
                    }
                    .summary-grid {
                        grid-template-columns: 1fr;
                    }
                }
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
        maxWidth: 1100,
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
    skeletonBox: {
        background: 'linear-gradient(90deg, var(--bg-3) 25%, var(--card) 50%, var(--bg-3) 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.4s infinite',
        borderRadius: 10,
    },
    summaryGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: 10,
    },
    summaryCard: {
        background: 'var(--card)',
        border: '1px solid var(--line-strong)',
        borderRadius: 14,
        padding: '16px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        overflow: 'hidden',
    },
    summaryLabel: {
        fontFamily: 'var(--mono)',
        fontSize: '0.55rem',
        letterSpacing: '0.1em',
        textTransform: 'uppercase' as const,
        color: 'var(--ink-faint)',
        display: 'flex',
        alignItems: 'center',
    },
    summaryValue: {
        fontFamily: 'var(--mono)',
        fontSize: '1.5rem',
        fontWeight: 700,
        color: 'var(--ink)',
        marginTop: 6,
        fontVariantNumeric: 'tabular-nums',
        fontFeatureSettings: '"tnum" 1',
    },
    summarySmall: {
        fontFamily: 'var(--sans)',
        fontSize: '0.78rem',
        color: 'var(--ink-dim)',
        lineHeight: 1.5,
        marginTop: 4,
    },
    card: {
        background: 'var(--card)',
        border: '1px solid var(--line-strong)',
        borderRadius: 14,
        overflow: 'hidden',
    },
    plansGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: 12,
    },
    planCard: {
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--card)',
        border: '1px solid var(--line-strong)',
        borderRadius: 14,
        padding: '22px',
        gap: 10,
        minHeight: 0,
    },
    recommendedBadge: {
        position: 'absolute',
        top: 12,
        right: 12,
        background: 'var(--accent)',
        color: 'var(--bg)',
        padding: '3px 10px',
        borderRadius: 999,
        fontSize: '0.55rem',
        fontFamily: 'var(--mono)',
        letterSpacing: '0.08em',
        fontWeight: 700,
        textTransform: 'uppercase' as const,
    },
    planHeader: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        marginBottom: 4,
    },
    planIcon: {
        width: 42,
        height: 42,
        borderRadius: 10,
        background: 'var(--surface)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
    },
    planTitle: {
        fontSize: '1rem',
        fontWeight: 600,
        color: 'var(--ink)',
        fontFamily: 'var(--sans)',
    },
    planTierLabel: {
        fontSize: '0.6rem',
        textTransform: 'uppercase' as const,
        letterSpacing: '0.08em',
        color: 'var(--ink-faint)',
        fontFamily: 'var(--mono)',
    },
    planReturns: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 8,
        marginBottom: 4,
        padding: '10px 12px',
        background: 'var(--surface)',
        borderRadius: 10,
    },
    returnBlock: {
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
    },
    returnLabel: {
        fontSize: '0.6rem',
        color: 'var(--ink-faint)',
        textTransform: 'uppercase' as const,
        letterSpacing: '0.06em',
        fontFamily: 'var(--mono)',
    },
    returnValue: {
        fontSize: '0.95rem',
        fontWeight: 700,
        color: 'var(--ink)',
        fontVariantNumeric: 'tabular-nums',
        fontFamily: 'var(--mono)',
    },
    planPriceBlock: {
        display: 'flex',
        alignItems: 'baseline',
        gap: 5,
        marginBottom: 2,
    },
    planPrice: {
        fontSize: '1.6rem',
        fontWeight: 700,
        color: 'var(--ink)',
        fontVariantNumeric: 'tabular-nums',
        fontFamily: 'var(--mono)',
    },
    planInterval: {
        fontSize: '0.78rem',
        color: 'var(--ink-faint)',
        fontFamily: 'var(--sans)',
    },
    planDescription: {
        color: 'var(--ink-dim)',
        lineHeight: 1.5,
        fontSize: '0.8rem',
        minHeight: 36,
        fontFamily: 'var(--sans)',
    },
    featureList: {
        margin: '8px 0 4px',
        padding: 0,
        listStyle: 'none',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
    },
    featureItem: {
        display: 'flex',
        alignItems: 'flex-start',
        gap: 8,
    },
    planBtn: {
        marginTop: 'auto',
        width: '100%',
        border: 'none',
        borderRadius: 10,
        padding: '11px',
        fontWeight: 600,
        cursor: 'pointer',
        transition: '0.15s',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 5,
        fontSize: '0.82rem',
        fontFamily: 'var(--sans)',
    },
    comparisonWrap: {
        overflowX: 'auto',
        border: '1px solid var(--line-strong)',
        borderRadius: 14,
        background: 'var(--card)',
    },
    comparisonTable: {
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: '0.82rem',
        fontFamily: 'var(--sans)',
    },
    compTh: {
        padding: '12px 16px',
        textAlign: 'left',
        borderBottom: '1px solid var(--line-strong)',
        fontWeight: 600,
        color: 'var(--ink)',
        background: 'var(--bg)',
        fontSize: '0.78rem',
        fontFamily: 'var(--sans)',
        whiteSpace: 'nowrap' as const,
    },
    compTd: {
        padding: '11px 16px',
        textAlign: 'left',
        borderBottom: '1px solid var(--line)',
        color: 'var(--ink-dim)',
        fontFamily: 'var(--mono)',
        fontSize: '0.78rem',
        fontVariantNumeric: 'tabular-nums',
    },
};
