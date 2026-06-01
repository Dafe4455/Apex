import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@root/auth';
import { prisma } from '@/lib/prisma';

function isAdmin(s: any) { return s?.user?.role === 'ADMIN'; }

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || !isAdmin(session))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const { action, adminNote } = await req.json();

  if (!['CONFIRMED', 'REJECTED'].includes(action))
    return NextResponse.json({ error: 'action must be CONFIRMED or REJECTED' }, { status: 400 });

  const deposit = await prisma.deposit.findUnique({ where: { id } });
  if (!deposit)
    return NextResponse.json({ error: 'Deposit not found' }, { status: 404 });

  if (deposit.status !== 'PENDING')
    return NextResponse.json({ error: 'Deposit already processed' }, { status: 409 });

  const updated = await prisma.$transaction(async (tx) => {
    const dep = await tx.deposit.update({
      where: { id },
      data: { status: action, adminNote: adminNote ?? null },
    });

    if (action === 'CONFIRMED') {
      await tx.user.update({
        where: { id: deposit.userId },
        data: { portfolioBalance: { increment: deposit.amount } },
      });
    }

    return dep;
  });

  return NextResponse.json(updated);
}
