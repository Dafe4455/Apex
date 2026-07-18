// src/app/api/subscriptions/downgrade/route.ts

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

  const newPlan = await prisma.subscriptionPlan.findUnique({
    where: {
      id: planId,
    },
  });

  if (!newPlan || !newPlan.isActive) {
    return NextResponse.json(
      { error: 'Invalid plan' },
      { status: 400 }
    );
  }

  const currentSub = await prisma.subscription.findFirst({
    where: {
      userId: session.user.id,
      status: 'active',
    },
    include: {
      plan: true,
    },
  });

  if (!currentSub) {
    return NextResponse.json(
      { error: 'No active subscription.' },
      { status: 400 }
    );
  }

  // Prevent downgrading to the same plan
  if (currentSub.planId === newPlan.id) {
    return NextResponse.json(
      { error: 'You are already subscribed to this plan.' },
      { status: 400 }
    );
  }

  const currentTierIdx = TIER_ORDER.indexOf(currentSub.plan.tier);
  const newTierIdx = TIER_ORDER.indexOf(newPlan.tier);

  if (newTierIdx === -1 || currentTierIdx === -1) {
    return NextResponse.json(
      { error: 'Invalid subscription tier configuration.' },
      { status: 400 }
    );
  }

  if (newTierIdx >= currentTierIdx) {
    return NextResponse.json(
      {
        error: 'Selected plan is not a downgrade. Use Upgrade instead.',
      },
      { status: 400 }
    );
  }

  // Already scheduled?
  if (currentSub.pendingPlanId === newPlan.id) {
    return NextResponse.json(
      {
        error: 'This downgrade has already been scheduled.',
      },
      { status: 409 }
    );
  }

  await prisma.subscription.update({
    where: {
      id: currentSub.id,
    },
    data: {
      pendingPlanId: newPlan.id,
      autoRenew: true,
    },
  });

  return NextResponse.json({
    success: true,
    message: `Downgrade to ${newPlan.name} has been scheduled. It will take effect on ${currentSub.currentPeriodEnd.toLocaleDateString()}.`,
    effectiveDate: currentSub.currentPeriodEnd,
    pendingPlan: {
      id: newPlan.id,
      name: newPlan.name,
      tier: newPlan.tier,
    },
  });
}
