async function testInvalidToken() {
  try {
    const res = await fetch('https://fkfk1j-t0.myshopify.com/api/2024-01/graphql.json', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': 'invalid_token_123'
      },
      body: JSON.stringify({ query: '{ shop { name } }' })
    });
    console.log('Status:', res.status);
    const text = await res.text();
    console.log('Response body:', text);
  } catch(e) { console.error(e); }
}
testInvalidToken();
