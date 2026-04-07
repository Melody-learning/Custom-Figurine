import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/style-presets — 前台读取（无鉴权），只返回 isActive 数据
export async function GET() {
  try {
    const categories = await prisma.styleCategory.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        presets: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
          select: {
            id: true,
            slug: true,
            categoryId: true,
            name: true,
            primaryPrompt: true,
            previewImageUrl: true,
            aiModelId: true,
            aiModel: { select: { modelId: true } },  // join 获取实际的 modelId 字符串
            sortOrder: true,
          },
        },
      },
    });

    // 将 DB 记录映射为前台期望格式（slug 作为 id，保持与 Phase 1 静态常量兼容）
    const result = categories.map((cat) => ({
      id: cat.slug,          // 兼容前台消费侧使用的字符串 ID
      _dbId: cat.id,         // DB 主键（供调试用）
      slug: cat.slug,
      name: cat.name,
      displayName: cat.displayName,
      isOrderable: cat.isOrderable,
      accentColor: cat.accentColor,
      icon: cat.icon,
      sortOrder: cat.sortOrder,
      presets: cat.presets.map((p) => ({
        id: p.slug,           // 兼容前台消费侧使用的字符串 ID
        _dbId: p.id,
        categoryId: cat.slug, // 使用 slug 保持一致
        name: p.name,
        primaryPrompt: p.primaryPrompt,
        previewImageUrl: p.previewImageUrl,
        aiModelId: p.aiModel?.modelId || null,  // ★ 返回 modelId 字符串，而非 DB 外键
        sortOrder: p.sortOrder,
      })),
    }));

    return NextResponse.json(result);
  } catch {
    // DB 不可用时返回空数组，前台静默 fallback 到静态常量
    return NextResponse.json([]);
  }
}
