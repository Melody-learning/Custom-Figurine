---
author: "Antigravity"
date: "2026-03-13"
status: "Implemented & Archived"
type: "Proposal"
---

# 提议名称：实现全链路 Mock AI 生图网关与交互 (Mock AI Generation Pipeline)

## 1. 背景与意图 (Context & Intent)
- **痛点/需求**: 目前前端 `/customize` 页面的生成逻辑仅仅是一个 `setTimeout(2500)` 而且最终返回的 `generatedImage` 还是用户原原本本上传的 2D `uploadedImage`。这并没有串联起真实的前后端交互流，也无法完整体验从二维到三维转化的视觉心智流程，更无法测试后续发送多张图片（原图 + 生成图）至云端的情境。
- **核心目标**: 严格遵守 `specs/integrations/ai-generation.md` 中定义的【实验性跑通测试阶段基准】。我们不直接调用真实 Replicate/Stability API，而是构建一个全功能流转的替身（Mock API Route）。它负责接收前端发送的前端图片，经过真实的网络传输层、伪装的 3 秒后端排队等待，最终向前端返回项目中预设的一张极度精美的 3D 白模效果图 (`/images/mock-3d-result.webp`)。以此串联从上传 -> 渲染 -> 结账 -> 用户主页 的全生命周期数据流。

## 2. 受影响的规范文件 (Impacted Specs)
- [x] `specs/integrations/ai-generation.md` (明确指引第一阶段的接口路由与载荷结构约定)
- [x] `specs/frontend/routing.md` (增加 `/api/generate` 代理路由说明)

## 3. 详细改动规格 (Proposed Deltas)

### 针对 `specs/integrations/ai-generation.md` 的修改：
- `[ADDED]` 增加第一阶段的具体 API 契约（API Contract）：
  - 路由: `POST /api/generate`
  - 入参: `{ image: string (base64 or blob url) }`
  - 出参: `{ status: 'success', resultUrl: '/images/mock-3d-result.webp' }`

### 针对系统代码的实质修改：
- `[NEW]` 创建一张足以让人惊艳的 3D 生成后占位图并放置于 `public/images/mock-3d-result.webp` (可由 AI Agent 工具生成)。
- `[NEW]` 新增 `src/app/api/generate/route.ts` 作为 Mock 生图网关。
- `[MODIFIED]` 修改 `src/app/customize/page.tsx` 中 `handleGenerate` 的逻辑，使其发起对 `/api/generate` 的 HTTP FETCH 请求，并展示真正的回传 3D 图片成果。

## 4. 实施 Checklist (Implementation Plan)
- [x] AI Agent 生成一张 3D 白模/手办效果的高质量展示图保存至本地 `public/images/`.
- [x] 创建 `/api/generate/route.ts` 搭建模拟延迟后端的接口。
- [x] 改造 `customize/page.tsx` 的请求链路。
- [x] 进行完整提交流程，由司令再次端到端测试。

---
## 5. 实施结果 (Resolution)
**状态**: ✅ 完成并归档。
**备注**: 首个跑通的全链路流被成功接力到了定制页，后续已经通过真实的 Gemini/OpenRouter API 链路取代了本 Mock。本提案历史使命已达成。
