# Proposal: 后台可配置 AI 生图模型

## Why

当前定制流程的 4 张图生成（正面、背面、侧面、效果展示）硬编码使用 Gemini 模型，且模型列表在前端代码中定义，每次新增模型都需要改代码重新部署。同时业务需求要求接入即梦 (Seedream) 系列模型（4.0/4.5/5.0），以提供更贴合亚洲面孔的生图能力。

需要将模型配置提升为后台可管理的配置项，支持多供应商（Google Gemini + 火山方舟即梦），无需改代码即可动态增删模型。

## What Changes

### 新增多供应商 AI 调用适配器
- 抽象统一的 `ImageAdapter` 接口，支持 Gemini 和即梦（火山方舟 Ark API）两个供应商
- 即梦适配器通过 `https://ark.cn-beijing.volces.com/api/v3/images/generations` 端点调用
- 每个即梦模型需要独立的接入点 ID（Endpoint ID），通过环境变量配置

### 后台模型配置
- 新增 `AiModel` 数据库表，存储可用模型的 ID、名称、供应商、接入点映射等
- 新增 Admin API 端点管理模型配置（CRUD）
- 前端模型列表改为从 API 动态获取，替换硬编码的 `ai-models.ts`

### 模型可选列表扩展
- **Gemini 系列**：`gemini-3.1-flash-image-preview`、`gemini-3-pro-image-preview`、`gemini-2.5-flash-image`
- **即梦系列**：`seedream-5.0-lite`、`seedream-4.5`、`seedream-4.0`

## Requirements Changes

- `ai-generation`: 新增即梦供应商支持，模型列表从硬编码改为数据库驱动
- `database`: 新增 `AiModel` 表

## Impact

- **代码**：`src/app/actions/image-to-3d.ts` 改造为多供应商分发，新增即梦适配器
- **数据库**：新增 `AiModel` 表（prisma/schema.prisma）
- **API**：新增 `/api/admin/ai-models` 管理端点，新增 `/api/ai-models` 公开查询端点
- **环境变量**：新增 `ARK_API_KEY`、`ARK_EP_SEEDREAM_*` 系列变量
- **前端**：`FigurineGenerationGallery.tsx` 模型选择器改为动态数据源
- **依赖**：无新增 npm 依赖（即梦使用原生 `fetch`，Gemini 沿用 `@google/genai`）
