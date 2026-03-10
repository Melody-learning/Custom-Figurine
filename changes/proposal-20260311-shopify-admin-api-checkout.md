# 提议名称：[引入 Shopify Admin API 以支持结账页原生图片显示]

## 1. 背景与意图 (Context & Intent)
- **痛点/需求**: 目前系统使用 Storefront API 创建购物车（Checkout）。由于 Shopify 结算系统的安全封闭性，通过 `customAttributes` 传入的定制图片 URL 被强制渲染为纯文字（即便使用了下划线前缀也只能隐藏，无法让消费者直观看到真正的预览图）。这导致购买者在付款的最后一步缺乏“所见即所得”的安全感，不符合行业标准和期望的购物体验。
- **核心目标**: 彻底重构下单与结账链路，使得消费者在进入 Shopify 结账页面时，能够**完美、原生地下拉看到带有其实际定制图片（包含原图和 AI 生成图）的商品缩略图**。

## 2. 受影响的规范文件 (Impacted Specs)
- [ ] `specs/integrations/shopify.md` (核心：需要修改架构设定，从 Storefront API 过渡到 Server-Side Admin API)
- [ ] `specs/business/checkout-flow.md` (核心：结账生命周期变动)

## 3. 详细改动规格 (Proposed Deltas)

### 针对 `specs/integrations/shopify.md` 的修改：
- `[ADDED]` 引入 **Shopify Admin API**。因 Storefront Token 权限不足以创建后端商品实体，系统需要配置且依赖 `SHOPIFY_ADMIN_ACCESS_TOKEN`（具有 `write_products`, `write_draft_orders` 权限）。
- `[MODIFIED]` 将结账途径从 `Storefront API -> cartCreate` 突变为 `Admin API -> Draft Order Create`。
- `[ADDED]` 订单生成策略：后端收到用户的定制属性与 Cloud Blob 图片 URL 后，通过 Admin API 创建一条全新的草稿订单 (Draft Order)。

### 针对 `specs/business/checkout-flow.md` 的修改：
- `[MODIFIED]` Checkout 生命周期变更为：获取定制属性 -> Vercel Blob 上传图片 -> Next.js Backend 接收图片 URL -> Backend 调 Shopify Admin API 创建带有 `image` 属性（直接绑定图片）的 Custom Line Item 或占位实体 Product -> Backend 生成 Draft Order Invoice URL -> 前端 Redirect。

## 4. 实施 Checklist (Implementation Plan)
- [ ] 1. 提交本 Proposal，用户确认并补充提供后台高权限的 `SHOPIFY_ADMIN_ACCESS_TOKEN`。
- [ ] 2. 依据提议修改 `specs/integrations/shopify.md` 并取得人工同意。
- [ ] 3. 在本地及 Vercel 注入 `SHOPIFY_ADMIN_ACCESS_TOKEN` 环境变量。
- [ ] 4. 重构 `src/app/api/checkout/route.ts` 和 `src/lib/shopify.ts`，彻底改为基于 GraphQL Admin API (或 REST API) 动态创建带有图片的 Draft Order。
- [ ] 5. 人工从浏览器测试端到端完整的 Checkout 流程，验证图片能在最后结账页显示。

---
## 状态区
- [x] 提出中 (Draft)
- [ ] 用户已审查并同意 Specs 修改 (Specs Approved)
- [ ] 代码实施完成待验收 (Implemented)
- [ ] **完成闭环 (Done)**
