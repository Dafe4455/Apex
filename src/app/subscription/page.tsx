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
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <Loader2 className="animate-spin text-ink-faint" size={28} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg text-ink font-sans antialiased">
      <Toaster position="top-center" />
      <div className="max-w-6xl mx-auto px-4 py-10 md:px-6 md:py-16">
        
        {/* Navigation */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-ink-faint hover:text-ink-dim transition-colors mb-8 group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Back to Dashboard
        </Link>

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold font-mono tracking-tight">
            Choose your plan
          </h1>
          <p className="mt-3 text-ink-faint max-w-md mx-auto text-sm md:text-base">
            Unlock premium features and auto‑trading capabilities. Pay directly from your portfolio balance.
          </p>
        </div>

        {/* Current Subscription Banner */}
        {userSub && (
          <div className="mb-10 p-6 rounded-2xl border border-accent/30 bg-surface shadow-lg backdrop-blur-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-xs text-accent uppercase tracking-widest font-mono font-bold">Current Plan</p>
                <h2 className="text-2xl font-bold font-mono mt-1">{userSub.plan.name}</h2>
                <p className="text-sm text-ink-faint mt-1">
                  ${userSub.plan.price}/{userSub.plan.interval.toLowerCase()} ·{' '}
                  <span className="text-green font-semibold capitalize bg-green-l px-2 py-0.5 rounded">
                    {userSub.status}
                  </span>
                </p>
                {userSub.autoRenew ? (
                  <p className="text-xs text-ink-faint mt-3">
                    Next billing: {new Date(userSub.currentPeriodEnd).toLocaleDateString()}
                  </p>
                ) : (
                  <p className="text-xs text-red mt-3 font-medium">
                    Canceled – access until {new Date(userSub.currentPeriodEnd).toLocaleDateString()}
                  </p>
                )}
              </div>
              {userSub.autoRenew && (
                <button
                  onClick={handleCancel}
                  disabled={actionLoading === userSub.planId}
                  className="px-5 py-2.5 border border-red text-red rounded-xl text-sm font-mono font-semibold hover:bg-red-l transition-colors disabled:opacity-50 min-w-[110px]"
                >
                  {actionLoading === userSub.planId ? <Loader2 className="animate-spin inline" size={14} /> : 'Cancel Plan'}
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
                className={`relative rounded-2xl border p-6 transition-all duration-300 hover:scale-[1.01] flex flex-col justify-between ${
                  isCurrentPlan
                    ? 'border-accent bg-gradient-to-b from-surface to-card shadow-2xl'
                    : 'border-line-strong bg-card hover:border-accent'
                }`}
              >
                {isCurrentPlan && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-bg text-[10px] font-bold px-4 py-1 rounded-full uppercase tracking-wider shadow-md">
                    Active
                  </div>
                )}
                
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center border border-line-strong">
                      {plan.name.includes('Pro') ? (
                        <Zap className="text-accent" size={20} />
                      ) : plan.name.includes('Basic') ? (
                        <Shield className="text-green" size={20} />
                      ) : (
                        <BarChart3 className="text-ink-dim" size={20} />
                      )}
                    </div>
                    <h3 className="text-xl font-semibold font-mono">{plan.name}</h3>
                  </div>

                  <p className="text-3xl font-bold font-mono">
                    ${plan.price}
                    <span className="text-sm font-normal text-ink-faint">/{plan.interval.toLowerCase()}</span>
                  </p>
                  <p className="mt-2 text-sm text-ink-faint leading-relaxed min-h-[40px]">{plan.description}</p>
                  
                  {plan.features && (
                    <ul className="mt-5 space-y-3 pt-5 border-t border-line">
                      {plan.features.map((f, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm">
                          <Check size={16} className="text-green mt-0.5 flex-shrink-0" />
                          <span className="text-ink-dim">{f}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <button
                  onClick={() => handleActivate(plan.id)}
                  disabled={isCurrentPlan || actionLoading === plan.id}
                  className={`mt-8 w-full py-3 rounded-xl font-mono text-sm font-semibold transition-all ${
                    isCurrentPlan
                      ? 'bg-line text-ink-faint cursor-not-allowed border border-line-strong/30'
                      : 'bg-accent text-bg hover:opacity-90 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center'
                  }`}
                >
                  {isCurrentPlan ? (
                    'Current Plan'
                  ) : actionLoading === plan.id ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    'Activate'
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
