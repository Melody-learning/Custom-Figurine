# Spec: Generation Metadata Tracking

覆盖范围：GeneratedAsset 记录每次生成的模型和风格元数据。

## ADDED Requirements

### Requirement: Schema 增加模型追踪字段
GeneratedAsset 分别记录 primary 和 secondary 生成任务使用的模型。

#### Scenario: 新增字段为可选字段
- **WHEN** 执行 `prisma db push`
- **THEN** `GeneratedAsset` 表新增 `primaryModelId`、`secondaryModelId`、`styleCategorySlug`、`stylePresetSlug` 四个可选字段
- **AND** 已有记录不受影响（字段默认为 null）

#### Scenario: 新记录写入完整元数据
- **WHEN** 一次新生成完成
- **THEN** `primaryModelId` 记录 Task 1 使用的模型 ID
- **AND** `secondaryModelId` 记录 Task 2/3/4 使用的模型 ID
- **AND** `styleCategorySlug` 记录用户选择的风格大类 slug（如 "cartoon"）
- **AND** `stylePresetSlug` 记录用户选择的风格子类 slug（如 "cartoon-chibi"）

### Requirement: 旧 modelId 字段向后兼容
原有 `modelId` 字段保留但标记为 deprecated。

#### Scenario: 旧数据回退展示
- **WHEN** Admin 展示的 `GeneratedAsset` 记录没有 `primaryModelId`（旧数据）
- **THEN** 展示时 fallback 到 `modelId` 字段

### Requirement: Admin Generations 页面展示元数据
Admin 后台 Generations 列表展示模型和风格信息。

#### Scenario: 表格列展示
- **WHEN** 查看 Admin Generations 列表
- **THEN** 可见 "Model" 列显示 `primaryModelId`（fallback `modelId`）
- **AND** 如果 `primaryModelId !== secondaryModelId`，额外标注差异
- **AND** 可见 "Style" 列显示 `styleCategorySlug / stylePresetSlug`

#### Scenario: 展开详情行
- **WHEN** 展开某条生成记录
- **THEN** 每张图片（Primary / Back / Side / Showcase）下方标注使用的模型 ID
