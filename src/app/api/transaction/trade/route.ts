import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@root/auth';
import { executeTrade } from '@/lib/tradeService';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }
    const user = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const body = await req.json();
    const { action, asset, amount, price, leverage, marginType, marketType } = body;

    const result = await executeTrade({
      userId: user.id,
      action,
      asset,
      amount: Number(amount),
      price: Number(price),
      leverage,
      marginType,
      marketType,
    });

    return NextResponse.json({ success: true, trade: result.transaction, newBalance: result.newBalance });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
