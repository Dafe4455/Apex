import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@root/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return new NextResponse('Unauthorized', { status: 403 });
  }

  const plans = await prisma.subscriptionPlan.findMany({
    orderBy: { price: 'asc' },
  });

  return NextResponse.json(plans);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return new NextResponse('Unauthorized', { status: 403 });
  }

  const body = await req.json();
  const {
    id,
    name,
    tier,
    description,
    price,
    minInvestment,
    weeklyReturnRate,
    interval,
    features,
    isActive,
    highlight,
  } = body;

  if (!name || !tier || price === undefined) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const data = {
    name,
    tier: tier.toLowerCase(),
    description: description || '',
    price: parseFloat(price),
    minInvestment: parseFloat(minInvestment || 0),
    weeklyReturnRate: parseFloat(weeklyReturnRate || 0),
    interval: interval || 'WEEKLY',
    features: Array.isArray(features) ? features : [],
    isActive: isActive !== false,
    highlight: highlight || null,
  };

  try {
    if (id) {
      const updated = await prisma.subscriptionPlan.update({
        where: { id },
        data,
      });
      return NextResponse.json({ success: true, plan: updated });
    } else {
      const created = await prisma.subscriptionPlan.create({ data });
      return NextResponse.json({ success: true, plan: created });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return new NextResponse('Unauthorized', { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const activeSubs = await prisma.subscription.count({
    where: { planId: id, status: 'active' },
  });

  if (activeSubs > 0) {
    await prisma.subscriptionPlan.update({
      where: { id },
      data: { isActive: false },
    });
    return NextResponse.json({ success: true, message: 'Plan deactivated (has active subscribers)' });
  }

  await prisma.subscriptionPlan.delete({ where: { id } });
  return NextResponse.json({ success: true, message: 'Plan deleted' });
}
