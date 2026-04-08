# Delta Spec: AffiliateTracker 组件

> 变更来源: `goaffpro-affiliate-tracking`
> 基础规范: `frontend/components.md`

## 变更摘要

新增全局客户端组件 `AffiliateTracker`，负责捕获分销推广 URL 参数并持久化到 Cookie。

## 新增组件

### `AffiliateTracker` (`src/components/AffiliateTracker.tsx`)

**类型**: Client Component（`'use client'`）
**UI**: 零渲染（`return null`）
**职责**: 全局 URL 参数监听 + Cookie 写入

**行为**:
1. 使用 `useSearchParams()` 监听 URL 查询参数
2. 检测 `ref` 参数是否存在
3. 若存在，写入 Cookie:
   - Name: `gaf_ref`
   - Value: URL 参数值（`encodeURIComponent` 编码）
   - Max-Age: `2592000`（30 天）
   - Path: `/`
   - SameSite: `Lax`
4. 使用 Last Click 归因：新值覆盖旧值

**挂载位置**: `src/app/layout.tsx` 的 `<body>` 内，包裹在 `<Suspense fallback={null}>` 中

### CartSidebar Cookie 读取

**变更文件**: `src/components/CartSidebar.tsx`

- `handleCheckout` 函数中新增 Cookie 读取逻辑
- 使用内联 `getCookie('gaf_ref')` 工具函数
- 将值作为 `affiliateRef` 字段随 checkout API 请求发送
