/**
 * 浏览器端背景移除工具模块
 * 
 * 使用 @imgly/background-removal 在客户端（浏览器 WASM）执行抠图。
 * Feature Flag: NEXT_PUBLIC_ENABLE_BG_REMOVAL
 * 
 * 设计原则：
 * - Graceful Degradation：抠图失败自动回退原图，不阻塞流程
 * - 单线程 Fallback：不依赖 SharedArrayBuffer，避免 COOP/COEP headers 影响 OAuth/Shopify
 * - 进度回调：UI 可显示模型下载和推理进度
 */

import { removeBackground as imglyRemoveBackground } from '@imgly/background-removal';

/** 抠图进度阶段 */
export type BgRemovalStage = 'downloading' | 'processing' | 'done' | 'error' | 'skipped';

/** 抠图进度回调参数 */
export interface BgRemovalProgress {
  stage: BgRemovalStage;
  progress: number; // 0-1
  message: string;
}

/** 抠图结果 */
export interface BgRemovalResult {
  /** 抠图后图片的 base64 data URL */
  processedImageUrl: string;
  /** 是否成功执行了抠图（false 表示回退到原图） */
  wasProcessed: boolean;
}

/**
 * 检查 Feature Flag 是否启用抠图预处理
 */
export function isBgRemovalEnabled(): boolean {
  if (typeof window === 'undefined') return false;  
  return process.env.NEXT_PUBLIC_ENABLE_BG_REMOVAL === 'true';
}

/**
 * 将 base64 data URL 转换为 Blob
 */
function dataURLtoBlob(dataURL: string): Blob {
  const parts = dataURL.split(';base64,');
  const contentType = parts[0].split(':')[1] || 'image/jpeg';
  const raw = atob(parts[1]);
  const array = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) {
    array[i] = raw.charCodeAt(i);
  }
  return new Blob([array], { type: contentType });
}

/**
 * 将 Blob 转换为 base64 data URL
 */
function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * 对图片执行背景移除
 * 
 * @param imageDataUrl - 原始图片的 base64 data URL
 * @param onProgress - 进度回调
 * @returns 抠图结果（成功则返回抠图图片，失败则返回原图）
 */
export async function removeImageBackground(
  imageDataUrl: string,
  onProgress?: (progress: BgRemovalProgress) => void
): Promise<BgRemovalResult> {
  // Feature Flag 检查
  if (!isBgRemovalEnabled()) {
    onProgress?.({ stage: 'skipped', progress: 1, message: 'Background removal disabled' });
    return { processedImageUrl: imageDataUrl, wasProcessed: false };
  }

  try {
    // 阶段1：通知 UI 开始下载模型
    onProgress?.({ stage: 'downloading', progress: 0, message: 'Loading AI model...' });

    // 将 data URL 转为 Blob 输入
    const inputBlob = dataURLtoBlob(imageDataUrl);

    // 阶段2：执行抠图
    onProgress?.({ stage: 'processing', progress: 0.3, message: 'Removing background...' });

    const resultBlob = await imglyRemoveBackground(inputBlob, {
      progress: (key: string, current: number, total: number) => {
        const ratio = total > 0 ? current / total : 0;
        
        if (key.includes('fetch') || key.includes('download')) {
          onProgress?.({ 
            stage: 'downloading', 
            progress: ratio * 0.5, // 下载占前 50%
            message: `Downloading model... ${Math.round(ratio * 100)}%`
          });
        } else {
          onProgress?.({ 
            stage: 'processing', 
            progress: 0.5 + ratio * 0.5, // 处理占后 50%
            message: `Processing image... ${Math.round(ratio * 100)}%`
          });
        }
      },
      // model: 'medium' is the default, good balance of speed and quality
      output: {
        format: 'image/png', // PNG 保留透明通道
        quality: 0.9,
      },
    });

    // 转为 data URL
    const resultDataUrl = await blobToDataURL(resultBlob);

    onProgress?.({ stage: 'done', progress: 1, message: 'Background removed!' });

    return { processedImageUrl: resultDataUrl, wasProcessed: true };

  } catch (error) {
    console.error('[BgRemoval] Failed to remove background, falling back to original:', error);
    onProgress?.({ stage: 'error', progress: 1, message: 'Background removal failed, using original' });
    
    // Graceful fallback: 返回原图
    return { processedImageUrl: imageDataUrl, wasProcessed: false };
  }
}
