# 提议名称：[Epic 2 - 用户账户与核心订单体系架构设计]

## 1. 背景与意图 (Context & Intent)
- **痛点/需求**: 目前的 AI 生成和加购流程都是基于匿名 Session 甚至纯前端 LocalStorage 的。一旦用户清理浏览器痕迹或更换设备，心仪的 AI 渲染作品和历史记录就会丢失。
- **核心目标**: 引入标准的身份验证体系（Authentication）和持久化业务数据库（Database），为每位顾客颁发并绑定专属的 `userId`。同时实现与 Shopify 的订单数据桥接，让用户无须跳回 Shopify 即可在独立站内纵览物流轨迹与订单动态。

## 2. 架构选型 (Technical Decisions)
为了紧密配合现有的 Next.js 14 App Router 与 Vercel 基础设施，建议选用以下成熟栈：
- **鉴权系统 (Auth)**: 采用 **NextAuth.js (Auth.js v5)**。它能在 Vercel 边缘网络极速运行，安全且易扩展。
  - **登录渠道**: 首期集成 **Google OAuth** (出海最顺滑转化) 和 **Email (Magic Link / OTP)** (防止密码泄露风险)。
- **持久化数据库 (DB)**: 采用 **Vercel Postgres**。搭配 **Prisma** 担当 ORM，享受极致的 TypeScript 类型安全。
  - **存储核心**: 记录 `Users`, `Sessions`, `GeneratedAssets` (存储生图历史链接和其对应选用的底模)。
- **订单同步策略 (Shopify Sync)**: 利用 Shopify Webhooks 处理订阅机制（涵盖 `orders/create`, `orders/fulfilled` 等事件）。Webhook 将数据推给我们的 `/api/webhooks/shopify`，经过 HMAC 验签后写入自己的 Postgres DB 附着于对应的用户之上。

## 3. 受影响的规范文件 (Impacted Specs)
- `[NEW]` 提议新建 `specs/backend/auth.md` —— 定义鉴权策略与 Session 流转规范。
- `[NEW]` 提议新建 `specs/backend/database.md` —— 定义实体关系 (ER Schema) 以及数据安全设计。
- `[MODIFIED]` 修订 `specs/frontend/routing.md` —— 增设受保护路由中间件拦截，以及落位 `/profile` 独立面板路由。

## 4. 实施阶段拆分 (Implementation Phases)
- **Phase 1: 基础设施落成** : 安装 `next-auth`, `prisma`。配置好本地及远端 Vercel 环节的 Postgres 密码等 `.env`。
- **Phase 2: 服务端 Auth 对接** : 打通 Google API Console 和 Nodemailer / Resend 邮件分发接口进行注册登录逻辑。
- **Phase 3: 数据库 Schema 起锚** : 执行 Prisma Migrate 完成 `Users`, `GeneratedAssets` 表格构建，替换目前的纯内存持久化。
- **Phase 4: 前端个人中心呈现** : 构建 `/profile` 仪表盘，展示昔日“得意之作”以及管理地址薄。
- **Phase 5: 订单桥接与防腐层** : 订阅 Shopify 订单与物流轨迹流转态，抹平数据格式，安全推至个人中心面板。

---
## 状态区
- [x] 提出中 (Draft)
- [ ] 等待用户审查并批复 Proposal (Pending User Approval)
- [ ] 修改并合入规范 Specs (Specs Updated)
- [ ] 物理代码实施完成 (Implemented)
- [ ] 完成闭环 (Done)
