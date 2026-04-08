# Delta Spec: GoAffPro 分销追踪集成

> 变更来源: `goaffpro-affiliate-tracking`
> 基础规范: `integrations/shopify.md`

## 变更摘要

Checkout 流程增加分销员推荐参数（`affiliateRef`）的传递，通过 Draft Order `customAttributes` 注入，并在支付成功后通过 Server-Side API 回调 GoAffPro。

## 新增行为

### Checkout API (`/api/checkout`)

- 请求体新增可选字段 `affiliateRef?: string`
- 当 `affiliateRef` 非空时，传递给 `createCheckout()` 函数

### `createCheckout()` 函数

- 新增可选参数 `affiliateRef?: string`
- 当传入时，在 Draft Order 的 `customAttributes` 中追加：
  ```json
  { "key": "_goaffpro_ref", "value": "<affiliateRef>" }
  ```

### Shopify Webhook (`/api/webhooks/shopify`)

- 在 `orders/paid` → `PENDING → PROCESSING` 状态转换成功后
- 从 payload 的 `note_attributes` 中提取 `_goaffpro_ref`
- 若存在，POST 到 `https://api.goaffpro.com/order_complete`：
  ```json
  {
    "ref": "<affiliateRef>",
    "shop": "<NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN>",
    "order_id": "<shopifyOrderId>"
  }
  ```
- 回调失败不阻塞订单处理（try-catch, non-blocking）

### GoAffPro loader.js

- 在 Root Layout 的 `<head>` 中嵌入：
  ```html
  <Script src="https://api.goaffpro.com/loader.js?shop=<STORE_DOMAIN>" strategy="afterInteractive" />
  ```

## 不变行为

- 现有的 `customAttributes`（`localOrderId`、`userId`、定制图片等）完全不受影响
- 优惠券逻辑不变
- Draft Order 的 `appliedDiscount` 逻辑不变
