/**
 * Gemini Adapter — Google AI Studio 图像生成
 * 重构自原 image-to-3d.ts 中的 callNativeGoogleImageAPI()
 */

import { GoogleGenAI } from "@google/genai";
import { HttpsProxyAgent } from "https-proxy-agent";
import type { ImageAdapter, ImageGenParams } from "./types";

const API_KEY = process.env.GEMINI_API_KEY;
const PROXY_URL = process.env.HTTP_PROXY;

export class GeminiAdapter implements ImageAdapter {
  async generateImage(params: ImageGenParams): Promise<string> {
    if (!API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured in environment variables");
    }

    // 建立反向代理客户端
    const fetchOptions: Record<string, unknown> = {};
    if (PROXY_URL) {
      console.log(`[GeminiAdapter] Tunneling through proxy: ${PROXY_URL}`);
      const proxyAgent = new HttpsProxyAgent(PROXY_URL);
      fetchOptions.agent = proxyAgent;
      fetchOptions.dispatcher = proxyAgent;
    }

    const aiConfig: Record<string, unknown> = { apiKey: API_KEY as string };
    if (Object.keys(fetchOptions).length > 0) {
      aiConfig.httpOptions = {
        fetch: async (url: string | URL | Request, options: RequestInit) =>
          fetch(url, { ...options, ...fetchOptions } as RequestInit),
      };
    }
    const ai = new GoogleGenAI(aiConfig);

    // 构建多模态载荷
    const parts: Array<Record<string, unknown>> = [{ text: params.prompt }];

    if (params.inputImageB64) {
      const images = Array.isArray(params.inputImageB64)
        ? params.inputImageB64
        : [params.inputImageB64];
      for (const img of images) {
        parts.push({
          inlineData: {
            data: img,
            mimeType: "image/jpeg",
          },
        });
      }
    }

    // 发送请求，强制 1:1 正方形 1024px
    const response = await ai.models.generateContent({
      model: params.model,
      contents: parts,
      config: {
        // @ts-ignore - imageConfig is Gemini 3 image generation config
        imageConfig: {
          aspectRatio: params.aspectRatio || "1:1",
          imageSize: params.imageSize || "1K",
        },
      },
    });

    // 解析响应中的图片 Base64
    const outParts = response.candidates?.[0]?.content?.parts || [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const imagePart = outParts.find((p: any) => p.inlineData?.data);

    if (imagePart && (imagePart as any).inlineData?.data) {
      return (imagePart as any).inlineData.data as string;
    }

    throw new Error(
      "Gemini API did not return an inlineData image in the response."
    );
  }
}
