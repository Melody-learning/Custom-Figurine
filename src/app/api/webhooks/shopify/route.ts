import { NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const hmacHeader = req.headers.get('X-Shopify-Hmac-Sha256');
    const topic = req.headers.get('X-Shopify-Topic'); // e.g., orders/create, orders/updated
    
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
    
    // We only care about order topics
    if (!topic?.startsWith('orders/')) {
      return NextResponse.json({ received: true });
    }

    // 3. Extract relevant data
    const shopifyOrderId = payload.id?.toString();
    if (!shopifyOrderId) {
      return NextResponse.json({ error: 'No order ID in payload' }, { status: 400 });
    }

    // Attempt to find our injected userId
    let userId = null;
    if (payload.custom_attributes && Array.isArray(payload.custom_attributes)) {
      const userAttr = payload.custom_attributes.find((attr: any) => attr.name === 'userId' || attr.key === 'userId');
      if (userAttr) {
        userId = userAttr.value;
      }
    }

    // If there is no userId attached, we cannot map this order to a user profile. Abort sync safely.
    if (!userId) {
      console.log(`Webhook Order ${shopifyOrderId} skipped: No userId attached.`);
      return NextResponse.json({ received: true });
    }

    // 4. Map Shopify fulfillment status
    let status = 'placed';
    if (payload.fulfillment_status === 'fulfilled') {
      status = 'shipped';
    } else if (payload.financial_status === 'refunded' || payload.cancelled_at) {
      status = 'cancelled';
    }

    // Extract tracking URL if available
    let trackingUrl = null;
    if (payload.fulfillments && payload.fulfillments.length > 0) {
      trackingUrl = payload.fulfillments[0].tracking_url || null;
    }

    // 5. Upsert into database
    await prisma.storeOrder.upsert({
      where: { shopifyOrderId },
      update: {
        status,
        trackingUrl,
      },
      create: {
        shopifyOrderId,
        userId,
        status,
        trackingUrl,
      },
    });

    console.log(`Successfully synced Shopify Order ${shopifyOrderId} for User ${userId}`);
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Webhook Processing Error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
