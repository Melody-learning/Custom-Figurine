# Design: Style Selection Phase 1

## Background / Context

生成流程当前架构中，`PROMPT_PRIMARY` 硬编码于 `image-to-3d.ts`。前端 `FigurineGenerationGallery` 通过 `startAsyncGeneration()` Server Action 触发 Webhook Worker，Webhook Worker 再调 `generatePrimaryRender()`，整条链路没有任何 prompt 参数传递入口。

用户上传图片后进入 Step 1 预览区，该区域包含：图片预览、BG Removal 对比（条件渲染）、Smart Background Filter Toggle、行动按钮组。风格选取 UI 需嵌入这个已有布局，不破坏现有 BG Removal 交互。

## Goals / Non-Goals

**Goals:**
- 在 Step 1 上传预览区插入风格选取面板，不影响 BG Removal UX
- primaryPrompt 全链路透传（前端选择 → Server Action → Webhook → generatePrimaryRender）
- 写实风格在 Step 3/4 禁止下单
- 代码结构为 Phase 2（Admin 后台配置）预留清晰扩展点

**Non-Goals:**
- DB Schema 变更
- 提示词 Admin 后台 CRUD（Phase 2）
- 后视图/侧视图提示词按风格定制（Phase 2）
- 示意图真实图片（Phase 1 用视觉占位）

## Architecture

### 数据流全览

```
[customize/page.tsx]
  selectedStylePreset: StylePreset | null   ← 新增 state
        │
        │ prop: stylePrompt?
        ▼
[FigurineGenerationGallery.tsx]
  接收 stylePrompt prop
        │
        │ startAsyncGeneration({ ..., promptOverride })
        ▼
[start-generation.ts (Server Action)]
  接收 promptOverride?: string
  将其放入 Webhook Payload
        │
        │ POST /api/webhooks/generate  { ..., promptOverride }
        ▼
[webhooks/generate/route.ts]
  接收 promptOverride
  传给 generatePrimaryRender(base64, modelId, promptOverride)
        │
        ▼
[image-to-3d.ts]
  generatePrimaryRender(..., promptOverride?: string)
  → callImageGenAPI(promptOverride ?? PROMPT_PRIMARY, ...)
```

### 风格常量数据结构

```typescript
// src/lib/constants/style-presets.ts

export interface StylePreset {
  id: string;            // 唯一标识，如 "cartoon-standard"
  name: string;          // 显示名，如 "标准"
  primaryPrompt: string; // 主视图生成提示词
  previewImageUrl?: string; // Phase 2 填充
}

export interface StyleCategory {
  id: string;            // 如 "cartoon"
  name: string;          // 如 "卡通风格"
  isOrderable: boolean;  // false = 写实，Step3/4 禁止下单
  accentColor: string;   // 占位色，如 "#FF6B6B"
  icon: string;          // lucide icon 名，用于占位展示
  presets: StylePreset[];
}

export const STYLE_CATEGORIES: StyleCategory[] = [
  {
    id: "cartoon",
    name: "卡通风格",
    isOrderable: true,
    accentColor: "#FF6B9D",
    icon: "Smile",
    presets: [
      { id: "cartoon-standard", name: "常规", primaryPrompt: "<卡通常规提示词>" },
      { id: "cartoon-chibi", name: "Q版", primaryPrompt: "<Q版提示词>" },
    ]
  },
  {
    id: "low-poly",
    name: "低多边形风格",
    isOrderable: true,
    accentColor: "#5BC0EB",
    icon: "Triangle",
    presets: [
      { id: "lowpoly-standard", name: "常规", primaryPrompt: "TODO: <低多边形常规提示词>" },
      { id: "lowpoly-rough", name: "粗粝", primaryPrompt: "TODO: <低多边形粗粝提示词>" },
    ]
  },
  {
    id: "sculpture",
    name: "雕塑风格",
    isOrderable: true,
    accentColor: "#C4A882",
    icon: "Layers",
    presets: [
      { id: "sculpture-standard", name: "常规", primaryPrompt: "TODO: <雕塑常规提示词>" },
      { id: "sculpture-faceless", name: "无脸化", primaryPrompt: "TODO: <无脸化提示词>" },
    ]
  },
  {
    id: "realistic",
    name: "写实风格",
    isOrderable: false,
    accentColor: "#6B7280",
    icon: "Camera",
    presets: [
      { id: "realistic-standard", name: "常规", primaryPrompt: "<当前 PROMPT_PRIMARY>" },
    ]
  },
]
```

### UI 布局与交互设计

**位置**：Step 1 上传后出现，插入在 BG Filter Toggle 和行动按钮组之间。

**布局模式**：
```
┌─────────────────────────────────────────────┐
│  [图片预览区]                                │
│  [Before/After 对比条（条件渲染）]           │
│  [Smart Background Filter Toggle]            │
│  ─────────────────────────────────────────   │
│  ✨ 选择生成风格                              │
│  ┌─────────┐ ┌─────────┐ ┌──────────┐ ┌──┐  │
│  │ 卡通风格 │ │低多边形  │ │  雕塑风格 │ │写│  │
│  │ (选中态) │ │         │ │          │ │实│  │
│  │ ──────  │ │         │ │          │ │仅│  │
│  │ ● 常规  │ │         │ │          │ │预│  │
│  │ ○ Q版   │ │         │ │          │ │览│  │
│  └─────────┘ └─────────┘ └──────────┘ └──┘  │
│  ─────────────────────────────────────────   │
│  [重新选择]         [✨ 生成 3D 模型 →]       │
└─────────────────────────────────────────────┘
```

**交互规则**：
- 默认选中"卡通风格 → 常规"（第一个大类第一个子类）
- 点击大类卡片：若已选中该大类则切换到第一个子类；若未选中则选中并展开子类
- 大类选中后，内部显示子类 Radio Group（展开式，不是弹窗）
- 写实大类卡片右上角显示 `Preview Only` 徽章（半透明灰色 badge）
- 卡片选中态：`ring-2 ring-brand-primary` + 内部显示子类列表

**下单限制**：
- Step 3 (select)：若 `selectedStylePreset.categoryIsOrderable === false`，"Continue" 按钮变 disabled，下方显示提示语
- Step 4 (confirm)："Add to Cart" 按钮同样 disabled + tooltip"Realistic style is currently not available for order."

### 关键改动点

#### `customize/page.tsx`
- 新增 state: `selectedPreset: StylePreset | null`（默认 `STYLE_CATEGORIES[0].presets[0]`）
- 渲染 `<StyleSelector>` 组件（内联或拆分，优先内联保持文件一致风格）
- `handleGenerate()` 无需改，但去掉省略的 `overrideImageTarget` 参数混用问题
- `FigurineGenerationGallery` 新增 `stylePrompt={selectedPreset?.primaryPrompt}` prop
- Step 3/4 按钮判断 `selectedPreset?.categoryIsOrderable`

#### `FigurineGenerationGallery.tsx`
- Props 新增 `stylePrompt?: string`
- `startAsyncGeneration()` 调用时新增 `promptOverride: stylePrompt`

#### `start-generation.ts`
- `StartGenerationPayload` 新增 `promptOverride?: string`
- Webhook body 新增 `promptOverride`

#### `webhooks/generate/route.ts`
- 解构接收 `promptOverride`
- 传给 `generatePrimaryRender(primaryInputBase64, modelId, promptOverride)`

#### `image-to-3d.ts`
- `generatePrimaryRender(base64, modelId, promptOverride?: string)`
- `callImageGenAPI(promptOverride ?? PROMPT_PRIMARY, ...)`

## Decisions

| 决策 | 选择 | 理由 |
|------|------|------|
| 风格存储位置 | 前端常量文件（TypeScript） | Phase 1 无需 DB，Phase 2 改为 API 读取时只改数据来源（数据结构保持兼容） |
| 风格选择时机 | Step 1 上传预览同屏 | 用户明确意图后再点生成，避免生成后无法改风格的沮丧感 |
| 默认选中 | 卡通风格→常规 | 卡通是产品主推风格，已有高质量提示词 |
| 写实限购实现 | `isOrderable` 字段驱动，Step 3/4 按钮 disabled | 数据驱动，Phase 2 Admin 配置时只需数据库写该字段，UI 不改 |
| StyleSelector 抽不抽组件 | Phase 1 内联 customize/page.tsx | 该页面已 869 行，如逻辑清晰可在同 PR 拆出 `StyleSelector.tsx` |

## Risks / Trade-offs

- **Prompt 明文传输**：promptOverride 经前端 prop → Server Action → Webhook，整条链路都是明文。Phase 1 可接受（Phase 2 由 DB 服务端查询替代）。
- **没有持久化 styleId**：生成结果不记录使用了哪个风格，Vault 里无法展示。Phase 2 解决。
- **BG Removal 状态机复杂**：StyleSelector 插入位置需保证不打断抠图进程，交互上应独立于抠图状态（任何时候都可以切换风格选择）。
