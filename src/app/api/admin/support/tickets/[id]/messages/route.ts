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
  const { body } = await req.json();

  if (!body?.trim())
    return NextResponse.json({ error: 'body is required' }, { status: 400 });

  const ticket = await prisma.supportTicket.findUnique({ where: { id } });
  if (!ticket)
    return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });

  const message = await prisma.supportMessage.create({
    data: { ticketId: id, sender: 'ADMIN', body: body.trim() },
  });

  await prisma.supportTicket.update({
    where: { id },
    data: {
      status: 'OPEN',
      updatedAt: new Date(),
    },
  });

  return NextResponse.json(message, { status: 201 });
}
