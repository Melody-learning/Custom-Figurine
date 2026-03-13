# 数据库设计与持久化规范 (Postgres / Prisma ORM)

本核心系统全面弃滞弱无依的客户端状态，转而采用工业级的关系型范式来支撑用户沉淀和高价值 AI 数字资产的留存。

## 1. 基础设施 (Infrastructure)
- **数据库引擎**: **Vercel Postgres (Neon)** - Serverless 架构，极低冷启时间，深度吻合 Next.js 的 Edge Network 节点。
- **抽象层**: **Prisma ORM** - 担任 Typescript 的护城河，所有的建表、扩充、关联必须通过 `schema.prisma` 执行 Migration 变更。

## 2. 核心领域实体 (Core Schemas)
实体模型定义着本架构的心智，不可随意添加孤儿表：

### 2.1 用户池落子 (Authentication Realm)
完全依附且兼容于 Auth.js 官方要求的适配层关系模型：
- **`User`** 表: 挂载核心业务 `role` (`USER` / `ADMIN`) 以及诸如 Shopify Customer ID (如有) 的远端联合句柄。
  - **核心资产标记**: `hasWelcomeCoupon`。解决跨端发券被刷的安全重器。当新用户或者营销引流弹窗触发时，我们在数据库锁死改状态，彻底摒弃前端 `localStorage`。
- **`Account` / `Session` / `VerificationToken`**: 用于保障 OAuth / Magic Link 登录流程的安全流转。

### 2.2 定制资产管理 (The Payload Realm)
- **`GeneratedAsset`** 表: 系统的金矿。记录每一次历尽艰辛求出的 AI 渲染成果。
  - 主要字段：`id`, `userId` (关联), `originalImage` (原图 blob url), `resultImage` (完成的 3D 模型风格图), `prompt` (生图暗示词), `baseModelVariantId` (当时套用在哪个白模地基上的校验码)。
  - **重要**: 其带有 `createdAt` 用来做成本对账。

### 2.3 订单留档层 (Order Mirror System)
为摆脱对 Shopify GraphQL 的高频强依赖，我们在独立站数据库建立轻量防腐“订单回声池”。
- **`StoreOrder`** 表:
  - 触发方: 由 Shopify Server 侧的 Webhook (`orders/create` & `orders/fulfilled`) 事件驱动异步静默抓取写库。
  - 核心字段：`shopifyOrderId`, `userId`, `status` (`placed`, `shipped`, `delivered`), `trackingUrl`。
  - **作用**: 让用户一进入我们的 `/profile` (个人中心) 就能无缝刷出他们买的 3D 盲盒手办走到哪了。
