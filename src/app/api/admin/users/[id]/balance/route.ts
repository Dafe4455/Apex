import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@root/auth';
import { prisma } from '@/lib/prisma';

function isAdmin(s: any) { return s?.user?.role === 'ADMIN'; }

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || !isAdmin(session))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const { amount, type } = await req.json();

  if (!amount || isNaN(parseFloat(amount)))
    return NextResponse.json({ error: 'Valid amount is required' }, { status: 400 });

  if (!['add', 'subtract'].includes(type))
    return NextResponse.json({ error: 'type must be add or subtract' }, { status: 400 });

  const delta = type === 'add' ? parseFloat(amount) : -parseFloat(amount);

  const user = await prisma.user.update({
    where: { id },
    data: { portfolioBalance: { increment: delta } },
    select: { id: true, portfolioBalance: true },
  });

  return NextResponse.json({ user });
}
