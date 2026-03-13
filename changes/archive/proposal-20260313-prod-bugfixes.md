# 提议：修复线上遗留 Bug 与全局错误监控引入

**日期**: 2026-03-13
**状态**: [草稿]
**目标**: 修复线上环境退出的重定向路径，解决魔术链接遇到服务端异常时“静默失败”不跳转的问题，并引入全局的前端错误监控（类本地开发环境体验）。

## 1. 变更意图与背景
基于线上实测暴露的 3 个体验断点：
1. **退出重定向**: 目前 `signOut` 默认配置为踢回首页 (`/`)，根据您的需求，需要修改为重定向至 `/login` 页。
2. **邮箱魔术链接无反馈**: NextAuth 的 `signIn("resend")` 如果在线上遇到配置问题（如 `RESEND_API_KEY` 未配置或 DB 连接失败），会抛出 `AuthError`，导致 Next.js Server Action 产生 500 异常，从而中断了跳转（不跳转至 verify-request）。我们需要在前端提供捕获与反馈。
3. **左下角报错小组件**: 本地开发时 Next.js 自带强大的 Error Overlay（左下角/右下角弹出的报错提示）。在线上生产环境 (Production) 我们无法直接开启原生的开发组件，但我们可以通过引入极其现代化的吐司组件 **Sonner** 结合全局错误捕获 (Error Boundary 和 Server Action try-catch) 来完美平替这个体验，一旦任何接口或注册报错，会在左下角弹出与本地类似的精美错误栈小组件！

## 2. 预计变更点

### 2.1 修复退出登录重定向路径
- **文件**: `src/app/actions/auth.ts`
- **变更**: 修改 `logoutUser` 函数中的 `redirectTo: "/"` 为 `redirectTo: "/login"`。

### 2.2 引入全局报错左下角小组件 (Sonner)
- **指令**: `npm install sonner`
- **文件**: `src/app/layout.tsx` 
- **变更**: 在 `<body>` 根节点注入 `<Toaster position="bottom-left" />`（完全复刻本地报错所在的位置），配置为 Rich Colors 模式，使得所有线上未捕获的错误都能以精美的暗色卡片在左下角弹出。

### 2.3 修复登录异常静默失败 (Error Handling)
- **文件**: `src/app/login/page.tsx` 与 `src/app/actions/auth.ts`
- **变更**: 
    - 使用 `try/catch` 包裹 `signIn`。
    - 在抛出错误时，返回友好的错误信息而不是直接 500。
    - 登录按钮在点击后呈现 Loading 态。
    - 遇到错误调用刚刚引入的 `toast.error()` 在左下角呈现。

## 3. 影响的 Specs 规范
- **`specs/frontend/components.md`**: 将新增对全局 Message Toast / Error Overlay 的交互标准说明。

## 4. 后续落地步骤
1. 您审核并批准此 Proposal（回复 LGTM 或同意）。
2. 我将在规范中增加全局报错模块设计，并开始安装 `sonner`。
3. 完成重定向修改与报错 UI 的注入落地。
4. 验证并归档。
