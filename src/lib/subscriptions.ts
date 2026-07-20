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

    const balance = Number(user.portfolioBalance);
    const planPrice = Number(targetPlan.price);

    if (balance < planPrice) {
      await prisma.subscription.update({
        where: { id: sub.id },
        data: { status: 'expired', autoRenew: false },
      });
      return null;
    }

    const newPeriodEnd = calculatePeriodEnd(now, targetPlan.interval);

    // Check if user already has a subscription for this target plan
    const existingSub = await prisma.subscription.findFirst({
      where: { userId, planId: targetPlan.id },
    });

    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { portfolioBalance: { decrement: planPrice } },
      }),
      prisma.transaction.create({
        data: {
          type: 'SubscriptionFee',
          amount: planPrice,
          userId,
          status: 'COMPLETED',
          description: `Renewed ${targetPlan.name}`,
        },
      }),
      // Mark old sub as upgraded/expired
      prisma.subscription.update({
        where: { id: sub.id },
        data: {
          status: sub.pendingPlanId ? 'upgraded' : 'expired',
          autoRenew: false,
          cancelledAt: now,
        },
      }),
      // Upsert the target subscription (reactivate existing or create new)
      existingSub
        ? prisma.subscription.update({
            where: { id: existingSub.id },
            data: {
              status: 'active',
              startDate: now,
              currentPeriodStart: now,
              currentPeriodEnd: newPeriodEnd,
              nextBillingDate: newPeriodEnd,
              autoRenew: true,
              previousSubscriptionId: sub.id,
              cancelledAt: null,
            },
          })
        : prisma.subscription.create({
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
          }),
    ]);

    return prisma.subscription.findFirst({
      where: { userId, status: 'active' },
      include: { plan: true },
    });
  }

  return sub;
}
