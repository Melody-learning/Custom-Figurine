---
title: Segmentation Pipeline Cleanup
status: IMPLEMENTED & ARCHIVED
date: 2026-03-14
---

# 代码整理与重构提案 (Segmentation Pipeline Cleanup)

## 背景复盘
在经历“纯前端零成本主体提取流水线”的多次迭代探索后，我们的架构经历了以下剧变更迭：
1. **Option A (WebAI SAM + OpenRouter)**: 尝试使用 Cloud Gemini 提供 Polygon 坐标，前端 `@xenova` 跑深度抠图。因 Next.js Webassembly 编译问题与高斯模糊性能太低作罢。
2. **Option B (Native Proxy Base64)**: 尝试云端生成 Base64 PNG。但在模型内部发现大面积 Base64 文本生成属于“AI 幻觉”。
3. **Option C (Hybrid CDN Worker)**: 借助 JSDelivr 动态加载 WebAI 张量解决打包报错。成功部署。
4. **终极大道至简版 (Simple Box-Crop)**: 依据最新决策，我们只保留前置彩色外框框选逻辑，去除了所有沉重的 WebWorker, WebGL 渲染，背景模糊特效，只输出纯净裁剪图。

## 垃圾清理任务列表 (Cleanup Objectives)
当前代码库依然残留着之前探索由于“做加法”产生的历史痕迹。为保持极致整洁，需要进行以下清理操作：

### 1. `next.config.mjs`
- **移除**为了兼容 `@xenova/transformers` 的 C++ 后端依赖（`sharp`, `onnxruntime-node`）而加入的 Webpack `resolve.alias: false` 劫持代码。

### 2. `package.json`
- 经过检查，`@xenova/transformers` 已经被彻底卸载。（`https-proxy-agent` 仍然保留，因为其作为软路由网关正在服役于 `GoogleGenAI` fetcher）。

### 3. Frontend & State Cleanup (`src/components/ai/SubjectSelectorCanvas.tsx`)
- 确保没有残留任何多余的 Worker、ImageData 和 WebGL 并行计算依赖逻辑。代码已在上一步被重构为纯 HTML5 原生 `drawImage` 切片渲染。
- 确保所有的 Bottom Bar 冗长文本渲染按钮已经被彻底删除断绝。

### 4. Backend Action Optimization (`src/app/actions/ai-subject.ts`)
- [x] `mask` 属性已经从 `Subject` Type 定义中移除？（如果不曾移除，这次彻底抹杀）。
- [x] System Prompt 已强制 AI 给定明确带有“绝对方位特征”（如“最左侧穿红衣服女孩”）的 `description`。确保无需后续再做关联推理。

---
## 实施结果 (Resolution)
**状态**: ✅ 完成大扫除。
**备注**: Webpack 代理、无用的 Worker 依赖（`@xenova/transformers`）以及底层 Canvas 多余的掩码渲染堆栈已被完全移除，代码库负重断崖式降低，回归原生 Web Box Crop 直给链路。
