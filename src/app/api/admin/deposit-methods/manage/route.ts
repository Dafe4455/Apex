// src/app/api/admin/deposit-methods/manage/route.ts
// Admin-only CRUD — protect with role check

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@root/auth';
import { prisma } from '@/lib/prisma';

function isAdmin(session: any) {
  return session?.user?.role === 'ADMIN';
}

// GET /api/admin/deposit-methods/manage — all methods (including inactive)
export async function GET() {
  const session = await auth();
if (!session || !isAdmin(session)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const methods = await prisma.depositMethod.findMany({
    orderBy: { sortOrder: 'asc' },
  });

  return NextResponse.json(methods);
}

// POST /api/admin/deposit-methods/manage — create new method
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !isAdmin(session)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const { label, icon, address, network, note, isActive, sortOrder } = body;

  if (!label || !address) {
    return NextResponse.json({ error: 'label and address are required' }, { status: 400 });
  }

  const method = await prisma.depositMethod.create({
    data: {
      label,
      icon: icon ?? '💳',
      address,
      network: network ?? null,
      note: note ?? null,
      isActive: isActive ?? true,
      sortOrder: sortOrder ?? 0,
    },
  });

  return NextResponse.json(method, { status: 201 });
}

// PATCH /api/admin/deposit-methods/manage — update a method
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !isAdmin(session)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const { id, ...data } = body;

  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }

  const method = await prisma.depositMethod.update({
    where: { id },
    data,
  });

  return NextResponse.json(method);
}

// DELETE /api/admin/deposit-methods/manage — delete a method
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !isAdmin(session)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }

  await prisma.depositMethod.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
