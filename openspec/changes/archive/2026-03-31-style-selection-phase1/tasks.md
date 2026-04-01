# Tasks: Style Selection Phase 1

## 1. 风格常量数据层

- [x] 1.1 创建 `src/lib/constants/style-presets.ts`，定义 `StylePreset` 和 `StyleCategory` 接口类型
- [x] 1.2 填入 4 个大类及其子类：卡通（常规/Q版含完整提示词）、低多边形（常规/粗粝 TODO提示词）、雕塑（常规/无脸化 TODO提示词）、写实（常规，含当前 PROMPT_PRIMARY 提示词）
- [x] 1.3 导出 `STYLE_CATEGORIES` 常量数组和辅助函数 `findPresetById(id)`、`getDefaultPreset()`

## 2. 生图管线改造（后端）

- [x] 2.1 修改 `src/app/actions/image-to-3d.ts`：`generatePrimaryRender()` 新增 `promptOverride?: string` 参数，优先使用该参数，fallback 到 `PROMPT_PRIMARY`
- [x] 2.2 修改 `src/app/actions/start-generation.ts`：`StartGenerationPayload` 接口新增 `promptOverride?: string`，Webhook body 中携带该字段
- [x] 2.3 修改 `src/app/api/webhooks/generate/route.ts`：从 body 解构 `promptOverride`，传入 `generatePrimaryRender()` 调用

## 3. FigurineGenerationGallery 组件改造

- [x] 3.1 `FigurineGenerationGalleryProps` 新增 `stylePrompt?: string` prop
- [x] 3.2 `startGenerationFlow()` 调用 `startAsyncGeneration` 时传入 `promptOverride: stylePrompt`

## 4. 风格选取 UI（customize/page.tsx）

- [x] 4.1 新增 state：`selectedCategoryId`（默认 `"cartoon"`）和 `selectedPresetId`（默认 `"cartoon-standard"`）
- [x] 4.2 新增辅助计算值：`selectedPreset`（从 STYLE_CATEGORIES 查找）、`selectedCategoryIsOrderable`
- [x] 4.3 在 BG Filter Toggle 和行动按钮组之间，插入风格选取面板（StyleSelector 区域）：
  - 大类卡片水平排列（4等分），含名称和视觉占位（accentColor 色块 + 图标）
  - 写实卡片右上角显示 "Preview Only" 徽章
  - 选中大类后，卡片内展开子类 Radio Group（列表形式）
- [x] 4.4 `FigurineGenerationGallery` 组件调用处新增 `stylePrompt={selectedPreset?.primaryPrompt}` prop
- [x] 4.5 Step 3（select）：若 `!selectedCategoryIsOrderable`，Continue 按钮 `disabled`，下方追加提示文案
- [x] 4.6 Step 4（confirm）：若 `!selectedCategoryIsOrderable`，Add to Cart/Checkout 按钮 `disabled`，显示提示说明

## 5. 视觉与交互打磨

- [x] 5.1 风格选取面板样式：与现有卡片系统保持一致（`rounded-xl border bg-white/80 backdrop-blur-md`），使用 Tailwind 现有语法
- [x] 5.2 大类卡片选中态：`ring-2 ring-[primary-color]` + 轻微 scale 动效（`scale-[1.02]`）
- [x] 5.3 子类 Radio 选项：hover/selected 视觉区分，使用品牌色点标记
- [x] 5.4 写实卡片视觉：整体保持可交互（不 disabled），仅徽章和后续步骤限制下单

## 6. 收尾与验证

- [x] 6.1 本地手动测试：选卡通常规 → 生成 → 确认生图 API 接收到正确提示词（查看 Vercel 或本地日志）
- [x] 6.2 本地手动测试：选写实风格 → 生成 → Step 3/4 确认按钮 disabled
- [x] 6.3 本地手动测试：切换大类/子类，BG Removal 状态不受干扰
- [x] 6.4 更新 `openspec/specs/integrations/ai-generation.md`：说明 promptOverride 透传机制，更新"已知限制"中关于提示词硬编码的条目
