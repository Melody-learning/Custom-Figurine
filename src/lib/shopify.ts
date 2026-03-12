// Shopify Storefront API 客户端

const domain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN!;
const storefrontAccessToken = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN!;
const adminAccessToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN!;
// Dev Dashboard App Credentials (Client ID and Secret)
const adminApiKey = process.env.SHOPIFY_ADMIN_API_KEY;
const adminApiSecret = process.env.SHOPIFY_ADMIN_API_SECRET;

const storefrontEndpoint = `https://${domain}/api/2024-01/graphql.json`;
const adminEndpoint = `https://${domain}/admin/api/2024-01/graphql.json`;

interface ShopifyResponse<T> {
  data: T;
  errors?: Array<{ message: string }>;
}

export async function shopifyFetch<T>({
  query,
  variables,
}: {
  query: string;
  variables?: Record<string, unknown>;
}): Promise<T> {
  const response = await fetch(storefrontEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': storefrontAccessToken,
    },
    body: JSON.stringify({ query, variables }),
    cache: 'no-store',
  });

  const json: ShopifyResponse<T> = await response.json();

  if (json.errors) {
    const errorDetails = Array.isArray(json.errors) 
      ? json.errors.map((e: any) => e?.message || JSON.stringify(e)).join(', ')
      : typeof json.errors === 'string' 
        ? json.errors 
        : JSON.stringify(json.errors);
    throw new Error(errorDetails);
  }

  return json.data;
}

export async function adminShopifyFetch<T>({
  query,
  variables,
}: {
  query: string;
  variables?: Record<string, unknown>;
}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Support both Admin Access Token (shpat_) and Dev Dashboard API Key + Secret (OAuth Client Credentials)
  let resolvedAccessToken = adminAccessToken;

  if (adminApiKey && adminApiSecret) {
    // Exchange Client Credentials for an Access Token
    const tokenResponse = await fetch(`https://${domain}/admin/oauth/access_token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'client_credentials',
        client_id: adminApiKey,
        client_secret: adminApiSecret
      }),
      cache: 'no-store'
    });

    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok || !tokenData.access_token) {
      throw new Error(`Failed to exchange Shopify Client Credentials: ${JSON.stringify(tokenData)}`);
    }
    resolvedAccessToken = tokenData.access_token;
  }

  if (!resolvedAccessToken) {
    throw new Error('Missing Shopify Admin API credentials in Vercel. Provide either SHOPIFY_ADMIN_API_KEY & SECRET or SHOPIFY_ADMIN_ACCESS_TOKEN.');
  }

  headers['X-Shopify-Access-Token'] = resolvedAccessToken;

  const response = await fetch(adminEndpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables }),
    cache: 'no-store',
  });

  const json: ShopifyResponse<T> = await response.json();

  if (json.errors) {
    const errorDetails = Array.isArray(json.errors) 
      ? json.errors.map((e: any) => e?.message || JSON.stringify(e)).join(', ')
      : typeof json.errors === 'string' 
        ? json.errors 
        : JSON.stringify(json.errors);
    throw new Error(errorDetails);
  }

  return json.data;
}

// 获取所有商品（包含选项和变体）
export async function getProducts() {
  const query = `
    query Products {
      products(first: 20) {
        edges {
          node {
            id
            title
            description
            handle
            options {
              name
              values
            }
            priceRange {
              minVariantPrice {
                amount
                currencyCode
              }
            }
            images(first: 1) {
              edges {
                node {
                  url
                  altText
                }
              }
            }
            variants(first: 50) {
              edges {
                node {
                  id
                  title
                  price {
                    amount
                    currencyCode
                  }
                  selectedOptions {
                    name
                    value
                  }
                }
              }
            }
          }
        }
      }
    }
  `;

  const data = await shopifyFetch<{
    products: { edges: Array<{ node: Product }> };
  }>({ query });

  return data.products.edges.map((edge) => edge.node);
}

// 获取商品选项的所有可能组合
export interface ProductOption {
  name: string;
  values: string[];
}

export interface ProductVariant {
  id: string;
  title: string;
  price: number;
  currencyCode: string;
  selectedOptions: { name: string; value: string }[];
}

export interface Product {
  id: string;
  title: string;
  description: string;
  handle: string;
  options: ProductOption[];
  priceRange: {
    minVariantPrice: {
      amount: string;
      currencyCode: string;
    };
  };
  images: {
    edges: Array<{
      node: {
        url: string;
        altText: string | null;
      };
    }>;
  };
  variants: {
    edges: Array<{
      node: {
        id: string;
        title: string;
        price: {
          amount: string;
          currencyCode: string;
        };
        selectedOptions: { name: string; value: string }[];
      };
    }>;
  };
}

// 创建结账（底层改为使用 Admin API 生成带图片的 Draft Order 发票）
export async function createCheckout(
  items: Array<{ variantId: string; quantity: number; customAttributes?: Array<{ key: string; value: string }> }>,
  userId?: string
) {
  // Build the Draft Order using standard Variant IDs 
  // This ensures the predefined catalog image from Shopify is used on the Checkout page, avoiding a gray placeholder.
  // The custom image URL from the user is injected via customAttributes so backend fulfillment can see it.
  const query = `
    mutation draftOrderCreate($input: DraftOrderInput!) {
      draftOrderCreate(input: $input) {
        draftOrder {
          id
          invoiceUrl
        }
        userErrors {
          message
          field
        }
      }
    }
  `;

  const cleanItems = items.map((item) => {
    const lineItemInput: any = {
      variantId: item.variantId,
      quantity: item.quantity,
    };

    if (item.customAttributes && item.customAttributes.length > 0) {
      lineItemInput.customAttributes = item.customAttributes
        .filter(attr => attr.value && attr.value.trim() !== '')
        .map(attr => ({
          key: attr.key,
          value: String(attr.value)
        }));
    }

    return lineItemInput;
  });

  const customAttributes = [];
  if (userId) {
    customAttributes.push({ key: "userId", value: userId });
  }

  const data = await adminShopifyFetch<{
    draftOrderCreate: {
      draftOrder: {
        id: string;
        invoiceUrl: string;
      };
      userErrors: Array<{ message: string; field: string[] }>;
    };
  }>({
    query,
    variables: {
      input: {
        lineItems: cleanItems,
        customAttributes: customAttributes,
        tags: ["custom-figurine", "api-generated-draft"],
        note: "Checkout generated from frontend custom figurine app."
      },
    },
  });

  if (data.draftOrderCreate.userErrors.length > 0) {
    throw new Error(
      data.draftOrderCreate.userErrors.map((e) => e.message).join(', ')
    );
  }

  return { webUrl: data.draftOrderCreate.draftOrder.invoiceUrl };
}
