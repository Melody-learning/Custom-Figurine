import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { updateOrderStatus } from '@/lib/order';
import { OrderStatus } from '@prisma/client';

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
