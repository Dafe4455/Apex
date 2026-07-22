// src/app/api/subscriptions/plans/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const plans = await prisma.subscriptionPlan.findMany({
    // where: { isActive: true },  // COMMENT THIS OUT TEMPORARILY
    orderBy: { price: 'asc' },
  });

  console.log('PLANS FROM DB:', plans); // Add this

  return NextResponse.json(plans);
}
