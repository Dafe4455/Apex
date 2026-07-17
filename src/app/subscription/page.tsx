'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Check, ArrowLeft, Zap, Shield, BarChart3 } from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';
import Link from 'next/link';

type Plan = {
  id: string;
  name: string;
  description: string;
  price: number;
  interval: string;
  features: string[] | null;
  isActive: boolean;
};

type UserSub = {
  id: string;
  planId: string;
  status: string;
  currentPeriodEnd: string;
  autoRenew: boolean;
  plan: { name: string; price: number; interval: string };
};

export default function SubscriptionPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [userSub, setUserSub] = useState<UserSub | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [plansRes, subRes] = await Promise.all([
          fetch('/api/subscriptions/plans'),
          fetch('/api/subscriptions/mine'),
        ]);
        if (plansRes.ok) setPlans(await plansRes.json());
        if (subRes.ok) setUserSub(await subRes.json());
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleActivate = async (planId: string) => {
    setActionLoading(planId);
    try {
      const res = await fetch('/api/subscriptions/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to activate');
      toast.success('Subscription activated!');
      const subRes = await fetch('/api/subscriptions/mine');
      if (subRes.ok) setUserSub(await subRes.json());
      router.refresh();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async () => {
    if (!userSub) return;
    setActionLoading(userSub.planId);
    try {
      const res = await fetch('/api/subscriptions/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Cancellation failed');
      toast.success('Subscription cancelled – you will not be billed again.');
      const subRes = await fetch('/api/subscriptions/mine');
      if (subRes.ok) setUserSub(await subRes.json());
      router.refresh();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
        <Loader2 className="animate-spin text-[var(--ink-faint)]" size={28} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)] font-sans">
      <Toaster position="top-center" />
      <div className="max-w-6xl mx-auto px-4 py-10 md:px-6 md:py-16">
        {/* Navigation */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-[var(--ink-faint)] hover:text-[var(--ink-dim)] transition-colors mb-8 group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Back to Dashboard
        </Link>

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold font-mono tracking-tight">
            Choose your plan
          </h1>
          <p className="mt-3 text-[var(--ink-faint)] max-w-md mx-auto">
            Unlock premium features and auto‑trading capabilities. Pay directly from your portfolio balance.
          </p>
        </div>

        {/* Current Subscription Banner */}
        {userSub && (
          <div className="mb-10 p-6 rounded-2xl border border-[var(--accent)] bg-[var(--surface)] shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-sm text-[var(--accent)] uppercase tracking-widest font-mono font-semibold">Current Plan</p>
                <h2 className="text-2xl font-bold font-mono mt-1">{userSub.plan.name}</h2>
                <p className="text-sm text-[var(--ink-faint)] mt-1">
                  ${userSub.plan.price}/{userSub.plan.interval.toLowerCase()} ·{' '}
                  <span className="text-[var(--green)] font-medium capitalize">{userSub.status}</span>
                </p>
                {userSub.autoRenew ? (
                  <p className="text-xs text-[var(--ink-faint)] mt-2">
                    Next billing: {new Date(userSub.currentPeriodEnd).toLocaleDateString()}
                  </p>
                ) : (
                  <p className="text-xs text-[var(--red)] mt-2">
                    Canceled – access until {new Date(userSub.currentPeriodEnd).toLocaleDateString()}
                  </p>
                )}
              </div>
              {userSub.autoRenew && (
                <button
                  onClick={handleCancel}
                  disabled={actionLoading === userSub.planId}
                  className="px-5 py-2.5 border border-[var(--red)] text-[var(--red)] rounded-xl text-sm font-mono font-semibold hover:bg-[var(--red-l)] transition-colors disabled:opacity-50"
                >
                  {actionLoading === userSub.planId ? <Loader2 className="animate-spin inline" size={14} /> : 'Cancel'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Plan Cards Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => {
            const isCurrentPlan = userSub?.planId === plan.id && userSub?.status === 'active';
            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl border p-6 transition-all duration-300 hover:scale-[1.02] ${
                  isCurrentPlan
                    ? 'border-[var(--accent)] bg-gradient-to-b from-[var(--surface)] to-[var(--card)] shadow-xl'
                    : 'border-[var(--line-strong)] bg-[var(--card)] hover:border-[var(--accent)]'
                }`}
              >
                {isCurrentPlan && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[var(--accent)] text-white text-xs font-bold px-4 py-1 rounded-full uppercase tracking-wider shadow-md">
                    Active
                  </div>
                )}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[var(--surface)] flex items-center justify-center">
                    {plan.name.includes('Pro') ? (
                      <Zap className="text-[var(--accent)]" size={20} />
                    ) : plan.name.includes('Basic') ? (
                      <Shield className="text-[var(--green)]" size={20} />
                    ) : (
                      <BarChart3 className="text-[var(--ink-dim)]" size={20} />
                    )}
                  </div>
                  <h3 className="text-xl font-semibold font-mono">{plan.name}</h3>
                </div>
                <p className="text-3xl font-bold font-mono">
                  ${plan.price}
                  <span className="text-base font-normal text-[var(--ink-faint)]">/{plan.interval.toLowerCase()}</span>
                </p>
                <p className="mt-2 text-sm text-[var(--ink-faint)] leading-relaxed">{plan.description}</p>
                {plan.features && (
                  <ul className="mt-5 space-y-3">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm">
                        <Check size={16} className="text-[var(--green)] mt-0.5 flex-shrink-0" />
                        <span className="text-[var(--ink-dim)]">{f}</span>
                      </li>
                    ))}
                  </ul>
                )}
                <button
                  onClick={() => handleActivate(plan.id)}
                  disabled={isCurrentPlan || actionLoading === plan.id}
                  className={`mt-8 w-full py-3 rounded-xl font-mono text-sm font-semibold transition-all ${
                    isCurrentPlan
                      ? 'bg-[var(--line)] text-[var(--ink-faint)] cursor-not-allowed'
                      : 'bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] active:scale-95 disabled:opacity-50'
                  }`}
                >
                  {isCurrentPlan ? 'Current Plan' : actionLoading === plan.id ? <Loader2 className="animate-spin inline" size={16} /> : 'Activate'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
