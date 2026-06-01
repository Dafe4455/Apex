// src/app/api/admin/deposit-methods/route.ts

import { NextResponse } from 'next/server';
import { auth } from '@root/auth';
import { prisma } from '@/lib/prisma';

// GET /api/admin/deposit-methods
// Public to authenticated users — returns active deposit methods
export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const methods = await prisma.depositMethod.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
    select: {
      id: true,
      label: true,
      icon: true,
      address: true,
      network: true,
      note: true,
    },
  });

  return NextResponse.json(methods);
}
