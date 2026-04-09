# Style Model Override & Generation Tracking

## Why

当前生成流程存在两个缺陷：
1. **风格模型覆盖未生效**：`StylePreset.aiModelId` 字段已在 DB Schema 和 Admin 后台配置好，但生成链路中完全没有使用——所有 4 个生成任务始终使用全局默认模型。
2. **生成记录缺少关键元数据**：`GeneratedAsset` 不记录使用了哪个风格、也没有区分 4 个生成节点各自使用的模型，Admin 后台无法追溯生成质量。

## What Changes

### 风格模型覆盖（核心功能修复）
- 当 `StylePreset` 绑定了特定 AI 模型（`aiModelId` 非 null）时，**仅影响 Task 1（primary render，照片→手办）**
- Task 2/3/4（back / side / showcase）仍然使用全局默认模型
- 前端 → Server Action → Webhook 完整链路传递双模型 ID

### 生成元数据追踪
- `GeneratedAsset` 新增字段：`primaryModelId`、`secondaryModelId`、`styleCategorySlug`、`stylePresetSlug`
- 原有 `modelId` 保留向后兼容（但新记录不再写入）
- Admin Generations 页面展示完整的模型和风格信息

## Affected Specs

- `integrations/ai-generation.md`: 生成流程的模型选择逻辑变更
- `backend/database.md`: GeneratedAsset Schema 增加字段

## Impact

- **Schema 变更**：`GeneratedAsset` 表增加 4 个可选字段（无迁移风险，均为可选）
- **API 变更**：`start-generation` Server Action 接收新参数；`webhooks/generate` 接收双模型 ID
- **前端变更**：`FigurineGenerationGallery` 接收并传递风格模型 ID；`customize/page.tsx` 传递风格元数据
- **Admin UI**：Generations 页面展示模型和风格列
