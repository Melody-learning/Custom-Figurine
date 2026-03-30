---
trigger: always_on
glob:
description: 定制手办独立站项目核心规则
---

# 定制手办独立站 — 项目规则

## 项目定位
面向海外的定制手办独立站。用户上传2D照片 → AI生成3D风格渲染图 → 确认下单 → 线下3D打印/涂装/发货。
前端 Next.js 自主开发，商品管理和支付结算接入 Shopify，部署在 Vercel。

## 技术栈
- **框架**: Next.js 15 (App Router) + Tailwind CSS v4
- **状态管理**: Zustand（购物车/主题/语言，localStorage 持久化）
- **鉴权**: NextAuth.js v5 (Google OAuth + Email Magic Link via Resend)
- **数据库**: Vercel Postgres (Neon) + Prisma ORM
- **电商**: Shopify GraphQL Storefront API + Admin API
- **存储**: Vercel Blob（用户图片直传）
- **动效**: Framer Motion + CSS Keyframes
- **国际化**: 自定义 i18n (EN/ZH)
- **通知**: Sonner (Toast)，图标: Lucide React

## 协作模式：OpenSpec (SDD) — 强制执行

本项目使用 [OpenSpec](https://github.com/Fission-AI/OpenSpec) Spec-Driven Development。
`openspec/specs/` 是 Source of Truth，`openspec/changes/<name>/` 存放活跃变更。

### 核心铁律
**任何涉及以下范畴的变更，必须先通过 `/opsx-propose` 建立变更提案，获得用户确认后再执行 `/opsx-apply` 写代码。未经提案直接修改源码是被禁止的。**

### 需要走 SDD 的变更（必须先执行 /opsx-propose）
- 新增功能模块（新页面、新 API 端点、新第三方集成、新 npm 依赖）
- 修改核心业务流程（定制流程、结账流程、生成流程）
- 变更数据库 Schema（prisma/schema.prisma）
- 修改鉴权或安全相关逻辑

### 不需要走 SDD 的变更（可直接执行）
- Bug 修复（不改变功能行为的修复）
- 样式微调（颜色、间距、字体大小）
- 文案修改（i18n 文本）
- 开发环境配置（.env、docker-compose）
- 性能优化（不改变接口契约的重构）

### ⚠️ AI 行为指令（每次对话必须遵守）
当用户提出的需求属于「需要走 SDD」的范畴时：
1. **不要直接写代码**，即使用户明确要求"帮我实现"
2. 告知用户：「这个变更需要先建立规范提案」
3. 引导用户执行 `/opsx-propose`，或在用户同意后代为执行
4. 提案中的 tasks.md 确认后，再执行 `/opsx-apply` 逐步实现
5. 完成后执行 `/opsx-archive`，同步更新 `openspec/specs/` 下受影响的规范文档

### 与 Planning Mode 的关系
- OpenSpec 的 proposal.md / design.md / tasks.md **替代** Antigravity 内置的 implementation_plan.md / task.md
- 不要为 SDD 范畴的变更创建 implementation_plan.md，应使用 OpenSpec 工件
- walkthrough.md 仍可在完成后用于总结

## 目录结构
```
├── .agents/rules/        # Antigravity 规则（本文件）
├── .agent/               # OpenSpec skills + workflows
├── openspec/
│   ├── specs/            # Source of Truth（9 个领域规范）
│   │   ├── frontend/     # themes.md, components.md, routing.md
│   │   ├── backend/      # auth.md, database.md
│   │   ├── business/     # checkout-flow.md
│   │   ├── infrastructure/ # deployment.md
│   │   └── integrations/ # shopify.md, ai-generation.md
│   └── changes/          # 变更提案 + archive/
├── prisma/schema.prisma  # 数据库 Schema
├── public/images/        # 静态图片资源
└── src/
    ├── app/
    │   ├── page.tsx             # 首页（多主题入口）
    │   ├── globals.css          # 全局样式 + 主题动效
    │   ├── layout.tsx           # Root Layout
    │   ├── providers.tsx        # Context Providers
    │   ├── customize/page.tsx   # 定制流程中心（核心）
    │   ├── login/               # 登录页
    │   ├── profile/             # 个人中心
    │   ├── actions/             # Server Actions
    │   └── api/
    │       ├── auth/            # NextAuth 路由
    │       ├── checkout/route.ts  # Shopify Draft Order 结账
    │       ├── generate/route.ts  # AI 生图（当前 Mock）
    │       ├── upload/route.ts    # 图片上传
    │       ├── upload-token/      # Blob 直传令牌
    │       ├── assets/            # 资产 CRUD
    │       └── webhooks/          # Shopify Webhooks
    ├── components/
    │   ├── CartSidebar.tsx       # 购物车侧边栏
    │   ├── Header.tsx / Footer.tsx
    │   ├── ai/                  # AI 生图组件
    │   ├── auth/LoginModal.tsx  # 登录弹窗
    │   ├── home-themes/         # 6 套首页主题组件
    │   ├── layout/              # HeaderClient, AnimatedCouponBadge
    │   ├── marketing/           # WelcomeModal, DynamicCouponCard
    │   └── profile/             # GenerationVaultList
    ├── lib/
    │   ├── shopify.ts           # Shopify API 客户端（GraphQL）
    │   ├── store.ts             # Zustand Store
    │   ├── i18n.ts              # 翻译字符串（EN/ZH）
    │   ├── theme.ts             # 主题配置
    │   ├── useTheme.tsx         # 主题 Hook + Provider
    │   ├── useTranslation.tsx   # i18n Hook + Provider
    │   ├── prisma.ts            # Prisma 单例
    │   └── constants/           # 常量
    ├── types/                   # TypeScript 类型
    ├── auth.ts                  # Auth.js 配置入口
    ├── auth.config.ts           # Auth 回调/路由配置
    └── middleware.ts            # 路由保护中间件
```

## 核心架构约定

### Shopify 结账
- Storefront API 读取商品；Admin API (OAuth2 Client Credentials) 创建 Draft Order
- 用户图片上传到 Vercel Blob → URL 作为 `customAttributes` 注入 Draft Order
- 绑定预设 `variantId`（确保结账页显示高转化商品图），定制图走 customAttributes
- 优惠券通过 `checkoutUrl + "?discount=CODE"` 透传
- 详见 `openspec/specs/integrations/shopify.md`

### AI 生图
- 当前 Mock 模式（3秒延迟返回占位图），待接入 Replicate / Stability AI / Gemini
- 流程：前端上传 → `/api/generate` 后端代理 → AI 服务 → Blob 存储 → 返回 URL
- 详见 `openspec/specs/integrations/ai-generation.md`

### 主题系统
- 6 套首页主题：Default, Cyberpunk, Glassmorphism, BentoBox, RetroPopArt, ZenMinimal
- 组件在 `src/components/home-themes/`，配置在 `src/lib/theme.ts`
- 所有主题共享数据模型（文案来自 i18n），严禁硬编码
- 详见 `openspec/specs/frontend/themes.md`

### 鉴权
- Google OAuth + Email Magic Link (Resend)，JWT Session，严禁密码注册
- `/profile` 需登录，`/admin` 需 ADMIN 角色
- 详见 `openspec/specs/backend/auth.md`

## 编码规范
1. TypeScript 严格模式，避免 `any`
2. 样式用 Tailwind CSS v4，主题动效在 `globals.css`
3. 用户可见文案通过 `src/lib/i18n.ts` 管理，禁止硬编码
4. 后端 API 用原生 `fetch`，不用 REST 第三方库
5. 图片上传用 `@vercel/blob/client` 直传（Vercel 4.5MB 限制）
6. 部署仅通过 GitHub → Vercel 自动部署，禁止 CLI 强推
7. 组件微交互规范见 `openspec/specs/frontend/components.md`

## 环境变量（.env.local / Vercel Settings）
| Key | 作用域 | 说明 |
|-----|--------|------|
| `NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN` | 前后端 | Shopify 店铺域名 |
| `NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN` | 前后端 | Storefront API 令牌 |
| `SHOPIFY_ADMIN_API_KEY` | 后端 | Admin API Client ID |
| `SHOPIFY_ADMIN_API_SECRET` | 后端 | Admin API Client Secret |
| `DATABASE_URL` | 后端 | Postgres 连接字符串 |
| `AUTH_SECRET` | 后端 | Auth.js 加密密钥 |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | 后端 | Google OAuth |
| `RESEND_API_KEY` | 后端 | Resend 邮件服务 |
| `BLOB_READ_WRITE_TOKEN` | 后端 | Vercel Blob 存储令牌 |

## 开发命令
```bash
npm run dev          # 开发服务器 http://localhost:3000
npm run build        # 生产构建
npm run start        # 生产服务器
npm run lint         # ESLint
docker-compose up -d # 启动本地 Postgres（重启后需手动执行）
npx prisma db push   # 推送 Schema 变更
```

## 已知问题
- 重启后需先 `docker-compose up -d` 再 `npm run dev`
- Vercel Serverless 有 4.5MB Payload 限制，图片必须客户端直传 Blob
- 腾讯系邮箱会拦截 localhost Magic Link，需右键复制链接
- [Dev Only] ImageLightbox 关闭时退出动画期间 `<img src="">` 触发 Next.js Dev 错误叠层（`intercept-console-error`），线上不影响。修复：在 `ImageLightbox.tsx` 中加 `{src && <img .../>}` 条件渲染
- [Dev Only] 本地 `SHOPIFY_ADMIN_ACCESS_TOKEN` 可能过期（401），导致 checkout 流程失败。线上使用独立凭据不受影响，本地需去 Shopify Admin 后台重新生成 token
