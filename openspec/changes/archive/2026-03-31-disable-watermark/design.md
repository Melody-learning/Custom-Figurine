## Context

当前 `JimengAdapter` 在调用火山方舟 Ark API (`/api/v3/images/generations`) 时，未设置 `watermark` 参数。Ark API 默认对生成图片添加水印。需要在请求体中显式设置 `watermark: false` 来关闭此行为。

Gemini 适配器无水印问题，无需修改。

## Goals / Non-Goals

**Goals:**
- 在 `JimengAdapter.generateImage()` 的请求体中添加 `watermark: false`
- 确保即梦所有模型变体（seedream-3.0, seedream-5.0-lite 等）均不带水印

**Non-Goals:**
- 不修改 Gemini 适配器（无水印问题）
- 不修改适配器接口或类型定义
- 不引入可配置的水印开关（直接硬编码关闭）

## Decisions

1. **硬编码 `watermark: false`**：由于本项目的所有生成图片都用于定制手办预览/确认，没有任何场景需要水印。因此直接硬编码为 `false`，不需要通过 `adapterConfig` 或环境变量做可选配置。

2. **仅修改 `jimeng.ts`**：Gemini API 不附加水印，因此只需要修改即梦适配器。变更范围最小化。

## Risks / Trade-offs

- **风险极低**：`watermark` 是 Ark API 官方支持参数，语义明确
- **合规性**：火山方舟平台 ToS 允许关闭水印（付费用户权限），无合规风险
