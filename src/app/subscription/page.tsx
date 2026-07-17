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
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <Loader2 className="animate-spin text-slate-500" size={28} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased">
      <Toaster position="top-center" />
      <div className="max-w-6xl mx-auto px-4 py-10 md:px-6 md:py-16">
        
        {/* Navigation */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors mb-8 group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Back to Dashboard
        </Link>

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold font-mono tracking-tight text-white">
            Choose your plan
          </h1>
          <p className="mt-3 text-slate-400 max-w-md mx-auto text-sm md:text-base leading-relaxed">
            Unlock premium features and auto‑trading capabilities. Pay directly from your portfolio balance.
          </p>
        </div>

        {/* Current Subscription Banner */}
        {userSub && (
          <div className="mb-10 p-6 rounded-2xl border border-indigo-500/30 bg-slate-900 shadow-xl backdrop-blur-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-xs text-indigo-400 uppercase tracking-widest font-mono font-bold">Current Plan</p>
                <h2 className="text-2xl font-bold font-mono text-white mt-1">{userSub.plan.name}</h2>
                <p className="text-sm text-slate-400 mt-1">
                  ${userSub.plan.price}/{userSub.plan.interval.toLowerCase()} ·{' '}
                  <span className="text-emerald-400 font-semibold capitalize bg-emerald-500/10 px-2 py-0.5 rounded">
                    {userSub.status}
                  </span>
                </p>
                {userSub.autoRenew ? (
                  <p className="text-xs text-slate-400 mt-3">
                    Next billing: {new Date(userSub.currentPeriodEnd).toLocaleDateString()}
                  </p>
                ) : (
                  <p className="text-xs text-rose-400 mt-3 font-medium">
                    Canceled – access until {new Date(userSub.currentPeriodEnd).toLocaleDateString()}
                  </p>
                )}
              </div>
              {userSub.autoRenew && (
                <button
                  onClick={handleCancel}
                  disabled={actionLoading === userSub.planId}
                  className="px-5 py-2.5 border border-rose-500/30 text-rose-400 rounded-xl text-sm font-mono font-semibold hover:bg-rose-500/10 transition-colors disabled:opacity-50 flex items-center justify-center min-w-[100px]"
                >
                  {actionLoading === userSub.planId ? <Loader2 className="animate-spin" size={14} /> : 'Cancel Plan'}
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
                    ? 'border-indigo-500 bg-gradient-to-b from-slate-900 to-slate-900/40 shadow-2xl shadow-indigo-500/5'
                    : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900'
                }`}
              >
                {isCurrentPlan && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[10px] font-bold px-4 py-1 rounded-full uppercase tracking-wider shadow-md">
                    Active Plan
                  </div>
                )}
                
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center border border-slate-700">
                      {plan.name.includes('Pro') ? (
                        <Zap className="text-indigo-400" size={20} />
                      ) : plan.name.includes('Basic') ? (
                        <Shield className="text-emerald-400" size={20} />
                      ) : (
                        <BarChart3 className="text-slate-400" size={20} />
                      )}
                    </div>
                    <h3 className="text-xl font-semibold font-mono text-white">{plan.name}</h3>
                  </div>

                  <p className="text-3xl font-bold font-mono text-white">
                    ${plan.price}
                    <span className="text-sm font-normal text-slate-400">/{plan.interval.toLowerCase()}</span>
                  </p>
                  
                  <p className="mt-2 text-sm text-slate-400 leading-relaxed min-h-[40px]">
                    {plan.description}
                  </p>

                  {plan.features && (
                    <ul className="mt-6 space-y-3 pt-6 border-t border-slate-800/60">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm">
                          <Check size={16} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                          <span className="text-slate-300">{feature}</span>
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
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
                      : 'bg-indigo-600 text-white hover:bg-indigo-500 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center'
                  }`}
                >
                  {isCurrentPlan ? (
                    'Current Plan'
                  ) : actionLoading === plan.id ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    'Activate Plan'
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
