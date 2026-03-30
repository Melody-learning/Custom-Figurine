## ADDED Requirements

### Requirement: Order list in Profile page
Profile 页面 SHALL 展示用户的订单列表，替换现有的 StoreOrder 简陋展示。

每张订单卡片 SHALL 展示：
- 订单号（CF-XXXXXXXX-XXXXXX）
- 订单状态（彩色标签：PENDING=黄色, PROCESSING=蓝色, SHIPPED=紫色, DELIVERED=绿色, CANCELLED=灰色, REFUNDED=红色）
- 商品预览图（取第一个 OrderItem 的 generatedImageUrl 或 originalImageUrl）
- 总金额
- 创建时间
- 可点击进入详情页

#### Scenario: Display order list
- **WHEN** 用户访问 Profile 页面
- **THEN** 系统 SHALL 展示按创建时间降序排列的订单列表

#### Scenario: Empty order list
- **WHEN** 用户没有任何订单
- **THEN** 系统 SHALL 展示空状态提示（"No orders yet" + 引导创建定制手办的 CTA）

#### Scenario: Click order card
- **WHEN** 用户点击某个订单卡片
- **THEN** 系统 SHALL 导航到该订单的详情页 `/profile/orders/[id]`

### Requirement: Order detail page
系统 SHALL 提供订单详情页 `/profile/orders/[id]`，展示完整订单信息。

#### Scenario: Status timeline display
- **WHEN** 用户查看订单详情
- **THEN** 页面 SHALL 展示状态时间线，标记已完成的阶段（含具体时间）和未完成的阶段

#### Scenario: Order items display
- **WHEN** 用户查看订单详情
- **THEN** 页面 SHALL 展示所有 OrderItem，每项包含：
  - AI 生成图（可点击查看大图）
  - 用户原图（可点击查看大图）
  - 商品名称、尺寸、数量、单价
  - 定制备注（如有）

#### Scenario: Order summary display
- **WHEN** 用户查看订单详情
- **THEN** 页面 SHALL 展示价格汇总：小计、折扣（如有）、总计、货币

#### Scenario: Tracking info display
- **WHEN** 订单状态为 SHIPPED 或 DELIVERED 且有 trackingUrl
- **THEN** 页面 SHALL 展示物流追踪号和"Track Package"可点击链接

#### Scenario: Pending order actions
- **WHEN** 订单状态为 PENDING
- **THEN** 页面 SHALL 展示"Pay Now"按钮（链接到 invoiceUrl）和"Cancel Order"按钮

#### Scenario: Back navigation
- **WHEN** 用户在订单详情页点击返回
- **THEN** 系统 SHALL 导航回 Profile 页面

### Requirement: Checkout success feedback
购物车结账跳转前 SHALL 清空本地购物车状态。

#### Scenario: Cart cleared after checkout redirect
- **WHEN** checkout API 成功返回并即将跳转到 Shopify 结账页
- **THEN** 系统 SHALL 清空 Zustand 购物车状态
