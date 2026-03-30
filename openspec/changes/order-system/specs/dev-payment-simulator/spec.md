## ADDED Requirements

### Requirement: Simulate payment page
系统 SHALL 在开发环境提供 `/dev/simulate-payment` 页面，用于在 Shopify 不可用时模拟支付流程。

页面 SHALL 展示：
- 订单号和总金额
- "Simulate Payment Success" 按钮 → 触发 PENDING → PROCESSING
- "Simulate Payment Failure" 按钮 → 保持 PENDING
- "Simulate Refund" 按钮 → 触发 → REFUNDED（仅 PROCESSING 状态可用）
- "Simulate Fulfillment" 按钮 → 触发 PROCESSING → SHIPPED

#### Scenario: Simulate successful payment
- **WHEN** 用户在模拟页面点击"Simulate Payment Success"
- **THEN** 系统 SHALL 将订单状态从 PENDING 更新为 PROCESSING，paidAt 设为当前时间，并展示成功反馈

#### Scenario: Simulate fulfillment
- **WHEN** 用户在模拟页面点击"Simulate Fulfillment"且订单为 PROCESSING 状态
- **THEN** 系统 SHALL 将订单状态更新为 SHIPPED，shippedAt 设为当前时间

### Requirement: Simulate webhook API endpoint
系统 SHALL 提供 `POST /api/dev/simulate-webhook` 端点，执行与真实 Webhook 相同的订单状态更新逻辑。

请求格式：
```json
{
  "orderId": "local-order-id",
  "event": "payment_success" | "payment_failure" | "fulfilled" | "refunded",
  "trackingNumber": "optional",
  "trackingUrl": "optional"
}
```

#### Scenario: Production environment blocked
- **WHEN** 在 NODE_ENV !== 'development' 环境调用此端点
- **THEN** 系统 SHALL 返回 403 Forbidden

#### Scenario: Valid simulate request
- **WHEN** 在开发环境发送合法的模拟请求
- **THEN** 系统 SHALL 执行对应的状态转换，返回更新后的订单信息
