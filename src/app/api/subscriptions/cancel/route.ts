import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@root/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return new NextResponse('Unauthorized', { status: 401 });

  const activeSub = await prisma.subscription.findFirst({
    where: { userId: session.user.id, status: 'active' },
  });
  if (!activeSub) return NextResponse.json({ error: 'No active subscription' }, { status: 404 });

  await prisma.subscription.update({
    where: { id: activeSub.id },
    data: { autoRenew: false, cancelledAt: new Date() },
  });

  return NextResponse.json({ success: true });
}
