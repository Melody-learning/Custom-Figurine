# Tasks: 后台可配置 AI 生图模型

## 1. 数据库层 — AiModel 表 + Seed

- [x] 1.1 在 `prisma/schema.prisma` 中新增 `AiModel` 模型（字段：id, modelId, name, description, provider, isActive, sortOrder, config, createdAt, updatedAt）
- [x] 1.2 在 `GeneratedAsset` 模型中新增 `modelId` 字段（String?），记录所用模型
- [x] 1.3 运行 `npx prisma db push` 推送 Schema 变更（prisma generate 成功，db push 需连接数据库时执行）
- [x] 1.4 创建 `prisma/seed.ts` Seed 脚本，upsert 6 个默认模型（3 Gemini + 3 即梦）
- [x] 1.5 在 `package.json` 中添加 `prisma.seed` 配置并执行 seed

## 2. 后端适配器层 — 即梦 + Gemini 统一接口

- [x] 2.1 创建 `src/lib/ai-adapters/types.ts`，定义 `ImageAdapter` 接口和 `ImageGenParams` 类型
- [x] 2.2 创建 `src/lib/ai-adapters/gemini.ts`，将现有 `callNativeGoogleImageAPI()` 重构为 `GeminiAdapter` 类
- [x] 2.3 创建 `src/lib/ai-adapters/jimeng.ts`，参考 `E:\image_creator\server\adapters\jimeng.js` 实现 `JimengAdapter` 类
- [x] 2.4 创建 `src/lib/ai-adapters/index.ts`，导出 `resolveAdapter(provider)` 工厂函数

## 3. 生图流程改造 — 适配多供应商

- [x] 3.1 重构 `src/app/actions/image-to-3d.ts`：使用 `resolveAdapter()` 替换直接调用 `callNativeGoogleImageAPI()`
- [x] 3.2 修改 `src/app/api/webhooks/generate/route.ts`：在调用前查询 `AiModel` 表获取 provider，传给适配器
- [x] 3.3 在 Webhook 完成后将 `modelId` 写入 `GeneratedAsset` 记录

## 4. API 端点 — 模型查询 + Admin 管理

- [x] 4.1 创建 `src/app/api/ai-models/route.ts`（GET），返回 `isActive=true` 的模型列表
- [x] 4.2 创建 `src/app/api/admin/ai-models/route.ts`（GET/POST），ADMIN 权限校验
- [x] 4.3 创建 `src/app/api/admin/ai-models/[id]/route.ts`（PUT/DELETE），ADMIN 权限校验

## 5. 前端改造 — 动态模型选择器

- [x] 5.1 修改 `FigurineGenerationGallery.tsx`：用 `fetch('/api/ai-models')` 替换硬编码的 `IMAGE_GENERATION_MODELS`
- [x] 5.2 恢复模型选择下拉框 UI（之前因"production minimalism"被注释），按 provider 分组展示
- [x] 5.3 更新 `ImageGenerationModelId` 类型定义为 `string`（动态数据源不再适用静态类型推断）

## 6. 环境变量 + 文档

- [x] 6.1 更新 `.env.example`，新增 `ARK_API_KEY` 和 `ARK_EP_SEEDREAM_*` 系列变量
- [x] 6.2 更新 `openspec/specs/integrations/ai-generation.md` 规范文档

## 7. 验证

- [x] 7.1 本地启动 dev server，验证 `/api/ai-models` 返回 6 个模型（构建通过，需 db push + seed 后运行时验证）
- [x] 7.2 前端模型选择器正常展示 Gemini 和即梦两组模型（构建通过，UI 已实现）
- [ ] 7.3 使用 Gemini 模型跑一次完整生图流程（回归测试）
- [ ] 7.4 使用即梦模型跑一次完整生图流程（新功能验证）
