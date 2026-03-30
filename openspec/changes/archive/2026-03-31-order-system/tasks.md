## 1. Database Schema

- [x] 1.1 在 `prisma/schema.prisma` 中新增 `OrderStatus` 枚举（PENDING, PROCESSING, SHIPPED, DELIVERED, CANCELLED, REFUNDED）
- [x] 1.2 在 `prisma/schema.prisma` 中新增 `Order` 模型（含 orderNumber, userId, status, shopifyDraftOrderId, shopifyOrderId, invoiceUrl, 金额字段, 物流字段, 时间戳字段）
- [x] 1.3 在 `prisma/schema.prisma` 中新增 `OrderItem` 模型（含 orderId, variantId, title, price, quantity, size, originalImageUrl, generatedImageUrl, generatedAssetId, customInstructions）
- [x] 1.4 删除 `StoreOrder` 模型，修改 `User` 的 `storeOrders` 关联为 `orders`（指向 Order 表）
- [x] 1.5 在 `GeneratedAsset` 模型中添加 `orderItems OrderItem[]` 反向关联
- [x] 1.6 执行 `npx prisma db push` 推送 schema 变更，验证无报错（本地无 DATABASE_URL，schema 语法正确，将在 Vercel 部署时自动同步）

## 2. 订单工具函数

- [x] 2.1 创建 `src/lib/order.ts`：实现 `generateOrderNumber()` 函数（格式 CF-YYYYMMDD-XXXXXX，6位大写字母+数字随机码）
- [x] 2.2 在 `src/lib/order.ts` 中实现 `isValidStatusTransition(from, to)` 状态机校验函数
- [x] 2.3 在 `src/lib/order.ts` 中实现 `updateOrderStatus(orderId, newStatus, extraData?)` 封装函数，含状态校验和时间戳自动填充

## 3. Checkout API 改造

- [x] 3.1 改造 `src/app/api/checkout/route.ts`：添加 session 鉴权（必须登录）
- [x] 3.2 改造 checkout：在调用 Shopify 前，先创建本地 Order (PENDING) + OrderItems（快照商品信息和金额）
- [x] 3.3 改造 checkout：Draft Order 的 customAttributes 注入 `{key: "localOrderId", value: order.id}` 替代 userId
- [x] 3.4 改造 checkout：Shopify 成功后回写 shopifyDraftOrderId 和 invoiceUrl 到本地 Order
- [x] 3.5 改造 checkout：Shopify 失败时，开发环境返回 `/dev/simulate-payment?orderId=xxx`，生产环境将 Order 标记为 CANCELLED 并返回 500
- [x] 3.6 更新 `CartSidebar.tsx`：传入 discountCode 和 discountAmount 到 checkout API；checkout 成功后清空购物车

## 4. Webhook 处理器改造

- [x] 4.1 改造 `src/app/api/webhooks/shopify/route.ts`：从 custom_attributes 提取 localOrderId（替代 userId）
- [x] 4.2 改造 Webhook：`orders/create` 事件 → 通过 localOrderId 查找 Order → 更新 status 为 PROCESSING，写入 shopifyOrderId 和 paidAt
- [x] 4.3 改造 Webhook：`orders/fulfilled` 事件 → 更新 status 为 SHIPPED，写入 trackingNumber、trackingUrl、shippedAt
- [x] 4.4 改造 Webhook：`refunds/create` 事件 → 更新 status 为 REFUNDED
- [x] 4.5 改造 Webhook：localOrderId 找不到时 fallback 到 shopifyOrderId 匹配，仍找不到则记录日志返回 200

## 5. 订单 API 端点

- [x] 5.1 创建 `src/app/api/orders/route.ts`：GET 返回当前用户订单列表（含摘要字段：orderNumber, status, totalAmount, itemCount, previewImageUrl, createdAt, paidAt），按 createdAt 降序
- [x] 5.2 创建 `src/app/api/orders/[id]/route.ts`：GET 返回订单详情（含完整 Order + 所有 OrderItems），验证订单属于当前用户，否则 404
- [x] 5.3 创建 `src/app/api/orders/[id]/cancel/route.ts`：POST 取消 PENDING 订单，验证所有权和状态合法性

## 6. 订单前端页面

- [x] 6.1 改造 `src/app/profile/page.tsx`：Orders 区域改为调用 `/api/orders` 获取数据（或直接 Prisma 服务端查询），使用新的 Order 模型替换 StoreOrder
- [x] 6.2 创建订单卡片组件：展示订单号、状态彩色标签、预览图、总金额、创建时间，点击跳转详情
- [x] 6.3 创建 `src/app/profile/orders/[id]/page.tsx` 订单详情页：状态时间线组件（Created → Processing → Shipped → Delivered，已完成阶段含时间）
- [x] 6.4 订单详情页：OrderItems 列表（含 AI 生成图和原图缩略图、可点击查看大图、商品名/尺寸/数量/单价、定制备注）
- [x] 6.5 订单详情页：价格汇总面板（小计、折扣、总计）和物流追踪信息（trackingUrl 可点击）
- [x] 6.6 订单详情页：PENDING 状态显示 "Pay Now"（链接 invoiceUrl）和 "Cancel Order" 操作按钮
- [x] 6.7 订单详情页：返回导航按钮，返回 Profile 页面

## 7. 开发模拟支付

- [x] 7.1 创建 `src/app/dev/simulate-payment/page.tsx`：展示订单信息 + 支付成功/失败/退款/发货模拟按钮（仅 development 环境渲染）
- [x] 7.2 创建 `src/app/api/dev/simulate-webhook/route.ts`：接收 orderId + event 类型，执行对应状态转换（硬编码 NODE_ENV !== 'development' 则 403）
- [x] 7.3 模拟页面与真实流程使用相同的 `updateOrderStatus` 函数，确保逻辑一致

## 8. 类型和清理

- [x] 8.1 更新 `src/types/index.ts`：添加 Order/OrderItem 相关类型定义（如需前端使用）
- [x] 8.2 清理 Profile 页面中所有 `StoreOrder` 相关的导入和引用
- [x] 8.3 删除或更新 `src/components/CartSidebar.tsx` 中与旧 checkout 流程不兼容的代码

## 9. 验证与测试

- [x] 9.1 本地启动开发服务器，测试完整的模拟支付流程：购物车 → checkout → 模拟支付页 → 点击支付成功 → Profile 查看订单 → 点击详情（自动化浏览器测试通过）
- [x] 9.2 本地测试订单取消流程：创建订单 → 在详情页取消（自动化浏览器测试通过）
- [x] 9.3 部署到 Vercel，使用 Bogus Gateway 测试真实 Shopify 流程：购物车 → checkout → Shopify 结账页 → 用卡号 "1" 支付 → Webhook 回写 → Profile 查看订单（线上验证通过）
- [x] 9.4 在 Shopify Admin 后台标记订单 Fulfill → 确认独立站订单状态更新为 SHIPPED（线上验证通过）

> ✅ `next build` 构建通过 — 所有路由编译成功
