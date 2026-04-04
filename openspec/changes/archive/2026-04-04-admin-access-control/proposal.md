# Admin Access Control

## Why

当前 Admin 后台缺少超管概念，所有 ADMIN 角色用户权限相同，无法管理其他用户的角色。同时前端 Admin 页面在权限失效（如切换账号）后缺乏统一的错误处理，导致 API 403 错误以白屏或组件崩溃的形式暴露给用户。

## What Changes

- 通过环境变量 `SUPER_ADMIN_EMAILS` 定义超管邮箱白名单
- 超管拥有所有 ADMIN 权限 + 用户角色管理权限（提升/降级其他用户为 ADMIN）
- 普通 ADMIN 不可修改任何用户角色
- Admin 前端所有 API 调用统一处理 403 响应：显示 toast 提示并跳转首页
- Admin 用户管理页面增加角色操作按钮（仅超管可见/可用）

## Capabilities

### New Capabilities
- `super-admin-role`: 环境变量驱动的超管身份识别，支持角色管理操作

### Affected Capabilities
- `backend/auth`: 新增超管判定逻辑（环境变量匹配），用户管理 API 增加超管鉴权

## Impact

- `src/middleware.ts`：无变更（已有 ADMIN 守卫）
- `src/app/api/admin/users/[id]/route.ts`：角色变更操作增加超管校验
- `src/app/admin/users/page.tsx`：角色操作 UI 仅超管可见
- `src/app/admin/layout.tsx`：统一 403 错误处理
- `.env.local` / Vercel Settings：新增 `SUPER_ADMIN_EMAILS`
