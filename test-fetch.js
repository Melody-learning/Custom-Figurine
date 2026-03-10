async function testFetchApi() {
  const massiveString = 'data:image/png;base64,' + 'A'.repeat(5 * 1024 * 1024); // 5MB
  try {
    const res = await fetch('http://localhost:3000/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        items: [{
          variantId: "gid://shopify/ProductVariant/44421115117726",
          quantity: 1,
          customAttributes: [{ key: "Image", value: massiveString }]
        }]
      })
    });

    console.log('Status:', res.status, res.headers.get('content-type'));
    const text = await res.text();
    console.log('Body start:', text.substring(0, 100));
  } catch (error) {
    console.error('Fetch error:', error);
  }
}
testFetchApi();
