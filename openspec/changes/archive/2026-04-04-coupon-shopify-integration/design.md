## Context

优惠券模块涉及 6 层：数据库（Prisma）→ 鉴权会话（NextAuth JWT）→ 后端 API（checkout/redeem）→ Shopify 集成（Draft Order）→ 前端展示（CartSidebar/Badge/Card）→ 营销触发（WelcomeModal）。当前实现在数据库和前端 UI 之间存在断层，Shopify 端完全没有折扣集成。

本次设计的核心原则：**服务端权威**——折扣资格由后端判定，折扣金额由后端计算，折扣应用由后端嵌入 Draft Order。前端只负责展示。

## Goals / Non-Goals

**Goals:**
- 欢迎券：所有注册方式统一发券，checkout 时服务端计算并嵌入 `appliedDiscount`，支付后核销
- KOL 码：**完全在我们系统内管理**（Admin 后台创建），不依赖 Shopify Discount 体系
- 安全：移除前端发送 `discountAmount` 的能力，后端自行决定
- 硬编码收口：所有优惠券相关常量集中管理

**Non-Goals:**
- 不与 Shopify 的 Discount Code 体系集成（KOL 码纯本地管理）
- 不支持多张优惠券叠加（一个订单最多应用一张）
- 不改动 AI 生图流程、首页主题、定制页交互

## Decisions

### D1. 欢迎券发放：Auth Events 统一触发

**决策**：在 `auth.ts` 的 PrismaAdapter events 中，通过 `createUser` 事件自动将 `hasWelcomeCoupon` 设为 `true`。同时保留 `WelcomeModal` 路径中 `loginWithEmail` 的预创建逻辑。

**理由**：`createUser` 事件由 PrismaAdapter 自动抛出，覆盖 Google OAuth 和 Email 两种注册方式，是最可靠的统一入口。

**实现要点**：
```typescript
// src/auth.ts
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  events: {
    async createUser({ user }) {
      await prisma.user.update({
        where: { id: user.id },
        data: { hasWelcomeCoupon: true },
      });
    },
  },
  // ...providers
});
```

### D2. KOL 码：完全本地管理（不依赖 Shopify Discount API）

**决策**：新增 `PromoCoupon`（码定义表）和 `UserCoupon`（用户兑换记录表）两个模型，KOL 码的创建、校验、兑换全部在我们系统内完成。结账时通过 `appliedDiscount` 嵌入 Draft Order 即可。

**理由**：
- 不需要在 Shopify 后台操作优惠券，减少运营复杂度
- 不需要 `read_discounts` / `write_discounts` App scope
- KOL 码的生命周期完全可控

**Schema 设计**：
```prisma
// 码定义表：Admin 创建的 KOL 码模板
model PromoCoupon {
  id            String        @id @default(cuid())
  code          String        @unique    // "KOL_JAKE_15"
  title         String                   // "Jake's Exclusive 15% Off"
  discountType  String                   // "PERCENTAGE" | "FIXED_AMOUNT"
  discountValue Float                    // 15 表示 15%，10.00 表示 $10
  maxUses       Int?                     // null = 无限制
  usedCount     Int           @default(0)
  expiresAt     DateTime?               // null = 永不过期
  isActive      Boolean       @default(true)
  createdAt     DateTime      @default(now())
  redemptions   UserCoupon[]
}

// 用户兑换记录表
model UserCoupon {
  id            String        @id @default(cuid())
  userId        String
  promoCouponId String
  isUsed        Boolean       @default(false)
  usedAt        DateTime?
  usedOrderId   String?

  user          User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  promoCoupon   PromoCoupon   @relation(fields: [promoCouponId], references: [id])
  createdAt     DateTime      @default(now())

  @@unique([userId, promoCouponId])  // 同一用户不能重复兑换同一码
}
```

### D3. Shopify 集成：Draft Order 嵌入 appliedDiscount

**决策**：在 `createCheckout()` 中新增 `discount` 参数，通过 `appliedDiscount` 字段直接嵌入 Draft Order。

```typescript
// src/lib/shopify.ts
export async function createCheckout(
  items: Array<{ variantId: string; quantity: number; customAttributes?: ... }>,
  userId?: string,
  localOrderId?: string,
  discount?: { title: string; valueType: 'PERCENTAGE' | 'FIXED_AMOUNT'; value: number }
) {
  const input: any = {
    lineItems: cleanItems,
    customAttributes,
    tags: ["custom-figurine", "api-generated-draft"],
  };

  if (discount) {
    input.appliedDiscount = {
      title: discount.title,
      valueType: discount.valueType,
      value: discount.value,
    };
  }
}
```

### D4. Checkout API 服务端折扣决策

**决策**：`/api/checkout/route.ts` 后端自行决定折扣，不接受前端传入的 `discountCode` / `discountAmount`。

**优先级规则**：
1. 查询用户未使用的 `UserCoupon`（KOL 码） → 优先使用折扣最高的
2. 如果没有 KOL 码，检查 `hasWelcomeCoupon` → 应用 10% 欢迎折扣
3. 都没有 → 不应用折扣

**结果**：
- 将折扣信息传入 `createCheckout()` 嵌入 Draft Order
- 本地 Order 记录同步写入 `discountCode`、`discountAmount`、`totalAmount`
- checkout 创建阶段**不核销**优惠券（等待支付确认）

### D5. 核销时机：支付成功后通过 Webhook 核销

**决策**：优惠券在 checkout 创建时**不核销**，而是在 Shopify Webhook `orders/create` / `orders/paid` 触发后（即用户实际支付后）才核销。

**实现要点**：
在现有 `src/app/api/webhooks/shopify/route.ts` 的 `orders/create || orders/paid` 分支中，当订单从 `PENDING → PROCESSING` 时，新增核销逻辑：

```typescript
if (order.status === 'PENDING') {
  await updateOrderStatus(order.id, OrderStatus.PROCESSING, { shopifyOrderId });

  // ---- 核销优惠券 ----
  if (order.discountCode) {
    // 如果是欢迎券
    if (order.discountCode === WELCOME_COUPON.CODE) {
      await prisma.user.update({
        where: { id: order.userId },
        data: { hasWelcomeCoupon: false },
      });
    }
    // 如果是 KOL 券
    const userCoupon = await prisma.userCoupon.findFirst({
      where: { userId: order.userId, isUsed: false },
      include: { promoCoupon: true },
    });
    if (userCoupon && userCoupon.promoCoupon.code === order.discountCode) {
      await prisma.userCoupon.update({
        where: { id: userCoupon.id },
        data: { isUsed: true, usedAt: new Date(), usedOrderId: order.id },
      });
    }
  }
}
```

**理由**：
- 用户不付款 → Draft Order 72h 过期 → 优惠券仍可用 ✅
- 用户付款 → Webhook 触发 → 优惠券核销 ✅
- 利用已有的 Webhook 基础设施，无需新建

**边界情况**：用户用同一券开启两个 checkout → 第一个付款核销后，第二个 Draft Order 上的折扣已嵌入无法撤回。这是 Draft Order `appliedDiscount` 的固有限制，风险极低（用户不太可能同时开两个结账）。

### D6. JWT Session 刷新策略

**决策**：在 `src/auth.ts` 中覆盖 `callbacks.jwt`（而不是在 `auth.config.ts` 中），每次都从 DB 读取最新的 `hasWelcomeCoupon`。

**理由**：`auth.config.ts` 需要 Edge 兼容（供 middleware 使用），不能 import Prisma。将 DB 查询放在 `auth.ts` 的 Node Runtime callbacks 中可以避免此问题。

```typescript
// src/auth.ts
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role || "USER";
        token.id = user.id;
      }
      // 每次都从 DB 读取最新优惠券状态
      if (token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { hasWelcomeCoupon: true },
        });
        token.hasWelcomeCoupon = dbUser?.hasWelcomeCoupon ?? false;
      }
      return token;
    },
  },
  events: { ... },
  providers: [ ... ],
});
```

### D7. 前端 CartSidebar 简化

**决策**：CartSidebar 不再计算折扣金额，仅展示优惠券 badge。

- 从 session 读取 `hasWelcomeCoupon` → 显示 "Welcome 10% Off" badge
- 调用 `/api/coupon/active` 获取 KOL 券 → 显示 KOL 券 badge
- checkout 请求 body 不再携带 `discountCode` / `discountAmount`
- 不再展示折扣后的 finalTotal（实际折扣价由 Shopify 结账页展示）

### D8. KOL 码的 Admin 管理（极简）

**决策**：在现有 Admin 后台新增一个"Promo Codes"页面，CRUD 操作 `PromoCoupon` 表。

功能：
- 创建码：输入 code、title、折扣类型、折扣值、最大使用次数、过期时间
- 列表查看：所有码 + usedCount / maxUses
- 停用/启用：`isActive` toggle

不做：
- 不做批量生成
- 不做使用记录详情页（后续可加）

## Risks / Trade-offs

| 风险 | 应对 |
|------|------|
| 同一用户用同一券并行开两个 checkout | 极低概率，且 Draft Order 嵌入的折扣无法撤回，可接受 |
| JWT 每次刷新查 DB | 单行主键查询 < 1ms，可接受 |
| KOL 码纯本地管理，Shopify 后台看不到折扣码 | 设计意图：简单优先。Draft Order 的 `appliedDiscount` 会在 Shopify 订单详情中显示折扣标题和金额 |
| Webhook 延迟导致核销不及时 | Shopify Webhook 通常秒级触发，偶尔延迟几分钟，不影响用户体验 |

## Open Questions

- 无（已在对话中全部确认）
