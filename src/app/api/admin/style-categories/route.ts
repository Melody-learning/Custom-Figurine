import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'ADMIN') return null;
  return session;
}

// GET /api/admin/style-categories — 所有大类（含子类，含停用）
export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const categories = await prisma.styleCategory.findMany({
    orderBy: { sortOrder: 'asc' },
    include: {
      presets: {
        orderBy: { sortOrder: 'asc' },
        include: { aiModel: { select: { id: true, name: true, modelId: true, provider: true } } },
      },
    },
  });

  return NextResponse.json(categories);
}

// POST /api/admin/style-categories — 新建大类
export async function POST(request: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const body = await request.json();
  const { slug, displayName, name, isOrderable, accentColor, icon, sortOrder } = body;

  if (!slug || !displayName) {
    return NextResponse.json({ error: 'slug and displayName are required' }, { status: 400 });
  }

  const existing = await prisma.styleCategory.findUnique({ where: { slug } });
  if (existing) {
    return NextResponse.json({ error: `Category with slug "${slug}" already exists` }, { status: 409 });
  }

  const category = await prisma.styleCategory.create({
    data: {
      slug,
      displayName,
      name: name || displayName,
      isOrderable: isOrderable ?? true,
      accentColor: accentColor || '#6B7280',
      icon: icon || 'Box',
      sortOrder: sortOrder ?? 0,
    },
  });

  return NextResponse.json(category, { status: 201 });
}
