## Why

定制流程中的抠图功能目前由 `NEXT_PUBLIC_ENABLE_BG_REMOVAL` 环境变量控制，用户无法在 UI 层面选择是否抠图。此外，上传后的预览图和生图结果的所有缩略图都不支持点击查看大图，用户无法确认图片细节（抠图质量、生成质量），体验粗糙。

## What Changes

- **用户可控的抠图开关**：在上传步骤中添加一个 UI Toggle（命名为 "Smart Background Filter" / "智能背景过滤"），默认开启。开启时上传完成后自动执行抠图，关闭时跳过抠图环节。此开关仅在 `NEXT_PUBLIC_ENABLE_BG_REMOVAL=true` 时显示，即环境变量是总开关，UI Toggle 是用户级子开关。
- **全局 Lightbox 查看大图组件**：新建 `ImageLightbox` 组件，支持点击任意图片展开全屏/模态框查看原图。组件风格适配当前主题系统（`useThemeConfig`），支持遮罩层点击关闭、ESC 关闭、缩放手势。
- **接入 Lightbox 的位置**：
  - 上传步骤：预览图、抠图 Before/After 对比图
  - 生图展厅（FigurineGenerationGallery）：主视觉、三视图缩略图
  - 确认步骤：生成结果图、原图

## Capabilities

### New Capabilities

- `image-lightbox`: 全局图片查看大图组件，支持主题适配、模态展示、键盘/手势交互

### Modified Capabilities

- `integrations/ai-generation`: 客户端预处理管线新增用户级抠图开关（UI Toggle 子控制）
- `frontend/components`: 新增 ImageLightbox 组件规范，定制页多处图片接入 Lightbox

## Impact

- **新文件**：`src/components/ImageLightbox.tsx`
- **修改文件**：
  - `src/app/customize/page.tsx` — 添加 Toggle + 接入 Lightbox
  - `src/components/ai/FigurineGenerationGallery.tsx` — 图片接入 Lightbox
  - `src/lib/i18n.ts` — 新增抠图开关和 Lightbox 的翻译文案
- **依赖**：无新 npm 依赖（Lightbox 用原生 React Portal + CSS 实现）
