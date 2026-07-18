import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@root/auth';
import { prisma } from '@/lib/prisma';

const TIER_ORDER = ['basic', 'advanced', 'platinum'];

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const { planId } = await req.json();

  if (!planId) {
    return NextResponse.json(
      { error: 'Missing planId' },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user) {
    return NextResponse.json(
      { error: 'User not found' },
      { status: 404 }
    );
  }

  const newPlan = await prisma.subscriptionPlan.findUnique({
    where: { id: planId },
  });

  if (!newPlan || !newPlan.isActive) {
    return NextResponse.json(
      { error: 'Invalid plan' },
      { status: 400 }
    );
  }

  const currentSub = await prisma.subscription.findFirst({
    where: {
      userId: user.id,
      status: 'active',
    },
    include: {
      plan: true,
    },
  });

  if (!currentSub) {
    return NextResponse.json(
      { error: 'No active subscription. Use activate instead.' },
      { status: 400 }
    );
  }

  const currentTierIdx = TIER_ORDER.indexOf(currentSub.plan.tier);
  const newTierIdx = TIER_ORDER.indexOf(newPlan.tier);

  if (newTierIdx <= currentTierIdx) {
    return NextResponse.json(
      { error: 'Not an upgrade. Use downgrade for lower tiers.' },
      { status: 400 }
    );
  }

  const now = new Date();

  const periodStart = currentSub.currentPeriodStart;
  const periodEnd = currentSub.currentPeriodEnd;

  const totalPeriodMs = periodEnd.getTime() - periodStart.getTime();
  const elapsedMs = now.getTime() - periodStart.getTime();
  const remainingRatio = Math.max(
    0,
    1 - elapsedMs / totalPeriodMs
  );

  const unusedOld = currentSub.plan.price * remainingRatio;
  const proratedNew = newPlan.price * remainingRatio;
  const chargeAmount = Math.max(0, proratedNew - unusedOld);

  if (user.portfolioBalance < chargeAmount) {
    return NextResponse.json(
      {
        error: `Insufficient balance. Prorated charge: $${chargeAmount.toFixed(
          2
        )}`,
      },
      { status: 400 }
    );
  }

  // Check whether the user has ever had this plan before
  const existingSubscription = await prisma.subscription.findFirst({
    where: {
      userId: user.id,
      planId: newPlan.id,
    },
  });

  await prisma.$transaction(async (tx) => {
    // Deduct the prorated upgrade fee
    await tx.user.update({
      where: { id: user.id },
      data: {
        portfolioBalance: {
          decrement: chargeAmount,
        },
      },
    });

    // Record the upgrade transaction
    await tx.transaction.create({
      data: {
        type: 'SubscriptionUpgrade',
        amount: chargeAmount,
        userId: user.id,
        status: 'COMPLETED',
        description: `Upgraded from ${currentSub.plan.name} to ${newPlan.name} (prorated)`,
      },
    });

    // Mark the current subscription as upgraded
    await tx.subscription.update({
      where: {
        id: currentSub.id,
      },
      data: {
        status: 'upgraded',
        autoRenew: false,
        cancelledAt: now,
      },
    });

    if (existingSubscription) {
      // Reactivate the existing subscription for this plan
      await tx.subscription.update({
        where: {
          id: existingSubscription.id,
        },
        data: {
          status: 'active',
          startDate: now,
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          nextBillingDate: periodEnd,
          autoRenew: true,
          cancelledAt: null,
          previousSubscriptionId: currentSub.id,
        },
      });
    } else {
      // First time subscribing to this plan
      await tx.subscription.create({
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
      });
    }
  });

  return NextResponse.json({
    success: true,
    message: `Successfully upgraded to ${newPlan.name}.`,
    proratedCharge: chargeAmount,
  });
}
