// 购物车商品类型
export interface CartItem {
  id: string;
  variantId: string;
  title: string;
  price: number;
  quantity: number;
  size?: string;
  image?: string;
  customImage?: string; // 用户上传的自定义图片
  generatedImage?: string; // AI 生成的图片
  generatedAssetId?: string; // 关联到 GeneratedAsset
  customInstructions?: string; // 用户定制备注
}

// AI 生成状态
export type ImageGenerationStatus = 'idle' | 'generating' | 'success' | 'error';

// AI 生成结果
export interface GenerationResult {
  imageUrl: string;
  status: ImageGenerationStatus;
}

// 订单摘要（用于列表展示）
export interface OrderSummary {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  currency: string;
  itemCount: number;
  previewImageUrl: string | null;
  createdAt: string;
  paidAt: string | null;
}
