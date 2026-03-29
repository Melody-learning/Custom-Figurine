## ADDED Requirements

### Requirement: 定制流程图片接入 Lightbox

定制流程中的以下图片 SHALL 使用 `ClickableImage` 组件替换原 `<img>` 标签，支持点击查看大图：

1. **上传步骤**：上传后的预览图、抠图 Before/After 对比图
2. **生图展厅**（FigurineGenerationGallery）：主视觉大图、三视图缩略图
3. **确认步骤**：生成结果图、原图缩略图

#### Scenario: 上传预览图可点击
- **WHEN** 用户上传图片后看到预览图
- **THEN** 预览图显示 cursor-pointer 样式，点击后打开 Lightbox 查看原图

#### Scenario: 抠图对比图可点击
- **WHEN** 抠图完成后显示 Before/After 对比
- **THEN** Before 和 After 两张图均可独立点击打开 Lightbox

#### Scenario: 生图展厅图片可点击
- **WHEN** AI 生图完成后展示三视图
- **THEN** 主视觉和各角度缩略图均可点击打开 Lightbox 查看大图

#### Scenario: 确认页图片可点击
- **WHEN** 用户进入确认步骤查看生成结果和原图
- **THEN** 两张图均可点击打开 Lightbox 查看大图
