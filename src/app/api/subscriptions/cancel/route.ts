// src/app/api/subscriptions/cancel/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@root/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return new NextResponse('Unauthorized', { status: 401 });

  const currentSub = await prisma.subscription.findFirst({
    where: { userId: session.user.id, status: 'active' },
  });

  if (!currentSub) {
    return NextResponse.json({ error: 'No active subscription' }, { status: 400 });
  }

  const now = new Date();

  await prisma.subscription.update({
    where: { id: currentSub.id },
    data: {
      status: 'cancelled',        // ADD THIS
      autoRenew: false,
      cancelledAt: now,
      pendingPlanId: null,
    },
  });

  return NextResponse.json({
    success: true,
    message: 'Subscription cancelled. Access continues until period end.',
    accessUntil: currentSub.currentPeriodEnd,
  });
}
