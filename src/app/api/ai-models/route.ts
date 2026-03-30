import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * GET /api/ai-models
 * 公开端点：返回所有已启用的 AI 模型列表
 */
export async function GET() {
  try {
    const models = await prisma.aiModel.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        modelId: true,
        name: true,
        description: true,
        provider: true,
        sortOrder: true,
      },
    });

    return NextResponse.json({ models });
  } catch (error: any) {
    console.error('[API:ai-models] Error fetching models:', error);
    return NextResponse.json(
      { error: 'Failed to fetch AI models' },
      { status: 500 }
    );
  }
}
