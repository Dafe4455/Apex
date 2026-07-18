// src/app/api/subscriptions/activate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@root/auth';
import { prisma } from '@/lib/prisma';
import { calculatePeriodEnd } from '@/lib/dates';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return new NextResponse('Unauthorized', { status: 401 });

  const { planId } = await req.json();
  if (!planId) return NextResponse.json({ error: 'Missing planId' }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
  if (!plan || !plan.isActive) {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
  }

  if (user.portfolioBalance < plan.price) {
    return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 });
  }

  const existingActive = await prisma.subscription.findFirst({
    where: { userId: user.id, status: 'active' },
  });

  if (existingActive) {
    return NextResponse.json(
      { error: 'You already have an active subscription. Use upgrade or cancel first.' },
      { status: 409 }
    );
  }

  const now = new Date();

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { portfolioBalance: { decrement: plan.price } },
    }),
    prisma.transaction.create({
      data: {
        type: 'SubscriptionFee',
        amount: plan.price,
        userId: user.id,
        status: 'COMPLETED',
        description: `Activated ${plan.name} plan`,
      },
    }),
    prisma.subscription.create({
      data: {
        userId: user.id,
        planId: plan.id,
        status: 'active',
        startDate: now,
        currentPeriodStart: now,
        currentPeriodEnd: calculatePeriodEnd(now, plan.interval),
        nextBillingDate: calculatePeriodEnd(now, plan.interval),
        autoRenew: true,
      },
    }),
  ]);

  return NextResponse.json({ success: true, message: `${plan.name} activated` });
}
