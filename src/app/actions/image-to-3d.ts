'use server';

import { resolveAdapter } from "@/lib/ai-adapters";
import prisma from "@/lib/prisma";

interface ImageGenResponse {
  b64_json?: string;
  error?: string;
}

// ============================================================
// 提示词集中管理
// ============================================================

/** 提示词1：纯手办产品照（英文 ACG 风格） */
const PROMPT_PRIMARY = "A professional studio product shot of a 1/7 scale premium ACG figurine featuring the characters in the reference image. The style is a highly detailed, mature stylized anime aesthetic. The figurine showcases masterful sculpting with crisp, clean edges, smooth matte skin, and vibrant, solid coloring. The characters feature expressive anime-style faces and distinct, stylized hair and clothing folds optimized for physical production. They are standing on a simple, elegant display base under soft studio lighting that perfectly highlights the PVC material texture. High resolution, masterpiece, official merchandise photography.";

/** 提示词2：效果展示图（中文餐桌场景） */
const PROMPT_SHOWCASE = "将手办图中的手办模型放置在一张家用餐桌上，手办底座为透明亚克力，无任何文字。手办旁边放着原图（另一张手绘图）和一支铅笔（表示刚刚有人在这里作画，现在已经离开了）。";

/** 后视图提示词 */
const PROMPT_BACK = "以上图为基准图（正面视图），生成该手办图的后视图。重要提示：保证人物100%的一致性，就像真实世界里存在这个手办，你只是拍摄他的多视角照片。";

/** 左侧视图提示词 */
const PROMPT_LEFT = "以上图为基准图（正面视图），生成该手办图的左侧视图。重要提示：保证人物100%的一致性，就像真实世界里存在这个手办，这个图片就是他的正视图，现在请你渲染左视角的照片。";

// ============================================================
// 核心通用图像生成请求发射器 (多供应商)
// ============================================================

/**
 * 根据 modelId 查询数据库获取 provider 和配置，调用对应适配器
 */
async function callImageGenAPI(
  prompt: string,
  modelId: string,
  baseImageB64?: string | string[]
): Promise<string> {
  // 查询 AiModel 表获取 provider 和配置
  const aiModel = await prisma.aiModel.findUnique({
    where: { modelId },
  });

  // 如果数据库中没有该模型记录，回退到 gemini（向后兼容）
  const provider = aiModel?.provider || "gemini";
  const adapterConfig = (aiModel?.config as Record<string, unknown>) || {};

  const adapter = resolveAdapter(provider);

  return adapter.generateImage({
    model: modelId,
    prompt,
    inputImageB64: baseImageB64,
    aspectRatio: "1:1",
    imageSize: "1K",
    adapterConfig,
  });
}

/**
 * 阶段一：基于输入图（抠图后优先）生成正面手办产品照
 */
export async function generatePrimaryRender(base64Image: string, modelId: string, promptOverride?: string): Promise<ImageGenResponse> {
  try {
     const prompt = promptOverride && promptOverride.trim() ? promptOverride : PROMPT_PRIMARY;
     console.log(`[Stage 1] Using prompt override: ${!!promptOverride}`);
     const resultBase64 = await callImageGenAPI(prompt, modelId, base64Image);
     return { b64_json: resultBase64 };
  } catch (error: any) {
     console.error("[Stage 1 Error] Generating Primary Render:", error);
     return { error: error.message || "Failed to generate primary render." };
  }
}

/**
 * 效果展示图：基于手办正视图 + 用户原始输入图 + 提示词2 生成餐桌场景展示
 */
export async function generateShowcaseImage(primaryImageB64: string, originalImageB64: string, modelId: string): Promise<ImageGenResponse> {
  try {
     // 两张输入图: [手办正视图, 用户原图]
     const resultBase64 = await callImageGenAPI(PROMPT_SHOWCASE, modelId, [primaryImageB64, originalImageB64]);
     return { b64_json: resultBase64 };
  } catch (error: any) {
     console.error("[Showcase Error] Generating Showcase Image:", error);
     return { error: error.message || "Failed to generate showcase image." };
  }
}

/**
 * 阶段二：并行生成后视图 + 侧视图 + 效果展示图（3 路并行）
 * @param primaryImageBase64 - 正面手办图的 base64（用于后视图/侧视图）
 * @param originalImageB64 - 用户原始上传图的 base64（用于效果展示图）
 * @param modelId - AI 模型 ID
 */
export async function generateSecondaryViews(primaryImageBase64: string, modelId: string, originalImageB64?: string) {
  try {
     // 3 路并行：后视图 + 侧视图 + 效果展示图
     console.log(`[Stage 2] Submitting 3-way parallel generation requests to ${modelId}...`);
     
     const promises: Promise<any>[] = [
        callImageGenAPI(PROMPT_BACK, modelId, primaryImageBase64),
        callImageGenAPI(PROMPT_LEFT, modelId, primaryImageBase64),
     ];

     // 效果展示图：使用原始输入图，失败不阻塞其他视图
     if (originalImageB64) {
        promises.push(
          generateShowcaseImage(primaryImageBase64, originalImageB64, modelId)
            .then(res => res.b64_json || null)
            .catch(err => {
              console.error("[Stage 2] Showcase generation failed (non-blocking):", err);
              return null;
            })
        );
     } else {
        promises.push(Promise.resolve(null));
     }

     const [backRes, leftRes, showcaseRes] = await Promise.all(promises);

     return {
         backViewB64: backRes as string,
         leftViewB64: leftRes as string,
         showcaseB64: showcaseRes as string | null
     };
  } catch (error: any) {
     console.error("[Stage 2 Error] Generating Secondary Views:", error);
     return { error: error.message || "Failed to generate secondary views." };
  }
}
