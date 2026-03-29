## MODIFIED Requirements

### Requirement: GeneratedAsset 模型

`GeneratedAsset` 模型 SHALL 新增以下字段：

```prisma
showcaseImage  String?  @db.Text  // 效果展示图 URL（提示词2 生成）
```

该字段为可空字段，新增不影响现有数据。现有记录的 `showcaseImage` 为 `null`。

#### Scenario: 新生成的 Asset 包含效果展示图
- **WHEN** 生图流程成功完成
- **THEN** `GeneratedAsset` 记录的 `showcaseImage` 字段存储效果展示图的 CDN URL

#### Scenario: 效果展示图生成失败
- **WHEN** 效果展示图生成失败但其他视图成功
- **THEN** `GeneratedAsset` 记录的 `showcaseImage` 字段为 `null`，其他字段正常填充
