import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'ADMIN') return null;
  return session;
}

// PATCH /api/admin/style-categories/[id] — 更新大类字段
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const { displayName, name, isOrderable, accentColor, icon, sortOrder, isActive } = body;

  const updated = await prisma.styleCategory.update({
    where: { id },
    data: {
      ...(displayName !== undefined && { displayName }),
      ...(name !== undefined && { name }),
      ...(isOrderable !== undefined && { isOrderable }),
      ...(accentColor !== undefined && { accentColor }),
      ...(icon !== undefined && { icon }),
      ...(sortOrder !== undefined && { sortOrder }),
      ...(isActive !== undefined && { isActive }),
    },
  });

  return NextResponse.json(updated);
}

// DELETE /api/admin/style-categories/[id] — 删除大类（级联删子类）
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { id } = await params;
  await prisma.styleCategory.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
