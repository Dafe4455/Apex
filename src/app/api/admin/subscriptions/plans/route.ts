// src/app/api/admin/subscriptions/plans/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@root/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return new NextResponse('Unauthorized', { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (!user || user.role !== 'ADMIN') {
    return new NextResponse('Unauthorized', { status: 403 });
  }

  const plans = await prisma.subscriptionPlan.findMany({
    orderBy: { price: 'asc' },
  });

  return NextResponse.json(plans);
}
