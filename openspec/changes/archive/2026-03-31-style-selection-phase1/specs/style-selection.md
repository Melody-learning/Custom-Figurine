# Spec: 风格选取 — 生成流程 (Style Selection — Generation Flow)

> 此规范覆盖 Phase 1 新增能力：用户在生成前选择风格大类和子类，所选提示词透传到后台生图管线。

---

## Capability: 风格常量数据源 (Style Preset Constants)

**Requirement**: 系统提供一个 TypeScript 常量文件，定义风格大类与子类的结构，包含显示名、提示词、是否可下单等元数据。

#### Scenario: 获取默认风格列表
- **WHEN** 系统加载风格常量
- **THEN** 应返回 4 个大类：卡通风格、低多边形风格、雕塑风格、写实风格
- **AND** 卡通风格包含 2 个子类（常规、Q版），每个子类有有效的 `primaryPrompt` 文本
- **AND** 低多边形/雕塑各包含 2 个子类（内容暂为 TODO 占位，不为空字符串）
- **AND** 写实风格包含 1 个子类（常规），`primaryPrompt` 为当前系统默认写实提示词

#### Scenario: isOrderable 字段
- **WHEN** 读取任意大类的 `isOrderable` 字段
- **THEN** 卡通/低多边形/雕塑返回 `true`
- **AND** 写实风格返回 `false`

---

## Capability: 风格选取 UI (Style Selector UI)

**Requirement**: 用户上传图片进入预览区后，在"行动按钮组"上方可见"选择生成风格"面板，并可交互选取大类和子类。

#### Scenario: 显示风格选择面板
- **WHEN** 用户已上传图片（`uploadedImage` 非空）
- **THEN** 在 Smart Background Filter Toggle 下方、行动按钮上方显示风格选择区域
- **AND** 默认选中第一个大类（卡通风格）下的第一个子类（常规）

#### Scenario: 点击大类卡片展开子类
- **WHEN** 用户点击未选中的大类卡片
- **THEN** 该大类高亮选中
- **AND** 在该卡片内联显示该大类所有子类的 Radio Group
- **AND** 默认选中该大类的第一个子类

#### Scenario: 切换大类
- **WHEN** 用户点击另一个大类卡片
- **THEN** 新大类选中并展开子类
- **AND** 先前大类收起子类列表

#### Scenario: 写实风格 Preview Only 标识
- **WHEN** 写实风格大类卡片渲染
- **THEN** 卡片右上角显示 "Preview Only" 徽章（灰色，半透明）
- **AND** 卡片整体视觉上可点击、可选中

#### Scenario: BG Removal 进行中时风格选取可用
- **WHEN** 系统正在执行 BG Removal（`bgProcessing === true`）
- **THEN** 风格选取面板仍然可用，用户可自由切换风格
- **AND** 风格切换不影响 BG Removal 进程

---

## Capability: 提示词透传 (Prompt Passthrough Pipeline)

**Requirement**: 用户选定的风格子类 `primaryPrompt` 经由 FigurineGenerationGallery → startAsyncGeneration → Webhook → generatePrimaryRender 完整传递，优先于硬编码的 PROMPT_PRIMARY。

#### Scenario: 提示词正常传入
- **WHEN** 用户选中"卡通风格 → Q版"并点击生成
- **THEN** `FigurineGenerationGallery` 接收到 Q版的 `primaryPrompt` 作为 prop
- **AND** `startAsyncGeneration` 调用时 payload 中包含该 promptOverride
- **AND** Webhook Worker 用该 promptOverride 代替 PROMPT_PRIMARY 调用生图 API

#### Scenario: 回退行为（promptOverride 为空）
- **WHEN** `promptOverride` 为 undefined 或空字符串
- **THEN** 生图系统回退使用全局默认的 `PROMPT_PRIMARY`（硬编码）

#### Scenario: 写实风格生图正常
- **WHEN** 用户选中"写实风格 → 常规"并点击生成
- **THEN** 生图流程正常执行，使用写实风格对应的提示词
- **AND** 生成结果正常显示在 FigurineGenerationGallery 中

---

## Capability: 写实风格下单限制 (Realistic Style Order Restriction)

**Requirement**: 当用户选择了 `isOrderable: false` 的风格（写实风格）进入后续步骤时，购物车相关按钮被禁用，并显示明确提示。

#### Scenario: Step 3 下单按钮禁用
- **WHEN** 用户在风格选取中选择了写实风格（isOrderable=false）
- **AND** 用户进入 Step 3（选择规格）
- **THEN** "Continue" 按钮为 disabled 状态
- **AND** 页面显示提示文本："Realistic style is currently not available for order."

#### Scenario: Step 4 加入购物车按钮禁用
- **WHEN** 用户在 Step 4（确认页）且当前风格为 isOrderable=false
- **THEN** "Add to Cart"/"Checkout" 按钮为 disabled
- **AND** 显示说明文本

#### Scenario: 可下单风格不受限制
- **WHEN** 用户选择了卡通/低多边形/雕塑等 isOrderable=true 的风格
- **THEN** Step 3/Step 4 的购物车按钮行为与现有流程完全一致，无任何限制
