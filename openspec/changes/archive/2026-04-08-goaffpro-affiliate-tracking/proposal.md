# GoAffPro 分销联盟参数追踪

## Why

我们的独立站使用 Headless 架构（自建前端 + Shopify Checkout），引入了 GoAffPro 作为分销联盟系统。当前问题是：**用户通过分销员推广链接（`?ref=xxx`）进入前端后，跳转到 Shopify Checkout 时 URL 参数会丢失**，导致 GoAffPro 无法识别该订单属于哪个分销员，佣金无法结算（丢单）。

## What Changes

### 前端参数捕获与缓存
- 新增全局 `<AffiliateTracker />` 客户端组件，监听 URL 中的 `?ref=xxx` 参数
- 捕获后写入浏览器 Cookie（`gaf_ref`，30 天有效期），覆盖旧值（Last Click 归因）

### Checkout 链路传参
- `CartSidebar.tsx` Checkout 时从 Cookie 读取 `gaf_ref`，随 API 请求发送
- `/api/checkout` 接收 `affiliateRef`，注入 Draft Order 的 `customAttributes`（key: `_goaffpro_ref`）

### Webhook 服务端回调
- `/api/webhooks/shopify` 在 `orders/paid` 处理中，从 `note_attributes` 提取 `_goaffpro_ref`
- 调用 GoAffPro Server-Side API（`POST https://api.goaffpro.com/order_complete`）上报订单归属

### GoAffPro loader.js 嵌入
- 在 `layout.tsx` 的 `<head>` 中嵌入 GoAffPro 官方追踪脚本，作为额外保险层

## Affected Specs

- `integrations/shopify.md`: Checkout 流程增加分销参数传递
- `frontend/components.md`: 新增 AffiliateTracker 组件

## Impact

- **无 Schema 变更**：不新增数据库字段（用户确认暂不存本地 DB）
- **API 变更**：`/api/checkout` 接口增加可选 `affiliateRef` 字段
- **Webhook 变更**：`/api/webhooks/shopify` 增加 GoAffPro 回调逻辑
- **前端变更**：新增 AffiliateTracker 组件；CartSidebar 增加 Cookie 读取
- **外部依赖**：GoAffPro Server-Side API（`api.goaffpro.com/order_complete`）
- **新增环境变量**：`NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN_ID`（GoAffPro 的 shop 标识，即 `xxx.myshopify.com`）
