import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

// PUT /api/admin/ai-models/[id] — update model
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const { modelId, name, description, provider, isActive, sortOrder, config } = body;

  try {
    const model = await prisma.aiModel.update({
      where: { id },
      data: {
        ...(modelId !== undefined && { modelId }),
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(provider !== undefined && { provider }),
        ...(isActive !== undefined && { isActive }),
        ...(sortOrder !== undefined && { sortOrder }),
        ...(config !== undefined && { config }),
      },
    });

    return NextResponse.json(model);
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Model not found' }, { status: 404 });
    }
    throw error;
  }
}

// DELETE /api/admin/ai-models/[id] — delete model
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { id } = await params;

  try {
    await prisma.aiModel.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Model not found' }, { status: 404 });
    }
    throw error;
  }
}
