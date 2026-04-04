import { NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { WELCOME_COUPON } from '@/lib/constants/coupon';
import { updateOrderStatus } from '@/lib/order';
import { OrderStatus } from '@prisma/client';

export async function POST(req: Request) {
  const logCtx: Record<string, unknown> = { timestamp: new Date().toISOString() };

  try {
    const rawBody = await req.text();
    const hmacHeader = req.headers.get('X-Shopify-Hmac-Sha256');
    const topic = req.headers.get('X-Shopify-Topic');

    logCtx.topic = topic;
    logCtx.hmacPresent = !!hmacHeader;
    logCtx.bodyLength = rawBody.length;

    // 1. Verify HMAC
    const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
    if (!secret) {
      console.error('WEBHOOK ERROR: SHOPIFY_WEBHOOK_SECRET not configured', logCtx);
      return NextResponse.json({ error: 'Internal Configuration Error' }, { status: 500 });
    }

    if (!hmacHeader) {
      console.error('WEBHOOK ERROR: Missing HMAC header', logCtx);
      return NextResponse.json({ error: 'Missing HMAC Header' }, { status: 401 });
    }

    const generatedHash = crypto
      .createHmac('sha256', secret)
      .update(rawBody, 'utf8')
      .digest('base64');

    if (generatedHash !== hmacHeader) {
      console.error('WEBHOOK ERROR: HMAC mismatch', {
        ...logCtx,
        expected: generatedHash.slice(0, 10) + '...',
        received: hmacHeader.slice(0, 10) + '...',
      });
      return NextResponse.json({ error: 'Unauthorized payload' }, { status: 401 });
    }

    logCtx.hmacVerified = true;

    // 2. Parse payload
    const payload = JSON.parse(rawBody);

    // ============================================
    // Handle: orders/create or orders/paid
    // ============================================
    if (topic === 'orders/create' || topic === 'orders/paid') {
      const shopifyOrderId = payload.id?.toString();
      logCtx.shopifyOrderId = shopifyOrderId;

      if (!shopifyOrderId) {
        console.log('WEBHOOK: No order ID in payload, skipping', logCtx);
        return NextResponse.json({ received: true });
      }

      // 提取 localOrderId
      const localOrderId = extractAttribute(payload, 'localOrderId');
      logCtx.localOrderId = localOrderId;
      logCtx.noteAttributes = payload.note_attributes;

      // 提取 draft_order_id（Shopify webhook payload 可能包含）
      const draftOrderId = payload.draft_order_id?.toString();
      logCtx.payloadDraftOrderId = draftOrderId;

      // ---- 策略 1: 通过 localOrderId 查找 ----
      let order = localOrderId
        ? await prisma.order.findUnique({ where: { id: localOrderId } })
        : null;
      logCtx.foundByLocalId = !!order;

      // ---- 策略 2: 通过 shopifyOrderId 查找 ----
      if (!order) {
        order = await prisma.order.findFirst({
          where: { shopifyOrderId },
        });
        logCtx.foundByShopifyOrderId = !!order;
      }

      // ---- 策略 3: 通过 shopifyDraftOrderId 查找 ----
      if (!order && draftOrderId) {
        // Shopify webhook 中的 draft_order_id 是数字 ID，但我们存的是 GID
        const draftOrderGid = `gid://shopify/DraftOrder/${draftOrderId}`;
        order = await prisma.order.findFirst({
          where: { shopifyDraftOrderId: draftOrderGid },
        });
        logCtx.foundByDraftOrderId = !!order;
        logCtx.draftOrderGid = draftOrderGid;
      }

      if (!order) {
        console.log('WEBHOOK: Order NOT found by any strategy', logCtx);
        return NextResponse.json({ received: true });
      }

      logCtx.matchedOrder = order.orderNumber;
      logCtx.currentStatus = order.status;

      // 更新状态
      if (order.status === 'PENDING') {
        await updateOrderStatus(order.id, OrderStatus.PROCESSING, {
          shopifyOrderId,
        });
        console.log(`WEBHOOK OK: ${order.orderNumber} → PROCESSING`, logCtx);

        // ---- 核销优惠券 ----
        if (order.discountCode && order.userId) {
          try {
            if (order.discountCode === WELCOME_COUPON.CODE) {
              // 欢迎券核销
              await prisma.user.update({
                where: { id: order.userId },
                data: { hasWelcomeCoupon: false },
              });
              console.log(`WEBHOOK: Welcome coupon revoked for user ${order.userId}`);
            } else {
              // KOL 券核销
              const userCoupon = await prisma.userCoupon.findFirst({
                where: { userId: order.userId, isUsed: false },
                include: { promoCoupon: true },
              });
              if (userCoupon && userCoupon.promoCoupon.code === order.discountCode) {
                await prisma.$transaction([
                  prisma.userCoupon.update({
                    where: { id: userCoupon.id },
                    data: { isUsed: true, usedAt: new Date(), usedOrderId: order.id },
                  }),
                  prisma.promoCoupon.update({
                    where: { id: userCoupon.promoCouponId },
                    data: { usedCount: { increment: 1 } },
                  }),
                ]);
                console.log(`WEBHOOK: KOL coupon ${order.discountCode} revoked for user ${order.userId}`);
              }
            }
          } catch (couponError) {
            // 核销失败不应阻塞订单状态转换
            console.error('WEBHOOK: Coupon revocation failed (non-blocking):', couponError);
          }
        }
      } else {
        if (!order.shopifyOrderId) {
          await prisma.order.update({
            where: { id: order.id },
            data: { shopifyOrderId },
          });
        }
        console.log(`WEBHOOK: ${order.orderNumber} already ${order.status}, skipped`, logCtx);
      }

      return NextResponse.json({ success: true });
    }

    // ============================================
    // Handle: orders/fulfilled
    // ============================================
    if (topic === 'orders/fulfilled' || topic === 'orders/updated') {
      const shopifyOrderId = payload.id?.toString();
      if (!shopifyOrderId) {
        return NextResponse.json({ received: true });
      }

      if (payload.fulfillment_status !== 'fulfilled' && topic !== 'orders/fulfilled') {
        return NextResponse.json({ received: true });
      }

      const order = await findOrderByPayload(payload);

      if (!order) {
        console.log(`WEBHOOK fulfilled: Order not found for shopifyOrderId=${shopifyOrderId}`, logCtx);
        return NextResponse.json({ received: true });
      }

      let trackingNumber = null;
      let trackingUrl = null;
      if (payload.fulfillments && payload.fulfillments.length > 0) {
        const fulfillment = payload.fulfillments[payload.fulfillments.length - 1];
        trackingNumber = fulfillment.tracking_number || null;
        trackingUrl = fulfillment.tracking_url || null;
      }

      if (order.status === 'PROCESSING') {
        await updateOrderStatus(order.id, OrderStatus.SHIPPED, {
          trackingNumber: trackingNumber || undefined,
          trackingUrl: trackingUrl || undefined,
        });
        console.log(`WEBHOOK OK: ${order.orderNumber} → SHIPPED (tracking: ${trackingNumber})`);
      } else {
        if (trackingNumber || trackingUrl) {
          await prisma.order.update({
            where: { id: order.id },
            data: {
              ...(trackingNumber && { trackingNumber }),
              ...(trackingUrl && { trackingUrl }),
            },
          });
        }
        console.log(`WEBHOOK: ${order.orderNumber} already ${order.status}, updated tracking only`);
      }

      return NextResponse.json({ success: true });
    }

    // ============================================
    // Handle: refunds/create
    // ============================================
    if (topic === 'refunds/create') {
      const shopifyOrderId = payload.order_id?.toString();
      if (!shopifyOrderId) {
        return NextResponse.json({ received: true });
      }

      const order = await prisma.order.findFirst({
        where: { shopifyOrderId },
      });

      if (!order) {
        console.log(`WEBHOOK refund: Order not found for shopifyOrderId=${shopifyOrderId}`);
        return NextResponse.json({ received: true });
      }

      if (order.status === 'PROCESSING') {
        await updateOrderStatus(order.id, OrderStatus.REFUNDED);
        console.log(`WEBHOOK OK: ${order.orderNumber} → REFUNDED`);
      } else {
        console.log(`WEBHOOK: ${order.orderNumber} in ${order.status}, cannot refund`);
      }

      return NextResponse.json({ success: true });
    }

    console.log(`WEBHOOK: Unhandled topic "${topic}"`, logCtx);
    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('WEBHOOK FATAL ERROR:', error, logCtx);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

// ========================================
// 多策略查找订单
// ========================================
async function findOrderByPayload(payload: Record<string, unknown>) {
  const shopifyOrderId = (payload.id as number)?.toString();
  const localOrderId = extractAttribute(payload, 'localOrderId');
  const draftOrderId = (payload.draft_order_id as number)?.toString();

  // 策略 1: localOrderId
  if (localOrderId) {
    const order = await prisma.order.findUnique({ where: { id: localOrderId } });
    if (order) return order;
  }

  // 策略 2: shopifyOrderId
  if (shopifyOrderId) {
    const order = await prisma.order.findFirst({ where: { shopifyOrderId } });
    if (order) return order;
  }

  // 策略 3: draftOrderId → GID
  if (draftOrderId) {
    const gid = `gid://shopify/DraftOrder/${draftOrderId}`;
    const order = await prisma.order.findFirst({ where: { shopifyDraftOrderId: gid } });
    if (order) return order;
  }

  return null;
}

// ========================================
// 从 Shopify payload 提取 custom attribute
// ========================================
function extractAttribute(payload: Record<string, unknown>, key: string): string | null {
  const sources = [
    payload.note_attributes,
    payload.custom_attributes,
  ];

  for (const source of sources) {
    if (Array.isArray(source)) {
      const attr = source.find(
        (a: { name?: string; key?: string; value?: string }) =>
          a.name === key || a.key === key
      );
      if (attr?.value) {
        return attr.value;
      }
    }
  }

  return null;
}
