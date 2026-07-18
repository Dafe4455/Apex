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
} from 'lucide-react';

type Plan = {
    id: string;
    name: string;
    description: string;
    price: number;
    interval: string;
    features: string[] | null;
    isActive: boolean;
};

type UserSubscription = {
    id: string;
    planId: string;
    status: string;
    currentPeriodEnd: string;
    autoRenew: boolean;
    plan: {
        name: string;
        price: number;
        interval: string;
    };
};

export default function SubscriptionPage() {

    const router = useRouter();

    const [plans, setPlans] = useState<Plan[]>([]);
    const [subscription, setSubscription] = useState<UserSubscription | null>(null);

    const [portfolioBalance, setPortfolioBalance] = useState(0);

    const [loading, setLoading] = useState(true);

    const [processing, setProcessing] = useState<string | null>(null);

    const money = useCallback((value: number) => {
        return value.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }, []);

    const loadPage = useCallback(async () => {

        try {

            const [plansRes, subRes, portfolioRes] = await Promise.all([
                fetch('/api/subscriptions/plans'),
                fetch('/api/subscriptions/mine'),
                fetch('/api/portfolio')
            ]);

            if (plansRes.ok) {
                setPlans(await plansRes.json());
            }

            if (subRes.ok) {
                setSubscription(await subRes.json());
            }

            if (portfolioRes.ok) {

                const data = await portfolioRes.json();

                setPortfolioBalance(data.portfolioBalance ?? 0);

            }

        } catch (err) {

            console.error(err);

            toast.error('Unable to load subscription data.');

        } finally {

            setLoading(false);

        }

    }, []);

    useEffect(() => {

        loadPage();

    }, [loadPage]);

    const activatePlan = async (plan: Plan) => {

        setProcessing(plan.id);

        try {

            const res = await fetch('/api/subscriptions/activate', {

                method: 'POST',

                headers: {

                    'Content-Type': 'application/json'

                },

                body: JSON.stringify({

                    planId: plan.id

                })

            });

            const data = await res.json();

            if (!res.ok) {

                throw new Error(data.error);

            }

            toast.success(`${plan.name} activated successfully`);

            await loadPage();

            router.refresh();

        }

        catch (err: any) {

            toast.error(err.message);

        }

        finally {

            setProcessing(null);

        }

    };

    const cancelSubscription = async () => {

        if (!subscription) return;

        setProcessing(subscription.planId);

        try {

            const res = await fetch('/api/subscriptions/cancel', {

                method: 'POST'

            });

            const data = await res.json();

            if (!res.ok) {

                throw new Error(data.error);

            }

            toast.success('Subscription cancelled');

            await loadPage();

            router.refresh();

        }

        catch (err: any) {

            toast.error(err.message);

        }

        finally {

            setProcessing(null);

        }

    };

    const recommendedPlan = useMemo(() => {
        return plans.find(p =>
            p.name.toLowerCase().includes('pro')
        );
    }, [plans]);

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

            <div className="sub-wrap">
                <div className="sub-inner">

                    {/* Header */}

                    <div className="sub-header">

                        <Link href="/dashboard" className="back-link">
                            <ArrowLeft size={16} />
                            Dashboard
                        </Link>

                        <h1 className="sub-title">
                            Subscription Plans
                        </h1>

                        <p className="sub-description">
                            Upgrade your account with premium tools, automated trading and
                            advanced analytics.
                        </p>

                    </div>

                    {/* Summary */}

                    <div className="summary-grid">

                        <div className="summary-card">

                            <div className="summary-label">
                                <Wallet size={16} />
                                Portfolio Balance
                            </div>

                            <div className="summary-value">
                                ${money(portfolioBalance)}
                            </div>

                            <div className="summary-small">
                                Subscription fees are deducted from your portfolio balance.
                            </div>

                        </div>

                        <div className="summary-card">

                            <div className="summary-label">
                                <CheckCircle2 size={16} />
                                Current Subscription
                            </div>

                            {subscription ? (
                                <>
                                    <div className="summary-value">
                                        {subscription.plan.name}
                                    </div>

                                    <div className="summary-small">

                                        {subscription.autoRenew
                                            ? `Renews ${new Date(
                                                subscription.currentPeriodEnd
                                            ).toLocaleDateString()}`
                                            : `Ends ${new Date(
                                                subscription.currentPeriodEnd
                                            ).toLocaleDateString()}`}

                                    </div>

                                    {subscription.autoRenew && (
                                        <button
                                            className="cancel-btn"
                                            onClick={cancelSubscription}
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
                                    <div className="summary-value">
                                        No Active Plan
                                    </div>

                                    <div className="summary-small">
                                        Choose one of the plans below.
                                    </div>
                                </>
                            )}

                        </div>

                    </div>

                    {/* Plans */}

                    <div className="plans-grid">

                        {plans.map(plan => {

                            const current =
                                subscription?.planId === plan.id &&
                                subscription.status === 'active';

                            const insufficient =
                                portfolioBalance < plan.price;

                            const recommended =
                                recommendedPlan?.id === plan.id;

                            return (

                                <div
                                    key={plan.id}
                                    className={`plan-card ${recommended ? 'recommended' : ''}`}
                                >

                                    {recommended && (
                                        <div className="recommended-badge">
                                            MOST POPULAR
                                        </div>
                                    )}

                                    <div className="plan-icon">

                                        {plan.name.toLowerCase().includes('basic') ? (
                                            <Shield size={26} />
                                        ) : plan.name.toLowerCase().includes('pro') ? (
                                            <Zap size={26} />
                                        ) : (
                                            <Crown size={26} />
                                        )}

                                    </div>

                                    <h2 className="plan-title">
                                        {plan.name}
                                    </h2>

                                    <div className="plan-price">

                                        ${money(plan.price)}

                                        <span>
                                            /{plan.interval.toLowerCase()}
                                        </span>

                                    </div>

                                    <p className="plan-description">
                                        {plan.description}
                                    </p>

                                    {plan.features && (

                                        <ul className="feature-list">

                                            {plan.features.map(feature => (

                                                <li key={feature}>

                                                    <CheckCircle2
                                                        size={15}
                                                        className="feature-icon"
                                                    />

                                                    {feature}

                                                </li>

                                            ))}

                                        </ul>

                                    )}

                                    {current ? (

                                        <button
                                            disabled
                                            className="btn-current"
                                        >
                                            Current Plan
                                        </button>

                                    ) : insufficient ? (

                                        <button
                                            disabled
                                            className="btn-disabled"
                                        >
                                            Insufficient Balance
                                        </button>

                                    ) : (

                                        <button
                                            onClick={() => activatePlan(plan)}
                                            disabled={processing === plan.id}
                                            className="btn-activate"
                                        >

                                            {processing === plan.id ? (
                                                <Loader2 className="spin" size={16} />
                                            ) : (
                                                'Activate Plan'
                                            )}

                                        </button>

                                    )}

                                </div>

                            );

                        })}

                    </div>

                </div>
            </div>

            <style jsx global>{`
:root{
  --radius:16px;
}

.sub-wrap{
  padding:24px 24px 80px;
  color:var(--ink);
  font-family:var(--sans);
}

.sub-inner{
  max-width:1150px;
  margin:0 auto;
}

.sub-loading{
  min-height:100vh;
  display:flex;
  justify-content:center;
  align-items:center;
  color:var(--accent);
}

.spin{
  animation:spin .8s linear infinite;
}

@keyframes spin{
  to{transform:rotate(360deg);}
}

/* ---------- Header ---------- */

.sub-header{
  margin-bottom:28px;
}

.back-link{
  display:inline-flex;
  align-items:center;
  gap:8px;
  text-decoration:none;
  color:var(--ink-faint);
  font-family:var(--mono);
  font-size:.72rem;
  margin-bottom:20px;
  transition:.2s;
}

.back-link:hover{
  color:var(--accent);
}

.sub-title{
  font-size:2rem;
  font-weight:700;
  color:var(--ink);
  letter-spacing:-.02em;
}

.sub-description{
  margin-top:8px;
  max-width:560px;
  color:var(--ink-faint);
  line-height:1.7;
  font-size:.92rem;
}

/* ---------- Summary ---------- */

.summary-grid{
  display:grid;
  grid-template-columns:repeat(auto-fit,minmax(280px,1fr));
  gap:20px;
  margin-bottom:32px;
}

.summary-card{
  background:var(--card);
  border:1px solid var(--line-strong);
  border-radius:16px;
  padding:22px;
}

.summary-label{
  display:flex;
  align-items:center;
  gap:8px;
  color:var(--ink-faint);
  font-size:.75rem;
  text-transform:uppercase;
  letter-spacing:.08em;
  font-family:var(--mono);
}

.summary-value{
  margin-top:14px;
  font-size:1.9rem;
  font-weight:700;
  color:var(--ink);
}

.summary-small{
  margin-top:8px;
  color:var(--ink-faint);
  line-height:1.6;
  font-size:.82rem;
}

/* ---------- Cancel ---------- */

.cancel-btn{
  margin-top:18px;
  border:none;
  background:var(--red-l);
  color:var(--red);
  padding:10px 18px;
  border-radius:10px;
  cursor:pointer;
  font-weight:600;
  transition:.2s;
}

.cancel-btn:hover{
  background:var(--red);
  color:white;
}

/* ---------- Plans ---------- */

.plans-grid{
  display:grid;
  grid-template-columns:repeat(auto-fit,minmax(310px,1fr));
  gap:24px;
}

.plan-card{
  position:relative;
  display:flex;
  flex-direction:column;
  background:var(--card);
  border:1px solid var(--line-strong);
  border-radius:18px;
  padding:28px;
  transition:.25s;
}

.plan-card:hover{
  border-color:var(--accent);
  transform:translateY(-5px);
}

.plan-card.recommended{
  border:2px solid var(--accent);
}

.recommended-badge{
  position:absolute;
  top:16px;
  right:16px;
  background:var(--accent);
  color:white;
  padding:5px 10px;
  border-radius:999px;
  font-size:.62rem;
  font-family:var(--mono);
  letter-spacing:.08em;
  font-weight:700;
}

.plan-icon{
  width:58px;
  height:58px;
  border-radius:16px;
  background:var(--surface);
  display:flex;
  justify-content:center;
  align-items:center;
  color:var(--accent);
}

.plan-title{
  margin-top:18px;
  font-size:1.35rem;
  font-weight:700;
}

.plan-price{
  margin-top:14px;
  font-size:2rem;
  font-weight:700;
}

.plan-price span{
  margin-left:6px;
  font-size:.85rem;
  color:var(--ink-faint);
  font-weight:400;
}

.plan-description{
  margin-top:12px;
  color:var(--ink-faint);
  line-height:1.7;
  min-height:55px;
}

/* ---------- Features ---------- */

.feature-list{
  margin:22px 0;
  padding:0;
  list-style:none;
  display:flex;
  flex-direction:column;
  gap:14px;
}

.feature-list li{
  display:flex;
  align-items:flex-start;
  gap:10px;
  color:var(--ink);
  line-height:1.5;
}

.feature-icon{
  color:var(--green);
  margin-top:2px;
}

/* ---------- Buttons ---------- */

.btn-activate,
.btn-current,
.btn-disabled{
  margin-top:auto;
  width:100%;
  border:none;
  border-radius:12px;
  padding:14px;
  font-weight:700;
  cursor:pointer;
  transition:.2s;
  display:flex;
  justify-content:center;
  align-items:center;
}

.btn-activate{
  background:var(--accent);
  color:white;
}

.btn-activate:hover{
  opacity:.92;
}

.btn-current{
  background:var(--green-l);
  color:var(--green);
  cursor:default;
}

.btn-disabled{
  background:var(--surface);
  color:var(--ink-faint);
  cursor:not-allowed;
}

/* ---------- Responsive ---------- */

@media(max-width:768px){

.sub-wrap{
padding:18px;
}

.sub-title{
font-size:1.6rem;
}

.summary-value{
font-size:1.5rem;
}

.plan-card{
padding:22px;
}

}
`}</style>
        </>
    );
}
