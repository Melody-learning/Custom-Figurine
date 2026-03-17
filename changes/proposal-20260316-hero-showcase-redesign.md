# Proposal: Hero Section Redesign — Showcase Carousel (2026-03-16)

## 1. Goal Description
Redesign the Homepage Hero Section from the current static "image slider + text" layout to a modern, premium "Full-Screen Showcase + Bottom Thumbnail Carousel" pattern with linked switching animations.

**Reference**: Classic parallax card carousel design (see attached reference).

**Key Requirements**:
- Full-screen visual showcase area that transitions between 4 business scenarios.
- Bottom thumbnail carousel with horizontal scrolling and left/right arrow controls.
- Linked interaction: clicking a thumbnail switches the main showcase with smooth fade/slide transitions and staggered text animations.
- Modern, minimalist, premium feel (潮玩/定制电商 style).
- **Easy to "uninstall"**: Self-contained component, no changes to existing sections below the hero.

## 2. Business Data (4 Scenarios)
| # | Scene | Title | Description |
|---|-------|-------|-------------|
| 1 | Children's Doodles | 儿童涂鸦 | 将孩子们天马行空的画作，化为触手可及的童年纪念 |
| 2 | Special Gifts | 专属礼物 | 为心爱的人定制独一无二的专属形象，定格感动瞬间 |
| 3 | Game Characters | 游戏角色 | 把你在虚拟世界中的无敌神装角色，完美复现到现实桌面 |
| 4 | Commemorative Moments | 时光纪念 | 无论是毕业、婚礼还是全家福，用立体的方式留下永恒回忆 |

## 3. Proposed Changes
- `[NEW]` `src/components/home-themes/HeroShowcase.tsx` — Standalone showcase component
- `[NEW]` `public/images/hero/*.png` — 4 AI-generated scenario images
- `[MODIFY]` `src/components/home-themes/DefaultHome.tsx` — Replace the old hero section with `<HeroShowcase />`

## 4. Uninstall Strategy
To revert: delete `HeroShowcase.tsx`, remove its import from `DefaultHome.tsx`, and restore the old hero `<section>` block. All images live in a separate `/images/hero/` directory.

## 5. Verification Plan
- Visual inspection at desktop and mobile viewports.
- Verify carousel switching, fade animations, staggered text entry.
- Verify CTA button links work.

## 6. V2 UX Refinements (2026-03-16 Feedback)
**Problem**: User noted the layout "feels weird" (某些地方怪怪的) after initial UX polish.
**UX Analysis**:
1. **Alignment Clash**: Main text is left-aligned, but the thumbnail carousel is center-aligned at the bottom. This creates a split visual focus.
2. **Typography Scale**: The `lg:text-7xl` font size is too dominant, competing with the premium 3D imagery instead of complementing it.
3. **Thumbnail Aspect Ratio**: The `aspect-[3/4]` (tall) thumbnails block too much of the bottom image area.
4. **CTA Visual Weight**: The solid white CTA button and "Learn More" link feel unbalanced.

**Solutions**:
- **Unify Alignment**: Move the thumbnail carousel to the bottom-left, aligning it horizontally with the main text content, creating a strong, unified left-edge reading line.
- **Refine Typography**: Scale down the main title to `md:text-5xl lg:text-6xl` allowing the background artwork to breathe.
- **Adjust Thumbnails**: Change thumbnail aspect ratio to `video` (16:9) or landscape, to reduce vertical height and show more of the main image.
- **Dark Mode Polish**: Enhance the glassmorphism strictly on the left side, keeping the right side completely clear for the 3D figurine display.

## 7. V3 Layout Fixes (2026-03-16 Feedback)
**Problem**: User reported 3 specific issues: (1) Hero content does not align with body sections, (2) gradient mask has a visible hard edge, (3) left-right visual weight is unbalanced.

**Root Cause Analysis**:
1. Hero used `px-6/px-16/px-24` while body uses `container mx-auto px-4` — different grid systems.
2. `w-full md:w-[65%]` gradient created an abrupt cut-off at 65% of the viewport.
3. `max-w-2xl` on the carousel constrained thumbnails to the left, leaving the right empty.

**Fixes**:
- Replace Hero padding with `container mx-auto px-4` to match body alignment.
- Replace hard-edged gradients with smooth full-width `inset-0` gradients that fade naturally.
- Remove `max-w-2xl` from the carousel so thumbnails span the full container width.

## 8. V4 Layout Polish & Image Specs (2026-03-16 Feedback)
**Problem**: (1) The left arrow in the thumbnail row pushed thumbnails out of alignment. (2) Need exact image specifications for external generation.

**Fixes**:
- **Arrow Relocation**: Moved `<` and `>` arrow buttons from the thumbnail row down into the counter bar, creating a clean `‹ prev | 04 / 04 | next ›` layout.
- **Scroll Offset Fix**: Changed programmatic scrolling from `scrollIntoView({inline: 'center'})` to `inline: 'nearest'` to stop the browser from adding horizontal padding when centering active thumbnails.
- **Image Spec**: Created `hero_image_spec.md` with explicit 16:9 2K dimensions and composition rules (subject strictly right-aligned, left 40% reserved for text overlay).

## 9. V5 Debug Tools (2026-03-16 Temporary Requirement)
**Problem**: The user needs a quick way to test generated images manually without modifying code or manually replacing files in the `public` directory, as the generated images often fail to meet the strict layout constraints.

**Solution**:
- Implemented a temporary, easily uninstallable React component (`HeroDebugUploader`) that displays a floating button on the Hero section.
- The component allows uploading local images to replace the background or thumbnail for any of the 4 scenes in real-time.
- State management for `SCENES` is temporarily moved to local state in `HeroShowcase` to support live updates.

**Uninstall Strategy**:
- Delete the `<HeroDebugUploader />` component import and usage in `HeroShowcase.tsx`.
- Revert the `scenes` state back to the static `SCENES` constant.
## 10. V6 Image Quality Specifications (2026-03-16 Feedback)
**Problem**: The user noticed that the background images look slightly blurry on the 2K screen. The provided original image files were very small (ranging from 50KB to 200KB), indicating high compression which destroys details on large monitors.

**Solution**:
- Updated `hero_image_spec_v2.md` to establish strict file size and resolution standards for the 8:3 Hero images.
- A single 2560x960 image saved as high-quality JPG/WebP should typically be between **800KB and 2MB** to maintain crispness on large screens without severely impacting load times.
- Recommended format: WebP or high-quality JPG (85%+ quality setting).
