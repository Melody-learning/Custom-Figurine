# Spec: Style Model Override

覆盖范围：风格子类绑定模型时，对生成流程中模型选择逻辑的影响。

## ADDED Requirements

### Requirement: 风格模型仅覆盖主视图生成
当 StylePreset 绑定了 aiModelId 时，仅 Task 1 (primary render) 使用该模型。

#### Scenario: 风格子类绑定了特定模型
- **WHEN** 用户选择了一个 `aiModelId` 非 null 的 StylePreset
- **THEN** Task 1 (primary render) 使用 `StylePreset.aiModelId` 指定的模型
- **AND** Task 2/3/4 (back / side / showcase) 仍使用全局默认模型

#### Scenario: 风格子类未绑定模型
- **WHEN** 用户选择了一个 `aiModelId` 为 null 的 StylePreset
- **THEN** 全部 4 个 Task 均使用全局默认模型

### Requirement: 前端正确传递风格模型 ID
前端需要从 StylePreset 数据中提取 aiModelId 并传递到 Server Action。

#### Scenario: StylePreset 类型声明包含 aiModelId
- **WHEN** API `/api/style-presets` 返回的 preset 包含 `aiModelId` 字段
- **THEN** 前端 `StylePreset` 接口声明中存在 `aiModelId?: string | null`
- **AND** `FigurineGenerationGallery` 接收 `styleModelId` prop

#### Scenario: 模型 ID 传递贯穿整个链路
- **WHEN** `FigurineGenerationGallery` 接收到 `styleModelId`
- **THEN** `startAsyncGeneration` payload 中包含分离的 `primaryModelId` 和 `secondaryModelId`
- **AND** Webhook payload 中包含 `primaryModelId` 和 `secondaryModelId`
