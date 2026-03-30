## Why

当前独立站缺少自有的订单系统。结账流程是"fire & forget"——购物车直接创建 Shopify Draft Order 后跳转，我们的数据库对此一无所知。用户在 Profile 页面看不到任何订单记录。

现有的 `StoreOrder` 表过于简陋（仅 shopifyOrderId + status），且完全依赖 Shopify Webhook 填充，在 PayPal 支付因区域不匹配持续失败的情况下，数据库始终为空，订单功能形同虚设。

需要将订单的 Source of Truth 从 Shopify 迁移到本地数据库，让我们的独立站拥有完整的订单生命周期管理能力。

## What Changes

### 架构转变：本地为主，Shopify 为支付通道

- **新建 `Order` + `OrderItem` 表**，替换掉现有的 `StoreOrder` 表
- **改造 `/api/checkout`**：先在本地数据库创建 Order (PENDING)，再推给 Shopify 创建 Draft Order，回存 invoiceUrl
- **改造 Webhook 处理器**：从 Shopify 事件回写状态到本地 Order（PROCESSING / SHIPPED / REFUNDED）
- **新增订单 API**：用户订单列表 + 订单详情
- **新增订单 UI 页面**：Profile 中的订单列表 + 可展开的订单详情页（含状态时间线、定制图片、物流追踪）
- **新增开发模拟支付**：本地 Shopify Admin Key 过期时的 fallback，通过模拟页面完成支付状态流转

### 订单状态机

```
PENDING → PROCESSING → SHIPPED → DELIVERED
            ↗ (支付成功=开始制作)    ↗ (Shopify Fulfill)
PENDING → CANCELLED (用户取消未支付订单)
PROCESSING → REFUNDED (退款)
```

注：PAID 状态合并入 PROCESSING（支付成功即自动视为开始制作）。

### 订单号格式

`CF-YYYYMMDD-XXXXXX`（如 `CF-20260330-A3F2K8`），含日期信息便于人工识别。

### 发货操作

在 Shopify Admin 后台手动标记 Fulfill + 填写物流单号 → Webhook 回写为 SHIPPED + trackingUrl。不在独立站开发 Admin 面板。

### 开发模式

本地 Shopify Admin Key 过期时，checkout API 仍创建本地 Order，返回模拟支付页面 URL。模拟页面提供"支付成功/失败/退款"按钮，触发等同于 Webhook 的状态流转逻辑。

## Capabilities

### New Capabilities
- `order-management`: 独立站自建订单系统，包含 Order/OrderItem 数据模型、订单状态机（PENDING → PROCESSING → SHIPPED → DELIVERED / CANCELLED / REFUNDED）、订单号生成（CF-YYYYMMDD-XXXXXX）
- `order-api`: 订单相关 API 端点，包含改造后的 checkout（先本地建单再推 Shopify）、用户订单列表、订单详情查询、取消订单
- `order-ui`: 订单前端页面，包含 Profile 订单列表卡片、订单详情页（状态时间线、商品明细含定制图片、物流追踪信息）
- `dev-payment-simulator`: 开发环境模拟支付模块，当 Shopify Admin Key 不可用时提供本地支付模拟页面和状态流转端点

### Modified Capabilities
- `checkout-flow`: 结账流程从 fire-and-forget 改为先本地建单再推 Shopify，增加 localOrderId 注入 customAttributes
- `shopify`: Webhook 处理器改造为回写本地 Order 表，增加 orders/fulfilled 和 refunds/create 事件处理
- `database`: 删除 StoreOrder 表，新增 Order + OrderItem 表，GeneratedAsset 增加反向关联

## Impact

- **数据库 Schema (BREAKING)**：删除 `StoreOrder` 表，新增 `Order` + `OrderItem` 表，`GeneratedAsset` 增加 `orderItems` 关联。需要执行 `prisma db push`。
- **API 端点**：`/api/checkout` 逻辑大幅改造；新增 `/api/orders`, `/api/orders/[id]`；改造 `/api/webhooks/shopify`
- **前端页面**：`/profile/page.tsx` 改造订单展示区；新增 `/profile/orders/[id]/page.tsx` 订单详情页
- **Zustand Store**：checkout 成功后清空购物车逻辑可能需要调整
- **开发环境**：新增 `/dev/simulate-payment` 页面和 `/api/dev/simulate-webhook` 端点（仅 development）
- **环境变量**：可能新增 `SHOPIFY_WEBHOOK_SECRET`（如果尚未配置）
