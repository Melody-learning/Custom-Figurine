import fs from 'fs';
import path from 'path';

// Load env vars
const envPath = path.resolve(process.cwd(), '.env.local');
const envFile = fs.readFileSync(envPath, 'utf8');
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    process.env[match[1]] = match[2];
  }
});

const domain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
const storefrontAccessToken = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN;
const endpoint = `https://${domain}/api/2024-01/graphql.json`;

console.log('Domain:', domain);
console.log('Token Prefix:', storefrontAccessToken ? storefrontAccessToken.substring(0, 5) : 'MISSING');
console.log('Endpoint:', endpoint);

async function testShopifyConnection() {
  const query = `
    query {
      shop {
        name
      }
    }
  `;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': storefrontAccessToken || '',
      },
      body: JSON.stringify({ query }),
    });

    console.log('--- Response Status ---');
    console.log(response.status, response.statusText);
    
    console.log('--- Response Headers ---');
    response.headers.forEach((value, key) => console.log(`${key}: ${value}`));

    const text = await response.text();
    console.log('--- Response Body ---');
    console.log(text.substring(0, 500) + (text.length > 500 ? '...' : ''));

  } catch (error) {
    console.error('Fetch failed entirely:', error);
  }
}

testShopifyConnection();
