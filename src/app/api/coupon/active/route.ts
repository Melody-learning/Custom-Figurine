import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { WELCOME_COUPON } from '@/lib/constants/coupon';

export async function GET() {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required.' },
        { status: 401 }
      );
    }

    // 1. Check welcome coupon status
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { hasWelcomeCoupon: true },
    });

    // 2. Get unredeemed KOL coupons (only active & non-expired)
    const kolCoupons = await prisma.userCoupon.findMany({
      where: {
        userId,
        isUsed: false,
        promoCoupon: {
          isActive: true,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } },
          ],
        },
      },
      include: { promoCoupon: true },
      orderBy: { createdAt: 'desc' },
    });

    // Build response
    const coupons: Array<{
      id: string;
      code: string;
      title: string;
      discountType: string;
      discountValue: number;
      source: 'WELCOME' | 'KOL';
      isUsed: boolean;
    }> = [];

    // Welcome coupon
    if (user?.hasWelcomeCoupon) {
      coupons.push({
        id: 'welcome',
        code: WELCOME_COUPON.CODE,
        title: WELCOME_COUPON.TITLE,
        discountType: WELCOME_COUPON.VALUE_TYPE,
        discountValue: WELCOME_COUPON.VALUE,
        source: 'WELCOME',
        isUsed: false,
      });
    }

    // KOL coupons
    for (const uc of kolCoupons) {
      coupons.push({
        id: uc.id,
        code: uc.promoCoupon.code,
        title: uc.promoCoupon.title,
        discountType: uc.promoCoupon.discountType,
        discountValue: uc.promoCoupon.discountValue,
        source: 'KOL',
        isUsed: false,
      });
    }

    return NextResponse.json({
      coupons,
      hasAnyCoupon: coupons.length > 0,
    });
  } catch (error) {
    console.error('Coupon active query error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch coupons.' },
      { status: 500 }
    );
  }
}
