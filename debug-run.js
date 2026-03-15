const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

async function testGeminiSegmentation() {
  const apiKey = process.env.GEMINI_API_KEY;
  const baseUrl = process.env.GOOGLE_GEMINI_BASE_URL; // e.g. https://openrouter.ai/api/v1/chat/completions
  let modelName = process.env.GEMINI_MODEL || 'google/gemini-2.5-flash';

  console.log(`Testing Gemini via ${baseUrl} with model ${modelName}`);

  // Dummy 1x1 image
  const dummyImage = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

  const systemPrompt = `Analyze this image and identify all distinct, prominent subjects.
Return a JSON array of objects. 
Each object must have:
- "id": a unique short string ID.
- "description": a highly descriptive label for the subject.
- "box_2d": an array of 4 integers [ymin, xmin, ymax, xmax] normalized to a 0-1000 scale.
- "mask": A base64 encoded PNG image representing the 2D segmentation mask of the object.`;

  try {
    const res = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'WebAI Figurine',
      },
      body: JSON.stringify({
        model: modelName,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: systemPrompt },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/png;base64,${dummyImage}`
                }
              }
            ]
          }
        ]
      })
    });

    if (!res.ok) {
        console.error("Failed:", await res.text());
        return;
    }

    const data = await res.json();
    console.log("Raw Response:");
    console.log(data.choices?.[0]?.message?.content);
    
    // Save response to see if `mask` came back as a base64 string
    fs.writeFileSync('sam-result.json', JSON.stringify(data, null, 2));
    
  } catch (err) {
    console.error("Request failed:", err);
  }
}

testGeminiSegmentation();
