/**
 * 即梦 (Jimeng/Seedream) Adapter — 火山方舟 Ark API v3
 * 参考实现: E:\image_creator\server\adapters\jimeng.js
 *
 * 端点: https://ark.cn-beijing.volces.com/api/v3/images/generations
 * 认证: Bearer Token (ARK_API_KEY)
 * 每个模型需要独立的 Endpoint ID (通过环境变量配置)
 */

import type { ImageAdapter, ImageGenParams } from "./types";

const ARK_API_BASE = "https://ark.cn-beijing.volces.com/api/v3";

export class JimengAdapter implements ImageAdapter {
  async generateImage(params: ImageGenParams): Promise<string> {
    const arkApiKey = process.env.ARK_API_KEY;
    if (!arkApiKey) {
      throw new Error(
        "ARK_API_KEY 未配置。请在火山方舟控制台获取 API Key 并在环境变量中设置。"
      );
    }

    // 从 adapterConfig 获取接入点环境变量名
    const endpointEnvKey =
      (params.adapterConfig?.endpointEnvKey as string) || null;
    if (!endpointEnvKey) {
      throw new Error(
        `模型 ${params.model} 缺少 endpointEnvKey 配置，请在 Admin 后台为该模型设置 config.endpointEnvKey。`
      );
    }

    const endpointId = process.env[endpointEnvKey];
    if (!endpointId) {
      throw new Error(
        `模型 ${params.model} 的接入点 ID 未配置。请在环境变量中设置 ${endpointEnvKey}=ep-xxx（在火山方舟控制台创建接入点获取）`
      );
    }

    // 检查并自动调整尺寸（即梦有最小像素要求）
    const minDimension =
      (params.adapterConfig?.minDimension as number) || 1024;
    let width = 1024;
    let height = 1024;

    // 从 imageSize 解析尺寸
    if (params.imageSize && params.imageSize.includes("x")) {
      const [w, h] = params.imageSize.split("x").map(Number);
      width = w;
      height = h;
    }

    if (width < minDimension || height < minDimension) {
      const scale = Math.max(minDimension / width, minDimension / height);
      width = Math.ceil(width * scale);
      height = Math.ceil(height * scale);
      console.log(
        `[JimengAdapter] 模型 ${params.model} 要求最小 ${minDimension}px，尺寸已调整为 ${width}x${height}`
      );
    }

    const finalSize = `${width}x${height}`;

    // 构建请求体
    const body: Record<string, unknown> = {
      model: endpointId, // 使用接入点 ID，不是模型名
      prompt: params.prompt,
      size: finalSize,
      response_format: "b64_json",
    };

    // 参考图传入：将第一张图通过 image 字段传入
    if (params.inputImageB64) {
      const firstImage = Array.isArray(params.inputImageB64)
        ? params.inputImageB64[0]
        : params.inputImageB64;
      if (firstImage) {
        body.image = `data:image/png;base64,${firstImage}`;
      }
    }

    const url = `${ARK_API_BASE}/images/generations`;

    console.log(
      `[JimengAdapter] Calling Ark API: model=${params.model}, endpoint=${endpointId}, size=${finalSize}`
    );

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${arkApiKey}`,
      },
      body: JSON.stringify(body),
    });

    const result = await response.json();

    if (result.error) {
      throw new Error(
        `Ark API 错误: ${result.error.message || JSON.stringify(result.error)}`
      );
    }

    // 提取生成的图片
    const imageData = result.data?.[0];
    if (!imageData) {
      throw new Error("Ark API 未返回图片数据");
    }

    if (imageData.b64_json) {
      return imageData.b64_json as string;
    }

    if (imageData.url) {
      // 如果返回 URL，下载并转为 base64
      const imgRes = await fetch(imageData.url);
      const arrayBuffer = await imgRes.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      return buffer.toString("base64");
    }

    throw new Error("Ark API 返回格式异常：既无 b64_json 也无 url");
  }
}
