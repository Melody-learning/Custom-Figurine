# Phase 7: Async Generation UX & Vault Integrity Pass

## Background
The transition from a synchronous mock flow to an asynchronous database-backed Vault flow introduced several subtle state management challenges and UX gaps:
1. Users were not explicitly informed that generation was safe to leave in the background.
2. The gallery completed state lacked a clear linkage to the Vault (no "Secured in Vault" badge).
3. Legacy records without reference images sent literal `"null"` strings, breaking frontend image cards.
4. Next.js `Image` components in the Vault threw console layout warnings.
5. Entering the Gallery, completing it, going back, and completing it again created infinite cloned Vault entries due to poor hydration of the `editingVaultAssetId`.

## Implementation Tasks

### 1. Asynchronous Safety Notification
- Added a highly visible, styled `Safe Asynchronous Process` banner within `FigurineGenerationGallery.tsx` during the active rendering state.
- Copy confirms: "You may close this page or lock your phone. The result is automatically saving to your Generation Vault."

### 2. Vault Synchronization Badge (Gallery)
- The static "Render Completed" button inside the Gallery header is now swapped with a pulsing `#00D084` **Secured in Vault** micro-badge.

### 3. `"null"` Image String Quarantine
- Hardened the `cleanB64` pipeline in `FigurineGenerationGallery.tsx` and `handleCheckout` in `GenerationVaultList.tsx`.
- Literal `"null"` strings are coerced to standard `null` primitives, allowing conditional UI components (like the reference picture-in-picture) to correctly collapse themselves instead of displaying a broken `<img>` icon.

### 4. Image Attribute Optimization
- Added `sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"` to the vault list Next.js `Image` tags, satisfying the layout engine and suppressing console overhead.

### 5. Duplicate Asset Clone Wall
- Updated the `onComplete` logic inside `customize/page.tsx`.
- It now waits for the async `saveGeneratedAsset` to return the new `<assetId>`.
- The new ID is immediately injected into the global Zustand store via `setEditingVaultAssetId(res.assetId)`. 
- Any subsequent state changes bridging the `select` and `generate` steps will now correctly identify as a Vault modification, skipping duplicate database creation. 

## End State
The Generation pipeline is fully closed-loop, structurally sound, and communicates its asynchronous nature perfectly to the end user.
