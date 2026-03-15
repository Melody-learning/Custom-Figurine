// test-native.js
import { GoogleGenAI } from "@google/genai";

async function testNativePrompt() {
  const apiKey = "AIzaSyDCFuFs1RRWJmThS9oE5CoLdzK8-0WRf1w";
  
  // Use a tiny transparent 1x1 image if we don't have a real one handy,
  // or a random image from the web
  const testImageUrl = "https://images.unsplash.com/photo-1543466835-00a7907e9de1?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80";
  
  const systemPrompt = `Analyze this image and identify all distinct, prominent subjects (e.g., individual people, pets, or significant objects). 
Do not include the background. 
Return a strict JSON object containing a "subjects" array. 
Each object in the array must have:
- "id": a unique short string ID.
- "description": a highly descriptive label.
- "box_2d": an array of 4 integers [ymin, xmin, ymax, xmax] normalized to a 0-1000 scale.
- "mask": A base64 encoded PNG image representing the 2D segmentation probability mask of the object.`;

  console.log("Fetching test image...");
  const imgRes = await fetch(testImageUrl);
  const arrayBuffer = await imgRes.arrayBuffer();
  const base64Image = Buffer.from(arrayBuffer).toString('base64');
  
  console.log("Sending prompt to Gemini via Native Google GenAI SDK...");
  const ai = new GoogleGenAI({ apiKey });
  
  try {
     const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash', 
        contents: [
          { text: systemPrompt },
          { inlineData: { data: base64Image, mimeType: 'image/jpeg' } }
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              subjects: {
                type: "ARRAY",
                items: {
                  type: "OBJECT",
                  properties: {
                    id: { type: "STRING" },
                    description: { type: "STRING" },
                    box_2d: { type: "ARRAY", items: { type: "INTEGER" } },
                    mask: { type: "STRING" }
                  },
                  required: ["id", "description", "box_2d", "mask"]
                }
              }
            },
            required: ["subjects"]
          }
        }
      });
      
      const textPayload = response.text || "";
      console.log("\n--- RESPONSE PAYLOAD (Snippet) ---");
      console.log(textPayload.substring(0, 500) + "... [TRUNCATED FOR LOGGING]");
      
      const parsed = JSON.parse(textPayload);
      console.log("SUCCESS! Parsed subjects:", parsed.subjects.length);
      console.log("Mask length for subject 0:", parsed.subjects[0].mask.length, "characters");
      
  } catch (e) {
      console.error("NATIVE REQUEST FAILED:", e);
  }
}

testNativePrompt().catch(console.error);
