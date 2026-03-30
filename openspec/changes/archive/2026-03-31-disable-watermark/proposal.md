# Disable Watermark

## Why

即梦 (Jimeng/Seedream) 模型通过火山方舟 Ark API 生成图片时，默认会附带水印。Ark API 提供了 `watermark` 布尔参数用于控制水印开关。当前 `JimengAdapter` 未设置此参数，导致所有即梦生成的图片均带有水印，影响用户体验和后续 3D 打印流程。

## What Changes

- 在 `JimengAdapter.generateImage()` 的请求体中添加 `watermark: false` 参数，关闭即梦模型的默认水印
- 确保所有三个模型（Gemini 及两个即梦变体）生成图片时均无水印（Gemini 原生无水印，即梦通过参数关闭）

## Capabilities

### New Capabilities

- `watermark-free-generation`: 所有 AI 模型生成的图片均不含水印

### Changed Capabilities

_无_

## Spec Changes

_无需修改规范文档，该变更仅涉及适配器实现层参数设置_

## Impact

- 受影响文件: `src/lib/ai-adapters/jimeng.ts`
- 无 API 接口变更，无 breaking change
- 无数据库或配置变更
