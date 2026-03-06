# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository

This is a.

## Project Overview Headless Shopify e-commerce project for custom figurine sales. Users upload 2D images, AI generates 3D-style renders, and orders are fulfilled offline (3D printing, painting, shipping).

## Architecture

```
Next.js Frontend → Shopify Storefront API (products/payments)
                     ↑
                  AI Image Generation API (to be integrated)
```

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Styling**: Tailwind CSS v4
- **State Management**: Zustand
- **Internationalization**: Custom i18n (EN/ZH)
- **Theme System**: 6 themes (default, neo-brutalist, minimal, elegant, editorial, watercolor)
- **Shopify**: GraphQL Storefront API
- **Icons**: Lucide React

## Commands

```bash
npm run dev      # Start development server at http://localhost:3000
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Key Files

- `src/lib/shopify.ts` - Shopify API client (GraphQL queries for products, checkout)
- `src/lib/store.ts` - Zustand store (cart, AI image generation state)
- `src/lib/i18n.ts` - Translation strings (EN/ZH)
- `src/lib/useTranslation.tsx` - i18n hook and provider
- `src/lib/theme.ts` - Theme configuration
- `src/lib/useTheme.tsx` - Theme hook and provider
- `src/components/Header.tsx` - Navigation with cart, language switcher, theme switcher
- `src/components/Footer.tsx` - Footer
- `src/components/CartSidebar.tsx` - Shopping cart sidebar with checkout
- `src/app/customize/page.tsx` - Multi-step customization flow
- `src/app/page.tsx` - Home page with hero and product sections

## Shopify Integration

Environment variables required (already configured in `.env.local`):
- `NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN` - Your Shopify store domain
- `NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN` - Storefront API access token

## Current Features

1. **Home page** (`/`) - Hero section, scenarios, craftsmanship, process timeline, FAQ
2. **Customize flow** (`/customize`) - 4-step: upload → AI generate → select product → confirm
3. **Cart sidebar** - Add/remove items, quantity control, Shopify checkout redirect
4. **Language switch** - EN/ZH toggle (top-right)
5. **Theme switch** - 6 themes available (top-right)

## Development Notes

- AI image generation is currently mocked (returns uploaded image as-is)
- Translation strings are in `src/lib/i18n.ts`
- Theme config is in `src/lib/theme.ts`
- Shopify products are managed in Shopify admin dashboard
- The project uses the `src` directory convention
- TypeScript is strict; avoid `any` types

## Upcoming Tasks

1. Integrate real AI image generation API
2. UI/UX optimization
3. Configure Shopify payments
4. Order synchronization (optional)
5. SEO optimization
