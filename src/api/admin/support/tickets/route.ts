import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@root/auth';
import { prisma } from '@/lib/prisma';

function isAdmin(s: any) { return s?.user?.role === 'ADMIN'; }

// GET /api/admin/support/tickets?status=OPEN|CLOSED
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || !isAdmin(session))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const status = req.nextUrl.searchParams.get('status');
  const where = status === 'OPEN' || status === 'CLOSED' ? { status } : {};

  const tickets = await prisma.supportTicket.findMany({
    where,
    orderBy: { updatedAt: 'desc' },
    include: {
      user: { select: { id: true, name: true, email: true } },
      messages: {
        orderBy: { createdAt: 'asc' },
        select: { id: true, sender: true, body: true, createdAt: true },
      },
    },
  });

  return NextResponse.json({ tickets });
}
