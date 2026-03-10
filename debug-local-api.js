import fs from 'fs';
import path from 'path';

async function testFetchApi() {
  try {
    const res = await fetch('http://localhost:3000/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        items: [{
          variantId: "gid://shopify/ProductVariant/44421115117726",
          quantity: 1,
          customAttributes: []
        }]
      })
    });

    console.log('Status:', res.status);
    const text = await res.text();
    console.log('Response body:', text);
  } catch (error) {
    console.error(error);
  }
}

testFetchApi();
