# Customize Revamp — 前端组件规范变更（以实际实现为准）

> **实现说明**：本变更提案原定流程为 `entry → upload → generate → confirm`，
> 实际落地为 `upload → style → generate → confirm`（4 步）。
> `entry` 风格首屏未独立为页面，而是重构为流程第 2 步的专属 Style 步骤，
> 以保持「先上传、再选风格」的渐进体验。以下规范以**实际实现**为准。

---

## ADDED Requirements

### Requirement: 独立风格选取步骤（Dedicated Style Step）
Upload 完成后进入专属的 Style 选取页面，选择风格大类 + 变体后，才允许进入生成步骤。

#### Scenario: 上传完成后进入风格选取
- **WHEN** 用户完成图片上传，点击「Continue」
- **THEN** step 切换为 `style`，展示风格大类卡片网格 + 变体 pill 选择器

#### Scenario: 风格选取后进入生成
- **WHEN** 用户选择风格大类 + 变体，点击「Start Crafting My Figurine」
- **THEN** selectedCategoryId / selectedPresetId 已确定，step 切换为 `generate`

#### Scenario: 预览风格（isOrderable = false）
- **WHEN** 用户选择 isOrderable 为 false 的风格（如 Realistic）
- **THEN** 「Start Crafting My Figurine」按钮**仍可点击**，下方显示灰色小字提示「Preview style — generation is available but ordering is not yet open」
- **THEN** 允许正常进入 generate 步骤和完成生成
- **THEN** 在 confirm 步骤「Add to Cart」按钮 disabled，显示「Ordering not yet available for this style」提示

---

### Requirement: 抠图默认关闭（BG Removal Default Off）
用户上传图片后，抠图功能默认不激活，需要手动开启。

#### Scenario: 图片上传成功
- **WHEN** 用户选择图片文件
- **THEN** bgFilterEnabled 为 false，图片直接展示，不触发 WASM 抠图

#### Scenario: 用户手动开启抠图
- **WHEN** 用户点击「Remove Background」按钮（bgFilterEnabled 切为 true）
- **THEN** 抠图流程开始，bgProcessing 为 true

#### Scenario: 抠图进行中其他操作
- **WHEN** bgProcessing 为 true
- **THEN** 「Continue」按钮处于 disabled 状态，文案变为「Processing photo...」

---

### Requirement: 生成自动触发（Auto-Start Generation）
进入 Gallery 步骤后，无需用户手动点击按钮，生成流程自动开始。

#### Scenario: 正常流程进入 generate 步骤
- **WHEN** step 切换为 `generate` 且 initialViews 为 null
- **THEN** FigurineGenerationGallery 挂载后立即调用 startGenerationFlow()，status 变为 GENERATING_PRIMARY

#### Scenario: 从 Vault 进入（有 initialViews）
- **WHEN** initialViews 不为空
- **THEN** 不触发自动生成，status 直接为 COMPLETE，展示已有视图

#### Scenario: 错误后重新生成
- **WHEN** status 为 ERROR
- **THEN** 页面展示「Retry」按钮，用户手动点击后重新触发 startGenerationFlow()

---

## MODIFIED Requirements

### Requirement: 步骤流程（Step Flow）
4 步流程：upload → style → generate → confirm。

#### Scenario: 完整正常流程
- **WHEN** 用户访问 /customize
- **THEN** 流程为：`upload` → `style` → `generate` → `confirm`

#### Scenario: Gallery 生成完成
- **WHEN** onComplete 回调触发
- **THEN** step 切换为 `confirm`（而非原来的 `select`）

#### Scenario: Confirm 页规格选择
- **WHEN** step 为 `confirm`
- **THEN** 页面展示：生成图预览、商品规格选项、价格、加入购物车按钮（原 select + confirm 合并内容）

---

### Requirement: Gallery 操作按钮语义
Gallery 底部操作按钮语义清晰，图标与动作一致。

#### Scenario: 生成进行中
- **WHEN** status 为 GENERATING_PRIMARY 或 GENERATING_SECONDARY
- **THEN** 右侧进入 confirm 按钮不可见或 disabled

#### Scenario: 生成完成
- **WHEN** status 为 COMPLETE
- **THEN** 右侧按钮文案为「View Results & Order」，图标为 ArrowRight

---

## REMOVED Requirements

### Requirement: 手动触发生成（Initialize Canvas 按钮）
**Reason**: 生成改为自动触发，手动按钮在正常流程中不再需要  
**Migration**: ERROR 状态下改为显示「Retry」重试按钮代替「Initialize Canvas」

### Requirement: Finalize Tri-View Model 按钮
**Reason**: 语义不清晰，已合并为「View Results & Order」统一入口  
**Migration**: 「View Results & Order」按钮承担原按钮职责
