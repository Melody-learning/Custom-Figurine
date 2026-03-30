## Context

当前结账流程是纯"发射后不管"——购物车经 `/api/checkout` 创建 Shopify Draft Order，返回 invoiceUrl 后跳转，我们的数据库不记录任何信息。订单可见性完全依赖 Shopify Webhook 回写到 `StoreOrder` 表，但该表结构极简（仅 shopifyOrderId + status），且因 PayPal 区域不匹配导致支付全部失败，Webhook 从未触发，导致订单系统形同虚设。

现有技术栈：Next.js 15 (App Router) + Prisma ORM + Vercel Postgres + Shopify Admin API (Draft Order) + Zustand 购物车。

约束条件：
- 本地开发环境 Shopify Admin Key 已过期，线上 Vercel 正常
- 已启用 Shopify Bogus Gateway 用于测试
- 发货操作在 Shopify Admin 后台执行，不开发独立站 Admin 面板
- 支付完成即视为开始制作（PAID 和 PROCESSING 合并）

## Goals / Non-Goals

**Goals:**
- 建立以本地数据库为 Source of Truth 的订单系统
- 订单在结账时即写入数据库（PENDING），不依赖 Webhook 才产生记录
- 用户在 Profile 页面可查看完整订单列表和详情
- 订单详情包含状态时间线、定制图片、物流追踪
- 开发环境在 Shopify 不可用时仍可完整测试订单流程
- Shopify Webhook 用于状态推进（PROCESSING → SHIPPED），而非订单创建

**Non-Goals:**
- 不开发独立站 Admin 管理面板（使用 Shopify Admin 后台）
- 不实现订单搜索、筛选、分页（初版简单列表即可）
- 不实现邮件通知（Shopify 原生发货通知已足够）
- 不处理多商品类型（当前仅定制手办一种 SKU 模式）
- 不实现支付方式选择（完全由 Shopify 结账页控制）

## Decisions

### 决策 1: 订单 Source of Truth 放在本地数据库

**选择**: 本地 Postgres 为主，Shopify 为支付通道

**替代方案**:
- A) 完全依赖 Shopify（当前方案）：PayPal 不通就完全无数据
- B) 双写同步：复杂度高，一致性难保证

**理由**: 方案 B（本地为主）确保即使支付链路不通，订单记录依然存在。用户可以看到"待支付"订单，可以重新支付。Webhook 仅用于状态推进而非数据创建。

### 决策 2: PENDING → PROCESSING 直接跳转，无独立 PAID 状态

**选择**: Webhook 收到 `orders/create`（Shopify 确认支付）后直接设为 PROCESSING

**理由**: 业务上"支付成功"就等于"开始制作"，增加一个独立的 PAID 状态徒增复杂度且无业务价值。

### 决策 3: 删除 StoreOrder 表，替换为 Order + OrderItem

**选择**: 全新的 Order/OrderItem 双表结构，直接删掉旧的 StoreOrder

**理由**: StoreOrder 过于简陋，没有金额、无商品明细、无定制图片关联。且当前数据库中没有真实 StoreOrder 数据，无需迁移。

### 决策 4: 商品信息快照到 OrderItem

**选择**: 下单时将商品标题、价格、图片 URL 全部快照到 OrderItem

**替代方案**: 只存 variantId，运行时查 Shopify

**理由**: 避免对 Shopify API 的高频依赖。价格可能变动，快照确保订单金额准确反映下单时的状态。

### 决策 5: 订单号格式 CF-YYYYMMDD-XXXXXX

**选择**: `CF-` 前缀 + 8位日期 + `-` + 6位随机码（大写字母+数字）

**示例**: `CF-20260330-K8A3F2`

**理由**: 前缀标识品牌（Custom Figurine），日期方便人工识别订单时间，随机码保证唯一性。cuid() 作为数据库主键，orderNumber 作为人类友好展示。

### 决策 6: 本地开发模拟支付

**选择**: 当 Shopify Draft Order 创建失败时（本地 key 过期），仍创建本地 Order 并返回模拟支付页面 URL

**实现**:
- `/api/checkout` 在 Shopify 调用失败且 `NODE_ENV === 'development'` 时，返回 `/dev/simulate-payment?orderId=xxx`
- 模拟页面提供"支付成功 / 失败 / 退款"按钮
- 按钮触发 `/api/dev/simulate-webhook` 端点，执行与真实 Webhook 相同的状态更新逻辑
- 生产环境不暴露这些端点

### 决策 7: Webhook 通过 localOrderId 关联本地订单

**选择**: 在 Draft Order 的 `customAttributes` 中注入 `{key: "localOrderId", value: order.id}`

**理由**: 之前是注入 userId 然后在 Webhook 中根据 userId 匹配——这不精确（一个用户可能有多个订单）。改为注入 localOrderId 可以精确定位到具体的本地订单。

### 决策 8: GeneratedAsset 与 OrderItem 的可选关联

**选择**: OrderItem 有可选的 `generatedAssetId` 字段，但不强制关联

**理由**: 用户可能从 Vault 中选择已有的 AI 生成资产下单，此时关联 GeneratedAsset。但购物车中的图片快照（URL）才是订单的最终凭证，GeneratedAsset 关联仅用于追溯。

## Risks / Trade-offs

**[Risk] Webhook 未及时送达** → 订单状态可能延迟更新。Mitigation: 用户可以通过 invoiceUrl 查看 Shopify 端的真实状态；未来可加定时任务主动拉取。

**[Risk] 订单号碰撞** → 6位随机码理论上有碰撞可能。Mitigation: `orderNumber` 字段加 `@unique` 约束，生成时重试。日均订单量极低（<100），碰撞概率可忽略。

**[Risk] 本地 Order 和 Shopify Order 状态不一致** → 手动在 Shopify 改状态但 Webhook 没收到。Mitigation: 初期可接受，本地以 Webhook 回写为准；MVP 阶段不做双向同步。

**[Risk] 模拟支付端点安全** → `/api/dev/simulate-webhook` 如果泄漏到生产环境可能被滥用。Mitigation: 端点内硬编码 `process.env.NODE_ENV !== 'development'` 检查，直接 403。

**[Trade-off] 不做 Admin 面板** → 发货操作需要切换到 Shopify Admin 后台。Trade-off 可接受，团队小且订单量初期低。

## Migration Plan

1. 修改 `prisma/schema.prisma`：删除 `StoreOrder`，新增 `Order` + `OrderItem`，`GeneratedAsset` 加反向关联
2. 执行 `npx prisma db push`（当前无真实 StoreOrder 数据，无需数据迁移）
3. 更新 `/api/checkout` 逻辑
4. 更新 Webhook 处理器
5. 新增订单 API 端点
6. 新增前端订单 UI
7. 部署到 Vercel，在 Shopify 后台确认 Webhook URL 已配置
8. 使用 Bogus Gateway 全链路测试

**回滚策略**: Prisma schema 回退 + `db push` 即可恢复 StoreOrder 表。API 端点变更通过 Git revert。
