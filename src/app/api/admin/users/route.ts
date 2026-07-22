import { NextResponse } from 'next/server';
import { auth } from '../../../../../auth';
import { prisma } from '@/lib/prisma';

function isAdmin(s: any) { return s?.user?.role === 'ADMIN'; }

function buildName(user: { firstName: string | null; lastName: string | null }) {
  return [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || null;
}

// GET — list all users
export async function GET() {
  const session = await auth();
  if (!isAdmin(session)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
      portfolioBalance: true,
      kycStatus: true,
      createdAt: true,
    },
  });

  // Add name field to each user for frontend convenience
  const usersWithName = users.map(u => ({ ...u, name: buildName(u) }));

  return NextResponse.json(usersWithName);
}

// PATCH — manually adjust a user's balance or stats (unchanged)
export async function PATCH(req: Request) {
  const session = await auth();
  if (!isAdmin(session)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const {
    userId,
    portfolioBalance,
    portfolioChangePercent,
    realisedPnl,
    volatility,
    riskLabel,
  } = await req.json();

  if (!userId) {
    return NextResponse.json({ error: 'userId required' }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(portfolioBalance !== undefined && { portfolioBalance }),
      ...(portfolioChangePercent !== undefined && { portfolioChangePercent }),
      ...(realisedPnl !== undefined && { realisedPnl }),
      ...(volatility !== undefined && { volatility }),
      ...(riskLabel !== undefined && { riskLabel }),
    },
  });

  const balanceNum = Number(updated.portfolioBalance);

  await prisma.activityLog.create({
    data: {
      userId,
      description: `Admin updated portfolio balance to $${balanceNum.toLocaleString()}`,
    },
  });

  return NextResponse.json({ success: true, portfolioBalance: balanceNum });
}
