import prisma from '@/lib/prisma';
import { OrderStatus } from '@prisma/client';

// ============================================================
// 订单号生成: CF-YYYYMMDD-XXXXXX
// ============================================================

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 去掉容易混淆的 I/O/0/1

function randomCode(length: number): string {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += CHARS.charAt(Math.floor(Math.random() * CHARS.length));
  }
  return result;
}

export async function generateOrderNumber(): Promise<string> {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
  
  // 尝试最多 5 次以避免碰撞
  for (let attempt = 0; attempt < 5; attempt++) {
    const orderNumber = `CF-${dateStr}-${randomCode(6)}`;
    
    // 检查唯一性
    const existing = await prisma.order.findUnique({
      where: { orderNumber },
      select: { id: true },
    });
    
    if (!existing) {
      return orderNumber;
    }
  }
  
  // 极端情况：5次都碰撞，追加时间戳毫秒
  return `CF-${dateStr}-${randomCode(6)}${Date.now().toString(36).slice(-2).toUpperCase()}`;
}

// ============================================================
// 状态机校验
// ============================================================

const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING]:    [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
  [OrderStatus.PROCESSING]: [OrderStatus.SHIPPED, OrderStatus.REFUNDED],
  [OrderStatus.SHIPPED]:    [OrderStatus.DELIVERED],
  [OrderStatus.DELIVERED]:  [],
  [OrderStatus.CANCELLED]:  [],
  [OrderStatus.REFUNDED]:   [],
};

export function isValidStatusTransition(from: OrderStatus, to: OrderStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

// ============================================================
// 统一的状态更新函数
// ============================================================

interface StatusUpdateData {
  shopifyOrderId?: string;
  trackingNumber?: string;
  trackingUrl?: string;
}

export async function updateOrderStatus(
  orderId: string,
  newStatus: OrderStatus,
  extraData?: StatusUpdateData
) {
  // 1. 查找订单
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, status: true },
  });

  if (!order) {
    throw new Error(`Order not found: ${orderId}`);
  }

  // 2. 校验状态转换合法性
  if (!isValidStatusTransition(order.status, newStatus)) {
    throw new Error(
      `Invalid status transition: ${order.status} → ${newStatus}`
    );
  }

  // 3. 构建更新数据（自动填充时间戳）
  const updateData: Record<string, unknown> = {
    status: newStatus,
  };

  switch (newStatus) {
    case OrderStatus.PROCESSING:
      updateData.paidAt = new Date();
      if (extraData?.shopifyOrderId) {
        updateData.shopifyOrderId = extraData.shopifyOrderId;
      }
      break;
    case OrderStatus.SHIPPED:
      updateData.shippedAt = new Date();
      if (extraData?.trackingNumber) {
        updateData.trackingNumber = extraData.trackingNumber;
      }
      if (extraData?.trackingUrl) {
        updateData.trackingUrl = extraData.trackingUrl;
      }
      break;
    case OrderStatus.DELIVERED:
      updateData.deliveredAt = new Date();
      break;
    case OrderStatus.CANCELLED:
      updateData.cancelledAt = new Date();
      break;
    case OrderStatus.REFUNDED:
      // No extra timestamp needed beyond updatedAt
      break;
  }

  // 4. 执行更新
  return prisma.order.update({
    where: { id: orderId },
    data: updateData,
  });
}
