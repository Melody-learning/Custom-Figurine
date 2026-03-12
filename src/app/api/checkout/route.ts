import { NextResponse } from 'next/server';
import { createCheckout } from '@/lib/shopify';
import { auth } from '@/auth';

export async function POST(request: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    const body = await request.json();
    const { items } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Invalid or empty cart items payload' },
        { status: 400 }
      );
    }

    // Call Shopify API to create checkout with current userId (if logged in)
    const checkout = await createCheckout(items, userId);

    return NextResponse.json({ url: checkout.webUrl });
  } catch (error: unknown) {
    console.error('API Checkout Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create checkout session', 
        details: error instanceof Error ? error.message : String(error),
        envSnapshot: {
          domain: process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN,
          tokenPrefix: process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN?.substring(0, 5)
        }
      },
      { status: 500 }
    );
  }
}
