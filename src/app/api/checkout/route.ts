import { NextResponse } from 'next/server';
import { createCheckout } from '@/lib/shopify';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { items } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Invalid or empty cart items payload' },
        { status: 400 }
      );
    }

    // Call Shopify API to create checkout
    const checkout = await createCheckout(items);

    return NextResponse.json({ url: checkout.webUrl });
  } catch (error) {
    console.error('API Checkout Error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
