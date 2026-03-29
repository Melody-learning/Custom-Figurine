## Why

项目已经有完整的前端定制流程、AI 生图管线、Shopify 结账系统，但缺少运营管理后台。Hero 轮播图内容硬编码在组件里，生图次数无限制（资源浪费和滥用风险），用户生成记录只能通过数据库直查。需要一个简易后台来满足初期运营管理需求。

## What Changes

### 1. Admin 后台框架
在 `src/app/admin/` 下新增管理页面，复用现有 NextAuth 鉴权 + middleware 角色守卫（`/admin/*` 路由已有 ADMIN 角色检测）。包含侧边栏布局和三个功能模块。

### 2. 生成记录管理
- 查看所有用户的 `GeneratedAsset` 记录（列表 + 分页 + 搜索）
- 查看生成详情（4 图预览、用户信息、耗时、状态）
- 删除记录（软删除或硬删除）

### 3. Hero 轮播管理
- 新增 `HeroSlide` Prisma model，将轮播数据从硬编码迁移到数据库
- Admin 页面支持：新增/编辑/删除/排序 轮播项
- 图片通过 Vercel Blob 上传，文案支持中英双语
- 前端首页 HeroShowcase 从 DB 动态读取

### 4. 生图权限控制
- User 表新增字段：`maxConcurrentJobs`（默认 1）、`maxTotalGenerations`（默认 3）、`isWhitelisted`（默认 false）
- 生成流程拦截：在 `startAsyncGeneration` 中检查权限
  - 白名单用户直接放行
  - 检查总次数上限（点击生成即扣次数，任务整体失败时返还）
  - 检查并发上限（用户级别的同时进行中任务数，不影响任务内部的 3 路并行子任务）
- 前端按钮状态：次数到上限时灰掉按钮 + 显示提示文案（不弹窗）
- Admin 页面用户管理：白名单开关、调整每用户次数/并发上限

## Capabilities

### New Capabilities

- `admin-panel`: 后台管理框架，侧边栏布局，ADMIN 角色保护
- `hero-cms`: Hero 轮播 CMS 化，数据库存储 + Blob 图片管理
- `generation-limits`: 生图权限控制系统（次数/并发/白名单）

### Modified Capabilities

- `backend/database`: Prisma Schema 新增 HeroSlide model + User 三个权限字段
- `integrations/ai-generation`: startAsyncGeneration 新增权限检查拦截
- `frontend/components`: HeroShowcase 从硬编码改为动态数据源；定制页按钮增加限制态

## Impact

- **新文件**：
  - `src/app/admin/layout.tsx` — Admin Shell 侧边栏布局
  - `src/app/admin/page.tsx` — Dashboard 统计概览
  - `src/app/admin/generations/page.tsx` — 生成记录管理
  - `src/app/admin/hero/page.tsx` — Hero 轮播管理
  - `src/app/admin/users/page.tsx` — 用户管理 + 权限配置
  - `src/app/api/admin/` — Admin 专用 API 路由
- **修改文件**：
  - `prisma/schema.prisma` — 新增 HeroSlide model + User 权限字段
  - `src/app/actions/start-generation.ts` — 新增权限检查拦截
  - `src/components/home-themes/HeroShowcase.tsx` — 从 DB 读取轮播数据
  - `src/app/customize/page.tsx` — 生成按钮限制态 UI
  - `src/lib/i18n.ts` — 权限提示文案
- **依赖**：无新 npm 依赖
