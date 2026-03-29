## Context

当前抠图功能由 `NEXT_PUBLIC_ENABLE_BG_REMOVAL` 环境变量全局控制。当设为 `true` 时，所有用户上传图片后会自动执行 WASM 抠图。用户没有选择权。

定制流程中所有图片（上传预览、抠图结果、AI 生图三视图、确认页图片）均为静态 `<img>` 标签，不可点击放大。用户无法确认抠图边缘质量或生成细节。

## Goals / Non-Goals

**Goals:**
- 让用户在 UI 层面控制是否执行抠图（Toggle 开关），不需要改环境变量
- 提供统一的 Lightbox 组件，可在定制流程任意图片上使用
- Lightbox 风格适配主题系统
- 零新依赖（纯 React + CSS 实现）

**Non-Goals:**
- 不做图片编辑（裁剪、旋转等）
- 不做多图画廊滑动（单图查看即可）
- 不修改抠图算法本身（`remove-background.ts` 不变）
- 不持久化用户的 Toggle 偏好（刷新重置为默认开启）

## Decisions

### 决策 1：抠图开关的控制层级

采用**两级控制**：

```
环境变量 NEXT_PUBLIC_ENABLE_BG_REMOVAL (总开关)
   └── UI Toggle "Smart Background Filter" (用户子开关)
```

- 环境变量 = `false` → 完全隐藏 Toggle，不执行抠图
- 环境变量 = `true` + Toggle ON → 执行抠图（当前默认行为）
- 环境变量 = `true` + Toggle OFF → 跳过抠图

**备选方案**：移除环境变量，完全由 UI Toggle 控制 → 被否决，环境变量仍有价值（灰度发布、开发调试、整体关闭）。

### 决策 2：Toggle 的命名与位置

- 英文名：**"Smart Background Filter"**（暗示智能处理，避免"抠图"这种技术术语）
- 中文名：**"智能背景过滤"**
- 位置：上传步骤中，在文件上传区域下方、操作按钮上方
- 视觉：小型 Toggle Switch + 简短说明文字
- 默认状态：**开启**

### 决策 3：ImageLightbox 组件设计

**架构**：独立的 `ImageLightbox` 组件，通过 React Portal 挂载到 `document.body`。

**Props 接口**：
```typescript
interface ImageLightboxProps {
  src: string;          // 图片 URL 或 data URL
  alt?: string;         // 可选描述文字
  isOpen: boolean;      // 控制显示
  onClose: () => void;  // 关闭回调
}
```

**交互**：
- 点击遮罩层关闭
- ESC 键关闭
- 图片自适应视口（`max-width: 90vw; max-height: 85vh`）
- 进入/退出动画（fade + scale）

**主题适配**：使用 `useThemeConfig()` 读取当前主题色，遮罩层颜色、关闭按钮颜色适配主题。

**使用方式**：在需要可点击查看的 `<img>` 外包裹点击事件 + 状态管理。提供 `ClickableImage` 包装组件简化使用。

### 决策 4：Lightbox 接入范围

| 位置 | 文件 | 图片 |
|------|------|------|
| 上传步骤 | `customize/page.tsx` | 预览图、Before/After 对比 |
| 生图展厅 | `FigurineGenerationGallery.tsx` | 主视觉大图、三视图缩略图 |
| 确认步骤 | `customize/page.tsx` | 生成结果图、原图 |

## Risks / Trade-offs

| 风险 | 缓解措施 |
|------|---------|
| Toggle 状态不持久化，刷新后重置 | V1 可接受：抠图是上传时一次性操作，不需要记忆。后续如有需求可存入 Zustand |
| Lightbox 在移动端手势支持有限 | V1 只实现点击打开/关闭，不做双指缩放。CSS `object-fit: contain` 已保证移动端可视性 |
| data URL 图片在 Lightbox 中加载可能闪烁 | data URL 已在内存中，实际不会有网络延迟 |
