import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { error: 'Please log in to redeem a coupon.' },
        { status: 401 }
      );
    }

    const { code } = await request.json();

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { error: 'Please enter a valid coupon code.' },
        { status: 400 }
      );
    }

    const normalizedCode = code.trim().toUpperCase();

    // 1. Look up the promo coupon
    const promoCoupon = await prisma.promoCoupon.findUnique({
      where: { code: normalizedCode },
    });

    if (!promoCoupon) {
      return NextResponse.json(
        { error: 'Invalid coupon code. Please check and try again.' },
        { status: 404 }
      );
    }

    // 2. Check if active
    if (!promoCoupon.isActive) {
      return NextResponse.json(
        { error: 'This coupon is no longer available.' },
        { status: 410 }
      );
    }

    // 3. Check expiration
    if (promoCoupon.expiresAt && new Date() > promoCoupon.expiresAt) {
      return NextResponse.json(
        { error: 'This coupon has expired.' },
        { status: 410 }
      );
    }

    // 4. Check usage limit
    if (promoCoupon.maxUses !== null && promoCoupon.usedCount >= promoCoupon.maxUses) {
      return NextResponse.json(
        { error: 'This coupon has reached its maximum number of uses.' },
        { status: 410 }
      );
    }

    // 5. Check if user already redeemed this coupon
    const existing = await prisma.userCoupon.findUnique({
      where: {
        userId_promoCouponId: {
          userId,
          promoCouponId: promoCoupon.id,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'You have already redeemed this coupon.' },
        { status: 409 }
      );
    }

    // 6. Create redemption record
    const userCoupon = await prisma.userCoupon.create({
      data: {
        userId,
        promoCouponId: promoCoupon.id,
      },
    });

    return NextResponse.json({
      success: true,
      coupon: {
        id: userCoupon.id,
        code: promoCoupon.code,
        title: promoCoupon.title,
        discountType: promoCoupon.discountType,
        discountValue: promoCoupon.discountValue,
      },
    });
  } catch (error) {
    console.error('Coupon redeem error:', error);
    return NextResponse.json(
      { error: 'Failed to redeem coupon. Please try again later.' },
      { status: 500 }
    );
  }
}
