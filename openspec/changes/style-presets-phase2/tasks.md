# Tasks: Style Presets Phase 2

## 1. Database Schema

- [x] 1.1 在 `prisma/schema.prisma` 添加 `StyleCategory` model（含 slug/displayName/isOrderable/accentColor/icon/sortOrder/isActive）
- [x] 1.2 在 `prisma/schema.prisma` 添加 `StylePreset` model（含 slug/primaryPrompt/previewImageUrl/aiModelId FK/sortOrder/isActive）
- [x] 1.3 为 `AiModel` 添加反向关联 `stylePresets StylePreset[]`
- [x] 1.4 运行 `npx prisma db push` 推送 Schema 变更到本地/线上 DB
- [x] 1.5 编写 `prisma/seed.ts`（或追加到已有 seed 文件），将 `STYLE_CATEGORIES` 静态数据 upsert 到 DB（以 slug 为 upsert key，幂等）

## 2. Admin API 路由

- [x] 2.1 `GET/POST /api/admin/style-categories/route.ts`：列表查询（含子类）+ 新建大类
- [x] 2.2 `PATCH/DELETE /api/admin/style-categories/[id]/route.ts`：更新大类字段 + 删除大类
- [x] 2.3 `POST /api/admin/style-presets/route.ts`：新建子类
- [x] 2.4 `PATCH/DELETE /api/admin/style-presets/[id]/route.ts`：更新子类（含提示词/模型绑定/图片URL）+ 删除子类
- [x] 2.5 所有 Admin API 路由加 ADMIN 角色鉴权守卫（参考现有 `/api/admin/ai-models/route.ts` 模式）

## 3. 前台 API 路由

- [x] 3.1 `GET /api/style-presets/route.ts`：返回 isActive 的大类+子类数组（按 sortOrder），DB 为空返回 `[]`

## 4. 前端数据接入（Customize 页）

- [x] 4.1 `customize/page.tsx` 将 `STYLE_CATEGORIES` 从 static import 改为 `useState` + `useEffect` fetch `/api/style-presets`
- [x] 4.2 fetch 期间用 skeleton 占位（4 个灰色卡片），与上传区 loading 风格一致
- [x] 4.3 fetch 失败或返回空时，fallback 到 `STYLE_CATEGORIES` 静态常量（无 toast 提示，静默降级）
- [x] 4.4 确保大类数据的 `slug` 字段被映射为消费侧使用的 `id` 字段，不改下游渲染逻辑

## 5. Admin 后台 UI

- [x] 5.1 新建 `src/app/admin/styles/page.tsx`：大类列表页（Server Component，初始数据 SSR）
- [x] 5.2 实现 `StyleCategoryRow`：展示大类名称/accentColor/icon/isOrderable/子类数量，支持展开/折叠子类
- [x] 5.3 实现 `StylePresetRow`：展示子类名/提示词摘要（前100字）/绑定模型/示意图缩略图
- [x] 5.4 实现 `StylePresetEditModal`（Client Component，抽屉/模态框）：  
      - 名称 input  
      - primaryPrompt textarea（自动增高）  
      - AI 模型下拉（fetch `/api/admin/ai-models`）  
      - 示意图上传（调用 `/api/upload-token` Blob 直传，preview URL 显示）  
      - 保存（PATCH）/ 取消
- [x] 5.5 实现新建大类表单（inline 或简单 Modal）：slug/displayName/accentColor/icon/isOrderable 字段
- [x] 5.6 实现子类排序调整（上移/下移按钮更新 sortOrder），调用 PATCH API
- [x] 5.7 在 `src/app/admin/layout.tsx` 侧边栏添加「Styles」导航项，链接到 `/admin/styles`

## 6. 验证与收尾

- [x] 6.1 运行 `npx prisma db seed` 验证 seed 数据正确写入 DB
- [x] 6.2 浏览器访问 `/admin/styles`，验证大类列表加载、编辑提示词、保存功能
- [x] 6.3 访问 `/customize`，验证风格卡片从 DB 加载（可在 Admin 改提示词后验证生效）
- [x] 6.4 关闭本地 DB（或临时让 API 返回空），验证 Customize 页静默降级到静态常量
- [x] 6.5 运行 `npx tsc --noEmit` 确认零 TS 错误
