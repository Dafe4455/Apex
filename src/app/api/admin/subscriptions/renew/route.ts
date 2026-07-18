import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@root/auth';
import { ensureSubscriptionActive } from '@/lib/subscriptions';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return new NextResponse('Unauthorized', { status: 403 });
  }

  const { userId } = await req.json();
  if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 });

  const subscription = await ensureSubscriptionActive(userId);

  return NextResponse.json({
    success: true,
    renewed: !!subscription,
    subscription: subscription ? {
      planName: subscription.plan.name,
      periodEnd: subscription.currentPeriodEnd,
    } : null,
  });
}
