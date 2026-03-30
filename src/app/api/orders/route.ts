import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const orders = await prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          select: {
            id: true,
            generatedImageUrl: true,
            originalImageUrl: true,
          },
        },
      },
    });

    const orderList = orders.map((order) => {
      // 取第一个 item 的图片作为预览
      const firstItem = order.items[0];
      const previewImageUrl = firstItem?.generatedImageUrl || firstItem?.originalImageUrl || null;

      return {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        totalAmount: order.totalAmount,
        currency: order.currency,
        itemCount: order.items.length,
        previewImageUrl,
        createdAt: order.createdAt.toISOString(),
        paidAt: order.paidAt?.toISOString() || null,
      };
    });

    return NextResponse.json({ orders: orderList });
  } catch (error) {
    console.error('Orders List Error:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}
