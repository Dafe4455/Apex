'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Check, X, ArrowLeft } from 'lucide-react';
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
  const [actionLoading, setActionLoading] = useState<string | null>(null); // planId being processed
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
      // Refresh user sub and balance (you may want to update a global balance state)
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
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)] p-6 md:p-10">
      <Toaster position="top-center" />
      <div className="max-w-5xl mx-auto">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-[var(--ink-faint)] hover:text-[var(--ink-dim)] mb-6"
        >
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>

        {/* Current Subscription */}
        {userSub && (
          <div className="mb-10 p-6 rounded-xl border border-[var(--line-strong)] bg-[var(--card)]">
            <h2 className="text-lg font-semibold mb-2 font-mono">Your Subscription</h2>
            <p className="text-2xl font-bold font-mono">{userSub.plan.name}</p>
            <p className="text-sm text-[var(--ink-faint)]">
              ${userSub.plan.price}/{userSub.plan.interval.toLowerCase()} · Status:{' '}
              <span className="capitalize font-medium text-[var(--green)]">{userSub.status}</span>
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
            {userSub.autoRenew && (
              <button
                onClick={handleCancel}
                disabled={actionLoading === userSub.planId}
                className="mt-4 px-4 py-2 border border-[var(--red)] text-[var(--red)] rounded-lg text-sm font-mono hover:bg-[var(--red-l)] transition-colors"
              >
                {actionLoading === userSub.planId ? <Loader2 className="animate-spin inline" size={14} /> : 'Cancel Subscription'}
              </button>
            )}
          </div>
        )}

        {/* Plans */}
        <h2 className="text-xl font-bold mb-6 font-mono">Plans</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => {
            const isCurrentPlan = userSub?.planId === plan.id && userSub?.status === 'active';
            return (
              <div
                key={plan.id}
                className={`p-6 rounded-xl border transition-all ${
                  isCurrentPlan
                    ? 'border-[var(--accent)] bg-[var(--surface)]'
                    : 'border-[var(--line-strong)] bg-[var(--card)] hover:border-[var(--line-strong)]'
                }`}
              >
                <h3 className="text-lg font-semibold font-mono">{plan.name}</h3>
                <p className="text-2xl font-bold font-mono mt-2">
                  ${plan.price}
                  <span className="text-sm font-normal text-[var(--ink-faint)]">/{plan.interval.toLowerCase()}</span>
                </p>
                <p className="text-sm text-[var(--ink-faint)] mt-1">{plan.description}</p>
                {plan.features && (
                  <ul className="mt-4 space-y-2">
                    {Array.isArray(plan.features) &&
                      plan.features.map((f, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <Check size={16} className="text-[var(--green)] mt-0.5" />
                          <span>{f}</span>
                        </li>
                      ))}
                  </ul>
                )}
                <button
                  onClick={() => handleActivate(plan.id)}
                  disabled={isCurrentPlan || actionLoading === plan.id}
                  className={`mt-6 w-full py-3 rounded-lg font-mono text-sm font-semibold transition-colors ${
                    isCurrentPlan
                      ? 'bg-[var(--line)] text-[var(--ink-faint)] cursor-not-allowed'
                      : 'bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] disabled:opacity-50'
                  }`}
                >
                  {isCurrentPlan ? 'Active' : actionLoading === plan.id ? <Loader2 className="animate-spin inline" size={16} /> : 'Activate'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
