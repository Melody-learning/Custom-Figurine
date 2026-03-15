// test-polygon.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testPolygonPrompt() {
  const apiKey = "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";
  const endpoint = "https://openrouter.ai/api/v1/chat/completions";
  const modelName = "google/gemini-2.5-flash";

  // Use a tiny transparent 1x1 image if we don't have a real one handy,
  // or actually, let's grab a random image from the web or project
  const testImageUrl = "https://images.unsplash.com/photo-1543466835-00a7907e9de1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80";
  
  const systemPrompt = `Analyze this image and identify all prominent subjects (e.g. people, pets, or significant objects).
Return a strict JSON object containing a "subjects" array. 
Each object in the array must have:
- "id": a unique short string ID.
- "description": a highly descriptive label.
- "polygon": an array of coordinates representing a dense, detailed 2D outline (contour) of the subject. The polygon should trace the exact edge of the subject. Format the polygon as a flat array of numbers: [y1, x1, y2, x2, y3, x3, ...] normalized to a 0-1000 scale. Provide at least 20-30 points to accurately capture the shape.`;

  console.log("Fetching test image...");
  const imgRes = await fetch(testImageUrl);
  const arrayBuffer = await imgRes.arrayBuffer();
  const base64Image = Buffer.from(arrayBuffer).toString('base64');
  
  console.log("Sending prompt to Gemini via OpenRouter...");
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
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
              image_url: { url: `data:image/jpeg;base64,${base64Image}` }
            }
          ]
        }
      ]
    })
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("API Error:", err);
    return;
  }

  const json = await res.json();
  const textPayload = json.choices?.[0]?.message?.content || "";
  console.log("\n--- RESPONSE PAYLOAD ---");
  console.log(textPayload);
}

testPolygonPrompt().catch(console.error);
