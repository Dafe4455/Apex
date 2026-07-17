import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@root/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const bot = await prisma.tradingBot.findUnique({ where: { id: params.id } });
  if (!bot || bot.userId !== session.user.id) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { status } = await req.json(); // "running", "paused", "stopped"
  const updated = await prisma.tradingBot.update({
    where: { id: params.id },
    data: { status },
  });
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const bot = await prisma.tradingBot.findUnique({ where: { id: params.id } });
  if (!bot || bot.userId !== session.user.id) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await prisma.tradingBot.delete({ where: { id: params.id } });
  return new NextResponse(null, { status: 204 });
}
