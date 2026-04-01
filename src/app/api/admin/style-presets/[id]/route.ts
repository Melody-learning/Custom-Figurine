import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'ADMIN') return null;
  return session;
}

// PATCH /api/admin/style-presets/[id] — 更新子类
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const { name, primaryPrompt, previewImageUrl, aiModelId, sortOrder, isActive } = body;

  const updated = await prisma.stylePreset.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(primaryPrompt !== undefined && { primaryPrompt }),
      ...(previewImageUrl !== undefined && { previewImageUrl: previewImageUrl || null }),
      ...(aiModelId !== undefined && { aiModelId: aiModelId || null }),
      ...(sortOrder !== undefined && { sortOrder }),
      ...(isActive !== undefined && { isActive }),
    },
    include: { aiModel: { select: { id: true, name: true, modelId: true, provider: true } } },
  });

  return NextResponse.json(updated);
}

// DELETE /api/admin/style-presets/[id] — 删除子类
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { id } = await params;
  await prisma.stylePreset.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
