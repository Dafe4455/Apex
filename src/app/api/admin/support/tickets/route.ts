import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@root/auth';
import { prisma } from '@/lib/prisma';
import { TicketStatus } from '@prisma/client';

function isAdmin(s: any) { return s?.user?.role === 'ADMIN'; }

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || !isAdmin(session))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const statusParam = req.nextUrl.searchParams.get('status');
  const validStatuses: TicketStatus[] = ['OPEN', 'CLOSED'];
  const status = validStatuses.includes(statusParam as TicketStatus)
    ? (statusParam as TicketStatus)
    : undefined;

  const tickets = await prisma.supportTicket.findMany({
    where: status ? { status } : undefined,
    orderBy: { updatedAt: 'desc' },
    include: {
      user: { select: { id: true, firstName: true, lastName: true, email: true } },
      messages: {
        orderBy: { createdAt: 'asc' },
        select: { id: true, sender: true, body: true, createdAt: true },
      },
    },
  });

  return NextResponse.json({ tickets });
}
