## Context

当前 Admin 后台使用 `Role` enum（`USER` / `ADMIN`）控制访问。Middleware 保护 `/admin/*` 页面路由，API 路由通过每个 handler 单独检查 `role === 'ADMIN'`。没有超管概念，角色变更需要直接操作数据库。

## Goals / Non-Goals

**Goals:**
- 通过环境变量识别超管身份，超管可通过 Admin UI 管理其他用户角色
- Admin 前端统一处理 403 错误（toast + 跳转首页）
- 不修改数据库 Schema（保持 `USER` / `ADMIN` 两种角色）

**Non-Goals:**
- 不引入细粒度权限系统（RBAC / 模块级权限）
- 不引入 `SUPER_ADMIN` enum 值（纯环境变量驱动）
- 不实现 session 变化实时检测（依赖 API 调用时的 403 自然触发）

## Decisions

### 1. 超管识别方式：环境变量

```
SUPER_ADMIN_EMAILS=chenjing00952846@gmail.com
```

新增 `src/lib/auth-utils.ts`：

```typescript
export function isSuperAdmin(email?: string | null): boolean {
  if (!email) return false;
  const superAdmins = (process.env.SUPER_ADMIN_EMAILS || '')
    .split(',')
    .map(e => e.trim().toLowerCase());
  return superAdmins.includes(email.toLowerCase());
}
```

### 2. 用户管理 API 鉴权

`/api/admin/users/[id]` 的 PATCH（角色变更）增加超管校验：

```
用户请求角色变更
  → 检查 session.role === ADMIN ✅
  → 检查 session.email 在 SUPER_ADMIN_EMAILS ✅
  → 检查目标用户不是超管自己 ✅
  → 执行变更
```

普通 ADMIN 调用角色变更 API → 返回 403。

### 3. Admin 前端 403 统一处理

在 `src/app/admin/layout.tsx` 中封装一个 `AdminFetchProvider`，提供包装过的 `fetch` 函数：
- 拦截所有 `/api/admin/*` 响应
- 遇到 401/403 → `toast.error('Session expired or access denied')` → `router.push('/')`

或者更简单：每个 Admin 页面的 fetch 调用统一走一个 helper：

```typescript
// src/lib/admin-fetch.ts
export async function adminFetch(url: string, options?: RequestInit) {
  const res = await fetch(url, options);
  if (res.status === 401 || res.status === 403) {
    toast.error('Access denied. Redirecting...');
    window.location.href = '/';
    throw new Error('Unauthorized');
  }
  return res;
}
```

各 Admin 页面把 `fetch` 换成 `adminFetch`。

### 4. Admin 用户管理页面

现有 `/admin/users` 页面已存在。修改：
- 超管可见「Promote to Admin」/「Demote to User」按钮
- 非超管看不到角色操作按钮（前端隐藏 + 后端校验双重保护）
- 超管不可降级自己

## Risks / Trade-offs

| 风险 | 缓解 |
|------|------|
| 环境变量泄露 → 超管身份暴露 | 仅服务端读取，不暴露给前端 |
| 多超管场景 | 逗号分隔支持多邮箱 |
| 超管邮箱更换 | 修改环境变量 + 重启即可 |
| `adminFetch` 侵入性 | 只影响 Admin 页面，不影响用户侧 |
