# 提议名称：[核心支付基建] 优先打通 Shopify Checkout 与 PayPal 集成

## 1. 背景与意图 (Context & Intent)
- **痛点/需求**: 现阶段我们的应用虽然拥有极佳的视觉主题和前端表现，但缺乏最核心的电商交易转化闭环。用户已经成功申请了 PayPal 企业账户，我们决定以终为始，率先打通从“点击结账”到“真金白银入账”的这条大动脉。
- **核心目标**: 构建将目前的前端应用无缝流转抛转至受 Shopify 托管、支持 PayPal 支付的收银台。确保自定义商品的订单生成流合法合规且能成功流转至 Shopify 的后台订单管理中心。

## 2. 受影响的规范文件 (Impacted Specs)
- [x] `specs/business/checkout-flow.md` (定义 GraphQL 建单时的参数装载逻辑与 Payload 数据结构)
- [x] `specs/integrations/shopify.md` (明确指引用户如何在 Shopify 控制台中开启和获取所需的接口凭据及绑定 PayPal)

## 3. 详细改动规格 (Proposed Deltas)

### 针对 `specs/integrations/shopify.md` 的修改：
- `[ADDED]` 增加对 Shopify Storefront API 权限获取的保姆级人工指导手册。
- `[ADDED]` 增加将 PayPal 企业账户绑定进入 Shopify 的具体设置步骤，以及如何在开发环境测试支付的沙盒建议。

### 针对 `specs/business/checkout-flow.md` 的修改：
- `[MODIFIED]` 充实现有的 Shopify Mutation 服务端结账建单文档，必须显式定义传入 GraphQL `checkoutCreate` 的接口字段（如何将无实体的定制选项塞入 `customAttributes`）。

## 4. 实施 Checklist (Implementation Plan)
- [ ] 1. (目前节点) 更新并让人工 Review 这两份 Specs 中的指导步骤。
- [ ] 2. 协助用户在 Shopify 后台把 API Token 和 PayPal 配置彻底搞定，并把密钥装载到 `.env.local` 中。
- [ ] 3. 编写 `src/lib/shopify.ts` 初始化 GraphQL Client 工具。
- [ ] 4. 编写 `src/app/api/checkout/route.ts` 接口来代理组装请求。
- [ ] 5. 测试前端点击结账，确认无误拦截后进行 `window.location.href = data.checkoutUrl` 的强制重定向！

---
## 状态区
- [x] 提出中 (Draft)
- [ ] 用户已审查并同意 Specs 修改 (Specs Approved)
- [ ] 代码实施完成待验收 (Implemented)
- [ ] **完成闭环 (Done)**
