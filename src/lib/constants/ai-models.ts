/**
 * AI Model Types
 * 
 * 模型列表现在从数据库动态获取（通过 /api/ai-models），
 * 此文件保留类型定义和硬编码回退列表（仅在 API 不可用时使用）。
 */

// 默认回退模型列表（当 API 不可用时使用）
export const DEFAULT_FALLBACK_MODELS = [
  {
    id: "gemini-3.1-flash-image-preview",
    name: "Gemini 3.1 Flash",
    description: "Pro-level visual intelligence with Flash-speed efficiency",
    provider: "gemini"
  },
];

// 模型 ID 现在是动态的字符串，不再限制为静态联合类型
export type ImageGenerationModelId = string;
