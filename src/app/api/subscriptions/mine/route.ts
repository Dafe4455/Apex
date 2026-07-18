// src/app/api/subscriptions/mine/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@root/auth';
import { ensureSubscriptionActive } from '@/lib/subscriptions';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return new NextResponse('Unauthorized', { status: 401 });

  // Auto-renew if expired before returning data
  const subscription = await ensureSubscriptionActive(session.user.id);

  if (!subscription) return NextResponse.json(null);

  return NextResponse.json({
    id: subscription.id,
    planId: subscription.planId,
    status: subscription.status,
    currentPeriodEnd: subscription.currentPeriodEnd,
    autoRenew: subscription.autoRenew,
    plan: subscription.plan,
  });
}
