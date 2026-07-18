import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@root/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return new NextResponse('Unauthorized', { status: 403 });
  }

  const { id, isActive } = await req.json();
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const updated = await prisma.subscriptionPlan.update({
    where: { id },
    data: { isActive },
  });

  return NextResponse.json({ success: true, plan: updated });
}
