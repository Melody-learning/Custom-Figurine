import { GoogleGenAI } from '@google/genai';
import { HttpsProxyAgent } from 'https-proxy-agent';

const apiKey = process.env.GEMINI_API_KEY;
const proxyUrl = 'http://192.168.1.2:7890';

async function testImageGen() {
  const proxyAgent = new HttpsProxyAgent(proxyUrl);
  const ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      fetch: async (url, options) => {
        return fetch(url, { ...options, dispatcher: proxyAgent });
      }
    }
  });

  try {
    console.log("Testing generateContent with gemini-2.5-flash-image...");
    const res = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: 'A futuristic city skyline at sunset, cyberpunk style.',
    });
    const parts = res.candidates?.[0]?.content?.parts || [];
    console.log("Parts returned:", parts.length);
    if (parts.length > 0) {
      parts.forEach((p, i) => {
        console.log(`Part ${i}: keys =`, Object.keys(p));
        if (p.inlineData) {
            console.log(`Part ${i} inlineData mimeType:`, p.inlineData.mimeType);
            console.log(`Part ${i} inlineData start:`, p.inlineData.data?.substring(0, 30));
        } else if (p.text) {
            console.log(`Part ${i} text:`, p.text);
        } else {
            console.log(`Part ${i} other:`, JSON.stringify(p).substring(0, 100));
        }
      });
    }
  } catch(e) {
    console.error("Test generateContent failed:", e.message);
  }
}

testImageGen();
