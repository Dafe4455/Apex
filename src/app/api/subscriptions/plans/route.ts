import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Fallback plans so the frontend works even if the DB table is empty
const DEFAULT_PLANS = [
  {
    id: 'plan_starter',
    name: 'Starter Tier',
    tier: 'basic',
    description: 'Ideal for beginners starting with essential automated trading tools.',
    price: 25,
    minInvestment: 250,
    weeklyReturnRate: 1.5,
    interval: 'WEEKLY',
    features: ['Automated portfolio management', 'Standard execution speed', '24/7 Email support'],
    isActive: true,
    highlight: null,
  },
  {
    id: 'plan_pro',
    name: 'Pro Growth',
    tier: 'advanced',
    description: 'Designed for active investors seeking enhanced weekly returns.',
    price: 75,
    minInvestment: 1000,
    weeklyReturnRate: 3.5,
    interval: 'WEEKLY',
    features: ['Advanced AI trading strategies', 'Priority order execution', 'Dedicated support manager', 'Custom risk limits'],
    isActive: true,
    highlight: 'Popular',
  },
  {
    id: 'plan_elite',
    name: 'Elite Wealth',
    tier: 'platinum',
    description: 'Maximum yield strategies tailored for high-net-worth capital portfolios.',
    price: 200,
    minInvestment: 5000,
    weeklyReturnRate: 6.0,
    interval: 'WEEKLY',
    features: ['Institutional-grade algo access', 'Instant execution', '1-on-1 VIP financial advisor', 'Guaranteed priority yield pool'],
    isActive: true,
    highlight: null,
  },
];

export async function GET() {
  try {
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

    if (plans && plans.length > 0) {
      // Convert Prisma Decimal objects to standard Numbers for the frontend
      const formattedPlans = plans.map(p => ({
        ...p,
        price: Number(p.price),
        minInvestment: Number(p.minInvestment),
        weeklyReturnRate: Number(p.weeklyReturnRate),
      }));

      return NextResponse.json(formattedPlans);
    }
  } catch (error) {
    console.error('Failed to fetch subscription plans from DB:', error);
  }

  // Fallback if the database is empty or connection fails
  return NextResponse.json(DEFAULT_PLANS);
}
