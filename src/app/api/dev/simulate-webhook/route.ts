import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { updateOrderStatus } from '@/lib/order';
import { OrderStatus } from '@prisma/client';
import { WELCOME_COUPON } from '@/lib/constants/coupon';

export async function POST(request: Request) {
  // 安全守卫：仅开发环境可用
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { orderId, event, trackingNumber, trackingUrl } = body;

    if (!orderId || !event) {
      return NextResponse.json(
        { error: 'Missing orderId or event' },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    let updatedOrder;

    switch (event) {
      case 'payment_success':
        updatedOrder = await updateOrderStatus(orderId, OrderStatus.PROCESSING, {
          shopifyOrderId: `dev-sim-${Date.now()}`,
        });

        // ---- 核销优惠券（与 Webhook 逻辑保持一致）----
        if (order.discountCode && order.userId) {
          try {
            if (order.discountCode === WELCOME_COUPON.CODE) {
              // 欢迎券核销
              await prisma.user.update({
                where: { id: order.userId },
                data: { hasWelcomeCoupon: false },
              });
              console.log(`[DEV] Welcome coupon revoked for user ${order.userId}`);
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
                console.log(`[DEV] KOL coupon ${order.discountCode} revoked for user ${order.userId}`);
              }
            }
          } catch (couponError) {
            console.error('[DEV] Coupon revocation failed (non-blocking):', couponError);
          }
        }
        break;

      case 'payment_failure':
        // 不改变状态，只返回当前状态
        updatedOrder = order;
        break;

      case 'fulfilled':
        updatedOrder = await updateOrderStatus(orderId, OrderStatus.SHIPPED, {
          trackingNumber: trackingNumber || `SIM-${Date.now()}`,
          trackingUrl: trackingUrl || `https://track.example.com/SIM-${Date.now()}`,
        });
        break;

      case 'refunded':
        updatedOrder = await updateOrderStatus(orderId, OrderStatus.REFUNDED);
        break;

      default:
        return NextResponse.json({ error: `Unknown event: ${event}` }, { status: 400 });
    }

    console.log(`[DEV] Simulated ${event} for order ${order.orderNumber}`);

    return NextResponse.json({ success: true, order: updatedOrder });
  } catch (error: unknown) {
    console.error('Simulate Webhook Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Simulation failed' },
      { status: 500 }
    );
  }
}
