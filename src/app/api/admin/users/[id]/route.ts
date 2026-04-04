import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { isSuperAdmin } from '@/lib/auth-utils';

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

  // Role changes require super admin
  if (role !== undefined) {
    if (!isSuperAdmin(session.user.email)) {
      return NextResponse.json(
        { error: 'Only super administrators can modify user roles' },
        { status: 403 }
      );
    }

    // Prevent super admin from demoting themselves
    if (id === (session.user as any).id) {
      return NextResponse.json(
        { error: 'You cannot change your own role' },
        { status: 400 }
      );
    }

    // Prevent demoting another super admin
    const targetUser = await prisma.user.findUnique({
      where: { id },
      select: { email: true },
    });
    if (targetUser && isSuperAdmin(targetUser.email)) {
      return NextResponse.json(
        { error: 'Cannot modify another super administrator\'s role' },
        { status: 403 }
      );
    }
  }

  const data: any = {};
  if (isWhitelisted !== undefined) data.isWhitelisted = isWhitelisted;
  if (maxTotalGenerations !== undefined) data.maxTotalGenerations = maxTotalGenerations;
  if (role !== undefined) data.role = role;

  const user = await prisma.user.update({ where: { id }, data });

  return NextResponse.json(user);
}
