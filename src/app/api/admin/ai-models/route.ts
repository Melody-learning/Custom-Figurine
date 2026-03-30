import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

// GET /api/admin/ai-models — list all models (including inactive)
export async function GET() {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const models = await prisma.aiModel.findMany({
    orderBy: { sortOrder: 'asc' },
  });

  return NextResponse.json(models);
}

// POST /api/admin/ai-models — create new model
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const body = await request.json();
  const { modelId, name, description, provider, isActive, sortOrder, config } = body;

  if (!modelId || !name || !provider) {
    return NextResponse.json(
      { error: 'modelId, name, and provider are required' },
      { status: 400 }
    );
  }

  // Check for duplicate modelId
  const existing = await prisma.aiModel.findUnique({ where: { modelId } });
  if (existing) {
    return NextResponse.json(
      { error: `Model with modelId "${modelId}" already exists` },
      { status: 409 }
    );
  }

  const model = await prisma.aiModel.create({
    data: {
      modelId,
      name,
      description: description || null,
      provider,
      isActive: isActive ?? true,
      sortOrder: sortOrder ?? 0,
      config: config || null,
    },
  });

  return NextResponse.json(model, { status: 201 });
}
