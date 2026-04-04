import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

// GET: List all promo codes
export async function GET() {
  const session = await auth();
  if ((session?.user as { role?: string })?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const promoCoupons = await prisma.promoCoupon.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { redemptions: true } },
    },
  });

  return NextResponse.json({ promoCoupons });
}

// POST: Create a new promo code
export async function POST(request: Request) {
  const session = await auth();
  if ((session?.user as { role?: string })?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const body = await request.json();
  const { code, title, discountType, discountValue, maxUses, expiresAt } = body;

  if (!code || !title || !discountType || discountValue === undefined) {
    return NextResponse.json(
      { error: 'Missing required fields: code, title, discountType, discountValue' },
      { status: 400 }
    );
  }

  if (!['PERCENTAGE', 'FIXED_AMOUNT'].includes(discountType)) {
    return NextResponse.json(
      { error: 'discountType must be PERCENTAGE or FIXED_AMOUNT' },
      { status: 400 }
    );
  }

  if (discountType === 'PERCENTAGE' && (discountValue < 0 || discountValue > 100)) {
    return NextResponse.json(
      { error: 'Percentage discount must be between 0 and 100' },
      { status: 400 }
    );
  }

  try {
    const promoCoupon = await prisma.promoCoupon.create({
      data: {
        code: code.trim().toUpperCase(),
        title: title.trim(),
        discountType,
        discountValue: Number(discountValue),
        maxUses: maxUses ? Number(maxUses) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    });

    return NextResponse.json({ promoCoupon }, { status: 201 });
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && (error as { code: string }).code === 'P2002') {
      return NextResponse.json(
        { error: `A promo code with code "${code}" already exists.` },
        { status: 409 }
      );
    }
    throw error;
  }
}

// PATCH: Toggle active status
export async function PATCH(request: Request) {
  const session = await auth();
  if ((session?.user as { role?: string })?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { id, isActive } = await request.json();
  if (!id || typeof isActive !== 'boolean') {
    return NextResponse.json({ error: 'id and isActive required' }, { status: 400 });
  }

  const updated = await prisma.promoCoupon.update({
    where: { id },
    data: { isActive },
  });

  return NextResponse.json({ promoCoupon: updated });
}
