# 提案：纯前端零成本主体提取流水线 (Gemini 3.1 + WebAI SAM)

## 1. 背景与意图 (Context & Intent)
为了彻底解决复杂背景和多人合影下 3D 建模引擎的困扰，您提出需要一套能够在前端画布提供可选主体、自动虚化其余背景的交互式工作流。
经过架构讨论，我们选定了**方案 C**：**[云端 Gemini 3.1 语义定位] + [端侧 WebAI (Transformers.js) 像素级抠图]**。
这套组合拳极具颠覆性：
1. **零 GPU 服务器成本**：不需要在后端租用昂贵的 A100/H100 显卡去跑图像分割模型，极大地降低了定制手办的算力亏损风险。
2. **极佳的隐私与速度**：原图的大部分像素运算都在用户的本地浏览器中由显卡原生完成。
3. **顶级的用户交互**：Gemini 负责理解“这是狗，那是人”，本地 SAM 回答“这是人体边缘”。用户即可通过点击热区平滑切换渲染主体。

## 2. 受影响的规范文件 (Impacted Specs)
- [ ] `specs/frontend/components.md` (新增复杂的纯前端 AI 渲染画布组件)
- [ ] `specs/backend/api.md` (新增专门用于获取位置框的 Server Action)

## 3. 技术栈与架构 (Tech Stack & Architecture)

### 3.1 云端大脑层：Gemini 3.1 空间推理 (Spatial Understanding)
由于 Gemini 原生支持通过文本 prompt 提取图像的规范化边界框，我们将构建一个 Server Action `extractSubjectsBox(file)`。
  - **输入**：用户上传的照片 base64。
  - **指令**：`Identify the main subjects (like people, pets, prominent objects) in this image. Return their descriptive names and a precise bounding box for each.`
  - **输出**：一组包含 Name 与 `[ymin, xmin, ymax, xmax]` 坐标（归一化为 0-1000）的 JSON。

### 3.2 浏览器执行层：WebAI (Transformers.js)
在用户的浏览器（客户端）动态引入 `@xenova/transformers` 包，直接将其转为 Wasm 执行。
  - **模型选用**：选用轻量化的 Meta SAM 模型（如 `Xenova/slimsam-77-uniform`，文件约 100MB 左右，由浏览器缓存）。
  - **执行注入**：前端画布拿到 Gemini 吐出的坐标框后，将其传给本地的 SAM 实例作为 `input_boxes` 引导点。本地瞬间算出完美的高精度黑白 Mask。

### 3.3 画布渲染层：(Canvas & CSS)
  - 渲染双层重叠：底层原图加上高斯模糊 `backdrop-filter: grayscale(100%) blur(5px)`。表层则利用计算出的 Mask，用 `<canvas>` 的 `globalCompositeOperation = 'destination-in'` 进行剪裁，将绝对清晰的主体“悬浮”叠加在毛玻璃背景之上。
  - 提供底部缩略图或锚点，让用户在多个解析出的不同 Subject 之间进行 Toggle 点击切换。

## 4. 实施 Checklist (Implementation Plan)

- [ ] **Phase 1: 基础设施** 
  - [ ] 创建本提案，规划前端包引入与 WebWorker 打包配置。
  - [ ] 安装依赖 `@xenova/transformers`。
- [ ] **Phase 2: Gemini Bounding Box 接口** 
  - [ ] 编写 Server Action 接入 `@google/genai` 调用 Gemini 3.1 的 Image Annotation 并解析多物体坐标组。
- [ ] **Phase 3: WebAI SAM 引擎集成** 
  - [ ] 编写 Web Worker 脚本，确保在后台线程下载和热加载 SlimSAM。
  - [ ] 桥接 Gemini 的坐标输出与 SAM 的坐标输入公式，生成 Float32Array 的 Mask。
- [ ] **Phase 4: 交互与渲染 UI** 
  - [ ] 创建 `SubjectSelectorCanvas` 组件，集成 Web GL / Canvas API 将 Mask 画在屏幕上实现主体的透明和虚化。

---
## 状态区
- [ ] 提出中 (Draft)
- [ ] 用户已审查并同意 Specs 修改 (Specs Approved)
- [ ] 代码实施完成待验收 (Implemented)
- [ ] **完成闭环 (Done)**
