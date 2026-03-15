import 'dotenv/config';

async function testFetch() {
  const apiKey = process.env.GEMINI_API_KEY;
  // Make sure we append the correct Gemini pathing to the proxy URL
  // The genai SDK does this under the hood, but the proxy might not be mapping it correctly
  const baseUrl = process.env.GOOGLE_GEMINI_BASE_URL + "/v1beta/models/gemini-2.0-flash:generateContent";
  
  console.log(`Pinging: ${baseUrl}`);
  
  // Dummy tiny 1px base64 image
  const dummyImage = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

  try {
    const res = await fetch(`${baseUrl}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: "What is in this image?" },
              { inline_data: { mime_type: "image/png", data: dummyImage } }
            ]
          }
        ]
      })
    });
    
    if (!res.ok) {
        console.log(`HTTP Error Status: ${res.status}`);
        const errorText = await res.text();
        console.log(`Error Body Preview: ${errorText.substring(0, 200)}`);
    } else {
        const json = await res.json();
        console.log("Success:", JSON.stringify(json, null, 2).substring(0, 300));
    }
  } catch(e) {
      console.error("Fetch failed entirely:", e);
  }
}

testFetch();
