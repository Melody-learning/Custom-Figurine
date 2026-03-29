---
title: Seamless Auth Intercept Modal
status: IMPLEMENTED & ARCHIVED
date: 2026-03-14
---

# Seamless Auth Intercept Modal

## Context
When an unauthenticated user attempts to initiate the 3D Generation Pipeline in the CustomFigurine studio, redirecting them to a separate `/login` page severely disrupts the user journey, increasing friction and drop-off rates. The user loses spatial context of the image they just uploaded.

## Goal
Implement a centralized `<LoginModal />` that gracefully intercepts protected actions (like starting a 3D render) by overlaying a premium authentication interface over the current viewport, maintaining background context and executing the Auth flow without a hard page reload.

## Proposed Architecture

### 1. The `<LoginModal />` Component
Extract the beautiful UI logic currently residing in `src/app/login/page.tsx` into a reusable client component: `src/components/auth/LoginModal.tsx`.
- Include the Google OAuth button and standard Email Magic Link login.
- Support an `isOpen` and `onClose` prop.
- Wrap content in a Radix UI or Framer Motion powered Dialog/Modal wrapper for smooth enter/exit animations.

### 2. Integration in `useStore` (Global State)
Since authentication prompts might be needed from various places (e.g., trying to check out an empty cart), manage the modal's visibility via the existing global Zustand store (`@/lib/store.ts`).
- Add `isLoginModalOpen: boolean;`
- Add `setLoginModalOpen: (open: boolean) => void;`

### 3. Modifying `CustomizePage` (`page.tsx`)
Instead of `router.push('/login')`, update the `handleGenerate` function to trigger the modal:
```typescript
if (!session) {
  setLoginModalOpen(true);
  return;
}
```

### 4. Handling Auth Callbacks
- Ensure Google login callbacks return the user directly back to the active `/customize` route seamlessly.
- For Email Magic Links, the user is temporarily diverted, but the existing `sessionStorage` mechanism ensures their uploaded canvas state is restored upon return.

## Impact & Traceability
- **UX Boost**: Uninterrupted flow; the user's uploaded photo remains fully visible in the blurred background.
- **Conversion**: Eliminates the high drop-off associated with full page redirects.
- **Spec Adherence**: Follows the application's premium UI/UX standard and component-based modularity.

---
## 实施结果 (Resolution)
**状态**: ✅ 完整实现并归档。
**备注**: `LoginModal` 已成功在全局抽离并接管登录拦截逻辑，通过 Zustand `setLoginModalOpen` 调起，且样式彻底对齐了全局 `var(--)` 颜色变量。Email 回调的 `callbackUrl` 重定向 Bug 也一并解决。
