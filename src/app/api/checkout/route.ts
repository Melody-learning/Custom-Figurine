import { NextResponse } from 'next/server';
import { createCheckout } from '@/lib/shopify';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { generateOrderNumber } from '@/lib/order';
import { WELCOME_COUPON, type AppliedDiscount } from '@/lib/constants/coupon';

interface CheckoutItem {
  variantId: string;
  quantity: number;
  title: string;
  price: number;
  size?: string;
  originalImageUrl?: string;
  generatedImageUrl?: string;
  generatedAssetId?: string;
  customInstructions?: string;
  customAttributes?: Array<{ key: string; value: string }>;
}

interface CheckoutRequestBody {
  items: CheckoutItem[];
  // Optional: user can specify which coupon to use. Server validates ownership.
  selectedCouponCode?: string;
}

/**
 * Resolve the best available discount for this user.
 * Compares actual discount amounts (needs subtotal) and picks the largest.
 * Returns null if no discount is available.
 */
async function resolveUserDiscount(userId: string, subtotal: number, selectedCode?: string): Promise<{
  discount: AppliedDiscount;
  code: string;
  source: 'KOL' | 'WELCOME';
  userCouponId?: string;
} | null> {
  // User explicitly chose "No coupon"
  if (selectedCode === '__NONE__') return null;
  // Helper: calculate actual dollar discount
  const calcAmount = (type: string, value: number) =>
    type === 'PERCENTAGE'
      ? subtotal * (value / 100)
      : Math.min(value, subtotal);

  // Candidate list
  const candidates: Array<{
    discount: AppliedDiscount;
    code: string;
    source: 'KOL' | 'WELCOME';
    userCouponId?: string;
    amount: number;
  }> = [];

  // 1. Check welcome coupon
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { hasWelcomeCoupon: true },
  });

  if (user?.hasWelcomeCoupon) {
    candidates.push({
      discount: {
        title: WELCOME_COUPON.TITLE,
        valueType: WELCOME_COUPON.VALUE_TYPE,
        value: WELCOME_COUPON.VALUE,
      },
      code: WELCOME_COUPON.CODE,
      source: 'WELCOME',
      amount: calcAmount(WELCOME_COUPON.VALUE_TYPE, WELCOME_COUPON.VALUE),
    });
  }

  // 2. Check KOL coupons (unused, active, non-expired)
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
  });

  for (const uc of kolCoupons) {
    if (uc.promoCoupon) {
      candidates.push({
        discount: {
          title: uc.promoCoupon.title,
          valueType: uc.promoCoupon.discountType as 'PERCENTAGE' | 'FIXED_AMOUNT',
          value: uc.promoCoupon.discountValue,
        },
        code: uc.promoCoupon.code,
        source: 'KOL',
        userCouponId: uc.id,
        amount: calcAmount(uc.promoCoupon.discountType, uc.promoCoupon.discountValue),
      });
    }
  }

  if (candidates.length === 0) return null;

  // If user specified a coupon, validate and use it
  if (selectedCode) {
    const chosen = candidates.find(c => c.code === selectedCode);
    if (chosen) {
      return {
        discount: chosen.discount,
        code: chosen.code,
        source: chosen.source,
        userCouponId: chosen.userCouponId,
      };
    }
    // selectedCode not found in user's available coupons — fall through to best
  }

  // Default: pick the candidate with the highest actual discount amount
  candidates.sort((a, b) => b.amount - a.amount);
  const best = candidates[0];

  return {
    discount: best.discount,
    code: best.code,
    source: best.source,
    userCouponId: best.userCouponId,
  };
}

export async function POST(request: Request) {
  try {
    // 1. 验证 session（必须登录）
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required. Please log in to checkout.' },
        { status: 401 }
      );
    }

    const body: CheckoutRequestBody = await request.json();
    const { items, selectedCouponCode } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Invalid or empty cart items payload' },
        { status: 400 }
      );
    }

    // 2. 计算 subtotal（先算小计，才能比较折扣大小）
    const subtotalAmount = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    // 3. 服务端折扣决策（传入用户选择的券码，服务端验证后应用）
    const resolvedDiscount = await resolveUserDiscount(userId, subtotalAmount, selectedCouponCode);

    let discountAmount = 0;
    if (resolvedDiscount) {
      if (resolvedDiscount.discount.valueType === 'PERCENTAGE') {
        discountAmount = subtotalAmount * (resolvedDiscount.discount.value / 100);
      } else {
        discountAmount = Math.min(resolvedDiscount.discount.value, subtotalAmount);
      }
    }
    // Round to 2 decimal places
    discountAmount = Math.round(discountAmount * 100) / 100;
    const totalAmount = Math.round((subtotalAmount - discountAmount) * 100) / 100;

    // 4. 生成订单号
    const orderNumber = await generateOrderNumber();

    // 5. 创建本地 Order (PENDING) + OrderItems
    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId,
        status: 'PENDING',
        subtotalAmount,
        discountCode: resolvedDiscount?.code || null,
        discountAmount,
        totalAmount,
        currency: 'USD',
        items: {
          create: items.map((item) => ({
            variantId: item.variantId,
            title: item.title || 'Custom Figurine',
            price: item.price,
            quantity: item.quantity,
            size: item.size || null,
            originalImageUrl: item.originalImageUrl || null,
            generatedImageUrl: item.generatedImageUrl || null,
            generatedAssetId: item.generatedAssetId || null,
            customInstructions: item.customInstructions || null,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    // 6. 尝试创建 Shopify Draft Order
    try {
      // 构建 Shopify 需要的 items 格式
      const shopifyItems = items.map((item) => {
        const shopifyItem: {
          variantId: string;
          quantity: number;
          customAttributes?: Array<{ key: string; value: string }>;
        } = {
          variantId: item.variantId,
          quantity: item.quantity,
        };

        // 注入定制图片和信息到 customAttributes
        const customAttrs: Array<{ key: string; value: string }> = [];
        if (item.generatedImageUrl) {
          customAttrs.push({ key: '_AI Generated Image', value: item.generatedImageUrl });
        }
        if (item.originalImageUrl) {
          customAttrs.push({ key: '_Uploaded Image', value: item.originalImageUrl });
        }
        if (item.customInstructions) {
          customAttrs.push({ key: '_Custom Instructions', value: item.customInstructions });
        }
        if (item.customAttributes && item.customAttributes.length > 0) {
          customAttrs.push(...item.customAttributes.filter(attr => attr.value && attr.value.trim() !== ''));
        }

        if (customAttrs.length > 0) {
          shopifyItem.customAttributes = customAttrs;
        }

        return shopifyItem;
      });

      // 传入服务端决定的折扣（直接嵌入 Draft Order 的 appliedDiscount）
      const checkout = await createCheckout(
        shopifyItems,
        userId,
        order.id,
        resolvedDiscount?.discount // undefined if no discount
      );

      // 7. 回写 Shopify 信息到本地 Order
      await prisma.order.update({
        where: { id: order.id },
        data: {
          shopifyDraftOrderId: checkout.draftOrderId || null,
          invoiceUrl: checkout.webUrl,
        },
      });

      // NOTE: 优惠券不在此处核销！核销由 Shopify Webhook (orders/paid) 触发

      return NextResponse.json({
        url: checkout.webUrl,
        orderId: order.id,
        orderNumber: order.orderNumber,
      });
    } catch (shopifyError: unknown) {
      console.error('Shopify Draft Order creation failed:', shopifyError);

      // 开发环境：返回模拟支付页面
      if (process.env.NODE_ENV === 'development') {
        console.log(`[DEV] Shopify failed, redirecting to simulate-payment for order ${order.id}`);
        return NextResponse.json({
          url: `/dev/simulate-payment?orderId=${order.id}`,
          orderId: order.id,
          orderNumber: order.orderNumber,
          devMode: true,
        });
      }

      // 生产环境：标记订单为 CANCELLED，返回错误
      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
        },
      });

      return NextResponse.json(
        {
          error: 'Failed to create checkout session',
          details: shopifyError instanceof Error ? shopifyError.message : String(shopifyError),
        },
        { status: 500 }
      );
    }
  } catch (error: unknown) {
    console.error('API Checkout Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to create checkout session',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
