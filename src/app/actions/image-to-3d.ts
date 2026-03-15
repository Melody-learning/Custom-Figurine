'use server';

import { GoogleGenAI } from "@google/genai";
import { HttpsProxyAgent } from "https-proxy-agent";

// We extract the base Gemini key as instructed.
const API_KEY = process.env.GEMINI_API_KEY; 
const PROXY_URL = process.env.HTTP_PROXY;

interface ImageGenResponse {
  b64_json?: string;
  error?: string;
}

// 核心通用图像生成请求发射器
async function callNativeGoogleImageAPI(prompt: string, modelName: string, baseImageB64?: string): Promise<string> {
   if (!API_KEY) {
     throw new Error("GEMINI_API_KEY is not configured in .env.local");
   }

   // 建立反向代理客户端
   const fetchOptions: any = {};
   if (PROXY_URL) {
      console.log(`[Google Image Gen] Tunneling through proxy: ${PROXY_URL}`);
      const proxyAgent = new HttpsProxyAgent(PROXY_URL);
      fetchOptions.agent = proxyAgent; 
      fetchOptions.dispatcher = proxyAgent; 
   }

   const aiConfig: any = { apiKey: API_KEY as string };
   if (Object.keys(fetchOptions).length > 0) {
       aiConfig.httpOptions = {
          fetch: async (url: string | URL | Request, options: RequestInit) => fetch(url, { ...options, ...fetchOptions } as RequestInit)
       };
   }
   const ai = new GoogleGenAI(aiConfig);

   // 构建多模态载荷，结合文字和选填的图像
   const parts: any[] = [{ text: prompt }];
   
   if (baseImageB64) {
       parts.push({
           inlineData: {
               data: baseImageB64,
               mimeType: "image/jpeg" // Safe default; modern Gemini models infer dynamically
           }
       });
   }

   // 发送大模型请求
   // 适配全新 Gemini 3 图片模型高阶参数，直接强制 1K(1024) 比例
   const response = await ai.models.generateContent({
       model: modelName,
       contents: parts,
       config: {
           // @ts-ignore - The latest SDK definitions might not fully expose these image-specific keys yet
           aspectRatio: "1:1",
           resolution: "1K"
       }
   });

   // 解析响应体中的 Image Base64
   const outParts = response.candidates?.[0]?.content?.parts || [];
   const imagePart = outParts.find((p: any) => p.inlineData && p.inlineData.data);

   if (imagePart && imagePart.inlineData && imagePart.inlineData.data) {
       return imagePart.inlineData.data as string;
   }

   throw new Error("Google AI Studio did not return an inlineData image representation in the payload.");
}

/**
 * 阶段一：基于裁剪后的原图生成正面手办渲染主视觉图
 */
export async function generatePrimaryRender(base64Image: string, modelId: string): Promise<ImageGenResponse> {
  try {
const prompt = "以图中人物为原型，在真实环境中，以写实风格创作一个1/7比例的商业手办模型。手办模型放置在一张家用餐桌上，手办底座为透明亚克力，无任何文字。手办旁边放着原图和一支铅笔（表示刚刚有人在这里作画，现在已经离开了）确保所有元素与参考图保持严格一致。重要要求：生成的图片必须是完美的 1:1 正方形比例，且分辨率严格限制为 1024x1024 像素。";
     const resultBase64 = await callNativeGoogleImageAPI(prompt, modelId, base64Image);
     return { b64_json: resultBase64 };
  } catch (error: any) {
     console.error("[Stage 1 Error] Generating Primary Render:", error);
     return { error: error.message || "Failed to generate primary render." };
  }
}

/**
 * 阶段二：并行基于主视觉图生成侧面和背面视角
 */
export async function generateSecondaryViews(primaryImageBase64: string, modelId: string) {
  const backPrompt = "以上图为基准图（正面视图），生成该手办图的后视图。重要提示：保证人物100%的一致性，就像真实世界里存在这个手办，你只是拍摄他的多视角照片。重要要求：生成的图片必须是完美的 1:1 正方形比例，且分辨率严格限制为 1024x1024 像素。";
  const leftPrompt = "以上图为基准图（正面视图），生成该手办图的左侧视图。重要提示：保证人物100%的一致性，就像真实世界里存在这个手办，这个图片就是他的正视图，现在请你渲染左视角的照片。重要要求：生成的图片必须是完美的 1:1 正方形比例，且分辨率严格限制为 1024x1024 像素。";

  try {
     // Trigger both slow AI network calls completely parallel to save ~15 seconds of waiting time
     console.log(`[Stage 2] Submitting parallel generation requests to ${modelId}...`);
     const [backRes, leftRes] = await Promise.all([
        callNativeGoogleImageAPI(backPrompt, modelId, primaryImageBase64),
        callNativeGoogleImageAPI(leftPrompt, modelId, primaryImageBase64)
     ]);

     return {
         backViewB64: backRes,
         leftViewB64: leftRes
     };
  } catch (error: any) {
     console.error("[Stage 2 Error] Generating Secondary Views:", error);
     return { error: error.message || "Failed to generate secondary views." };
  }
}
