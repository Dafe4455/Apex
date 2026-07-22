// src/app/api/subscriptions/plans/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  // Use raw query to bypass any Prisma mapping issues
  const plans = await prisma.$queryRaw`
    SELECT id, name, description, price, interval, features, "isActive", tier, "minInvestment", "weeklyReturnRate", "sortOrder", highlight, "createdAt", "updatedAt"
    FROM "SubscriptionPlan"
    WHERE "isActive" = true
    ORDER BY price ASC
  `;

  console.log('RAW SQL PLANS:', JSON.stringify(plans, null, 2));

  return NextResponse.json(plans);
}
