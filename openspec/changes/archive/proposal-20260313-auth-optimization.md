# 提议：优化登录注册体验与集成 Resend

**日期**: 2026-03-13
**状态**: [已完成]
**目标**: 提升登录页面的视觉微交互体验，并将邮件发送服务迁移至/集成 Resend 以提高到达率和开发者体验。

## 1. 变更意图与背景
当前系统登录页面的 Google 授权登录按钮缺乏足够的微交互（动效反馈），无法提供优质的用户体验。
此外，系统目前尚未完全实现基于 Resend 的邮件发送注册功能（可能是用 nodemailer 或未完善），需要引入 `resend` 官方 SDK 以保证注册/Magic Link 邮件的稳定投递。

## 2. 预计变更点

### 2.1 UI/UX 微交互 (Frontend)
- **文件**: `src/app/login/page.tsx`
- **变更**: 针对 Google 登录按钮增加 hover、active 等状态下的平滑过渡、可能的涟漪效果、或者图标缩放、边框流光等高阶 CSS 微交互效果，配合 Tailwind CSS 完成。

### 2.2 邮件服务集成 (Backend/Auth)
- **依赖**: 引入 `resend` 包 (`npm install resend`)
- **文件**: `src/app/actions/auth.ts` 或 `src/auth.ts`（取决于当前的 Magic Link 实现位置）
- **变更**: 将发送 Magic Link 邮件的具体实现替换为使用 `resend.emails.send(...)`。需要增加相关的环境变量配置（如 `RESEND_API_KEY`）。

### 2.3 自定义魔术链接提示页 (Verify Request UI)
- **目标**: 覆写 Auth.js (NextAuth) 默认简陋的 `verify-request` 页面，提供一个美观的中间引导页。
- **文件**: `src/auth.config.ts` 以及 `src/app/login/verify-request/page.tsx`（或相似路由）。
- **变更**: 在 `pages` 配置对象中新增 `verifyRequest: '/login/verify-request'`，并重新编写具备动态光晕等全站级 Glassmorphism 审美的界面。引导用户前往邮箱查收邮件，并提供返回入口。

## 3. 影响的 Specs 规范
- **`specs/frontend/components.md`**: 补充关于第三方登录按钮的微交互设计标准以及新的验证过度页组件规范。
- **`specs/frontend/routing.md`**: 记录新的 `verifyRequest` 静态路由策略。
- **`specs/backend/auth.md`**: 记录使用 Resend 作为邮件 Provider，以及明确接管默认中间路由的行为。

## 4. 后续落地步骤
1. 用户审核并批准此 Proposal（针对第二阶段：Verify Request UI）。
2. 我将更新相关的规范文件并生成 Implementation Plan。
3. 执行相关路由编写及精美页面的编写修改。
4. 本台验证并在终端归档。
