## Context

当前生图流程（`image-to-3d.ts`）：

```
原图 (base64) ─── generatePrimaryRender() ──→ 正面手办图 (提示词1-旧)
                                                    │
                                              generateSecondaryViews()
                                              ├── 后视图 (backPrompt)
                                              └── 侧视图 (leftPrompt)
```

**问题**：
1. 提示词1-旧混合了"手办生成"和"餐桌场景"，导致 AI 模型负担重、效果不稳定
2. 抠图结果未被利用：即使用户开了抠图，传给 Gemini 的仍是压缩后的原图
3. 缺少独立的效果展示图，用户无法看到手办"放在桌上"的实际效果

## Goals / Non-Goals

**Goals:**
- 将提示词1替换为纯手办产品照提示词（英文），专注手办品质
- 新增效果展示图（提示词2，中文），展示餐桌摆拍场景
- 抠图后的图传给提示词1，原图传给提示词2
- DB 新增 `showcaseImage` 字段存储效果展示图
- 前端展厅新增第 4 个 tab 展示效果图

**Non-Goals:**
- 不修改后视图/侧视图的提示词（维持现有）
- 不修改前端上传/压缩/抠图逻辑（上一个变更已完善）
- 不修改 Gemini API 调用方式（`callNativeGoogleImageAPI` 不变）
- 不引入新的 AI 模型或 API

## Decisions

### 决策 1：提示词管理

将所有提示词集中到 `image-to-3d.ts` 中作为模块级常量，便于后续维护：

```typescript
const PROMPT_PRIMARY = "A professional studio product shot of a 1/7 scale premium ACG figurine...";
const PROMPT_SHOWCASE = "将手办图中的手办模型放置在一张家用餐桌上...";
const PROMPT_BACK = "...后视图...";
const PROMPT_LEFT = "...左侧视图...";
```

### 决策 2：效果展示图的生成时机

**方案 A（选择）**：与后视图/侧视图并行生成（第二阶段 3 路并行）

优点：总耗时不增加（Gemini 并行调用），效果展示图在同一批次完成
缺点：第二阶段 API 调用从 2 个增加到 3 个（但无串行等待）

```
阶段一: 原图(抠图后) → 提示词1 → 正面手办图
阶段二 (并行):
  ├── 正面手办图 + backPrompt → 后视图
  ├── 正面手办图 + leftPrompt → 侧视图
  └── 原图(未抠图) + 提示词2 → 效果展示图
```

**方案 B（否决）**：效果展示图作为独立阶段三 → 增加总耗时，用户体验差

### 决策 3：数据流中区分"抠图后图"和"原图"

当前 `startAsyncGeneration` 向 webhook 传递 `originalImageUrl`（来自用户上传的 base64 → Blob URL）。

新增 `processedImageUrl`（抠图后的图片 URL，可选）：
- 如果用户开启了抠图且抠图成功：`processedImageUrl` = 抠图后的图（上传至 Blob）
- 否则：`processedImageUrl` = `null`，手办生图也用 `originalImageUrl`

Webhook 收到后：
- 提示词1 使用 `processedImageUrl || originalImageUrl`
- 提示词2 始终使用 `originalImageUrl`

### 决策 4：前端 Gallery 展示第 4 张图

在 `FigurineGenerationGallery` 的 Views 面板中新增 "Showcase" tab：
- 缩略图和主视觉等同处理
- 点击 "Finalize" 时将 4 张图一起传回

### 决策 5：抠图后图片上传至 Blob

抠图完成后，抠图结果（PNG）需要上传到 Vercel Blob 获取 URL，以便传递给 webhook。注意：
- 抠图结果目前只存在于前端 state（base64 data URL）
- 需要在 `handleGenerate` 时将抠图后的图片（如果有）通过 `/api/upload-token` + client put 上传至 Blob
- 上传后得到 `processedImageUrl`，传给 `startAsyncGeneration`

## Risks / Trade-offs

| 风险 | 缓解措施 |
|------|---------|
| 3 路并行 Gemini 调用可能触发 rate limiting | 观察生产环境日志，必要时添加 retry |
| 效果展示图的"手办旁放着原图"可能被 AI 误解 | 提示词写死为中文，Gemini 对中文场景描述有良好理解 |
| DB 新增字段需要迁移 | `showcaseImage` 是可空字段，`prisma db push` 不影响现有数据 |
| 抠图后 PNG 上传到 Blob 增加一次网络请求 | 可在 `handleGenerate` 中并行执行，不阻塞 UI |
