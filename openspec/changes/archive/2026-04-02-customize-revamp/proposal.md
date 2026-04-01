# customize-revamp

## Why

定制页（Customize）是核心转化路径，但当前的信息架构和 UI 语言存在多处摩擦：步骤过多且职责边界不清、风格选取隐藏在上传后、抠图操作产生"硬控"阻塞感、关键按钮语义模糊——这些问题共同削弱了用户对「定制手办」这一高价值体验的感知和信心。

## What Changes

### 信息架构（结构性调整）

- **新增风格优先入口**：风格选取（Style Picker）从 Step 1 上传区内移出，作为 Customize 页的首屏内容展示，先激发用户欲望，再引导上传
- **Step 1 极简化**：上传区只保留拖拽上传 + 可选的"Remove Background"开关（默认 OFF），移除风格选取面板
- **抠图默认关闭**：`bgFilterEnabled` 初始值改为 `false`；抠图进行中其他按钮统一设为 `disabled` 并附带明确说明，消除"以为能点"的误导
- **生成自动触发**：进入 Step 2（FigurineGenerationGallery）后，流程自动开始，不再需要用户手动点击 "Initialize Canvas"
- **合并 Step 3 + Step 4**：将规格选择（原 Step 3）并入确认页（原 Step 4），总步骤从 4 步缩减为 3 步

### UI 与语言包装（跟随架构调整，不大幅重构）

- **废弃 "Initialize Canvas" 按钮**：自动触发后，该按钮在正常流程中不再出现
- **"Finalize Tri-View Model" → 语义明确的操作文案**，图标从 Download 改为 ArrowRight
- **文案整体去技术化**：Gallery 内的"Virtualizing 3D Scene"、"baking albedo textures"等术语改为工艺包装语言，保持「定制手办工作室」的品牌感而非「AI 生图工具」的感知
- **步骤指示条更新**：4 步 → 3 步视觉同步更新
- **Reference 图 HUD**：IDLE 状态下隐藏，仅在生成中/完成后展示

## Capabilities

### New Capabilities

- `style-first-entry`：风格选取作为 Customize 页独立首屏模块，默认展开，可横向滚动浏览所有风格大类及预览

### Modified Capabilities

- `bg-removal-default`：抠图开关默认值由 `true` 改为 `false`
- `generation-auto-start`：进入 Gallery 后自动触发，取消手动触发方式
- `step-flow`：4 步流程重组为 3 步（Upload → Craft → Confirm & Order）

## Requirement Changes

- `frontend/components`：Customize 页步骤结构、Gallery 交互行为、文案语气规范

## Impact

- **主要影响文件**：`src/app/customize/page.tsx`、`src/components/ai/FigurineGenerationGallery.tsx`
- **无后端 API 变更**，无数据库 Schema 变更
- **不影响**：购物车流程、Shopify 结账、鉴权逻辑、首页
