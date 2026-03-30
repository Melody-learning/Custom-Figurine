import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// 临时诊断端点 — 用完后删除
export async function GET() {
  const hasSecret = !!process.env.SHOPIFY_WEBHOOK_SECRET;
  const secretLen = process.env.SHOPIFY_WEBHOOK_SECRET?.length || 0;
  const secretPrefix = process.env.SHOPIFY_WEBHOOK_SECRET?.slice(0, 6) || '';

  // 查看最近的 PENDING 订单
  const recentOrders = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: {
      id: true,
      orderNumber: true,
      status: true,
      shopifyDraftOrderId: true,
      shopifyOrderId: true,
      invoiceUrl: true,
      createdAt: true,
    },
  });

  return NextResponse.json({
    env: {
      SHOPIFY_WEBHOOK_SECRET_SET: hasSecret,
      SHOPIFY_WEBHOOK_SECRET_LENGTH: secretLen,
      SHOPIFY_WEBHOOK_SECRET_PREFIX: secretPrefix,
      NODE_ENV: process.env.NODE_ENV,
    },
    recentOrders,
    timestamp: new Date().toISOString(),
  });
}
