## ADDED Requirements

### Requirement: Checkout API creates local order first
`POST /api/checkout` SHALL 在调用 Shopify Admin API 之前先在本地数据库创建 Order (PENDING) 和 OrderItems。

流程：
1. 验证用户 session（必须登录）
2. 生成订单号 CF-YYYYMMDD-XXXXXX
3. 计算金额（subtotal、discount、total）
4. 创建 Order (PENDING) + OrderItems（快照商品信息）
5. 调用 Shopify Admin API 创建 Draft Order
6. 在 Draft Order 的 customAttributes 中注入 `{key: "localOrderId", value: order.id}`
7. 回写 shopifyDraftOrderId 和 invoiceUrl 到本地 Order
8. 返回 `{ url: invoiceUrl, orderId: order.id }`

#### Scenario: Successful checkout with Shopify
- **WHEN** 已登录用户提交非空购物车到 `/api/checkout`
- **THEN** 系统 SHALL 创建本地 Order (PENDING)，创建 Shopify Draft Order，返回 invoiceUrl

#### Scenario: Checkout requires authentication
- **WHEN** 未登录用户尝试结账
- **THEN** 系统 SHALL 返回 401 错误

#### Scenario: Shopify fails in development
- **WHEN** Shopify Admin API 调用失败且 NODE_ENV === 'development'
- **THEN** 系统 SHALL 仍保留本地 Order (PENDING)，返回模拟支付页面 URL `/dev/simulate-payment?orderId=xxx`

#### Scenario: Shopify fails in production
- **WHEN** Shopify Admin API 调用失败且 NODE_ENV === 'production'
- **THEN** 系统 SHALL 将本地 Order 标记为 CANCELLED，返回 500 错误

### Requirement: Order list API
`GET /api/orders` SHALL 返回当前登录用户的订单列表，按 createdAt 降序排列。

响应格式：
```json
{
  "orders": [
    {
      "id": "...",
      "orderNumber": "CF-20260330-K8A3F2",
      "status": "PROCESSING",
      "totalAmount": 49.99,
      "currency": "USD",
      "itemCount": 2,
      "previewImageUrl": "...",
      "createdAt": "...",
      "paidAt": "..."
    }
  ]
}
```

#### Scenario: List user orders
- **WHEN** 已登录用户请求 `GET /api/orders`
- **THEN** 系统 SHALL 返回该用户所有订单的摘要列表

#### Scenario: Unauthenticated request
- **WHEN** 未登录用户请求 `GET /api/orders`
- **THEN** 系统 SHALL 返回 401

### Requirement: Order detail API
`GET /api/orders/[id]` SHALL 返回指定订单的完整详情，包含 OrderItems。

响应 SHALL 包含：订单主信息、状态时间线（createdAt, paidAt, shippedAt, deliveredAt）、所有 OrderItem（含图片 URL）、物流追踪信息。

#### Scenario: Get order detail
- **WHEN** 已登录用户请求 `GET /api/orders/[id]`，该订单属于该用户
- **THEN** 系统 SHALL 返回完整订单详情，包含所有 OrderItems

#### Scenario: Access other user's order
- **WHEN** 已登录用户请求 `GET /api/orders/[id]`，该订单不属于该用户
- **THEN** 系统 SHALL 返回 404（不泄露订单存在性）

#### Scenario: Order not found
- **WHEN** 请求不存在的订单 ID
- **THEN** 系统 SHALL 返回 404

### Requirement: Cancel order API
`POST /api/orders/[id]/cancel` SHALL 允许用户取消 PENDING 状态的订单。

#### Scenario: Cancel pending order
- **WHEN** 已登录用户取消一个 PENDING 状态的自有订单
- **THEN** 系统 SHALL 将订单状态更新为 CANCELLED

#### Scenario: Cancel non-pending order
- **WHEN** 用户尝试取消一个非 PENDING 状态的订单
- **THEN** 系统 SHALL 返回 400 错误，提示订单无法取消
