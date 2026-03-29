# AI 图像生成引擎规范 (AI Image Generation Engine)

> 此文档是 AI 生图系统的 Source of Truth，反映截至 2026-03-29 的实际生产实现。

## 1. 系统架构总览

```
┌──────────────────────────────────────────────────────────────────────┐
│                         BROWSER (客户端)                             │
│                                                                      │
│  ┌─────────────┐    ┌──────────────────┐    ┌─────────────────────┐  │
│  │ 用户上传图片  │───▶│ @imgly BG Removal│───▶│ FigurineGeneration │  │
│  │ (裁剪/预览)  │    │ (WASM 抠图预处理) │    │ Gallery (展厅组件)  │  │
│  └─────────────┘    └──────────────────┘    └────────┬────────────┘  │
│                                                       │ startAsync   │
│                                                       │ Generation() │
└───────────────────────────────────────────────────────┼──────────────┘
                                                        │
┌───────────────────────────────────────────────────────┼──────────────┐
│                       SERVER (Next.js)                │              │
│                                                       ▼              │
│  ┌─────────────────────┐    ┌──────────────────────────────────┐    │
│  │ Server Action        │    │ POST /api/webhooks/generate      │    │
│  │ start-generation.ts  │───▶│ 后台异步生图 Worker (maxDur=120s)│    │
│  │ ① 上传原图到 Blob   │    │ ① generatePrimaryRender()       │    │
│  │ ② 创建 PENDING 记录 │    │ ② generateSecondaryViews()      │    │
│  │ ③ 触发 Webhook      │    │ ③ 并行上传结果到 Blob           │    │
│  └─────────────────────┘    │ ④ 更新 DB 为 COMPLETE/FAILED    │    │
│                              └──────────────────────────────────┘    │
│                                           │                          │
│  ┌─────────────────────┐                  │                          │
│  │ GET /api/assets/[id] │◀── 轮询(3s) ────┘                          │
│  │ 前端查询生成状态     │                                             │
│  └─────────────────────┘                                             │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │ image-to-3d.ts — Gemini 原生图像生成 API 调用器              │    │
│  │ • callNativeGoogleImageAPI() — 通用请求发射器(支持多图)     │    │
│  │ • generatePrimaryRender()    — 阶段一：正面手办主视觉       │    │
│  │ • generateShowcaseImage()    — 效果展示图（双图输入）        │    │
│  │ • generateSecondaryViews()   — 阶段二：背面+侧面+展示(3并行)│    │
│  └──────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────┘
```

## 2. 生图模型与供应商

**当前供应商**：Google Gemini（通过 `@google/genai` 官方 SDK 直连）

| 模型 ID | 显示名称 | 说明 |
|---------|---------|------|
| `gemini-3.1-flash-image-preview` | Nano Banana 2 | Pro 级视觉默认选项 |
| `gemini-3-pro-image-preview` | Nano Banana Pro | 最高质量生成 |
| `gemini-2.5-flash-image` | Nano Banana | 初代稳定版 |

- 模型定义在 `src/lib/constants/ai-models.ts`
- 前端展厅允许用户选择模型
- 所有模型通过同一个 `callNativeGoogleImageAPI()` 统一调用，输出 1:1 正方形 1024px

## 3. 环境变量

| Key | 作用域 | 说明 |
|-----|--------|------|
| `GEMINI_API_KEY` | 后端 | Google AI Studio API Key |
| `HTTP_PROXY` | 后端 | 可选，反向代理地址（用于网络受限环境） |
| `BLOB_READ_WRITE_TOKEN` | 后端 | Vercel Blob 存储令牌 |
| `NEXT_PUBLIC_ENABLE_BG_REMOVAL` | 前后端 | Feature Flag，启用客户端抠图预处理 |

## 4. 完整生图流程（异步 Webhook 架构）

### 阶段 0：客户端预处理（可选）

用户上传图片后，系统执行以下预处理管线：

**尺寸压缩**：长边缩放至 ≤1024px（bounding box），保持宽高比。

**条件化格式输出**（根据抠图 Feature Flag 切换）：

当 `NEXT_PUBLIC_ENABLE_BG_REMOVAL=true` 时：

**用户级控制**：系统在上传步骤中显示 "Smart Background Filter" / "智能背景过滤" Toggle 开关（默认开启）。Toggle 开启时执行抠图，关闭时跳过。环境变量是总开关，Toggle 是用户子开关。

1. 以 **PNG 格式**压缩图片（保留透明通道，不填充背景色），为抠图提供干净输入
2. **透明度检测**：扫描图片边缘像素，若已有透明背景（>5% 边缘像素透明）则跳过抠图
3. 对非透明图片调用 `@imgly/background-removal` 在浏览器内通过 WASM 执行背景移除
4. 使用单线程模式，避免对 COOP/COEP 响应头的依赖
5. 失败时 Graceful Fallback 到原图，不阻塞流程
6. **存储降级**：抠图完成后，将透明 PNG 转为 JPEG（填白底，质量 0.8）再存入 Zustand state，确保 localStorage 不溢出

当 `NEXT_PUBLIC_ENABLE_BG_REMOVAL` 未设置或为 `false` 时：
- 隐藏 Toggle 开关，直接以 JPEG 格式（白底，质量 0.8）输出压缩结果

相关文件：`src/lib/remove-background.ts`、`src/app/customize/page.tsx`

### 阶段 1：前端触发 — Server Action

文件：`src/app/actions/start-generation.ts`

1. **鉴权检查**：必须已登录
2. **原图上传**：将 Base64 图片转换为 Buffer，上传到 Vercel Blob (`vault/original-*.jpg`)
3. **抠图后图上传**（可选）：如果前端传了 `processedImageB64`（抠图后的图），上传到 Blob (`vault/processed-*.png`)，获得 `processedImageUrl`
4. **创建 PENDING 记录**：在 `GeneratedAsset` 表中写入初始记录，包含原图 URL
5. **异步触发 Webhook**：通过 `waitUntil(fetch(...))` 非阻塞调用 `/api/webhooks/generate`
   - Payload 包含 `assetId`, `modelId`, `originalImageUrl`, `processedImageUrl`（可选）
   - URL 解析策略：`NEXT_PUBLIC_APP_URL` > `VERCEL_PROJECT_PRODUCTION_URL` > `VERCEL_URL` > localhost
   - 可注入 `x-vercel-protection-bypass` 绕过 Preview 密码保护
6. **立即返回** `{ success: true, assetId }` 给前端

### 阶段 2：后台异步生图 — Webhook Worker

文件：`src/app/api/webhooks/generate/route.ts`（maxDuration=120s）

1. **下载原图**：从 Blob URL fetch 原始图片，转回 Base64
2. **下载抠图后图**（可选）：如有 `processedImageUrl`，fetch 并转 Base64；失败时 fallback 到原图
3. **阶段一生成**：调用 `generatePrimaryRender(processedImage || originalImage)` 生成正面手办主视觉
   - 输入优先使用抠图后的图，提供更干净的人物轮廓
4. **阶段二生成**：调用 `generateSecondaryViews(primaryB64, modelId, originalBase64)` **3 路并行**：
   - 后视图（正面手办图 + backPrompt）
   - 侧视图（正面手办图 + leftPrompt）
   - 效果展示图（正面手办图 + 原始用户图 + showcasePrompt）— 失败不阻塞
5. **并行上传**：4 张结果图同时上传到 Vercel Blob CDN（showcase 可能为 null）
6. **更新数据库**：写入 `resultImage`/`backImage`/`sideImage`/`showcaseImage`，状态设为 `COMPLETE`
7. **失败处理**：捕获异常后将状态标记为 `FAILED`

### 阶段 3：前端轮询 — 实时状态同步

文件：`src/components/ai/FigurineGenerationGallery.tsx`

1. Server Action 返回 `assetId` 后，前端启动 3 秒间隔轮询
2. 调用 `GET /api/assets/[id]` 查询记录状态
3. 状态为 `COMPLETE` → 提取四张图 URL 并展示（正面、后面、侧面、效果展示）
4. 状态为 `FAILED` → 显示错误信息
5. 超过 120 秒 → 超时终止轮询
6. **Showcase tab** 条件渲染：仅在 `showcaseImage` 非空时显示第 4 个缩略图

## 5. Gemini 生图核心实现

文件：`src/app/actions/image-to-3d.ts`

### 通用请求发射器 `callNativeGoogleImageAPI()`

```typescript
// 签名: (prompt, modelName, baseImageB64?: string | string[]) => Promise<string>
// 支持单图或多图输入（多图时按顺序附加到 parts 数组）
// config: { imageConfig: { aspectRatio: "1:1", imageSize: "1K" } }
// 支持可选 HTTP 代理隧道
```

### Prompt 工程

**提示词1 — 手办产品照（`PROMPT_PRIMARY`，英文）**：
> A professional studio product shot of a 1/7 scale premium ACG figurine featuring the characters in the reference image. The style is a highly detailed, mature stylized anime aesthetic...
- 输入：1 张图（抠图后优先，否则原图）

**提示词2 — 效果展示图（`PROMPT_SHOWCASE`，中文）**：
> 将手办图中的手办模型放置在一张家用餐桌上，手办底座为透明亚克力，无任何文字。手办旁边放着原图和一支铅笔...
- 输入：2 张图（手办正视图 + 用户原始上传图）

**背面视图（`PROMPT_BACK`）**：
> 以上图为基准图（正面视图），生成该手办图的后视图。保证人物100%的一致性...

**侧面视图（`PROMPT_LEFT`）**：
> 以上图为基准图（正面视图），生成该手办图的左侧视图。保证人物100%的一致性...

## 6. 数据库模型

```prisma
model GeneratedAsset {
  id                 String   @id @default(cuid())
  userId             String
  originalImage      String   // Vercel Blob URL
  resultImage        String?  // 正面主视觉 Blob URL
  backImage          String?  // 背面视图 Blob URL
  sideImage          String?  // 侧面视图 Blob URL
  showcaseImage      String?  // 效果展示图 Blob URL（提示词2 生成）
  status             String   // PENDING | COMPLETE | FAILED
  prompt             String?
  baseModelVariantId String?
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt
  user               User     @relation(...)
}
```

## 7. 相关文件索引

| 文件 | 职责 |
|------|------|
| `src/lib/constants/ai-models.ts` | 可用模型配置 |
| `src/lib/remove-background.ts` | 客户端 WASM 抠图工具 |
| `src/app/actions/start-generation.ts` | Server Action：触发异步生图 |
| `src/app/actions/image-to-3d.ts` | Gemini API 调用封装 |
| `src/app/api/webhooks/generate/route.ts` | 后台 Webhook Worker |
| `src/app/api/assets/[id]/route.ts` | 资产状态查询 API |
| `src/components/ai/FigurineGenerationGallery.tsx` | 前端生图展厅组件 |

## 8. 已知限制与待办

- Vercel Serverless maxDuration=120s，超长生图可能超时
- 当前 Prompt 硬编码在 `image-to-3d.ts`，未来应抽取到配置或数据库
- 背景移除（`@imgly/background-removal`）处于 Feature Flag 实验阶段
- 低端移动设备的 WASM 抠图内存消耗需持续观察
- 二、三视角的一致性依赖模型能力，偶有漂移
