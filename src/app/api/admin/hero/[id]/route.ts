import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

// PUT /api/admin/hero/[id] — update slide
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
  const { tag, tagZh, title, titleZh, description, descriptionZh, imageUrl, thumbUrl, accent, isActive } = body;

  const slide = await prisma.heroSlide.update({
    where: { id },
    data: {
      ...(tag !== undefined && { tag }),
      ...(tagZh !== undefined && { tagZh }),
      ...(title !== undefined && { title }),
      ...(titleZh !== undefined && { titleZh }),
      ...(description !== undefined && { description }),
      ...(descriptionZh !== undefined && { descriptionZh }),
      ...(imageUrl !== undefined && { imageUrl }),
      ...(thumbUrl !== undefined && { thumbUrl }),
      ...(accent !== undefined && { accent }),
      ...(isActive !== undefined && { isActive }),
    },
  });

  return NextResponse.json(slide);
}

// DELETE /api/admin/hero/[id] — delete slide
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { id } = await params;
  await prisma.heroSlide.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
