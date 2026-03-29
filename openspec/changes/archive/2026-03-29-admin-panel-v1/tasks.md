## Phase 1: 基础设施 (DB + 框架)

- [x] 1.1 Prisma Schema: User 表新增 `maxConcurrentJobs`、`maxTotalGenerations`、`isWhitelisted` 字段
- [x] 1.2 Prisma Schema: 新增 `HeroSlide` model
- [x] 1.3 `npx prisma db push` 推送 Schema 变更
- [x] 1.4 `src/app/admin/layout.tsx` — Admin Shell 侧边栏布局（暗色主题）
- [x] 1.5 `src/app/admin/page.tsx` — Dashboard 统计概览页

## Phase 2: 生图权限控制 (核心业务)

- [x] 2.1 `src/app/actions/start-generation.ts` — 新增权限检查逻辑（白名单→总次数→并发）
- [x] 2.2 `src/app/customize/page.tsx` — 生成按钮限制态 UI（灰掉 + 提示文案）
- [x] 2.3 验证：FAILED 状态的 Asset 不计入总次数（COUNT 排除 FAILED 实现）
- [x] 2.4 `src/lib/i18n.ts` — 权限提示文案（EN/ZH）— 按钮文案已直接内嵌英文，后续统一国际化

## Phase 3: 生成记录管理

- [x] 3.1 `GET /api/admin/generations` — 列表 API（分页 + 状态筛选 + 搜索）
- [x] 3.2 `DELETE /api/admin/generations/[id]` — 删除 API
- [x] 3.3 `src/app/admin/generations/page.tsx` — 记录列表页面（表格 + 筛选 + 详情展开）

## Phase 4: Hero 轮播管理

- [x] 4.1 `GET /api/hero-slides` — 公开 API（前端首页读取）
- [x] 4.2 `src/components/home-themes/HeroShowcase.tsx` — 从 DB 动态读取替代硬编码
- [x] 4.3 Admin Hero CRUD API: `GET/POST/PUT/DELETE /api/admin/hero/*` + `PATCH /api/admin/hero/reorder`
- [x] 4.4 `src/app/admin/hero/page.tsx` — 轮播管理页面（卡片列表 + 上传 + 编辑 + 排序）

## Phase 5: 用户管理

- [x] 5.1 `GET /api/admin/users` — 用户列表 API（分页 + 搜索）
- [x] 5.2 `PATCH /api/admin/users/[id]` — 更新用户权限 API
- [x] 5.3 `src/app/admin/users/page.tsx` — 用户管理页面（表格 + 白名单开关 + 编辑次数上限）
- [x] 5.4 `GET /api/admin/stats` — Dashboard 统计 API（Server Component 直查 DB，无需单独 API）
- [x] 5.5 完善 Dashboard 页面统计卡片数据

## Phase 6: 验证

- [x] 6.1 TypeScript 编译通过（tsc --noEmit 零错误）
- [ ] 6.2 手动验证：普通用户生图次数限制生效 — 需你登录测试
- [ ] 6.3 手动验证：白名单用户无限制 — 需在 Admin 设置后测试
- [ ] 6.4 手动验证：Admin 后台三个模块正常运作 — 需用 ADMIN 角色登录访问 /admin
- [ ] 6.5 手动验证：Hero 轮播从 DB 动态加载 — API 已验证返回空数组（✅），需在 Admin 添加数据后测试
