import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const plans = await prisma.subscriptionPlan.findMany({
    where: { isActive: true },
    orderBy: { price: 'asc' },
    select: {
      id: true,
      name: true,
      tier: true,
      description: true,
      price: true,
      minInvestment: true,
      weeklyReturnRate: true,
      interval: true,
      features: true,
      isActive: true,
      highlight: true,
    },
  });

  return NextResponse.json(plans);
}
