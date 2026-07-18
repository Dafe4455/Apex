import { NextResponse } from 'next/server';
import { auth } from '@root/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return new NextResponse('Unauthorized', { status: 401 });

  const subscription = await prisma.subscription.findFirst({
    where: {
      userId: session.user.id,
      status: { in: ['active', 'pending_downgrade'] },
    },
    include: {
      plan: {
        select: {
          name: true,
          tier: true,
          price: true,
          interval: true,
        },
      },
      pendingPlan: {
        select: { name: true, tier: true, price: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!subscription) return NextResponse.json(null);

  return NextResponse.json({
    id: subscription.id,
    planId: subscription.planId,
    status: subscription.status,
    currentPeriodEnd: subscription.currentPeriodEnd,
    autoRenew: subscription.autoRenew,
    plan: subscription.plan,
    pendingPlan: subscription.pendingPlan,
  });
}
