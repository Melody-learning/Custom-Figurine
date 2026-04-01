# Style Presets Phase 2 — Database Configuration & Admin CRUD

## Why

Phase 1 将风格大类/子类、提示词、模型策略硬编码在 `src/lib/constants/style-presets.ts`。
每次调整提示词或新增风格均需代码变更 + Vercel 重新部署，对运营效率影响极大。
Phase 1 中有 4 个 `TODO` 提示词尚未填写，无法生产使用。
当前也无法为不同风格绑定不同的 AI 模型（选谁靠代码写死）。

Phase 2 将把这些配置迁移到数据库，提供 Admin 后台的 CRUD 界面，实现运营侧零代码调整。

## What Changes

### 新增
- **Prisma Schema**：新增 `StyleCategory` 和 `StylePreset` 两张表（含 `promptOverride`、`modelId` 外键、`previewImageUrl`、`isOrderable`、`sortOrder` 等字段）
- **Seed Script**：将 `style-presets.ts` 中的现有数据 seed 到 DB，包括已有的卡通提示词
- **Admin 风格管理页**：`/admin/styles`，支持：
  - 查看大类列表（含子类折叠）
  - 内联编辑大类元数据（名称、accentColor、icon、isOrderable）
  - 新增 / 编辑 / 删除子类（name、primaryPrompt 富文本 textarea、绑定 AI 模型、previewImageUrl 图片上传）
  - 调整排序（drag or up/down arrows）
- **API 路由**：`/api/admin/style-categories` 和 `/api/admin/style-presets/[id]` CRUD
- **前端数据获取**：`customize/page.tsx` 改从 `/api/style-presets` 获取配置，回退到静态常量（兼容本地无 DB 场景）

### 修改
- `src/lib/constants/style-presets.ts`：保留为静态兜底（fallback），添加 `fromDb()` 适配层
- `prisma/schema.prisma`：新增 `StyleCategory` / `StylePreset` models
- `src/app/customize/page.tsx`：STYLE_CATEGORIES 数据来源换为 API（SWR or fetch + Suspense），不改消费侧渲染代码

### 不改变
- Customize 页的风格选取 UI（Phase 1 已完成）
- 生成管线的提示词透传机制（`promptOverride` 字段已兼容）
- 后视图/侧视图提示词（Phase 1 架构中已预留，Phase 2 暂不纳入范围）

## Requirement Changes

- `ai-generation`: 新增「风格配置可运营化」需求——提示词、模型绑定从代码迁移到 DB，Admin 可热更新

## Impact

- `prisma/schema.prisma`：新增两个 model，需要 `prisma db push`
- `src/app/admin/`：新增 `styles/` 子页
- `src/app/api/admin/style-categories/` 和 `/style-presets/[id]/`：新增 4-5 个 API handler
- `src/lib/constants/style-presets.ts`：作为 fallback 保留，入口函数改为可替换
- `src/app/customize/page.tsx`：数据获取从 static import 改为 async fetch（小改）
- Vercel Blob：previewImageUrl 图片上传沿用现有 `/api/upload` 路由，无新增基础设施
