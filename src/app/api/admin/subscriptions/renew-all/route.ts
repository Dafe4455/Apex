import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@root/auth';
import { prisma } from '@/lib/prisma';
import { calculatePeriodEnd } from '@/lib/dates';

async function checkAdmin(session: any) {
  if (!session?.user?.id) return false;
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  return user?.role === 'ADMIN';
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!(await checkAdmin(session))) {
    return new NextResponse('Unauthorized', { status: 403 });
  }

  const now = new Date();
  const expiredSubs = await prisma.subscription.findMany({
    where: {
      status: 'active',
      currentPeriodEnd: { lte: now },
    },
    include: { plan: true, user: true },
  });

  let renewed = 0;
  let failed = 0;

  for (const sub of expiredSubs) {
    const targetPlan = sub.pendingPlanId
      ? await prisma.subscriptionPlan.findUnique({ where: { id: sub.pendingPlanId } })
      : sub.plan;

    if (!targetPlan) continue;

    if (sub.user.portfolioBalance < targetPlan.price) {
      await prisma.subscription.update({
        where: { id: sub.id },
        data: { status: 'expired', autoRenew: false },
      });
      failed++;
      continue;
    }

    const newPeriodEnd = calculatePeriodEnd(now, targetPlan.interval);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: sub.userId },
        data: { portfolioBalance: { decrement: targetPlan.price } },
      }),
      prisma.transaction.create({
        data: {
          type: 'SubscriptionFee',
          amount: targetPlan.price,
          userId: sub.userId,
          status: 'COMPLETED',
          description: `Admin renewed ${targetPlan.name}`,
        },
      }),
      sub.pendingPlanId
        ? prisma.subscription.create({
            data: {
              userId: sub.userId,
              planId: targetPlan.id,
              status: 'active',
              startDate: now,
              currentPeriodStart: now,
              currentPeriodEnd: newPeriodEnd,
              nextBillingDate: newPeriodEnd,
              autoRenew: true,
              previousSubscriptionId: sub.id,
            },
          })
        : prisma.subscription.update({
            where: { id: sub.id },
            data: {
              currentPeriodStart: now,
              currentPeriodEnd: newPeriodEnd,
              nextBillingDate: newPeriodEnd,
              pendingPlanId: null,
            },
          }),
    ]);

    renewed++;
  }

  return NextResponse.json({ renewed, failed, total: expiredSubs.length });
}
