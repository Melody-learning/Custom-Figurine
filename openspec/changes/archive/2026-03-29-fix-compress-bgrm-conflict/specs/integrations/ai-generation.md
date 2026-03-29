## MODIFIED Requirements

### Requirement: 客户端预处理管线

当 `NEXT_PUBLIC_ENABLE_BG_REMOVAL=true` 时，系统 SHALL 对用户上传的图片执行以下预处理管线：

1. **尺寸压缩**：长边缩放至 ≤1024px（bounding box），保持宽高比
2. **条件化格式输出**：
   - 抠图功能开启时：SHALL 以 PNG 格式输出（保留透明通道，不填充背景色）
   - 抠图功能关闭时：SHALL 以 JPEG 格式输出（填充白色背景，质量 0.8）
3. **透明度检测**：压缩后 SHALL 检测图片是否已具备透明背景
   - 若检出透明背景，SHALL 跳过抠图步骤并直接使用该图
4. **抠图执行**：对非透明图片调用 `@imgly/background-removal` 进行背景移除
5. **存储降级**：抠图完成后，最终写入 Zustand state 前 SHALL 将透明 PNG 转为 JPEG（填白底，质量 0.8），确保 localStorage 不溢出

当 `NEXT_PUBLIC_ENABLE_BG_REMOVAL` 未设置或为 `false` 时，系统 SHALL 维持原有行为：直接以 JPEG 格式（白底，质量 0.8）输出压缩结果。

#### Scenario: 抠图开启 + 普通照片上传
- **WHEN** 用户在抠图功能开启时上传一张不含透明通道的 JPEG/PNG 照片
- **THEN** 系统以 PNG 格式压缩图片（不填白底），将 PNG 传给抠图模型，抠图完成后将结果转为 JPEG（白底）存入 state

#### Scenario: 抠图开启 + 已有透明背景的 PNG
- **WHEN** 用户在抠图功能开启时上传一张已有透明背景的 PNG 图片
- **THEN** 系统检测到透明背景后跳过抠图步骤，以 PNG 格式压缩后直接转为 JPEG（白底）存入 state

#### Scenario: 抠图关闭
- **WHEN** 用户在抠图功能关闭时上传任意格式图片
- **THEN** 系统以 JPEG 格式（白底，质量 0.8）压缩至 ≤1024px 后直接存入 state（行为与变更前完全一致）

#### Scenario: 抠图失败的 Graceful Fallback
- **WHEN** 抠图模型执行失败
- **THEN** 系统回退到 PNG 压缩结果，转为 JPEG（白底）存入 state，不阻塞用户流程
