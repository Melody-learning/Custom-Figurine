## 1. 基础设施

- [x] 1.1 新建 `src/lib/auth-utils.ts`，实现 `isSuperAdmin(email)` 函数（读取 `SUPER_ADMIN_EMAILS` 环境变量）
- [x] 1.2 `.env.local` 新增 `SUPER_ADMIN_EMAILS=chenjing00952846@gmail.com`
- [x] 1.3 新建 `src/lib/admin-fetch.ts`，封装 `adminFetch()` 工具函数（拦截 401/403 → toast + 跳转首页）

## 2. 用户管理 API 超管鉴权

- [x] 2.1 修改 `src/app/api/admin/users/[id]/route.ts` 的 PATCH handler：角色变更操作增加 `isSuperAdmin(session.user.email)` 校验
- [x] 2.2 校验目标用户不是超管自己（防止自我降级）
- [x] 2.3 非超管调用角色变更 → 返回 `{ error: 'Only super administrators can modify user roles' }`（403）

## 3. Admin 前端 403 统一处理

- [x] 3.1 修改 `src/app/admin/hero/page.tsx`：`fetch` → `adminFetch`
- [x] 3.2 修改 `src/app/admin/promo-codes/page.tsx`：`fetch` → `adminFetch`
- [x] 3.3 修改 `src/app/admin/users/page.tsx`（含用户列表页）：`fetch` → `adminFetch`
- [x] 3.4 检查其他 Admin 页面（ai-models, style-presets, generations 等），统一替换

## 4. Admin 用户管理 UI

- [x] 4.1 `/api/admin/users` GET 响应中返回 `callerIsSuperAdmin` 标记
- [x] 4.2 修改 `src/app/admin/users/page.tsx`：超管可见角色操作按钮（Promote / Demote），非超管隐藏
- [x] 4.3 按钮调用 PATCH `/api/admin/users/[id]` 并处理返回结果

## 5. 验收测试

- [x] 5.1 超管账号登录 Admin → 用户管理页可见角色按钮 → 可提升/降级其他用户
- [x] 5.2 普通 ADMIN 登录 Admin → 用户管理页无角色按钮
- [x] 5.3 普通 ADMIN 直接调用角色变更 API → 返回 403
- [x] 5.4 非 ADMIN 用户访问 `/admin` → 跳转首页
- [x] 5.5 Admin 页面 API 返回 403 时 → 显示 toast + 跳转首页

## 6. 额外修复

- [x] 6.1 修复 `middleware.ts` 关键 BUG：named export 覆盖 default export 导致路由保护完全失效
- [x] 6.2 移除 `api/coupon/redeem/route.ts` 调试 console.log
