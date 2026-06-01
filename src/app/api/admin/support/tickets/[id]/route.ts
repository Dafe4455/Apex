import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@root/auth';
import { prisma } from '@/lib/prisma';

function isAdmin(s: any) { return s?.user?.role === 'ADMIN'; }

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || !isAdmin(session))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;

  const ticket = await prisma.supportTicket.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true } },
      messages: {
        orderBy: { createdAt: 'asc' },
        select: { id: true, sender: true, body: true, createdAt: true },
      },
    },
  });

  if (!ticket)
    return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });

  return NextResponse.json({ ticket });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || !isAdmin(session))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const { status } = await req.json();

  if (!['OPEN', 'CLOSED'].includes(status))
    return NextResponse.json({ error: 'status must be OPEN or CLOSED' }, { status: 400 });

  const ticket = await prisma.supportTicket.update({
    where: { id },
    data: { status },
    include: {
      user: { select: { id: true, name: true, email: true } },
      messages: {
        orderBy: { createdAt: 'asc' },
        select: { id: true, sender: true, body: true, createdAt: true },
      },
    },
  });

  return NextResponse.json({ ticket });
}
