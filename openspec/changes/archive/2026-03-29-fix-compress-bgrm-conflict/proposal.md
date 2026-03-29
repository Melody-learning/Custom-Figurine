## Why

定制流程的图片上传环节存在处理逻辑矛盾：`compressImage` 函数会将所有图片（包括透明 PNG）强制填充白色背景并转为 JPEG，但紧随其后的 `removeImageBackground` 又会尝试移除背景。这导致：

1. **已有透明背景的 PNG 被无谓地填白再抠除** —— 浪费客户端算力，抠图精度下降
2. **JPEG 压缩伪影污染抠图输入** —— 有损压缩在边缘产生的锯齿/色块会干扰 WASM 抠图模型的边缘检测，导致抠图质量比使用原始 PNG 输入时更差

## What Changes

- **条件化压缩策略**：根据是否启用了 `BG_REMOVAL` feature flag，选择不同的压缩输出格式
  - 抠图开启时：保留 PNG 格式（不填白底），让抠图模型拿到干净输入
  - 抠图关闭时：维持当前 JPEG + 白底方案（节省 localStorage 空间）
- **透明度检测与抠图跳过**：当上传图片本身已具备透明背景时，跳过抠图步骤，避免二次处理
- **抠图后二次压缩**：抠图完成后将透明 PNG 转为 JPEG（填白底）再存入 state，确保 localStorage 不溢出

## Capabilities

### New Capabilities

_(无新增 capability)_

### Modified Capabilities

- `integrations/ai-generation`: 图片预处理管线的行为需求变更 —— 压缩策略从固定 JPEG 改为条件化输出，需更新预处理流程规范

## Impact

- **代码影响**：`src/app/customize/page.tsx` 中的 `compressImage` 函数和 `handleFileUpload` 流程
- **依赖**：`src/lib/remove-background.ts`（消费方，无需修改）
- **风险**：PNG base64 体积远大于 JPEG，中间态（抠图完成前）可能短暂增加内存占用，但最终存入 state 前会压回 JPEG，不影响 localStorage 配额
