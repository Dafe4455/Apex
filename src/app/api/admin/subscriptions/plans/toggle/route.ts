import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@root/auth';
import { prisma } from '@/lib/prisma';

async function checkAdmin(session: any) {
  if (!session?.user?.id) return false;
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  return user?.role === 'ADMIN';
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!(await checkAdmin(session))) {
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
