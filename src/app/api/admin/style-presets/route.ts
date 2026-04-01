import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'ADMIN') return null;
  return session;
}

// POST /api/admin/style-presets — 新建子类
export async function POST(request: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const body = await request.json();
  const { categoryId, slug, name, primaryPrompt, previewImageUrl, aiModelId, sortOrder } = body;

  if (!categoryId || !slug || !name || !primaryPrompt) {
    return NextResponse.json(
      { error: 'categoryId, slug, name, and primaryPrompt are required' },
      { status: 400 }
    );
  }

  const preset = await prisma.stylePreset.create({
    data: {
      categoryId,
      slug,
      name,
      primaryPrompt,
      previewImageUrl: previewImageUrl || null,
      aiModelId: aiModelId || null,
      sortOrder: sortOrder ?? 0,
    },
    include: { aiModel: { select: { id: true, name: true, modelId: true, provider: true } } },
  });

  return NextResponse.json(preset, { status: 201 });
}
