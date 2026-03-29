## MODIFIED Requirements

### Requirement: 客户端预处理管线

当 `NEXT_PUBLIC_ENABLE_BG_REMOVAL=true` 时，系统 SHALL 在上传步骤中显示一个 "Smart Background Filter" / "智能背景过滤" Toggle 开关，默认开启。

- Toggle 开启时：上传完成后 SHALL 自动执行抠图（即原有抠图行为）
- Toggle 关闭时：上传完成后 SHALL 跳过抠图，直接显示压缩后的预览图
- 当 `NEXT_PUBLIC_ENABLE_BG_REMOVAL` 未设置或为 `false` 时：SHALL 隐藏 Toggle，不显示抠图相关 UI

预处理管线的其他行为（尺寸压缩、条件化格式输出、透明度检测、存储降级）不变。

#### Scenario: 环境变量开启 + Toggle 开启（默认行为）
- **WHEN** `NEXT_PUBLIC_ENABLE_BG_REMOVAL=true` 且用户未关闭 Toggle
- **THEN** 用户上传图片后系统自动执行抠图，显示 Before/After 对比

#### Scenario: 环境变量开启 + Toggle 关闭
- **WHEN** `NEXT_PUBLIC_ENABLE_BG_REMOVAL=true` 且用户手动关闭了 Toggle
- **THEN** 用户上传图片后系统跳过抠图，直接显示压缩后的预览图，不显示 Before/After 对比

#### Scenario: 环境变量关闭
- **WHEN** `NEXT_PUBLIC_ENABLE_BG_REMOVAL` 未设置或为 `false`
- **THEN** 系统不显示 Toggle 开关，上传后直接显示 JPEG 压缩结果

#### Scenario: 上传后切换 Toggle
- **WHEN** 用户已上传图片且抠图已完成，之后关闭 Toggle
- **THEN** 不回滚已完成的抠图结果（Toggle 仅影响下次上传）
