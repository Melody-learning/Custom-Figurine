## MODIFIED Requirements

### Requirement: 生图提示词与流程

系统的生图流程 SHALL 使用以下提示词体系：

**提示词1（手办产品照 — `generatePrimaryRender`）**：
- 英文提示词，专注于纯手办产品照（Professional Studio Product Shot）
- 输入图 SHALL 使用**抠图后的图片**（如果用户启用了抠图），以提供更干净的人物轮廓
- 如果未执行抠图，SHALL 使用用户上传的原始图片

**提示词2（效果展示图 — `generateShowcaseImage`，新增）**：
- 中文提示词，展示手办放置在餐桌上的场景效果
- 输入图 SHALL 始终使用**用户的原始上传图片**（不经过抠图），无论是否启用了抠图

### Requirement: 效果展示图生成（新增）

系统 SHALL 在生成后视图/侧视图的同一阶段，并行生成效果展示图（Showcase Image）：

```
阶段一: 输入图(抠图后/原图) → 提示词1 → 正面手办图
阶段二 (3 路并行):
  ├── 正面手办图 + backPrompt → 后视图
  ├── 正面手办图 + leftPrompt → 侧视图
  └── 原图(原始) + 提示词2 → 效果展示图
```

- `generateSecondaryViews` SHALL 接受额外参数 `originalImageB64` 和 `modelId`
- 效果展示图的结果 SHALL 存储到 `GeneratedAsset.showcaseImage` 字段
- 生成失败时 SHALL Graceful Fallback（不阻塞其他视图的成功完成）

### Requirement: 数据流传递抠图后图片

- `startAsyncGeneration` SHALL 接受可选的 `processedImageB64` 参数（抠图后的图片 base64）
- 如果提供了 `processedImageB64`，SHALL 上传至 Vercel Blob 并将 URL 作为 `processedImageUrl` 传给 webhook
- Webhook 收到 `processedImageUrl` 后，SHALL 用于提示词1 的输入；提示词2 始终使用 `originalImageUrl`

#### Scenario: 抠图开启、生成完成
- **WHEN** 用户开启抠图上传图片并触发生图
- **THEN** 提示词1 使用抠图后的图片；提示词2 使用原始上传图片；生成 4 张图（正面、后面、侧面、效果展示）

#### Scenario: 抠图关闭、生成完成
- **WHEN** 用户关闭抠图直接上传并触发生图
- **THEN** 提示词1 和提示词2 均使用原始上传图片；生成 4 张图
