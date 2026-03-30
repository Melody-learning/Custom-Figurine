/**
 * AI Adapter Factory — 根据 provider 解析对应的适配器
 */

import type { ImageAdapter } from "./types";
import { GeminiAdapter } from "./gemini";
import { JimengAdapter } from "./jimeng";

// 单例缓存
let geminiInstance: GeminiAdapter | null = null;
let jimengInstance: JimengAdapter | null = null;

/**
 * 根据供应商名称返回对应的适配器实例
 * @param provider - "gemini" | "jimeng"
 */
export function resolveAdapter(provider: string): ImageAdapter {
  switch (provider) {
    case "gemini":
      if (!geminiInstance) geminiInstance = new GeminiAdapter();
      return geminiInstance;
    case "jimeng":
      if (!jimengInstance) jimengInstance = new JimengAdapter();
      return jimengInstance;
    default:
      throw new Error(`Unsupported AI provider: "${provider}". Supported: gemini, jimeng`);
  }
}

export type { ImageAdapter, ImageGenParams } from "./types";
