## Context

Customize 页是用户从「上传照片」到「加入购物车」的核心路径，当前实现为 `src/app/customize/page.tsx`（1033 行）+ `FigurineGenerationGallery.tsx`（409 行）。现有 4 步状态机（upload → generate → select → confirm）存在结构性问题，需要重组为 3 步，并调整 Gallery 的交互触发方式和文案包装体系。

## Goals / Non-Goals

**Goals:**
- 将风格选取移出 Step 1，作为首屏独立模块（entry）
- 抠图开关默认 OFF，抠图进行中按钮 disabled 状态明确
- Gallery 进入后自动开始生成，不需要手动点击
- Step 3 + Step 4 合并为单页完成规格选择和下单
- 文案语气统一为「定制工艺」语境，去技术术语

**Non-Goals:**
- 不修改生成引擎（API、模型选择、Prompt）
- 不修改 Shopify 结账流程
- 不修改首页、Header、购物车组件
- 不引入大规模视觉重构或新动效库（保留现有 Framer Motion 用法）

## Decisions

### D1. 风格选取作为 Step 0 / Entry 模块

**决策**：在 `page.tsx` 中新增一个 `entry` 阶段，展示所有风格大类（横向滚动卡片），点击任一风格后进入 Step 1 上传。Step 1 顶部展示当前已选风格的 badge，允许用户返回修改。

**理由**：风格是用户对产品的第一个具体选择，放在首屏可以建立期待感，同时减少 Step 1 的认知负担。

**实现要点**：
- 新增 `step` 类型值 `'entry'`，初始 step 为 `'entry'`
- 仅 `from vault` 的情况跳过 `entry` 直接进 `generate`
- 风格卡片复用现有 `styleCategories` 数据，布局改为水平滚动

### D2. 抠图默认关闭

**决策**：`bgFilterEnabled` 初始值改为 `false`；用户主动点击"Remove Background"后触发，不自动执行。

**理由**：抠图是耗时操作（2-5 秒 WASM），默认开启导致用户上传后必须等待，产生"硬控"感。

**实现要点**：
- `useState<boolean>(false)` 替换现有 `useState<boolean>(true)`
- 抠图进行中（`bgProcessing === true`）时，「生成」按钮设为 `disabled` 并文案改为 "Processing photo..."

### D3. Gallery 自动开始

**决策**：`FigurineGenerationGallery` 挂载后通过 `useEffect(() => { startGenerationFlow(); }, [])` 自动触发生成。

**理由**：用户在 Step 1 已完成准备（上传图片、选风格），进入 Step 2 是明确的意图跳转，不需要再次确认。

**实现要点**：
- 移除 Header 区域的 "Initialize Canvas" 按钮（或改为「重新生成」语义，仅在 `ERROR` / `COMPLETE` 状态显示）
- `status === 'IDLE'` 状态下的 placeholder 文案调整（用户不会再停留在 IDLE 状态，但 initialViews 模式保留）
- `initialViews` 不为空时跳过自动触发（从 Vault 进入的情况）

### D4. Step 3 + Step 4 合并

**决策**：删除 `select` 步骤，原 Select 的内容（商品规格选择、价格展示）上移到 `confirm` 步骤，形成"左图右配置"的单页布局。

**理由**：现有 Step 3 转化价值低，用户在这里只是选尺寸，选完立刻进 Step 4。合并后减少一次点击，页面信息更完整。

**实现要点**：
- `Step` 类型变为 `'entry' | 'upload' | 'generate' | 'confirm'`
- Gallery 的 `onComplete` 回调直接跳到 `'confirm'`（原来跳 `'select'`）
- Confirm 页左侧放图片预览，右侧垂直排列：规格选项 → 价格 → 接下来流程 → 加入购物车

### D5. 文案去技术化（包装层）

**决策**：在 Gallery 组件内及 page.tsx 的 step 标题文案中，统一替换技术词汇。

| 原文 | 替换为 |
|------|--------|
| Initialize Canvas | （按钮废弃） |
| Virtualize Model（步骤标题） | Crafting Your Figurine |
| Virtualizing 3D Scene... | Bringing your photo to life... |
| Awaiting Render Command | Ready to craft your figurine |
| Calculating depth maps, extruding... | Capturing every detail of your photo |
| Finalize Tri-View Model | View Results & Order |
| Configure Specs | Choose Your Options |
| Review Assets → Confirm & Order | Review & Order |

**理由**：产品定位是「定制手办工作室」而非 3D 渲染软件，用户关心的是成品体验，不是 pipeline 细节。

### D6. Gallery 底部按钮语义修正

**决策**：
- 左按钮（Cancel & Return / Discard & Retake）：保留，文案可微调
- 右按钮（Finalize Tri-View Model）→ 改为 **"View Results & Order"**，图标改为 `ArrowRight`
- 仅 COMPLETE 状态可点（保持不变）

## Risks / Trade-offs

| 风险 | 应对 |
|------|------|
| 自动触发生成 在极端情况下（网络差）可能导致用户还没看清楚就开始消耗配额 | 新 entry 步骤给用户明确的风格确认节点，进入 generate 是有意识的操作 |
| 合并 Step 3+4 后 confirm 页信息量增加 | 采用左右双栏布局（md 以上），移动端垂直堆叠，保证可读性 |
| 抠图默认关闭 可能让部分之前依赖自动抠图的用户困惑 | 在 Remove Background 开关旁加一行说明文字："Removes photo background for cleaner results" |

## Open Questions

- `entry` 步骤的风格卡片是否要有示例图（生成效果预览）？目前 `styleCategories` 里没有预览图字段，如需要要先扩展数据结构
