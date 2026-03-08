// Shopify Storefront API 客户端

const domain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN!;
const storefrontAccessToken = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN!;

const endpoint = `https://${domain}/api/2024-01/graphql.json`;

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
  const response = await fetch(endpoint, {
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
    throw new Error(json.errors.map((e) => e.message).join(', '));
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

// 创建结账
export async function createCheckout(
  items: Array<{ variantId: string; quantity: number; customAttributes?: Array<{ key: string; value: string }> }>
) {
  const query = `
    mutation CheckoutCreate($input: CheckoutCreateInput!) {
      checkoutCreate(input: $input) {
        checkout {
          id
          webUrl
        }
        checkoutUserErrors {
          message
          field
        }
      }
    }
  `;

  const data = await shopifyFetch<{
    checkoutCreate: {
      checkout: {
        id: string;
        webUrl: string;
      };
      checkoutUserErrors: Array<{ message: string; field: string[] }>;
    };
  }>({
    query,
    variables: {
      input: {
        lineItems: items.map(item => ({
          variantId: item.variantId,
          quantity: item.quantity,
          customAttributes: item.customAttributes
        })),
      },
    },
  });

  if (data.checkoutCreate.checkoutUserErrors.length > 0) {
    throw new Error(
      data.checkoutCreate.checkoutUserErrors.map((e) => e.message).join(', ')
    );
  }

  return data.checkoutCreate.checkout;
}
