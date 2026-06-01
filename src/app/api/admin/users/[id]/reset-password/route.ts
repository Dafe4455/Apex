import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@root/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

function isAdmin(s: any) { return s?.user?.role === 'ADMIN'; }

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || !isAdmin(session))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const { password } = await req.json();

  if (!password || password.length < 6)
    return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });

  const hashed = await bcrypt.hash(password, 12);

  await prisma.user.update({
    where: { id },
    data: { password: hashed },
  });

  return NextResponse.json({ success: true });
}
