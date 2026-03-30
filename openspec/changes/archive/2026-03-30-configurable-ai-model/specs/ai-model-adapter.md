# Spec: AI 生图多供应商适配器

## ADDED Requirements

### Requirement: 多供应商适配器接口
系统需要支持通过统一接口调用不同 AI 供应商的图像生成 API。

#### Scenario: Gemini 模型调用
- **WHEN** 请求的模型 provider 为 "gemini"
- **THEN** 系统通过 `@google/genai` SDK 调用 Google AI Studio API，使用模型 ID 作为 `model` 参数

#### Scenario: 即梦 (Seedream) 模型调用
- **WHEN** 请求的模型 provider 为 "jimeng"
- **THEN** 系统通过原生 `fetch` 调用火山方舟 Ark API v3 (`https://ark.cn-beijing.volces.com/api/v3/images/generations`)
- **AND** 使用模型配置中的 `endpointEnvKey` 查找对应的 Endpoint ID 环境变量
- **AND** 使用 `ARK_API_KEY` 环境变量作为 Bearer Token 认证

#### Scenario: 即梦参考图传入
- **WHEN** 即梦模型接收到参考图 base64 数据
- **THEN** 将图片以 `data:image/png;base64,...` 格式放入请求体的 `image` 字段

#### Scenario: 即梦最小尺寸自动调整
- **WHEN** 即梦模型要求最小像素 (seedream-4.5/5.0: 1920px, seedream-4.0: 1024px)
- **AND** 请求尺寸小于最小要求
- **THEN** 自动按比例放大到满足最小像素要求

#### Scenario: 不支持的 provider
- **WHEN** 请求的模型 provider 不在支持列表中
- **THEN** 抛出错误 "Unsupported provider: {provider}"

### Requirement: 数据库驱动的模型配置
系统的可用模型列表必须从数据库读取，而非前端硬编码。

#### Scenario: 公开查询活跃模型
- **WHEN** 前端请求 `GET /api/ai-models`
- **THEN** 返回 `isActive=true` 的模型列表，按 `sortOrder` 升序排列
- **AND** 响应格式为 `{ models: AiModel[] }`

#### Scenario: Admin 管理模型
- **WHEN** ADMIN 用户请求 `/api/admin/ai-models` 的 CRUD 端点
- **THEN** 可以创建、读取、更新、删除模型记录
- **AND** 非 ADMIN 用户收到 403 响应

#### Scenario: 数据库 Seed 默认模型
- **WHEN** 首次部署或运行 `npx prisma db seed`
- **THEN** 创建以下 6 个默认模型记录：
  | modelId | provider | name |
  |---------|----------|------|
  | gemini-3.1-flash-image-preview | gemini | Gemini 3.1 Flash |
  | gemini-3-pro-image-preview | gemini | Gemini 3 Pro |
  | gemini-2.5-flash-image | gemini | Gemini 2.5 Flash |
  | seedream-5.0-lite | jimeng | Seedream 5.0 Lite |
  | seedream-4.5 | jimeng | Seedream 4.5 |
  | seedream-4.0 | jimeng | Seedream 4.0 |

### Requirement: 前端动态模型选择
前端展厅组件的模型列表通过 API 动态获取。

#### Scenario: 加载模型列表
- **WHEN** `FigurineGenerationGallery` 组件挂载
- **THEN** 异步请求 `GET /api/ai-models` 获取可用模型列表
- **AND** 默认选中列表中的第一个模型

#### Scenario: 模型列表加载失败
- **WHEN** API 请求失败
- **THEN** 回退使用硬编码的默认模型 `gemini-3.1-flash-image-preview`

### Requirement: 生成记录关联模型
已生成的资产需要记录使用的模型信息。

#### Scenario: 保存所用模型
- **WHEN** 生图任务完成
- **THEN** `GeneratedAsset` 记录中 `modelId` 字段记录实际使用的模型 ID

## MODIFIED Requirements

### Requirement: 环境变量扩展
- **ADDED** `ARK_API_KEY`: 火山方舟 API Key（后端）
- **ADDED** `ARK_EP_SEEDREAM_5_0`: Seedream 5.0 Lite 接入点 ID（后端）
- **ADDED** `ARK_EP_SEEDREAM_4_5`: Seedream 4.5 接入点 ID（后端）
- **ADDED** `ARK_EP_SEEDREAM_4_0`: Seedream 4.0 接入点 ID（后端）
