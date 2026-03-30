import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { updateOrderStatus } from '@/lib/order';
import prisma from '@/lib/prisma';
import { OrderStatus } from '@prisma/client';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { id } = await params;

    // 查找订单
    const order = await prisma.order.findUnique({
      where: { id },
      select: { id: true, userId: true, status: true, orderNumber: true },
    });

    if (!order || order.userId !== userId) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Only pending orders can be cancelled' },
        { status: 400 }
      );
    }

    const updated = await updateOrderStatus(order.id, OrderStatus.CANCELLED);

    return NextResponse.json({
      success: true,
      order: {
        id: updated.id,
        orderNumber: updated.orderNumber,
        status: updated.status,
      },
    });
  } catch (error) {
    console.error('Cancel Order Error:', error);
    return NextResponse.json({ error: 'Failed to cancel order' }, { status: 500 });
  }
}
