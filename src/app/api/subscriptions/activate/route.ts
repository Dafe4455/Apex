import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@root/auth';
import { prisma } from '@/lib/prisma';
import { calculatePeriodEnd } from '@/lib/dates'; // ensure this exists

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return new NextResponse('Unauthorized', { status: 401 });

  const { planId } = await req.json();
  if (!planId) return NextResponse.json({ error: 'Missing planId' }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });

  if (!user || !plan || !plan.isActive) return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
  if (user.portfolioBalance < plan.price) return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 });

  // Check if user already has an active subscription (only one allowed at a time)
  const existingActive = await prisma.subscription.findFirst({
    where: { userId: user.id, status: 'active' },
  });
  if (existingActive) {
    return NextResponse.json({ error: 'You already have an active subscription. Cancel it first.' }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { portfolioBalance: { decrement: plan.price } } }),
    prisma.transaction.create({
      data: {
        type: 'SubscriptionFee',
        amount: plan.price,
        userId: user.id,
        status: 'COMPLETED',
      },
    }),
    prisma.subscription.create({
      data: {
        userId: user.id,
        planId: plan.id,
        status: 'active',
        startDate: new Date(),
        currentPeriodStart: new Date(),
        currentPeriodEnd: calculatePeriodEnd(new Date(), plan.interval),
        nextBillingDate: calculatePeriodEnd(new Date(), plan.interval),
        autoRenew: true,
      },
    }),
  ]);

  return NextResponse.json({ success: true });
}
