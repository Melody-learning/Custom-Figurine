import { NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { updateOrderStatus } from '@/lib/order';
import { OrderStatus } from '@prisma/client';

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const hmacHeader = req.headers.get('X-Shopify-Hmac-Sha256');
    const topic = req.headers.get('X-Shopify-Topic'); // e.g., orders/create, orders/fulfilled, refunds/create
    
    // 1. Verify webhook HMAC signature
    const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
    if (!secret) {
      console.error('SHOPIFY_WEBHOOK_SECRET is not configured.');
      return NextResponse.json({ error: 'Internal Configuration Error' }, { status: 500 });
    }

    if (!hmacHeader) {
      return NextResponse.json({ error: 'Missing HMAC Header' }, { status: 401 });
    }

    const generatedHash = crypto
      .createHmac('sha256', secret)
      .update(rawBody, 'utf8')
      .digest('base64');
      
    if (generatedHash !== hmacHeader) {
      console.error('Shopify Webhook HMAC verification failed');
      return NextResponse.json({ error: 'Unauthorized payload' }, { status: 401 });
    }

    // 2. Parse payload
    const payload = JSON.parse(rawBody);

    // ========================================
    // Handle: orders/create (支付成功 → PROCESSING)
    // ========================================
    if (topic === 'orders/create' || topic === 'orders/paid') {
      const shopifyOrderId = payload.id?.toString();
      if (!shopifyOrderId) {
        return NextResponse.json({ received: true });
      }

      // 从 custom_attributes (note_attributes) 提取 localOrderId
      const localOrderId = extractAttribute(payload, 'localOrderId');

      // 尝试查找本地订单
      let order = localOrderId
        ? await prisma.order.findUnique({ where: { id: localOrderId } })
        : null;

      // Fallback: 通过 shopifyOrderId 匹配（如果 localOrderId 找不到）
      if (!order) {
        order = await prisma.order.findFirst({
          where: { shopifyOrderId: shopifyOrderId },
        });
      }

      if (!order) {
        console.log(`Webhook: Order not found for localOrderId=${localOrderId}, shopifyOrderId=${shopifyOrderId}. Skipping.`);
        return NextResponse.json({ received: true });
      }

      // 仅 PENDING 状态可转为 PROCESSING
      if (order.status === 'PENDING') {
        await updateOrderStatus(order.id, OrderStatus.PROCESSING, {
          shopifyOrderId: shopifyOrderId,
        });
        console.log(`Webhook: Order ${order.orderNumber} → PROCESSING (Shopify ID: ${shopifyOrderId})`);
      } else {
        // 如果还没有 shopifyOrderId，补上
        if (!order.shopifyOrderId) {
          await prisma.order.update({
            where: { id: order.id },
            data: { shopifyOrderId },
          });
        }
        console.log(`Webhook: Order ${order.orderNumber} already in ${order.status}, skipping status update.`);
      }

      return NextResponse.json({ success: true });
    }

    // ========================================
    // Handle: orders/fulfilled (发货 → SHIPPED)
    // ========================================
    if (topic === 'orders/fulfilled' || topic === 'orders/updated') {
      const shopifyOrderId = payload.id?.toString();
      if (!shopifyOrderId) {
        return NextResponse.json({ received: true });
      }

      // 检查是否真的是 fulfilled
      if (payload.fulfillment_status !== 'fulfilled' && topic !== 'orders/fulfilled') {
        return NextResponse.json({ received: true });
      }

      const localOrderId = extractAttribute(payload, 'localOrderId');

      let order = localOrderId
        ? await prisma.order.findUnique({ where: { id: localOrderId } })
        : null;

      if (!order) {
        order = await prisma.order.findFirst({
          where: { shopifyOrderId: shopifyOrderId },
        });
      }

      if (!order) {
        console.log(`Webhook fulfilled: Order not found for shopifyOrderId=${shopifyOrderId}. Skipping.`);
        return NextResponse.json({ received: true });
      }

      // 提取物流信息
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
        console.log(`Webhook: Order ${order.orderNumber} → SHIPPED (tracking: ${trackingNumber})`);
      } else {
        // 补充物流信息（即使状态已是 SHIPPED）
        if (trackingNumber || trackingUrl) {
          await prisma.order.update({
            where: { id: order.id },
            data: {
              ...(trackingNumber && { trackingNumber }),
              ...(trackingUrl && { trackingUrl }),
            },
          });
        }
        console.log(`Webhook: Order ${order.orderNumber} already in ${order.status}, updated tracking info only.`);
      }

      return NextResponse.json({ success: true });
    }

    // ========================================
    // Handle: refunds/create (退款 → REFUNDED)
    // ========================================
    if (topic === 'refunds/create') {
      const shopifyOrderId = payload.order_id?.toString();
      if (!shopifyOrderId) {
        return NextResponse.json({ received: true });
      }

      const order = await prisma.order.findFirst({
        where: { shopifyOrderId: shopifyOrderId },
      });

      if (!order) {
        console.log(`Webhook refund: Order not found for shopifyOrderId=${shopifyOrderId}. Skipping.`);
        return NextResponse.json({ received: true });
      }

      if (order.status === 'PROCESSING') {
        await updateOrderStatus(order.id, OrderStatus.REFUNDED);
        console.log(`Webhook: Order ${order.orderNumber} → REFUNDED`);
      } else {
        console.log(`Webhook: Order ${order.orderNumber} in ${order.status}, cannot refund. Skipping.`);
      }

      return NextResponse.json({ success: true });
    }

    // 未识别的 topic，安全返回
    console.log(`Webhook: Unhandled topic ${topic}, ignoring.`);
    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Webhook Processing Error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

// ========================================
// Helper: 从 Shopify payload 中提取 custom attribute
// ========================================
function extractAttribute(payload: Record<string, unknown>, key: string): string | null {
  // Shopify 的 custom attributes 可能在 note_attributes 或 custom_attributes 中
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
