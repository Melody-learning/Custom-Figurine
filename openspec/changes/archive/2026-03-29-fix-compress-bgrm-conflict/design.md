## Context

当前定制流程的图片上传处理链路为：

```
用户选择文件 → compressImage(file, 1024)
    ├── 读取文件为 Image
    ├── 缩放至 ≤1024px bounding box
    ├── Canvas 填白 → drawImage → toDataURL('image/jpeg', 0.8)
    └── 输出 JPEG base64 data URL
         ↓
    isBgRemovalEnabled() ?
    ├── YES → removeImageBackground(jpegBase64)
    │         → @imgly WASM 抠图 → 输出 PNG base64 (透明)
    │         → setUploadedImage(PNG)
    └── NO  → setUploadedImage(JPEG)
```

**矛盾**：当抠图开启时，compressImage 产出的 JPEG 白底会：
1. 污染抠图输入（JPEG 伪影干扰边缘检测）
2. 添加无意义的白色背景（抠图会再去移除）

compressImage 的原始需求是解决 `QuotaExceededError`（Zustand localStorage 持久化存储限制约 5MB），这个约束仍然有效。

## Goals / Non-Goals

**Goals:**
- 在抠图开启时，为抠图模型提供更高质量的输入（保留 PNG、不填白底）
- 保持 localStorage 安全（最终存入 state 的 data URL 体积不超标）
- 检测已有透明背景的图片，跳过无意义的抠图操作
- 代码变动最小化，仅修改 `customize/page.tsx` 的 `compressImage` 和 `handleFileUpload`

**Non-Goals:**
- 不改变 `remove-background.ts` 的接口或实现
- 不改变 1024px 的最大尺寸限制
- 不改变抠图关闭时的现有行为（JPEG + 白底方案照旧）
- 不引入新的 npm 依赖

## Decisions

### 决策 1：双模式压缩策略

将 `compressImage` 重构为两种输出模式：

| 模式 | 触发条件 | 输出格式 | 背景处理 | 用途 |
|------|---------|---------|---------|------|
| **JPEG 模式** | 抠图关闭 / 抠图后的降级存储 | `image/jpeg` 0.8 | 填白底 | 最终存入 state |
| **PNG 模式** | 抠图开启、作为抠图输入 | `image/png` | 保留原始透明通道 | 临时中间态 |

**备选方案**：始终用 PNG → 抠图后再转 JPEG。被否决，因为当抠图关闭时 PNG base64 可能 5-10 倍于 JPEG，直接溢出 localStorage。

### 决策 2：透明度检测用简单 Canvas 采样

通过在 Canvas 中采样像素的 alpha 通道来检测图片是否已有透明区域：
- 扫描图片边缘像素（四边各取一行/列），检查是否存在 alpha < 250 的像素
- 检出率不需要 100%，只需要粗筛已抠图的 PNG（边缘透明是最显著特征）
- 开销可忽略（在已经加载到 Canvas 之后直接读取 `getImageData`）

**备选方案**：检查文件 MIME 是否为 PNG → 被否决，因为 PNG 不一定有透明区域，而 WebP 也可能有。

### 决策 3：抠图后降级存储

抠图完成后，最终写入 state 前进行一次 JPEG 降级：
```
PNG(抠图结果,透明) → Canvas(填白底) → JPEG(0.8) → setUploadedImage()
```
确保 localStorage 体积与当前行为一致。但先保存透明 PNG 结果到 `bgOriginal` state，用于 Before/After 对比 UI。

**风险**：如果用户需要透明背景图传给 AI 生图，降级为 JPEG 白底可能丢失抠图价值。但当前 Gemini 的 prompt 描述了"放置在餐桌上"的实体场景，白色底图反而更接近 prompt 预设，因此可接受。

## Risks / Trade-offs

| 风险 | 缓解措施 |
|------|---------|
| PNG 中间态增大内存占用（浏览器端） | 仅在抠图路径中短暂持有 PNG data URL，抠图完成后立即转 JPEG 释放 |
| 透明度检测误判（假阴性：有透明但没检出） | 可接受，最差情况只是多跑一次抠图，与当前行为一致 |
| 透明度检测误判（假阳性：没透明但跳过抠图） | 采用保守阈值（需检测到 >5% 的边缘像素透明才判定），误判率极低 |
| 后续 AI 模型需要透明背景输入 | 预留参数接口，未来可配置是否跳过 JPEG 降级 |
