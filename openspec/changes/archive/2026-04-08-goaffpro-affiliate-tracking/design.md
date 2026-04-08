# Design: GoAffPro 分销联盟参数追踪

## Context

当前结账链路：
```
CartSidebar → POST /api/checkout → createCheckout() → Shopify Draft Order → invoiceUrl
```

Draft Order 已使用 `customAttributes` 注入 `localOrderId`、`userId`。
Webhook 已在 `orders/paid` 中处理优惠券核销，且有 `extractAttribute()` 函数可从 `note_attributes` 提取自定义字段。

GoAffPro 的订单归因有两种途径：
1. **loader.js 自动追踪**：脚本在前端种 Cookie，Shopify 后台的 GoAffPro App 通过 Webhook 匹配
2. **Server-Side API**：我们主动 POST `api.goaffpro.com/order_complete` 上报

## Goals / Non-Goals

**Goals:**
- 前端全局捕获 `?ref=xxx` URL 参数，存入 Cookie（30 天）
- Checkout 时将 ref 值注入 Draft Order 的 `customAttributes`
- Webhook 支付成功后回调 GoAffPro API 上报订单归属
- 嵌入 GoAffPro `loader.js` 脚本作为额外保险

**Non-Goals:**
- 不在本地数据库存储 `affiliateRef`（后续如需分销数据分析再加）
- 不实现分销员面板或佣金展示（这些在 GoAffPro 后台管理）
- 不修改现有的优惠券系统

## Design

### 1. 前端参数捕获 — `AffiliateTracker`

```typescript
// src/components/AffiliateTracker.tsx
'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

const AFFILIATE_COOKIE = 'gaf_ref';
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 天 = 2592000 秒

export function AffiliateTracker() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) {
      // Last Click 覆盖：新值替换旧值
      document.cookie = `${AFFILIATE_COOKIE}=${encodeURIComponent(ref)}; max-age=${COOKIE_MAX_AGE}; path=/; SameSite=Lax`;
    }
  }, [searchParams]);

  return null; // 零 UI 组件
}
```

注意事项：
- `useSearchParams()` 需要包裹在 `<Suspense>` 中（Next.js 15 要求）
- 只监听 `ref` 参数（用户确认只启用了这一个标识符）
- 不清理 URL（避免无谓的路由跳转和历史记录干扰）

### 2. Layout 挂载

```tsx
// src/app/layout.tsx
import { AffiliateTracker } from '@/components/AffiliateTracker';

// 在 <body> 内、其他 Provider 旁边：
<Suspense fallback={null}>
  <AffiliateTracker />
</Suspense>
```

同时在 `<head>` 中嵌入 GoAffPro loader.js：
```tsx
<Script
  src={`https://api.goaffpro.com/loader.js?shop=${process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN}`}
  strategy="afterInteractive"
/>
```

### 3. CartSidebar 传参

```typescript
// CartSidebar.tsx - handleCheckout 函数中
function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

const affiliateRef = getCookie('gaf_ref');

const res = await fetch('/api/checkout', {
  method: 'POST',
  body: JSON.stringify({
    items: cartItems,
    selectedCouponCode,
    affiliateRef: affiliateRef || undefined, // 新增
  }),
});
```

### 4. Checkout API 注入 Draft Order

```typescript
// src/app/api/checkout/route.ts

interface CheckoutRequestBody {
  items: CheckoutItem[];
  selectedCouponCode?: string;
  affiliateRef?: string;  // 新增
}

// 在 createCheckout 调用时传入:
const checkout = await createCheckout(
  shopifyItems,
  userId,
  order.id,
  resolvedDiscount?.discount,
  body.affiliateRef  // 新增参数
);
```

```typescript
// src/lib/shopify.ts - createCheckout 函数

export async function createCheckout(
  items: ...,
  userId?: string,
  localOrderId?: string,
  discount?: ...,
  affiliateRef?: string  // 新增参数
) {
  // ... 现有 customAttributes 构造逻辑 ...

  if (affiliateRef) {
    customAttributes.push({ key: "_goaffpro_ref", value: affiliateRef });
  }

  // ... 其余不变 ...
}
```

### 5. Webhook GoAffPro 回调

```typescript
// src/app/api/webhooks/shopify/route.ts
// 在 orders/paid 处理的 PENDING → PROCESSING 转换成功后

// 提取分销员 ref
const affiliateRef = extractAttribute(payload, '_goaffpro_ref');
if (affiliateRef) {
  try {
    const shopDomain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
    await fetch('https://api.goaffpro.com/order_complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ref: affiliateRef,
        shop: shopDomain,
        order_id: shopifyOrderId,
      }),
    });
    console.log(`WEBHOOK: GoAffPro notified for ref=${affiliateRef}, order=${shopifyOrderId}`);
  } catch (goaffproError) {
    // GoAffPro 回调失败不应阻塞订单处理
    console.error('WEBHOOK: GoAffPro notification failed (non-blocking):', goaffproError);
  }
}
```

### 6. 数据流全景

```
用户点击 ?ref=AFFILIATE_CODE
         ↓
AffiliateTracker → Cookie: gaf_ref=AFFILIATE_CODE (30天)
         ↓
CartSidebar.handleCheckout()
  → 读取 Cookie gaf_ref
  → POST /api/checkout { affiliateRef: "AFFILIATE_CODE" }
         ↓
/api/checkout
  → createCheckout(..., affiliateRef)
    → Draft Order customAttributes: [{ key: "_goaffpro_ref", value: "AFFILIATE_CODE" }]
  → Shopify invoiceUrl → 用户跳转支付
         ↓
Shopify 支付完成 → Webhook orders/paid
  → extractAttribute(payload, '_goaffpro_ref') → "AFFILIATE_CODE"
  → POST api.goaffpro.com/order_complete { ref, shop, order_id }
         ↓
GoAffPro 记录佣金 ✅
```

同时，GoAffPro 的 `loader.js` 也在前端运行，提供额外的追踪覆盖。

## Decisions

| 决策 | 选择 | 理由 |
|------|------|------|
| Cookie 名称 | `gaf_ref` | 简短、不与其他 Cookie 冲突、`gaf` 是 GoAffPro 缩写 |
| Cookie 有效期 | 30 天 | 用户确认，与 GoAffPro 后台设置一致 |
| Cookie 属性 | `SameSite=Lax; Path=/` | Lax 允许顶层导航携带、非 HttpOnly 因为前端需要读取 |
| 归因模型 | Last Click（新值覆盖旧值） | GoAffPro 官方使用 Last Click |
| 只监听 `ref` | 是 | 用户确认 GoAffPro 后台只启用了 `ref` |
| 是否存 DB | 否 | 用户确认暂不需要，减少 Schema 变更 |
| GoAffPro 回调失败处理 | try-catch 不阻塞 | 佣金记录失败不应影响订单状态转换 |
| loader.js 嵌入方式 | Next.js `<Script>` afterInteractive | 不阻塞首屏渲染 |

## Risks / Trade-offs

- **Cookie 跨域限制**：我们的前端域名和 Shopify Checkout 域名不同，Cookie 不共享。所以必须通过 Draft Order `customAttributes` + Webhook 回调来传递，不能单靠 Cookie
- **GoAffPro API 无认证**：`order_complete` API 无需 API Key（用 shop 域名做身份识别），意味着理论上可被伪造。但这是 GoAffPro 官方设计，我们按文档实现即可
- **Webhook 时序**：GoAffPro 回调发生在 `orders/paid` Webhook 中。如果 Webhook 延迟或重试，GoAffPro 会重复收到上报——GoAffPro 应能自行去重（按 order_id）
- **loader.js + 自建 Cookie 双重追踪**：可能在边际情况产生 ref 不一致（loader.js 认为是 A，我们的 Cookie 认为是 B）。以 Draft Order 中注入的值为准
