import { NextResponse } from 'next/server';
import { auth } from '@root/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// GET — list current user's withdrawals
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = (session.user as any).id;

  const withdrawals = await prisma.withdrawal.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      amount: true,
      currency: true,
      status: true,
      note: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ withdrawals });
}

// POST — submit a new withdrawal request
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const { amount, currency = 'USD', method, details, note, password } = await req.json();

  // ── Amount validation ──────────────────────────────────────────────────────
  if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
    return NextResponse.json({ error: 'Valid amount is required' }, { status: 400 });
  }

  if (Number(amount) < 50) {
    return NextResponse.json({ error: 'Minimum withdrawal is $50' }, { status: 400 });
  }

  // ── Method validation ──────────────────────────────────────────────────────
  const allowedMethods = ['bank', 'card', 'crypto'];
  if (!method || !allowedMethods.includes(method)) {
    return NextResponse.json({ error: 'A valid withdrawal method is required' }, { status: 400 });
  }

  // ── Details validation ─────────────────────────────────────────────────────
  if (
    !details ||
    typeof details !== 'object' ||
    Object.values(details as Record<string, string>).every((v) => !v?.trim())
  ) {
    return NextResponse.json({ error: 'Withdrawal details are required' }, { status: 400 });
  }

  // Per-method required fields (keys match what the frontend sends)
  const requiredFields: Record<string, string[]> = {
    bank:   ['Account Name', 'Bank Name', 'Account Number', 'Routing / Sort Code'],
    card:   ['Cardholder Name', 'Card Number (last 4)', 'Expiry'],
    crypto: ['Coin', 'Network', 'Wallet Address'],
  };

  const required = requiredFields[method] ?? [];
  const missingFields = required.filter(
    (field) => !((details as Record<string, string>)[field]?.trim())
  );

  if (missingFields.length > 0) {
    return NextResponse.json(
      { error: `Missing required fields: ${missingFields.join(', ')}` },
      { status: 400 }
    );
  }

  // ── Password validation ────────────────────────────────────────────────────
  if (!password) {
    return NextResponse.json({ error: 'Password is required' }, { status: 400 });
  }

  // ── Fetch user (balance + password hash in one query) ─────────────────────
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { portfolioBalance: true, password: true },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const passwordMatch = await bcrypt.compare(password, user.password ?? '');
  if (!passwordMatch) {
    return NextResponse.json({ error: 'Incorrect password' }, { status: 401 });
  }

  // ── Balance check ──────────────────────────────────────────────────────────
  if (user.portfolioBalance < Number(amount)) {
    return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 });
  }

  // ── Build note from method details ─────────────────────────────────────────
  const detailsNote = Object.entries(details as Record<string, string>)
    .filter(([, v]) => v?.trim())
    .map(([k, v]) => `${k}: ${v}`)
    .join(' | ');

  const fullNote = [note, detailsNote].filter(Boolean).join(' — ') || null;

  // ── Create withdrawal ──────────────────────────────────────────────────────
  const withdrawal = await prisma.withdrawal.create({
    data: {
      userId,
      amount:   Number(amount),
      currency,
      status:   'PENDING',
      note:     fullNote,
    },
  });

  // ── Activity log ───────────────────────────────────────────────────────────
  await prisma.activityLog.create({
    data: {
      userId,
      description: `Withdrawal of $${Number(amount).toLocaleString()} requested via ${method}`,
    },
  });

  // ── Notify user ────────────────────────────────────────────────────────────
  await prisma.notification.create({
    data: {
      userId,
      message: `Your withdrawal request of $${Number(amount).toLocaleString()} has been received and is under review`,
    },
  });

  return NextResponse.json({ withdrawal }, { status: 201 });
}
