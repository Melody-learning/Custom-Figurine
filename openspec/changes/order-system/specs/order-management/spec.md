## ADDED Requirements

### Requirement: Order data model
系统 SHALL 维护 `Order` 表作为订单主表，包含以下字段：
- `id` (cuid, 主键)
- `orderNumber` (唯一，人类友好编号，格式 `CF-YYYYMMDD-XXXXXX`)
- `userId` (关联 User)
- `status` (OrderStatus 枚举)
- `shopifyDraftOrderId` (可空，Shopify Draft Order GID)
- `shopifyOrderId` (可空，Shopify 正式订单 ID，支付后才有)
- `invoiceUrl` (可空，Shopify 结账 URL)
- `subtotalAmount` (Float, 商品小计)
- `discountCode` (可空，优惠券代码)
- `discountAmount` (Float, 默认 0)
- `totalAmount` (Float, 最终总价)
- `currency` (String, 默认 "USD")
- `trackingNumber` (可空)
- `trackingUrl` (可空)
- `shippedAt` / `deliveredAt` / `paidAt` / `cancelledAt` (可空时间戳)
- `createdAt` / `updatedAt`

#### Scenario: Order created at checkout
- **WHEN** 用户从购物车发起结账
- **THEN** 系统创建一条 Order 记录，status 为 PENDING，包含金额快照和 Shopify Draft Order 信息

#### Scenario: Order number uniqueness
- **WHEN** 系统生成订单号 CF-YYYYMMDD-XXXXXX
- **THEN** orderNumber 字段有唯一约束，生成碰撞时 SHALL 自动重试

### Requirement: OrderItem data model
系统 SHALL 维护 `OrderItem` 表作为订单明细，包含以下字段：
- `id` (cuid, 主键)
- `orderId` (关联 Order)
- `variantId` (Shopify variant GID)
- `title` (商品名称快照)
- `price` (Float, 下单时单价)
- `quantity` (Int)
- `size` (可空，如 "6cm" / "8cm" / "10cm" / "15cm")
- `originalImageUrl` (可空，用户原图 Blob URL)
- `generatedImageUrl` (可空，AI 生成图 Blob URL)
- `generatedAssetId` (可空，关联 GeneratedAsset)
- `customInstructions` (可空，用户备注)
- `createdAt`

#### Scenario: OrderItem snapshots product info
- **WHEN** 订单创建时
- **THEN** OrderItem SHALL 快照当时的商品标题、价格、图片 URL，不依赖运行时 Shopify 查询

#### Scenario: OrderItem links to GeneratedAsset
- **WHEN** 用户从 Generation Vault 选择已有资产下单
- **THEN** OrderItem 的 generatedAssetId SHALL 关联到对应的 GeneratedAsset 记录

### Requirement: Order status state machine
系统 SHALL 实现以下订单状态枚举和合法状态转换：

状态枚举：`PENDING` | `PROCESSING` | `SHIPPED` | `DELIVERED` | `CANCELLED` | `REFUNDED`

合法转换：
- PENDING → PROCESSING（Shopify Webhook 确认支付成功）
- PENDING → CANCELLED（用户取消未支付订单）
- PROCESSING → SHIPPED（Shopify Admin 标记 fulfilled，Webhook 回写）
- PROCESSING → REFUNDED（退款）
- SHIPPED → DELIVERED（物流确认签收，可选）

#### Scenario: Payment triggers PROCESSING
- **WHEN** Shopify Webhook 报告支付成功 (orders/create)
- **THEN** 订单状态 SHALL 从 PENDING 更新为 PROCESSING，paidAt 设为当前时间

#### Scenario: Fulfillment triggers SHIPPED
- **WHEN** Shopify Webhook 报告订单发货 (orders/fulfilled)
- **THEN** 订单状态 SHALL 从 PROCESSING 更新为 SHIPPED，shippedAt 设为当前时间，trackingNumber 和 trackingUrl 更新

#### Scenario: Cancel pending order
- **WHEN** 用户取消一个 PENDING 状态的订单
- **THEN** 订单状态 SHALL 更新为 CANCELLED，cancelledAt 设为当前时间

#### Scenario: Invalid state transition rejected
- **WHEN** 尝试一个非法的状态转换（如 SHIPPED → PENDING）
- **THEN** 系统 SHALL 拒绝该操作并返回错误

### Requirement: Order number generation
系统 SHALL 生成格式为 `CF-YYYYMMDD-XXXXXX` 的订单号，其中：
- `CF` 为固定前缀（Custom Figurine）
- `YYYYMMDD` 为 UTC 日期
- `XXXXXX` 为 6 位大写字母和数字的随机码

#### Scenario: Order number contains date
- **WHEN** 2026年3月30日创建订单
- **THEN** 订单号 SHALL 以 `CF-20260330-` 开头

#### Scenario: Order number is human readable
- **WHEN** 订单号生成完毕
- **THEN** 订单号 SHALL 仅包含大写字母 A-Z 和数字 0-9（随机码部分），便于口头/邮件传达
