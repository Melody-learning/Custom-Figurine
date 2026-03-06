// 购物车商品类型
export interface CartItem {
  id: string;
  variantId: string;
  title: string;
  price: number;
  quantity: number;
  image?: string;
  customImage?: string; // 用户上传的自定义图片
  generatedImage?: string; // AI 生成的图片
}

// AI 生成状态
export type ImageGenerationStatus = 'idle' | 'generating' | 'success' | 'error';

// AI 生成结果
export interface GenerationResult {
  imageUrl: string;
  status: ImageGenerationStatus;
}
