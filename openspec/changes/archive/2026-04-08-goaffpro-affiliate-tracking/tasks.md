# Tasks: GoAffPro 分销联盟参数追踪

## 1. 前端参数捕获

- [x] 1.1 新建 `src/components/AffiliateTracker.tsx` — 客户端组件，监听 `?ref=` URL 参数，写入 Cookie `gaf_ref`（30 天有效期，Last Click 覆盖）
- [x] 1.2 `src/app/layout.tsx` — 在 `<body>` 内挂载 `<Suspense><AffiliateTracker /></Suspense>`；在 `<head>` 中通过 `next/script` 嵌入 GoAffPro `loader.js`

## 2. Checkout 链路传参

- [x] 2.1 `src/components/CartSidebar.tsx` — `handleCheckout` 中读取 Cookie `gaf_ref`，作为 `affiliateRef` 字段加入 checkout API 请求体
- [x] 2.2 `src/app/api/checkout/route.ts` — `CheckoutRequestBody` 接口增加 `affiliateRef?: string`；传递给 `createCheckout()` 调用
- [x] 2.3 `src/lib/shopify.ts` — `createCheckout()` 增加 `affiliateRef?: string` 参数；当非空时在 Draft Order `customAttributes` 中追加 `{ key: "_goaffpro_ref", value: affiliateRef }`

## 3. Webhook GoAffPro 回调

- [x] 3.1 `src/app/api/webhooks/shopify/route.ts` — 在 `orders/paid` 的 `PENDING → PROCESSING` 转换成功后，通过 `extractAttribute(payload, '_goaffpro_ref')` 提取分销员 ref；若存在则 POST `api.goaffpro.com/order_complete`（non-blocking try-catch）

## 4. 验证

- [x] 4.1 本地访问 `http://localhost:3000/?ref=test123`，检查浏览器 Cookie 中是否存在 `gaf_ref=test123`
- [x] 4.2 执行 Checkout 流程（dev 模式），检查 console 日志中 Draft Order 的 customAttributes 是否包含 `_goaffpro_ref`
- [ ] 4.3 部署到 Vercel staging 后，用分销链接进入 → 完成支付 → 检查 GoAffPro 后台是否记录到该笔推荐订单
