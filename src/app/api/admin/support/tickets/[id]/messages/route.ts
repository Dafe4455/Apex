import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@root/auth';
import { prisma } from '@/lib/prisma';

function isAdmin(s: any) { return s?.user?.role === 'ADMIN'; }

// POST /api/admin/support/tickets/[id]/messages — admin sends a reply
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session || !isAdmin(session))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { body } = await req.json();

  if (!body?.trim())
    return NextResponse.json({ error: 'body is required' }, { status: 400 });

  const ticket = await prisma.supportTicket.findUnique({ where: { id: params.id } });
  if (!ticket)
    return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });

  const message = await prisma.supportMessage.create({
    data: {
      ticketId: params.id,
      sender: 'ADMIN',
      body: body.trim(),
    },
  });

  // Re-open ticket automatically when admin replies to a closed one
  if (ticket.status === 'CLOSED') {
    await prisma.supportTicket.update({
      where: { id: params.id },
      data: { status: 'OPEN', updatedAt: new Date() },
    });
  } else {
    // Bump updatedAt so it sorts to top of list
    await prisma.supportTicket.update({
      where: { id: params.id },
      data: { updatedAt: new Date() },
    });
  }

  return NextResponse.json(message, { status: 201 });
}
