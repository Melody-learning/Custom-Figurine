# Design: Style Model Override & Generation Tracking

## Context

当前 4 个生成任务（primary / back / side / showcase）全部使用同一个 `modelId`（来自全局默认 AI Model）。`StylePreset.aiModelId` 已在 DB 和 Admin 中可配置，但生成链路完全忽略了它。

数据流现状：
```
customize/page.tsx
  └→ FigurineGenerationGallery (只取全局默认模型)
       └→ startAsyncGeneration({ modelId: 全局默认 })
            └→ webhooks/generate (4 个任务都用同一个 modelId)
                 └→ GeneratedAsset.modelId = 那一个模型
```

## Goals / Non-Goals

**Goals:**
- 风格子类绑定的 `aiModelId` 仅覆盖 Task 1 (primary render)
- Task 2/3/4 始终使用全局默认模型
- `GeneratedAsset` 分别记录 primary 和 secondary 使用的模型
- `GeneratedAsset` 记录用户选择的风格大类和子类 slug
- Admin Generations 页面展示上述元数据

**Non-Goals:**
- 不支持 4 个任务各自使用不同模型（Task 2/3/4 共享一个即可）
- 不改变提示词逻辑（`promptOverride` 已经 work，不动）
- 不改变 Admin AI Models 或 Styles 模块本身

## Design

### 1. Schema 变更 — `GeneratedAsset`

```diff
 model GeneratedAsset {
   ...
-  modelId            String?            // 实际使用的 AI 模型 ID
+  modelId            String?            // [Deprecated] 保留向后兼容
+  primaryModelId     String?            // Task 1 (primary render) 使用的模型
+  secondaryModelId   String?            // Task 2/3/4 (back/side/showcase) 使用的模型
+  styleCategorySlug  String?            // 用户选择的风格大类 slug
+  stylePresetSlug    String?            // 用户选择的风格子类 slug
   ...
 }
```

### 2. 前端数据流改造

```
customize/page.tsx
  │  selectedPreset.aiModelId → 传给 Gallery
  │  selectedCategory.id (slug) → 传给 Gallery
  │  selectedPreset.id (slug) → 传给 Gallery
  ▼
FigurineGenerationGallery
  │  新增 props: styleModelId?, styleCategorySlug?, stylePresetSlug?
  │  
  │  primaryModelId = styleModelId || selectedModel (全局默认)
  │  secondaryModelId = selectedModel (全局默认，始终不受风格覆盖)
  │  
  │  startAsyncGeneration({
  │    primaryModelId,
  │    secondaryModelId,
  │    styleCategorySlug,
  │    stylePresetSlug,
  │    promptOverride,
  │    ...
  │  })
  ▼
start-generation.ts (Server Action)
  │  接收并存入 DB:
  │    asset.primaryModelId = payload.primaryModelId
  │    asset.secondaryModelId = payload.secondaryModelId
  │    asset.styleCategorySlug = payload.styleCategorySlug
  │    asset.stylePresetSlug = payload.stylePresetSlug
  │  
  │  Webhook payload 也传递双模型:
  │    { primaryModelId, secondaryModelId, ... }
  ▼
webhooks/generate/route.ts
  │  Task 1: generatePrimaryRender(img, primaryModelId)
  │  Task 2: callImageGenAPI(PROMPT_BACK, secondaryModelId, ...)
  │  Task 3: callImageGenAPI(PROMPT_LEFT, secondaryModelId, ...)
  │  Task 4: generateShowcaseImage(..., secondaryModelId)
  │  
  │  更新 DB:
  │    asset.primaryModelId = primaryModelId
  │    asset.secondaryModelId = secondaryModelId
```

### 3. Admin Generations 页面

表格行增加列：
- **Model** → 显示 `primaryModelId`，如果 `primaryModelId !== secondaryModelId` 则额外标注
- **Style** → `styleCategorySlug / stylePresetSlug`（如 `cartoon / chibi`）

展开详情行中每张图下方标注使用的模型 ID。

### 4. StylePreset 前端类型扩展

`StylePreset` 接口增加可选 `aiModelId` 字段（API 已经返回，前端类型未声明）：

```typescript
export interface StylePreset {
  id: string;
  categoryId: string;
  name: string;
  primaryPrompt: string;
  previewImageUrl?: string;
  aiModelId?: string | null;  // 新增
}
```

## Decisions

| 决策 | 选择 | 理由 |
|------|------|------|
| 模型字段拆分方案 | `primaryModelId` + `secondaryModelId` | Task 2/3/4 共享同一模型，无需 4 个字段 |
| 旧 `modelId` 字段 | 保留但 deprecated | 避免迁移风险，旧数据仍可读 |
| `modelId` 写入时机 | start-generation 创建时写入 + webhook 完成时确认 | 双保险，确保即使 webhook 失败也有记录 |
| 风格信息存储 | 存 slug 而非 DB ID | slug 可读性强，Admin 页面直接显示无需 join |

## Risks / Trade-offs

- **旧数据兼容**：已有的 `GeneratedAsset` 记录只有 `modelId`，没有 `primaryModelId` 等新字段。Admin 展示时需要 fallback 到 `modelId`
- **前端类型不一致风险**：静态 `STYLE_CATEGORIES` 中 `StylePreset` 无 `aiModelId`，API 返回有。需统一类型定义
- **模型删除后的孤儿引用**：`primaryModelId` 存的是字符串而非 FK，如果 AiModel 被删除，历史记录的 modelId 不会被级联清理（但这是期望行为——历史记录应保留当时使用的模型 ID）
