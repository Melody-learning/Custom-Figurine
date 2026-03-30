/**
 * AI Image Adapter — 统一接口定义
 * 所有供应商（Gemini、即梦等）通过此接口对齐调用方式
 */

export interface ImageGenParams {
  /** AI 模型标识符 (如 "gemini-3.1-flash-image-preview" 或 "seedream-5.0-lite") */
  model: string;
  /** 文本提示词 */
  prompt: string;
  /** 参考图 base64（单图或多图），可选 */
  inputImageB64?: string | string[];
  /** 宽高比 (默认 "1:1") */
  aspectRatio?: string;
  /** 图片尺寸 (Gemini: "1K", 即梦: "1024x1024") */
  imageSize?: string;
  /** 供应商特定配置 (来自 AiModel.config JSON) */
  adapterConfig?: Record<string, unknown>;
}

export interface ImageAdapter {
  /** 生成图片，返回 base64 编码的图片数据 */
  generateImage(params: ImageGenParams): Promise<string>;
}
