'use server';

import { GoogleGenAI } from "@google/genai";
import { HttpsProxyAgent } from "https-proxy-agent";

export interface Subject {
  id: string;
  description: string;
  box_2d: [number, number, number, number]; // [ymin, xmin, ymax, xmax] in 0-1000 scale
}

export interface SubjectDetectionResult {
  subjects: Subject[];
  error?: string;
}

export async function detectImageSubjects(base64Image: string, mimeType: string = "image/jpeg"): Promise<SubjectDetectionResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  const proxyUrl = process.env.HTTP_PROXY;
  let modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

  if (!apiKey) {
    return { subjects: [], error: "GEMINI_API_KEY is not configured in environment variables" };
  }

  try {
    const systemPrompt = `You are a precision computer vision system.
Analyze the provided image and detect all distinct, prominent subjects (e.g., individual people, pets).
For each detected subject, provide:
1.  "description": A short, highly accurate Chinese description. THIS IS CRITICAL: You MUST explicitly include their exact space position in the image (e.g., "左一", "中间", "右下角") and their key visual feature (e.g., "穿红衣服的女士", "穿黑西装的小男孩"). Example: "左侧穿红衣服的女孩".
2.  "box_2d": A bounding box strictly tightly enclosing the subject, represented as [ymin, xmin, ymax, xmax]. Coordinates must be normalized integers from 0 to 1000, where [0,0] is top-left and [1000, 1000] is bottom-right.

Output strictly as a JSON array of objects, like this:
[
  { "description": "左一穿红裙子的女士", "box_2d": [ymin, xmin, ymax, xmax] },
  { "description": "右侧穿黑西装的男孩", "box_2d": [ymin, xmin, ymax, xmax] }
]
Do not return any conversational text, only the raw JSON string.`;

    modelName = modelName.replace('google/', '');

    // Configure Proxy Tunneling for Google Cloud API Bypass Local Firewall
    const fetchOptions: any = {};
    if (proxyUrl) {
       console.log(`[Google SDK] Injecting Soft Router Tunnel: ${proxyUrl}`);
       const proxyAgent = new HttpsProxyAgent(proxyUrl);
       
       // GoogleGenAI uses native fetch, but usually accepts a custom fetcher or dispatcher.
       // However, we will override the global Undici dispatcher or pass agent to fetch
       fetchOptions.dispatcher = proxyAgent; // For Next.js/Undici native fetch
       fetchOptions.agent = proxyAgent;      // For node-fetch fallback
    }

    // GoogleGenAI SDK instantiation wrapped with a custom fetch to guarantee proxy injection
    const ai = new GoogleGenAI({ 
       apiKey: apiKey,
       // @ts-ignore - The new @google/genai SDK has incomplete types for custom fetch injection
       httpOptions: Object.keys(fetchOptions).length > 0 ? ({
          fetch: async (url: any, options: any) => {
             return fetch(url, { ...options, ...fetchOptions });
          }
       } as any) : undefined
    });

    let response;
    let retries = 3;
    let lastError = null;

    while (retries > 0) {
      try {
        response = await ai.models.generateContent({
          model: modelName, 
          contents: [
            { text: systemPrompt },
            { inlineData: { data: base64Image, mimeType: mimeType } }
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
                      box_2d: { type: "ARRAY", items: { type: "INTEGER" } }
                    },
                    required: ["id", "description", "box_2d"]
                  }
                }
              },
              required: ["subjects"]
            }
          }
        });
        break; // Success! Break out of the retry loop.
      } catch (err: any) {
        retries--;
        lastError = err;
        console.warn(`[GenAI Native Proxy] Network request failed. Retries left: ${retries}. Error:`, err.message);
        if (retries === 0) throw err;
        await new Promise(r => setTimeout(r, 2000));
      }
    }

    if (!response) {
       throw lastError || new Error("Failed to generate content after retries.");
    }

    const textPayload = response.text || "";
    
    try {
      const parsed = JSON.parse(textPayload);
      return { subjects: parsed.subjects || [] };
    } catch (parseError: any) {
      console.error("JSON Parse Error:", parseError.message);
      
      // Fallback rescue parsing for robust box-extraction
      const subjectsRegex = /"id"\s*:\s*"([^"]+)"[\s\S]*?"description"\s*:\s*"([^"]+)"[\s\S]*?"box_2d"\s*:\s*\[\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\]/g;
      const subjects = [];
      let match;
      while ((match = subjectsRegex.exec(textPayload)) !== null) {
        subjects.push({
          id: match[1],
          description: match[2],
          box_2d: [parseInt(match[3], 10), parseInt(match[4], 10), parseInt(match[5], 10), parseInt(match[6], 10)] as [number, number, number, number]
        });
      }

      if (subjects.length > 0) {
         return { subjects, error: "JSON was malformed but we successfully salvaged the spatial bounding box data." };
      }

      throw new Error(`Invalid JSON format from AI: ${parseError.message}`);
    }

  } catch (error: any) {
    console.error("AI Detection Router Error:", error);
    return { subjects: [], error: error.message || "Failed to analyze image" };
  }
}
