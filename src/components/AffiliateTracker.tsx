'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

/**
 * GoAffPro 分销联盟参数追踪组件
 * 
 * 监听 URL 中的 ?ref=xxx 参数，写入 Cookie 供 Checkout 时读取。
 * 使用 Last Click 归因模型：新值覆盖旧值。
 * 
 * 挂载于 layout.tsx，需包裹在 <Suspense> 中。
 */

const AFFILIATE_COOKIE = 'gaf_ref';
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 天 = 2,592,000 秒

export function AffiliateTracker() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref && ref.trim()) {
      // Last Click 覆盖策略：每次有新 ref 都重写 Cookie
      document.cookie = `${AFFILIATE_COOKIE}=${encodeURIComponent(ref.trim())}; max-age=${COOKIE_MAX_AGE}; path=/; SameSite=Lax`;
    }
  }, [searchParams]);

  return null; // 零 UI 组件
}

/**
 * 读取分销员 Cookie 值
 * 供 CartSidebar 等组件在 Checkout 时调用
 */
export function getAffiliateCookie(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^| )' + AFFILIATE_COOKIE + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}
