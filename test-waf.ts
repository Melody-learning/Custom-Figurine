import { getProducts } from './src/lib/shopify';

process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN = 'fkfk1j-t0.myshopify.com';
process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN = 'a059b1a3bfa9ddf42ee02d55895bcfc7';

async function testSizes() {
  const products = await getProducts();
  const validId = products[0].variants.edges[0].node.id;
  const endpoint = `https://fkfk1j-t0.myshopify.com/api/2024-01/graphql.json`;
  const token = 'a059b1a3bfa9ddf42ee02d55895bcfc7';

  const sizes = [100, 500, 1000, 2000]; // KB

  for (const size of sizes) {
    const massiveString = 'data:image/png;base64,' + 'A'.repeat(size * 1024);
    const query = `mutation cartCreate($input: CartInput!) { cartCreate(input: $input) { cart { id } userErrors { message } } }`;
    
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Storefront-Access-Token': token,
        },
        body: JSON.stringify({
          query,
          variables: { input: { lines: [{ merchandiseId: validId, quantity: 1, attributes: [{ key: "Image", value: massiveString }] }] } }
        })
      });
      const text = await response.text();
      console.log(`${size}KB -> Status: ${response.status}. Body start: ${text.substring(0, 50).replace(/\n/g, '')}`);
    } catch(e: any) {
      console.log(`${size}KB -> Fetch failed:`, e.message);
    }
  }
}
testSizes();
