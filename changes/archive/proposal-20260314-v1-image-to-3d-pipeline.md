---
title: V1 Image-to-3D Render Pipeline
status: IMPLEMENTED & ARCHIVED
date: 2026-03-14
---

# V1 图像到 3D 渲染多视角生成流水线 (V1 Image-to-3D Render Pipeline)

## 1. 业务流程总览 (Workflow Overview)

根据您的指示，V1 版本的核心路径将暂时绕过复杂的“多主体精确掩码分离”，而是采用**“单主体裁剪原图输入 -> 大模型参考生图”**的直接生图路线。这是一个典型的 `Image-to-Image (I2I)` 工作流。

整个推演链路包含两个核心阶段（三个 API 调用串联）：

### 阶段一：生成正面基准渲染图 (Primary Render Generation)
- **输入**: 用户上传并最终确认裁切后的原始图像 (Cropped Subject Image)。
- **引擎**: Gemini 生图大模型 (支持在界面动态切换 `gemini-3.1-flash-image-preview`, `gemini-3-pro-image-preview`, `gemini-2.5-flash-image` 等)。
- **Prompt**: 
  > 以图中人物为原型，在真实环境中，以写实风格创作一个1/7比例的商业手办模型。手办模型放置在一张家用餐桌上，手办底座为透明亚克力，无任何文字。手办旁边放着原图和一支铅笔（表示刚刚有人在这里作画，现在已经离开了）确保所有元素与参考图保持严格一致。
- **输出**: 正面主视觉手办渲染图 (`render_front.png`)。

### 阶段二：生成侧/后方多视角一致性图像 (Multi-View Consistency Generation)
- **输入**: 阶段一生成的**正面主视觉手办渲染图**（将其作为基础控制图，而不再使用用户原图）。
- **引擎**: 相同的 Gemini 生图大模型。
- **并行任务 A (生成后视图)**:
  - **Prompt**: 
    > 以上图为基准图（正面视图），生成该手办图的后视图。重要提示：保证人物100%的一致性，就像真实世界里存在这个手办，你只是拍摄他的多视角照片。
  - **输出**: 后视图 (`render_back.png`)。
- **并行任务 B (生成左侧视图)**:
  - **Prompt**:
    > 以上图为基准图（正面视图），生成该手办图的左侧视图。重要提示：保证人物100%的一致性，就像真实世界里存在这个手办，你只是拍摄他的多视角照片。
  - **输出**: 左侧视图 (`render_left.png`)。

## 2. 技术架构规划 (Technical Architecture)

为了实现上述链路并保证兼容性，我们需要设计一层独立的生图服务调度器：

### 2.1 模型选择与配置池 (Model Registry)
我们需要在前端 `生成配置面板` 中预置你截图里的那组模型清单（Nano Banana 系列）。
系统将通过统一的 API 路由调度，使用 OpenRouter（如果 OpenRouter 支持 Gemini 生图）或者我们刚才跑通的 Google Native SDK (配置 Proxy) 来调用生图。
**需要确认的点**：图片生成接口我们是使用 Google 官方的 `imagen` 系列原生 SDK 进行生图，还是使用 OpenRouter 提供的兼容端点？（看您的截图类似于 OpenRouter 或其他聚合页配置，后续实施时请确认对应 API Base）。

### 2.2 服务端 Action 改造 (`src/app/actions/image-to-3d.ts`)
新建独立的服务端 Action 用以封装这三步生成：
1. `generatePrimaryRender(base64Image, modelId)`: 执行阶段一，返回正面图 URL 或 Base64。
2. `generateSecondaryViews(primaryImageBase64, modelId)`: 接受正面图，内部使用 `Promise.all` 并发向大模型请求左侧和后侧视图，显著缩短用户等待时间。

### 2.3 前端 UI 交互 (`src/components/CreateFigurineWizard.tsx`)
- 用户在 `SubjectSelectorCanvas` 点击 `Create 3D Figurine` 按钮后，界面滑入新状态。
- 显示一个下拉框供用户选择底层的生成大模型 (如 `gemini-3.1-flash-image-preview`)。
- 开始生图流程，展示高级的骨架屏 (Skeleton) 或 `Step 1/2...` 进度动画。
- 阶段一完成后，立刻在界面中央展示非常精美的正面渲染图。
- 界面底部暗中拉起侧边/后边生图请求，一旦两张图返回，以“三视图”画廊的形式（类似手办包装盒展示）呈现给最终用户。

---
## 实施结果 (Resolution)
**状态**: ✅ 完全实现并归档。
**备注**: 
1. `image-to-3d.ts`：三步生成流（串联主图 + 并发次图）已经通过 `fetch` 调用真实打通。
2. `FigurineGenerationGallery.tsx` 已完成三重视野设计（IDLE / GENERATING / COMPLETE）。
3. **UX 进化史**：在中期验收中，将最初生硬刺眼的暗黑赛博朋克深渊背景，彻底重组拉正为了能够融入全站 `var(--surface-sunken)` 设计语言的毛玻璃极简面板。
4. **Kinetic UI**：为加载态加盖了镭射扫描圈、全息投影与打字机终端元素，同时修复了 `calc(100vh)` 在部分宽屏下吃掉底栏按钮布局的视觉 Bug。画廊已达到生产环境级商用质量。
