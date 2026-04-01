# Proposal: Style Selection Phase 1 — Frontend UI + Pipeline Integration

## Why

当前生成流程将"写实 ACG 风格"提示词硬编码在 `image-to-3d.ts`，用户无法选择生成风格，限制了产品的差异化能力和转化潜力。通过在上传预览环节加入风格选取，能让用户在生成前明确意图，提升结果满意度，同时为后续 Admin 后台配置化（Phase 2）打好前端基础。

## What Changes

### 新增能力

1. **风格选取 UI**：在上传预览页（Step 1）的行动按钮区上方，新增风格选择面板。展示 4 个风格大类（卡通/低多边形/雕塑/写实），点击大类后展开子类选择（常规/Q版等）。
2. **写实风格限购提示**：写实风格大类添加"Preview Only"徽章，选中写实风格生成的资产在 Step 3/4 中禁用购物车按钮，显示"Not available for order"提示。
3. **提示词管线打通**：将所选风格的 `primaryPrompt` 经由 `FigurineGenerationGallery` → `startAsyncGeneration` → Webhook Worker 全程透传，替换当前硬编码的 `PROMPT_PRIMARY`。
4. **风格常量文件**：新增 `src/lib/constants/style-presets.ts`，以 TypeScript 常量定义大类及子类结构（含提示词）。卡通风格提供两条真实提示词（常规/Q版），其他三个大类（低多边形/雕塑/写实）以当前写实提示词占位（标注 TODO）。

### 明确不包含（Phase 2 范畴）

- Admin 后台风格管理 CRUD
- 风格数据库表（StyleCategory / StylePreset）
- 示意图真实图片上传（Phase 1 用颜色/图标占位）
- 后视图/侧视图提示词按风格定制
- `GeneratedAsset` 表新增 `stylePresetId` 字段

## Requirement Changes

- `integrations/ai-generation.md`：更新"Prompt 工程"章节，说明提示词来源从硬编码改为通过调用链传入，并记录风格常量数据结构规范

## Impact

- **`src/lib/constants/style-presets.ts`**：新建，风格常量数据源
- **`src/app/customize/page.tsx`**：新增风格选择状态 + StyleSelector 区域渲染 + 下单限制检查
- **`src/components/ai/FigurineGenerationGallery.tsx`**：新增 `stylePrompt?: string` prop，传入 `startAsyncGeneration`
- **`src/app/actions/start-generation.ts`**：新增 `promptOverride?: string` 参数，Webhook Payload 携带 prompt
- **`src/app/api/webhooks/generate/route.ts`**：接收并使用传入的 prompt，覆盖硬编码 `PROMPT_PRIMARY`
- **`src/app/actions/image-to-3d.ts`**：`generatePrimaryRender()` 接受可选 `promptOverride` 参数
