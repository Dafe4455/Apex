import { NextResponse } from 'next/server';
import { auth } from '@root/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return new NextResponse('Unauthorized', { status: 401 });

  const sub = await prisma.subscription.findFirst({
    where: { userId: session.user.id, status: 'active' },
    include: { plan: { select: { name: true, price: true, interval: true } } },
  });
  return NextResponse.json(sub);
}
