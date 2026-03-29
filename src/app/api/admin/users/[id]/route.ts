import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const { isWhitelisted, maxTotalGenerations, role } = body;

  const data: any = {};
  if (isWhitelisted !== undefined) data.isWhitelisted = isWhitelisted;

  if (maxTotalGenerations !== undefined) data.maxTotalGenerations = maxTotalGenerations;
  if (role !== undefined) data.role = role;

  const user = await prisma.user.update({ where: { id }, data });

  return NextResponse.json(user);
}
