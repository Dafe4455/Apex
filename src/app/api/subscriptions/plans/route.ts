import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const plans = await prisma.subscriptionPlan.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      description: true,
      price: true,
      interval: true,
      features: true,
      isActive: true,
    },
    orderBy: { price: 'asc' },
  });
  return NextResponse.json(plans);
}
