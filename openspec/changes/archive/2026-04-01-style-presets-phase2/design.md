# Technical Design: Style Presets Phase 2

## Context

Phase 1 将风格配置静态化在 `style-presets.ts`。消费侧（`customize/page.tsx`）通过 `STYLE_CATEGORIES` 数组直接渲染，生成管线通过 `promptOverride` 透传提示词。整体架构已为 Phase 2 预留好接口，只需替换数据来源。

现有 DB 中已有 `AiModel`、`HeroSlide` 等类似 CMS 表作为参考实现。Admin 后台已有 `/admin/ai-models`、`/admin/hero` 等子页面可参考。

## Goals / Non-Goals

**Goals:**
- 将大类/子类配置（名称、提示词、accentColor、icon、isOrderable、sortOrder）迁移到 Postgres
- 每个子类可独立绑定不同 AI 模型（通过 `aiModelId` 外键）
- Admin 后台 `/admin/styles` 支持完整 CRUD 与示意图上传
- Customize 页从 API 读取配置，静态常量降为兜底 fallback
- Seed 脚本初始化现有数据（不丢失 Phase 1 提示词）

**Non-Goals:**
- 后视图/侧视图提示词的配置化（超出 Phase 2 范围）
- 前台风格选取 UI 改版（Phase 1 已完成）
- 多语言 i18n 的风格名称（字段预留，但 UI 不实现）

## Architecture

### DB Schema 新增

```prisma
model StyleCategory {
  id           String          @id @default(cuid())
  slug         String          @unique  // "cartoon" | "low-poly" 等，兼容现有ID
  displayName  String                   // "Cartoon" 英文显示名
  name         String                   // "卡通风格" 原始名（备用）
  isOrderable  Boolean         @default(true)
  accentColor  String          @default("#6B7280")
  icon         String          @default("Box")  // Lucide icon 名
  sortOrder    Int             @default(0)
  isActive     Boolean         @default(true)
  presets      StylePreset[]
  createdAt    DateTime        @default(now())
  updatedAt    DateTime        @updatedAt
}

model StylePreset {
  id              String         @id @default(cuid())
  slug            String                  // "cartoon-standard"，兼容现有ID
  categoryId      String
  name            String                  // "Standard" | "Chibi" 等
  primaryPrompt   String         @db.Text // 主视图提示词
  previewImageUrl String?        @db.Text // Admin 上传的示意图
  aiModelId       String?                 // 可选：绑定特定 AI 模型
  sortOrder       Int            @default(0)
  isActive        Boolean        @default(true)
  category        StyleCategory  @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  aiModel         AiModel?       @relation(fields: [aiModelId], references: [id])
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt

  @@unique([categoryId, slug])
}

// AiModel 加反向关联
// model AiModel { ... stylePresets StylePreset[] }
```

### API 设计

```
GET  /api/style-presets              → 返回 StyleCategory[] + nested presets（前台使用）
GET  /api/admin/style-categories     → 同上，Admin 专用（需鉴权）
POST /api/admin/style-categories     → 新建大类
PATCH /api/admin/style-categories/[id] → 更新大类
DELETE /api/admin/style-categories/[id] → 删除大类（级联删子类）
POST /api/admin/style-presets        → 新建子类
PATCH /api/admin/style-presets/[id]  → 更新子类（提示词、图片、模型绑定）
DELETE /api/admin/style-presets/[id] → 删除子类
```

### 前端数据流变更

```
Before:
  customize/page.tsx
    └── import { STYLE_CATEGORIES } from '@/lib/constants/style-presets'
          └── 静态数组，同步可用

After:
  customize/page.tsx
    └── useEffect(() => fetch('/api/style-presets'))
          ├── 成功：使用 DB 数据渲染
          └── 失败/为空：fallback 到 STYLE_CATEGORIES 静态常量
```

加载时用 skeleton 占位卡片，与现有上传区 loading 行为一致。

### Admin 页面结构

```
/admin/styles
  ├── StyleCategoryList（大类列表，可展开）
  │     ├── [大类行] 名称 / accentColor 色块 / Icon / isOrderable 标签 / 编辑删除
  │     └── [展开] StylePresetList（该大类的子类）
  │           ├── [子类行] 名称 / 提示词摘要 / 绑定模型 / 示意图缩略图 / 编辑删除
  │           └── [+ Add Preset] 按钮
  └── [+ Add Category] 按钮

StylePresetEditModal（全屏抽屉/模态框）
  ├── 名称 (input)
  ├── primaryPrompt (textarea，自动增高)
  ├── 示意图上传（复用现有 /api/upload-token Blob 直传，仅 URL 存 DB）
  ├── AI 模型绑定（下拉，从 /api/admin/ai-models 获取）
  └── 保存 / 取消
```

### Seed 脚本

写 `prisma/seed.ts`，将 `STYLE_CATEGORIES` 中的现有数据 upsert 进 DB（使用 `slug` 作 upsert key，不重复插入）。部署时通过 `npx prisma db seed` 初始化。

## Decisions

1. **用 `slug` 字段（而非自动生成 cuid）兼容现有 preset ID**  
   `customize/page.tsx` 和生成管线使用字符串 ID 如 `"cartoon-standard"` 匹配数据，迁移后 DB 数据的 `slug` 字段保持一致，消费侧代码无需修改。

2. **子类绑定 AI 模型是可选的（`aiModelId` nullable）**  
   生成管线 fallback 到系统默认 active 模型，只有需要特定模型的子类才填写。避免初始数据不完整导致阻塞。

3. **示意图仅存 URL，文件走 Blob 直传**  
   与 HeroSlide 的处理方式一致，Admin 调用 `/api/upload-token` 获取直传凭证，图片不经过 Next.js 服务器。

4. **静态常量作为 fallback 保留**  
   本地开发无 DB 环境、或 API 失败时，`customize/page.tsx` 自动降级使用静态常量，不影响开发体验。

## Risks / Trade-offs

- **首次渲染闪烁**：fetch 期间显示 skeleton，用户感知轻微延迟（约 50-150ms 本地，Vercel Edge 更快）。可接受。
- **Seed 需手动执行**：首次部署或 DB 重置后需显式跑 seed，否则大类为空。文档记录。
- **提示词富文本**：当前用 textarea，不支持格式化编辑。Phase 2 不引入 Rich Text Editor，保持简单。
