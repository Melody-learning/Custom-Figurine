# 提案：全局 1K (1024x1024) 图像分辨率管线压缩与标准化 (Image Normalization Pipeline)

## 1. 深度复盘与意图 (Context & Intent)
随着 3D 资产生成流水线的逐渐固化，我们发现：
1. **上传负载过大**：用户可能会上传原相机直出的 4K 甚至 8K 巨型图片，直接转 Base64 塞进内存会导致浏览器极易 OOM（崩溃），且 Vercel Blob / 数据库面临不必要的拥堵。
2. **AI 模型感知盲区**：底层调用的 Vision-Language Model 和 3D Mesh Engine 最佳感知分辨率基本都锚定在 1024x1024。塞给它 4K 图片并不能提升网格精度，反而会大幅增加推理计算时长和内存损耗。
3. **输出规格不齐**：不同图源生成的资产，如果在最终 Vault 库展示时或者进入购物车时尺寸不规整，将破坏电商前台视觉的统一感。

**核心指令**：将输入图片加个处理环节，检查是否超过 1K (1024x1024)，超过的话压缩到 1K 以内。然后输出的图片全部要求是 1K。

## 2. 解决方案：全链路 1K 限制盾 (1K Resolution Shield Pipeline)

为了实现严苛的 1K（1024x1024）标准化，我们将在**输入端**与**生成端**建立两道强制闸门：

### 闸门一：前端浏览器级无损压缩 (Client-side Downsampling)
在用户于 `page.tsx` 选中图片（触发 `handleFileUpload`）时：
- 我们不直接 `FileReader.readAsDataURL()`，而是通过 `HTMLCanvasElement` 代理。
- 计算图片的原始分辨率 `width` 和 `height`。
- **判断阈值**：如果 `Math.max(width, height) > 1024`，我们将计算缩放比例，让最长边固定为 1024，等比缩放次长边。
- **导出**：画布调用 `canvas.toDataURL('image/jpeg', 0.9)` 导出高质量但在 1K 范围内的 Base64。
- **体验提升**：这能将用户的单张上传体积从 10MB 瞬间压到几百 KB，生成发送速度将成倍飙升。

### 闸门二：后端/AI生成物理规格约束 (Server-side & API Constraint)
深入我们底层 API 调用的源头（如 `Fal.ai` 的 `run` 请求，存在于 `actions/start-generation.ts` 或 webhook 处理中）：
- 强制注入输出尺寸要求，对于支持 `image_size` 规范参数的模型接口（如 SD 系或专门的三视图生成模型），指定参数为 `square_hd` 或强制写死 `width: 1024, height: 1024`。
- 确保从 Webhook 传回 Vercel Blob，最终写进 Prisma 数据库的 `primaryImage`, `backImage` 等衍生品，全都带有原生 1K 基因。

## 3. 实施 Checklist

- [ ] 1. 编写一个独立工具函数 `resizeImageTo1K(file: File): Promise<string>` 封装基于 Canvas 的前端图片等比压缩逻辑。
- [ ] 2. 在 `src/app/customize/page.tsx` 中的 `handleFileUpload` 接入该工具函数，替换原有的纯 Base64 读取。
- [ ] 3. 审查后端 AI 调用链 (`src/app/api/webhooks/generate/route.ts` 或是 `src/app/actions/...`) 的参数设定，将最终生成物强制规范为 1024x1024（如果相关底层 API 参数支持配置）。
