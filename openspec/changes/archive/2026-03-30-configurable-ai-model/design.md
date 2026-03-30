# Design: 后台可配置 AI 生图模型

## Context

当前系统通过 `src/lib/constants/ai-models.ts` 硬编码 3 个 Gemini 模型，`src/app/actions/image-to-3d.ts` 中的 `callNativeGoogleImageAPI()` 仅支持 Google Gemini SDK 调用。需要扩展为多供应商架构，同时将模型配置从代码迁移到数据库。

参考项目 `E:\image_creator` 中已验证的即梦（火山方舟 Ark API）调用方式将直接复用。

## Goals / Non-Goals

**Goals:**
- 将生图模型配置从前端硬编码迁移到数据库，支持后台 CRUD
- 实现多供应商适配器架构（Gemini + 即梦）
- 前端模型选择器动态加载可用模型列表
- Gen记录中存储实际使用的模型 ID 和供应商信息

**Non-Goals:**
- 不在本次变更中实现完整的 Admin 管理界面（仅提供 API 端点）
- 不修改提示词逻辑（Prompt Engineering 保持不变）
- 不改变异步 Webhook 生图架构
- 不支持即梦的图生图（img2img）模式（即梦仅做文生图+参考图）

## Architecture

### 适配器模式 (Adapter Pattern)

```
image-to-3d.ts
├── resolveAdapter(provider) → GeminiAdapter | JimengAdapter
├── GeminiAdapter
│   └── callNativeGoogleImageAPI() (现有逻辑，重构为类方法)
└── JimengAdapter
    └── callArkGenerateAPI() (参考 E:\image_creator\server\adapters\jimeng.js)
```

**统一接口**：
```typescript
interface ImageAdapter {
  generateImage(params: {
    model: string;
    prompt: string;
    inputImageB64?: string | string[];
    aspectRatio?: string;
    imageSize?: string;
  }): Promise<string>; // 返回 base64 图片数据
}
```

### 数据库模型

```prisma
model AiModel {
  id           String   @id @default(cuid())
  modelId      String   @unique           // "gemini-3.1-flash-image-preview" 或 "seedream-5.0-lite"
  name         String                     // 显示名称
  description  String?                    // 描述
  provider     String                     // "gemini" | "jimeng"
  isActive     Boolean  @default(true)    // 启用/禁用
  sortOrder    Int      @default(0)       // 排序
  config       Json?                      // 供应商特定配置 (如即梦的 endpointEnvKey)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}
```

- `config` 字段用 JSON 存储适配器特定的配置，例如即梦的 `{ "endpointEnvKey": "ARK_EP_SEEDREAM_5_0" }`
- Gemini 模型的 `config` 可为空（模型 ID 即 API 参数）

### API 端点

| 端点 | 方法 | 权限 | 说明 |
|------|------|------|------|
| `/api/ai-models` | GET | 公开 | 返回 `isActive=true` 的模型列表（按 sortOrder 排序） |
| `/api/admin/ai-models` | GET | ADMIN | 返回所有模型（含 isActive=false） |
| `/api/admin/ai-models` | POST | ADMIN | 新增模型 |
| `/api/admin/ai-models/[id]` | PUT | ADMIN | 更新模型 |
| `/api/admin/ai-models/[id]` | DELETE | ADMIN | 删除模型 |

### 生图流程改造

Webhook Worker (`/api/webhooks/generate/route.ts`) 中的调用路径变更：

```
收到 modelId → 查询 AiModel 表获取 provider + config
→ resolveAdapter(provider) → adapter.generateImage(...)
```

**对即梦的特殊处理**：
- 即梦不支持 `responseModalities: ['Image']`，使用火山方舟标准 API
- 即梦通过 `body.image = "data:image/png;base64,..."` 传入参考图
- 每个即梦模型对应一个 Endpoint ID（环境变量），通过 `config.endpointEnvKey` 映射
- 即梦模型有最小像素要求（4.5/5.0: 1920px，4.0: 1024px），适配器内自动缩放

### 前端改造

`FigurineGenerationGallery.tsx` 中：
- 移除 `import { IMAGE_GENERATION_MODELS } from '@/lib/constants/ai-models'`
- 通过 `useSWR('/api/ai-models')` 或 `useEffect + fetch` 动态加载模型列表
- 模型选择器下拉框按 provider 分组展示

## Decisions

1. **数据库驱动 vs 环境变量驱动**：选择数据库。理由：支持动态增删不需重部署，且可存储每个模型的显示名、排序等元数据。
2. **适配器工厂 vs Switch-case**：选择适配器工厂模式。理由：更好的开闭原则，新增供应商只需添加适配器而不修改核心逻辑。
3. **即梦 API 版本**：使用火山方舟 Ark API v3（`/api/v3/images/generations`），这是参考项目已验证的方式。
4. **Seed 模型数据**：通过 Prisma seed 脚本预生成 6 个默认模型记录，无需手动插入。

## Risks / Trade-offs

- **即梦提示词兼容性**：现有提示词为 Gemini 优化，即梦可能需要调整 Prompt（但本次不在 scope 内，先使用相同提示词）
- **即梦延迟**：火山方舟 API 调用延迟可能不同于 Gemini，需观察是否要调整 120s timeout
- **环境变量依赖**：即梦需要 `ARK_API_KEY` + 每个模型的 `ARK_EP_*`，新增模型时需同步更新 Vercel 环境变量
- **数据库 Seed**：首次部署需运行一次 Seed 脚本填充默认模型数据
