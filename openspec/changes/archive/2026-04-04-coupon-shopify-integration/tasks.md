## 1. 基础设施：常量文件 + 数据库 Schema

- [x] 1.1 新建 `src/lib/constants/coupon.ts`，集中定义 `WELCOME_COUPON`（code/title/valueType/value）
- [x] 1.2 `prisma/schema.prisma` 新增 `PromoCoupon` 模型（码定义表：code/title/discountType/discountValue/maxUses/usedCount/expiresAt/isActive）
- [x] 1.3 `prisma/schema.prisma` 新增 `UserCoupon` 模型（兑换记录表：userId/promoCouponId/isUsed/usedAt/usedOrderId + `@@unique([userId, promoCouponId])`）
- [x] 1.4 `User` 模型新增 `coupons UserCoupon[]` 关系字段
- [x] 1.5 执行 `npx prisma db push` 同步 Schema

## 2. 欢迎券发放：统一所有注册方式

- [x] 2.1 `src/auth.ts` 新增 `events.createUser`，自动将新注册用户 `hasWelcomeCoupon` 设为 `true`
- [x] 2.2 保留 `src/app/actions/auth.ts` 中 WelcomeModal 的预创建逻辑（兼容未注册用户提交邮箱场景）
- [x] 2.3 验证 Google OAuth 首次登录后 `hasWelcomeCoupon = true`

## 3. JWT Session 刷新：实时同步优惠券状态

- [x] 3.1 在 `src/auth.ts` 中覆盖 `callbacks.jwt`，每次都从 DB 查询最新 `hasWelcomeCoupon` 值（放在 Node Runtime 中，避免 Edge 兼容问题）
- [x] 3.2 `auth.config.ts` 中的 jwt callback 简化为仅处理 role/id（不再处理 coupon）
- [x] 3.3 确认 `middleware.ts` 不受影响

## 4. Shopify 集成：Draft Order 嵌入 appliedDiscount

- [x] 4.1 修改 `src/lib/shopify.ts` 的 `createCheckout()` 签名，新增 `discount?: { title: string; valueType: 'PERCENTAGE' | 'FIXED_AMOUNT'; value: number }` 参数
- [x] 4.2 在 `draftOrderCreate` mutation 的 `input` 中注入 `appliedDiscount` 字段
- [x] 4.3 GraphQL mutation 返回字段新增 `totalPrice` 等以确认折扣生效

## 5. Checkout API 重构：服务端折扣决策

- [x] 5.1 从 `CheckoutRequestBody` 接口中移除 `discountCode` 和 `discountAmount`
- [x] 5.2 新增服务端折扣决策逻辑：查 `UserCoupon`（未使用，折扣最高优先）→ 无则检查 `hasWelcomeCoupon`
- [x] 5.3 根据决策结果计算本地 Order 的 `discountCode`、`discountAmount`、`totalAmount`
- [x] 5.4 将 discount 传入 `createCheckout()` 嵌入 Shopify Draft Order
- [x] 5.5 **不在 checkout 阶段核销**——核销由 Webhook 处理

## 6. Webhook 核销：支付成功后核销优惠券

- [x] 6.1 在 `src/app/api/webhooks/shopify/route.ts` 的 `PENDING → PROCESSING` 分支中，新增核销逻辑
- [x] 6.2 根据 `order.discountCode` 判断类型：欢迎券 → `User.hasWelcomeCoupon = false`；KOL 券 → `UserCoupon.isUsed = true`
- [x] 6.3 KOL 券核销时同步 `PromoCoupon.usedCount` 自增

## 7. KOL 码兑换 API

- [x] 7.1 新建 `src/app/api/coupon/redeem/route.ts`（POST），接收 `{ code: string }`
- [x] 7.2 验证用户已登录
- [x] 7.3 查询 `PromoCoupon` 表校验：码存在 + isActive + 未过期 + 未达使用上限
- [x] 7.4 检查 `UserCoupon` 防重复兑换（`@@unique([userId, promoCouponId])`）
- [x] 7.5 创建 `UserCoupon` 记录 + `PromoCoupon.usedCount` 自增
- [x] 7.6 返回兑换成功信息和优惠券详情

## 8. 用户优惠券查询 API

- [x] 8.1 新建 `src/app/api/coupon/active/route.ts`（GET），返回用户当前可用的所有优惠券
- [x] 8.2 同时返回欢迎券状态和未使用的 KOL 券列表
- [x] 8.3 前端 CartSidebar 和 Profile 页消费此 API

## 9. 前端 CartSidebar 改造

- [x] 9.1 移除前端折扣计算逻辑（`discountRate`、`discountAmount`、`finalTotal` 变量）
- [x] 9.2 调用 `/api/coupon/active` 获取可用券列表，展示折扣 badge
- [x] 9.3 checkout 请求 body 不再携带 `discountCode` / `discountAmount`
- [x] 9.4 移除 checkout 返回后的 `?discount=` URL 拼接逻辑
- [x] 9.5 底部价格区简化：Subtotal + "优惠券将在结账页应用" 提示 + Total（不预算折扣）

## 10. 前端 Profile 页优惠券展示改造

- [x] 10.1 `DynamicCouponCard.tsx` 动态化：session 无券时显示灰态"已使用"
- [x] 10.2 新增 KOL 码兑换入口（输入框 + 兑换按钮），调用 `/api/coupon/redeem`
- [x] 10.3 兑换成功后展示 KOL 券卡片（券名、折扣力度、状态）
- [x] 10.4 `AnimatedCouponBadge.tsx` 适配：有任意可用券时显示，无券时不渲染

## 11. Admin 后台：KOL 码管理（极简）

- [x] 11.1 新建 `src/app/admin/promo-codes/page.tsx`，列表展示 `PromoCoupon` 数据
- [x] 11.2 新建 `src/app/api/admin/promo-codes/route.ts`，GET 列表 + POST 创建
- [x] 11.3 创建表单：code、title、discountType（Percentage/Fixed）、discountValue、maxUses、expiresAt
- [x] 11.4 停用/启用 toggle（`isActive` 切换）

## 12. 硬编码清理 + i18n

- [x] 12.1 所有 `'WELCOME10'` 硬编码替换为 `WELCOME_COUPON.CODE` 常量
- [x] 12.2 `DynamicCouponCard.tsx` / `AnimatedCouponBadge.tsx` / `CartSidebar.tsx` 中英文硬编码文案迁入 `i18n.ts`

## 13. 验收测试

- [x] 13.1 Email Magic Link 新注册 → `hasWelcomeCoupon = true` → Header badge 显示
- [x] 13.2 Google OAuth 新注册 → `hasWelcomeCoupon = true` → Header badge 显示
- [x] 13.3 有欢迎券用户 checkout → Draft Order 包含 `appliedDiscount 10%` → Shopify 结账页价格含折扣
- [x] 13.4 支付成功 → Webhook 触发 → `hasWelcomeCoupon = false` → Header badge 消失
- [ ] 13.5 不付款 → Draft Order 过期 → 优惠券仍可用
- [x] 13.6 Admin 创建 KOL 码 → 用户兑换 → Profile 展示
- [x] 13.7 KOL 码 checkout → Draft Order 包含对应 appliedDiscount → 支付后券核销
- [x] 13.8 重复兑换同一 KOL 码 → 返回"已兑换"错误
- [x] 13.9 无效/过期/已满 KOL 码 → 返回明确错误信息
- [ ] 13.10 安全测试：前端不再传 discountAmount，后端自行决策
