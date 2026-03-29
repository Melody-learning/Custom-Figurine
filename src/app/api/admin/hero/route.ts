import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

// GET /api/admin/hero — list all slides (including inactive)
export async function GET() {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const slides = await prisma.heroSlide.findMany({
    orderBy: { sortOrder: 'asc' },
  });

  return NextResponse.json(slides);
}

// POST /api/admin/hero — create new slide
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const body = await request.json();
  const { tag, tagZh, title, titleZh, description, descriptionZh, imageUrl, thumbUrl, accent } = body;

  // Get max sortOrder
  const maxSort = await prisma.heroSlide.aggregate({ _max: { sortOrder: true } });
  const nextOrder = (maxSort._max.sortOrder ?? -1) + 1;

  const slide = await prisma.heroSlide.create({
    data: {
      tag,
      tagZh: tagZh || null,
      title,
      titleZh: titleZh || null,
      description,
      descriptionZh: descriptionZh || null,
      imageUrl,
      thumbUrl,
      accent: accent || 'from-amber-500/20 via-orange-400/10 to-transparent',
      sortOrder: nextOrder,
    },
  });

  return NextResponse.json(slide, { status: 201 });
}

// PATCH /api/admin/hero — reorder slides
export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const body = await request.json();
  // Expect { order: [{ id: string, sortOrder: number }] }
  const { order } = body as { order: { id: string; sortOrder: number }[] };

  await Promise.all(
    order.map((item) =>
      prisma.heroSlide.update({
        where: { id: item.id },
        data: { sortOrder: item.sortOrder },
      })
    )
  );

  return NextResponse.json({ success: true });
}
