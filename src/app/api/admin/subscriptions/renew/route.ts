import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@root/auth';
import { prisma } from '@/lib/prisma';
import { ensureSubscriptionActive } from '@/lib/subscriptions';

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
