# Tasks: Style Model Override & Generation Tracking

## 1. Schema & 数据层

- [x] 1.1 `prisma/schema.prisma` — GeneratedAsset 增加 `primaryModelId`、`secondaryModelId`、`styleCategorySlug`、`stylePresetSlug` 四个可选字段
- [x] 1.2 执行 `npx prisma db push` 推送 Schema 变更
- [x] 1.3 `src/lib/constants/style-presets.ts` — StylePreset 接口增加 `aiModelId?: string | null`

## 2. Server Action & Webhook 双模型传递

- [x] 2.1 `src/app/actions/start-generation.ts` — payload 接口增加 `primaryModelId`、`secondaryModelId`、`styleCategorySlug`、`stylePresetSlug`；创建 asset 时写入这些字段；webhook payload 传递双模型
- [x] 2.2 `src/app/api/webhooks/generate/route.ts` — 接收 `primaryModelId` + `secondaryModelId`；Task 1 用 primaryModelId，Task 2/3/4 用 secondaryModelId；完成时更新 DB 确认模型

## 3. 前端链路改造

- [x] 3.1 `src/components/ai/FigurineGenerationGallery.tsx` — 新增 props: `styleModelId?`、`styleCategorySlug?`、`stylePresetSlug?`；计算 primaryModelId（styleModelId || 全局默认）和 secondaryModelId（全局默认）；传递给 startAsyncGeneration
- [x] 3.2 `src/app/customize/page.tsx` — 将 `selectedPreset.aiModelId`、`selectedCategory.id`、`selectedPreset.id` 传递给 FigurineGenerationGallery

## 4. Admin Generations 页面

- [x] 4.1 `src/app/admin/generations/page.tsx` — Generation 接口增加 `primaryModelId`、`secondaryModelId`、`styleCategorySlug`、`stylePresetSlug` 字段
- [x] 4.2 表格增加 "Style" 列，展示 `styleCategorySlug / stylePresetSlug`
- [x] 4.3 "Model" 列改为展示 `primaryModelId`（fallback `modelId`），如果 primary ≠ secondary 则标注差异
- [x] 4.4 展开详情行每张图下方标注使用的模型 ID（Primary 图用 primaryModelId，其余用 secondaryModelId）

## 5. 验证

- [x] 5.1 本地启动 dev，在风格选择中给某个 preset 绑定不同模型，确认 primary 和 secondary 使用不同模型
- [x] 5.2 Admin Generations 页面确认新记录显示双模型和风格信息
- [x] 5.3 确认旧记录（无新字段）正常 fallback 展示
