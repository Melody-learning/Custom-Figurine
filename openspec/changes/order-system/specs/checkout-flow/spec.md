## MODIFIED Requirements

### Requirement: Checkout creates local order before Shopify
结账流程 SHALL 从 fire-and-forget 模式改为先本地建单再推 Shopify。

改造前：购物车 → Shopify Draft Order → 跳转 invoiceUrl
改造后：购物车 → 本地 Order (PENDING) → Shopify Draft Order → 回写信息 → 跳转 invoiceUrl

Draft Order 的 `customAttributes` SHALL 注入 `{key: "localOrderId", value: order.id}` 替代原来的 `{key: "userId", value: userId}`，以便 Webhook 精确关联订单。

#### Scenario: Checkout flow with local order
- **WHEN** 用户点击 "Proceed to Checkout"
- **THEN** 系统 SHALL 先在本地 DB 创建 Order + OrderItems (PENDING)，再创建 Shopify Draft Order，最后返回 invoiceUrl 跳转

#### Scenario: Discount code preserved
- **WHEN** 用户有优惠券且发起结账
- **THEN** 系统 SHALL 将 discountCode 和 discountAmount 记录到本地 Order，并在跳转 URL 中追加 `?discount=CODE`
