import { prisma } from '@/lib/prisma';
import { calculatePeriodEnd } from '@/lib/dates';

export async function ensureSubscriptionActive(userId: string) {
  const now = new Date();

  const sub = await prisma.subscription.findFirst({
    where: { userId, status: 'active' },
    include: { plan: true },
  });

  if (!sub) return null;

  if (sub.currentPeriodEnd <= now) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return null;

    const targetPlan = sub.pendingPlanId
      ? await prisma.subscriptionPlan.findUnique({ where: { id: sub.pendingPlanId } })
      : sub.plan;

    if (!targetPlan) return null;

    if (user.portfolioBalance < targetPlan.price) {
      await prisma.subscription.update({
        where: { id: sub.id },
        data: { status: 'expired', autoRenew: false },
      });
      return null;
    }

    const newPeriodEnd = calculatePeriodEnd(now, targetPlan.interval);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { portfolioBalance: { decrement: targetPlan.price } },
      }),
      prisma.transaction.create({
        data: {
          type: 'SubscriptionFee',
          amount: targetPlan.price,
          userId,
          status: 'COMPLETED',
          description: `Renewed ${targetPlan.name}`,
        },
      }),
      sub.pendingPlanId
        ? prisma.subscription.create({
            data: {
              userId,
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

    return prisma.subscription.findFirst({
      where: { userId, status: 'active' },
      include: { plan: true },
    });
  }

  return sub;
}
