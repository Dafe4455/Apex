// src/app/api/subscriptions/downgrade/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@root/auth';
import { prisma } from '@/lib/prisma';
import { calculatePeriodEnd } from '@/lib/dates';

const TIER_ORDER = ['basic', 'advanced', 'platinum'];

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return new NextResponse('Unauthorized', { status: 401 });

  const { planId } = await req.json();
  if (!planId) return NextResponse.json({ error: 'Missing planId' }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const newPlan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
  if (!newPlan || !newPlan.isActive) {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
  }

  const currentSub = await prisma.subscription.findFirst({
    where: { userId: user.id, status: 'active' },
    include: { plan: true },
  });

  if (!currentSub) {
    return NextResponse.json({ error: 'No active subscription. Use activate instead.' }, { status: 400 });
  }

  // Prevent downgrading to the same plan
  if (currentSub.planId === planId) {
    return NextResponse.json({ error: 'You are already on this plan.' }, { status: 400 });
  }

  const currentTierIdx = TIER_ORDER.indexOf(currentSub.plan.tier);
  const newTierIdx = TIER_ORDER.indexOf(newPlan.tier);

  if (newTierIdx >= currentTierIdx) {
    return NextResponse.json({ error: 'Not a downgrade. Use upgrade for higher tiers.' }, { status: 400 });
  }

  try {
    const now = new Date();
    const periodStart = currentSub.currentPeriodStart;
    const periodEnd = currentSub.currentPeriodEnd;
    const totalPeriodMs = periodEnd.getTime() - periodStart.getTime();
    const elapsedMs = now.getTime() - periodStart.getTime();
    const remainingRatio = Math.max(0, 1 - elapsedMs / totalPeriodMs);

    const unusedOld = currentSub.plan.price * remainingRatio;
    const proratedNew = newPlan.price * remainingRatio;
    const creditAmount = Math.max(0, unusedOld - proratedNew);

    await prisma.$transaction([
      // Credit the user's account for unused balance
      ...(creditAmount > 0 ? [
        prisma.user.update({
          where: { id: user.id },
          data: { portfolioBalance: { increment: creditAmount } },
        }),
      ] : []),
      prisma.transaction.create({
        data: {
          type: 'SubscriptionDowngrade',
          amount: creditAmount,
          userId: user.id,
          status: 'COMPLETED',
          description: `Downgraded from ${currentSub.plan.name} to ${newPlan.name} (prorated credit)`,
        },
      }),
      prisma.subscription.update({
        where: { id: currentSub.id },
        data: {
          status: 'downgraded',
          autoRenew: false,
          cancelledAt: now,
        },
      }),
      prisma.subscription.create({
        data: {
          userId: user.id,
          planId: newPlan.id,
          status: 'active',
          startDate: now,
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          nextBillingDate: periodEnd,
          autoRenew: true,
          previousSubscriptionId: currentSub.id,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: `Downgraded to ${newPlan.name}`,
      creditedAmount: creditAmount,
    });
  } catch (error: any) {
    // Handle unique constraint error (P2002)
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Downgrade already in progress. Please refresh and try again.' },
        { status: 409 }
      );
    }

    console.error('Subscription downgrade error:', error);
    return NextResponse.json(
      { error: 'Failed to downgrade subscription' },
      { status: 500 }
    );
  }
}
