import { NextResponse } from 'next/server';
import { createCheckout } from '@/lib/shopify';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { generateOrderNumber } from '@/lib/order';

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
  discountCode?: string;
  discountAmount?: number;
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
    const { items, discountCode, discountAmount = 0 } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Invalid or empty cart items payload' },
        { status: 400 }
      );
    }

    // 2. 计算金额
    const subtotalAmount = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const totalAmount = subtotalAmount - discountAmount;

    // 3. 生成订单号
    const orderNumber = await generateOrderNumber();

    // 4. 创建本地 Order (PENDING) + OrderItems
    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId,
        status: 'PENDING',
        subtotalAmount,
        discountCode: discountCode || null,
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

    // 5. 尝试创建 Shopify Draft Order
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
        // 追加前端传来的 customAttributes（已上传到 Blob 的）
        if (item.customAttributes && item.customAttributes.length > 0) {
          customAttrs.push(...item.customAttributes.filter(attr => attr.value && attr.value.trim() !== ''));
        }

        if (customAttrs.length > 0) {
          shopifyItem.customAttributes = customAttrs;
        }

        return shopifyItem;
      });

      // 注入 localOrderId 到订单级 customAttributes（替代 userId）
      const checkout = await createCheckout(shopifyItems, userId, order.id);

      // 6. 回写 Shopify 信息到本地 Order
      await prisma.order.update({
        where: { id: order.id },
        data: {
          shopifyDraftOrderId: checkout.draftOrderId || null,
          invoiceUrl: checkout.webUrl,
        },
      });

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
