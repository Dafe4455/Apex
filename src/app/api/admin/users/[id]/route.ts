import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@root/auth';
import { prisma } from '@/lib/prisma';
import { KycStatus } from '@prisma/client';

function isAdmin(s: any) { return s?.user?.role === 'ADMIN'; }

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
      name: true,
      email: true,
      role: true,
      kycStatus: true,
      portfolioBalance: true,
      createdAt: true,
    },
  });

  if (!user)
    return NextResponse.json({ error: 'User not found' }, { status: 404 });

  return NextResponse.json({ user });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || !isAdmin(session))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const { name, email, kycStatus } = await req.json();

  const validKyc: KycStatus[] = ['NONE', 'PENDING', 'APPROVED', 'REJECTED'];

  const user = await prisma.user.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(email !== undefined && { email }),
      ...(kycStatus && validKyc.includes(kycStatus) && { kycStatus }),
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      kycStatus: true,
      portfolioBalance: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ user });
}
