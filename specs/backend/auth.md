# 用户鉴权系统规范 (Authentication Specifications)

本规范定义了 Next.js 定制站点的全域身份验证策略，主要基于 **NextAuth.js (Auth.js v5)** 构建。

## 1. 核心诉求与业务意义
- 破除当前“阅后即焚”的匿名访客体验。
- 使生成的高昂 AI 资产图片能被固化并长期属于某个实体账户，从而培养复购黏性。
- 提供独立于 Shopify（纯外挂支付）的，带有丰富用户自主权的本站个人中心体系。

## 2. 鉴权渠道 (Providers)
- **Primary: Google OAuth** 
  - 无密码、转化率极高。
  - 需要在 Google Cloud Console 开通 API，配置 `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET`。
- **Secondary: Email / Magic-Link (Resend)**
  - 用于兜底不使用 Google 的客群。[MODIFIED] 统一采用官方 `resend` SDK 来代替 Nodemailer，以确保更高的邮件送达率和更简化的 API 调用体验。需要配置 `RESEND_API_KEY`。
  - 为了保护电商转化漏斗，**严禁使用密码注册体系**。邮箱登录仅发送一次性 OTP/魔术链接。

## 3. Session 与会话策略 (Session Strategy)
- 采用 **JWT (JSON Web Token)** 策略。
- 此策略能在 Vercel Edge Runtime (乃至中间件拦截器) 中极速解签，零冷启动延迟，无需每次路由切换请求中心数据库。

## 4. 路由防御中间件及系统重定向 (Route Protection & Redirects)
由 `middleware.ts` / `auth.config.ts` 强力接管，以下路由矩阵受到读写拦截和改写：
- `[Match] /profile/*` -> 强制重定向至 `/login`（若未验证）
- `[Match] /admin/*` -> 强制比对 Session Token 中的 Role 字段。仅当 `Role === 'ADMIN'` 放行。
- `[Match] /api/user/*` -> 非法者返回 `401 Unauthorized`。
- `[Match] /api/auth/verify-request` -> [ADDED] NextAuth 预设中转，将被 `auth.config.ts` 强行覆盖重定向至我们自定义的 `/login/verify-request`，从而隐藏难看的默认全黑提示。

## 5. UI/UX 体验断点
- **未登录态的生图拦截**：在 `/customize` 页面中，用户**必须**在点击“生成 AI 效果”按钮前被弹窗拦截要求登录。因为 AI 生成成本高昂，不应提供无限次的匿名白嫖额度。
