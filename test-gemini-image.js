const { GoogleGenAI } = require('@google/genai');
const { HttpsProxyAgent } = require('https-proxy-agent');

const apiKey = process.env.GEMINI_API_KEY;
const proxyUrl = 'http://192.168.1.2:7890'; // Use the proxy from previous sessions

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
    console.log("Testing generateImages with gemini-2.5-flash-image...");
    const response = await ai.models.generateImages({
      model: 'gemini-2.5-flash-image',
      prompt: 'A futuristic city skyline at sunset, cyberpunk style.',
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/jpeg'
      }
    });

    console.log("Success! Image generated.");
    console.log(response.generatedImages?.[0]?.image.imageBytes ? "Got imageBytes" : "No image bytes");
  } catch (e) {
    console.error("Test generateImages failed:", e.message);
    try {
      console.log("Testing generateContent with gemini-2.5-flash-image instead...");
      const res = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: 'A futuristic city skyline at sunset, cyberpunk style.',
      });
      console.log("generateContent output:", res.text || "No text");
    } catch(e2) {
      console.error("Test generateContent failed:", e2.message);
    }
  }
}

testImageGen();
