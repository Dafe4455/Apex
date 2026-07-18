import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@root/auth';
import { prisma } from '@/lib/prisma';

const TIER_ORDER = ['basic', 'advanced', 'platinum'];

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return new NextResponse('Unauthorized', { status: 401 });

  const { planId } = await req.json();
  if (!planId) return NextResponse.json({ error: 'Missing planId' }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  const newPlan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });

  if (!user || !newPlan || !newPlan.isActive) {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
  }

  const currentSub = await prisma.subscription.findFirst({
    where: { userId: user.id, status: 'active' },
    include: { plan: true },
  });

  if (!currentSub) {
    return NextResponse.json({ error: 'No active subscription' }, { status: 400 });
  }

  const currentTierIdx = TIER_ORDER.indexOf(currentSub.plan.tier);
  const newTierIdx = TIER_ORDER.indexOf(newPlan.tier);

  if (newTierIdx >= currentTierIdx) {
    return NextResponse.json({ error: 'Not a downgrade.' }, { status: 400 });
  }

  // Schedule downgrade — update next billing to new plan, keep current until then
  await prisma.subscription.update({
    where: { id: currentSub.id },
    data: {
      pendingPlanId: newPlan.id,
      autoRenew: true, // Will renew into the new plan
    },
  });

  return NextResponse.json({
    success: true,
    message: `Downgrade to ${newPlan.name} scheduled for ${currentSub.currentPeriodEnd.toLocaleDateString()}`,
    effectiveDate: currentSub.currentPeriodEnd,
  });
}
