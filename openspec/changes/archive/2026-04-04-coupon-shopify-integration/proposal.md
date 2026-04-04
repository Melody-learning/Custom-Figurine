# coupon-shopify-integration

## Why

当前优惠券模块是一个「幻影系统」——前端展示折扣、本地 DB 记录折扣金额，但 Shopify 端从未真正应用折扣。Draft Order 创建时不包含任何 `appliedDiscount`，仅在结账 URL 尾部拼接 `?discount=WELCOME10`，而 Shopify 后台是否配置了这个码完全不可知。同时存在多个安全漏洞：折扣金额由前端计算后端原封不动信任、优惠券永不核销（永久 10% off）、Google OAuth 注册的用户永远拿不到欢迎券。

本次重构目标：将优惠券与 Shopify Draft Order 的 `appliedDiscount` 机制真正打通，实现服务端权威的折扣计算和核销，并新增 KOL 兑换码功能。

## What Changes

### 欢迎券重构（注册即送 10% OFF，一次性）

- **发券时机统一**：所有注册方式（Google OAuth / Email Magic Link / WelcomeModal）都授予 `hasWelcomeCoupon = true`
- **服务端折扣计算**：`/api/checkout` 后端根据 `session.user.hasWelcomeCoupon` 自行计算折扣，不再信任前端传入的 `discountAmount`
- **Shopify 集成**：Draft Order 创建时传入 `appliedDiscount: { valueType: "PERCENTAGE", value: 10, title: "Welcome 10% Off" }`，折扣锁死在订单上
- **使用后核销**：checkout 成功后将 `hasWelcomeCoupon` 翻为 `false`，一次性使用

### KOL 兑换码功能（新增）

- **码的管理**：完全在我们系统内管理，Admin 后台创建 `PromoCoupon`，不依赖 Shopify Discount API
- **前端兑换入口**：用户在个人中心输入兑换码
- **后端校验**：`/api/coupon/redeem` 查询本地 `PromoCoupon` 表验证（是否存在、是否过期、是否已满）
- **本地存储**：新增 `PromoCoupon` 表（码定义）+ `UserCoupon` 表（兑换记录）
- **结账应用**：checkout 时优先使用 KOL 券（如果有），否则使用欢迎券；通过 `appliedDiscount` 嵌入 Draft Order

### 核销策略

- 优惠券在**支付成功后**通过 Shopify Webhook 核销，而非 checkout 创建时
- 用户不付款 → Draft Order 72h 过期 → 优惠券仍可用

### 安全加固

- 移除前端折扣计算逻辑，CartSidebar 仅做展示
- 后端 checkout API 成为折扣的唯一权威计算方
- 硬编码 `'WELCOME10'` 统一收口到常量文件

## Capabilities

### New Capabilities

- `kol-coupon-redeem`：用户可输入 KOL 专属码兑换优惠券
- `coupon-shopify-sync`：折扣通过 `appliedDiscount` 直接嵌入 Shopify Draft Order
- `coupon-revocation`：欢迎券使用后自动核销

### Modified Capabilities

- `welcome-coupon-grant`：从仅 Email Magic Link 扩展到所有注册方式
- `checkout-discount`：从前端计算 + URL 透传改为后端计算 + Draft Order 嵌入
- `cart-discount-display`：CartSidebar 折扣展示改为读取用户可用优惠券列表

## Requirement Changes

- `backend/database`：新增 `UserCoupon` 模型，`User.hasWelcomeCoupon` 增加核销逻辑
- `integrations/shopify`：Draft Order 创建增加 `appliedDiscount` 字段
- `frontend/components`：CartSidebar、DynamicCouponCard、AnimatedCouponBadge 适配新逻辑

## Impact

- **主要影响文件**：`/api/checkout/route.ts`、`shopify.ts`、`CartSidebar.tsx`、`auth.ts`、`auth.config.ts`、`prisma/schema.prisma`
- **新增文件**：`/api/coupon/redeem/route.ts`、`src/lib/constants/coupon.ts`、兑换码 UI 组件
- **数据库 Schema 变更**：新增 `UserCoupon` 表
- **不影响**：首页主题、AI 生图流程、Admin 面板（不需要管理码）、定制页
