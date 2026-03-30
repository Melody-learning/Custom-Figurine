## MODIFIED Requirements

### Requirement: Webhook writes back to local Order table
Shopify Webhook 处理器 SHALL 改为回写 `Order` 表（替代已删除的 `StoreOrder` 表），通过 `customAttributes` 中的 `localOrderId` 精确匹配本地订单。

支持的事件：
- `orders/create`：匹配 localOrderId → 更新状态为 PROCESSING，写入 shopifyOrderId 和 paidAt
- `orders/fulfilled`：匹配 localOrderId 或 shopifyOrderId → 更新状态为 SHIPPED，写入 trackingNumber、trackingUrl、shippedAt
- `refunds/create`：匹配 shopifyOrderId → 更新状态为 REFUNDED

#### Scenario: Payment webhook updates order
- **WHEN** Shopify 发送 `orders/create` Webhook 且 payload 含 localOrderId
- **THEN** 系统 SHALL 找到对应本地 Order，更新 status → PROCESSING，shopifyOrderId → payload.id，paidAt → now()

#### Scenario: Fulfillment webhook updates order
- **WHEN** Shopify 发送 `orders/fulfilled` Webhook
- **THEN** 系统 SHALL 更新 Order status → SHIPPED，写入 trackingUrl 和 shippedAt

#### Scenario: Webhook without localOrderId
- **WHEN** Webhook payload 的 custom_attributes 中没有 localOrderId
- **THEN** 系统 SHALL 尝试通过 shopifyOrderId 匹配；若仍找不到，记录日志并返回 200（避免 Shopify 重试）

#### Scenario: HMAC verification
- **WHEN** 收到 Webhook 请求
- **THEN** 系统 SHALL 验证 X-Shopify-Hmac-Sha256 头部签名，验证失败返回 401
