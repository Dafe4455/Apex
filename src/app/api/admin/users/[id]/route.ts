import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@root/auth';
import { prisma } from '@/lib/prisma';
import { KycStatus } from '@prisma/client';

function isAdmin(s: any) { return s?.user?.role === 'ADMIN'; }

// Helper: construct full name from firstName + lastName
function buildName(user: { firstName: string | null; lastName: string | null }) {
  return [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || null;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || !isAdmin(session))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      country: true,
      role: true,
      kycStatus: true,
      portfolioBalance: true,
      createdAt: true,
    },
  });

  if (!user)
    return NextResponse.json({ error: 'User not found' }, { status: 404 });

  return NextResponse.json({ user: { ...user, name: buildName(user) } });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || !isAdmin(session))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const { name, email, phone, country, kycStatus, portfolioBalance } = await req.json();

  const validKyc: KycStatus[] = ['NONE', 'PENDING', 'APPROVED', 'REJECTED'];

  // Split name into firstName + lastName if provided
  let firstName, lastName;
  if (name !== undefined) {
    const parts = name.trim().split(/\s+/);
    firstName = parts[0];
    lastName = parts.slice(1).join(' ') || null;
  }

  const user = await prisma.user.update({
    where: { id },
    data: {
      ...(firstName !== undefined && { firstName }),
      ...(lastName !== undefined && { lastName }),
      ...(email !== undefined && { email }),
      ...(phone !== undefined && { phone }),
      ...(country !== undefined && { country }),
      ...(kycStatus && validKyc.includes(kycStatus) && { kycStatus }),
      ...(portfolioBalance !== undefined && { portfolioBalance: Number(portfolioBalance) }),
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      country: true,
      role: true,
      kycStatus: true,
      portfolioBalance: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ user: { ...user, name: buildName(user) } });
}
