# StyleSense - Performance Audit V2 (Evidence-Based)

**Date**: 2026-06-29  
**Target**: Lighthouse 90+ Mobile, 95+ Desktop, LCP <2.5s, FCP <1.8s  
**Method**: Source code inspection - no runtime measurements available

---

## Current Architecture Summary

| Layer | Technology | Status |
|-------|-----------|--------|
| Framework | Next.js 16.2.1 (App Router) | Server + Client hybrid |
| React | 19.2.4 | Latest |
| CSS | Tailwind CSS v4 | JIT, small output |
| Fonts | next/font/google (Inter, Manrope, Space Grotesk) + Material Symbols (external) | Partially optimized |
| Images | next/image with AVIF/WebP | Enabled (previously had `unoptimized`) |
| Analytics | PostHog + Vercel Analytics + Sentry | Heavy |
| Hosting | Vercel (client) + Render (server) | Edge CDN |

---

## FINDING 1: Material Symbols Font (~200-300KB woff2)

**File**: `layout.tsx` lines 117-124  
**Evidence**: External Google Font loaded via JS-injected `<link rel="stylesheet">` + `<link rel="preload" as="style">`

**Problem**: The preload triggers an early fetch of the CSS, then the inline script creates another `<link>` - effectively loading the same resource twice. The font file itself (~200KB woff2 variable font) is still fetched from `fonts.gstatic.com`.

**Impact**: +200-400ms on FCP (network round-trip to Google → download CSS → download woff2)  
**TBT Impact**: Minimal (async)  
**LCP Impact**: None (non-blocking)

**Estimated Lighthouse Impact**: -5 to -10 points (Performance) due to extra network requests during critical path

---

## FINDING 2: PostHog SDK Initialized Synchronously at Module Level

**File**: `src/app/providers/PostHogProvider.tsx` line 9  
**Evidence**: `posthog.init()` runs at module evaluation time via top-level `if (typeof window !== "undefined")` block

**Problem**: PostHog (~22KB gzip) initializes immediately during hydration. It sets up session recording, feature flags, and network connections on every single page load - even pages that don't track any custom events.

**Impact**: +50-100ms TBT (main thread busy during init)  
**Bundle Impact**: ~22KB gzip in shared client bundle  

**Estimated Lighthouse Impact**: -3 to -5 points (TBT contribution)

---

## FINDING 3: Framer Motion in Global Shared Bundle

**File**: `src/components/motion/index.tsx` (imported by many pages)  
**Evidence**: Re-exports `motion`, `AnimatePresence`, `useReducedMotion` from framer-motion

**Problem**: framer-motion (~32KB gzip) is included in the shared chunk because it's used by:
- FeedbackWidget (every page)
- AuthGateModal (analysis page)
- HomePageClient (landing)
- ScrollStagger/ScrollReveal (discover, wardrobe, history, landing)

Since FeedbackWidget imports framer-motion and loads on every page via layout.tsx, the entire framer-motion bundle is in the shared chunk.

**Impact**: +32KB in first-load JS for every route  
**Estimated Lighthouse Impact**: -5 to -8 points on mobile (parse/compile time)

---

## FINDING 4: Static Product Data (43KB raw) in Client Bundle

**Files**: 
- `src/data/products.ts` - 22.3KB (49 products with full URLs)
- `src/data/outfitProducts.ts` - 13.9KB (210 outfit-product mappings)
- `src/data/outfits.ts` - 7KB (30 outfits)

**Evidence**: Imported by discover page, wardrobe page, outfit/[id] page, RelatedLookCard

**Problem**: This 43KB of static JSON data is compiled into JavaScript and sent to every page that imports it. After gzip: ~10KB. Pages affected:
- `/discover` - imports outfits + outfitProducts (which imports products) = 43KB
- `/outfit/[id]` - imports all three = 43KB
- `/wardrobe` - imports products = 22KB

**Impact**: +10KB gzip per affected route, +parse time  
**Estimated Lighthouse Impact**: -2 to -4 points

---

## FINDING 5: 5 Nested Client Providers Wrapping All Routes

**File**: `src/app/providers.tsx`  
**Evidence**: AuthProvider → PostHogProvider → LenisProvider → SavedOutfitsProvider → WardrobeProvider

**Problem**: Every page is wrapped in 5 client-side providers. This means:
1. The ENTIRE page tree must hydrate (no streaming benefit)
2. WardrobeProvider makes 4 API calls on mount (even on /about, /terms)
3. LenisProvider starts a permanent RAF loop
4. PostHog initializes session recording

**Impact**: +200-400ms hydration time on every page  
**Estimated Lighthouse Impact**: -5 to -10 points (TBT + TTI)

---

## FINDING 6: Lenis RAF Loop Running Permanently

**File**: `src/lib/lenis.tsx` line 48-51  
**Evidence**: `requestAnimationFrame(raf)` runs continuously from mount

**Problem**: Continuous RAF loop ticks every 16ms even when user isn't scrolling. On mobile, this adds constant CPU work that affects INP and battery life.

**Impact**: +2-5ms per frame of CPU time, degrades INP  
**Estimated Lighthouse Impact**: -2 to -3 points (TBT/INP)

---

## FINDING 7: FeedbackWidget Loads framer-motion on Every Page

**File**: `src/app/components/FeedbackWidget.tsx` line 4  
**Evidence**: `import { motion, AnimatePresence } from "framer-motion"`

**Problem**: Because FeedbackWidget is imported directly in layout.tsx (Server Component), it and its framer-motion dependency are included in the shared client bundle that loads on EVERY route. The widget is interactive-only (button → modal) but its animation library ships regardless.

**Impact**: Forces framer-motion into shared chunk (+32KB)  
**Estimated Lighthouse Impact**: Already counted in Finding 3

---

## FINDING 8: HeroScannerCard Uses WebGL + Complex Animation

**File**: `src/app/components/HeroScannerCard.tsx`  
**Evidence**: Custom WebGL shader, 6 avatar images, setInterval loop, canvas rendering

**Problem**: On the landing page, this component:
- Creates a WebGL context with custom shaders
- Loads 6 JPG images (35-49KB each)
- Runs setInterval for avatar cycling
- Maintains continuous canvas render

**Impact on landing page**: +150-300ms TBT (shader compilation + image decode)  
**Estimated Lighthouse Impact**: -5 to -8 points on landing page mobile

---

## FINDING 9: Discover Page Renders 30 Items Immediately

**File**: `src/app/discover/page.tsx`  
**Evidence**: `filteredLooks.map(...)` renders all 30 outfit cards in one pass

**Problem**: All 30 Image components mount simultaneously. Even with `loading="lazy"` on items 5-30 and `priority` on items 1-4, the browser still:
- Creates 30 DOM nodes with intersection observers
- Evaluates 30 ScrollStaggerItem motion components
- Parses style attributes for all cards

**Impact**: +100-200ms TBT on initial render  
**Estimated Lighthouse Impact**: -3 to -5 points

---

## FINDING 10: Duplicate `preconnect` for fonts.gstatic.com

**File**: `layout.tsx` line 116  
**Evidence**: `<link rel="preconnect" href="https://fonts.gstatic.com">` in head

**Problem**: Since text fonts use `next/font/google` (self-hosted), the preconnect to fonts.gstatic.com is ONLY needed for Material Symbols. Having it is correct for that purpose, but the `<link rel="preload" as="style">` already establishes the connection implicitly. The explicit preconnect is redundant.

**Impact**: Minimal (~10ms wasted DNS lookup if not needed)  
**Estimated Lighthouse Impact**: 0 points

---

## FINDING 11: `html2canvas` Still in package.json

**File**: `package.json`  
**Evidence**: `"html2canvas": "^1.4.1"` (~44KB gzip)

**Current status**: Already dynamic-imported in outfit/[id] page (good). But the package is still in dependencies - Next.js may include it in vendor chunk analysis. Since it's dynamic-imported, it won't be in the initial bundle. **Not an actual issue.**

---

## FINDING 12: Sentry Wraps Entire Build

**File**: `next.config.ts` lines 50-68  
**Evidence**: `withSentryConfig` wraps the config in production

**Impact**: Sentry adds ~30KB gzip to the client bundle for error tracking + performance monitoring. The `tunnelRoute: "/monitoring"` adds a server-side proxy route.

**Estimated Lighthouse Impact**: -3 to -5 points (bundle size + initialization)

---

## Per-Page Analysis

### Landing Page `/`

| Metric | Source | Estimated |
|--------|--------|-----------|
| LCP Element | h1 "Know your colors..." | Text (fast with swap fonts) |
| JS Bundle | HomePageClient + react-scroll + framer-motion + providers | ~100KB gzip |
| Images | 6 avatar JPGs (35-49KB each) via `<img>` | ~250KB total |
| Fonts | Inter + Manrope (self-hosted) + Material Symbols (async) | ~60KB woff2 |
| API Calls | 0 (static page) + wardrobe hydration if logged in | 0-4 |
| TBT Contributors | WebGL shader compile, PostHog init, framer-motion parse | ~300ms |

### Analysis Page `/analysis`

| Metric | Source | Estimated |
|--------|--------|-----------|
| LCP Element | Upload dropzone or h1 heading | Text/container |
| JS Bundle | AuthGateModal (framer-motion) + Navbar + providers | ~80KB gzip |
| Images | None (user uploads only) | 0 |
| API Calls | 0 initially (upload on action only) | 0 |
| TBT Contributors | PostHog init, provider hydration | ~150ms |

### Discover Page `/discover`

| Metric | Source | Estimated |
|--------|--------|-----------|
| LCP Element | First outfit image (with priority) | Image from Supabase Storage |
| JS Bundle | static data (43KB raw) + framer-motion + posthog + Navbar | ~120KB gzip |
| Images | 30 outfit WebP images (~50-80KB each, served via Next.js optimization) | First 4 eager, rest lazy |
| API Calls | 0 (static data) + saved-outfits if logged in | 0-1 |
| TBT Contributors | 30 ScrollStaggerItem mounts, static data parse | ~200ms |

### Wardrobe Page `/wardrobe`

| Metric | Source | Estimated |
|--------|--------|-----------|
| LCP Element | First product card image | Product image from CDN |
| JS Bundle | products.ts (22KB) + framer-motion + providers | ~110KB gzip |
| Images | Up to 49 product images | Lazy loaded |
| API Calls | fetchProductsLegacy (200 products) + 4 wardrobe hydration | 5 |
| TBT Contributors | useMemo over 200 products, provider hydration | ~250ms |

---

## Ranked Optimization Plan (by ROI)

### CRITICAL (Highest Impact, Achievable)

| # | Optimization | File | Expected Impact | Difficulty | Risk |
|---|-------------|------|-----------------|------------|------|
| 1 | **Remove Material Symbols preload** - it duplicates the script-injected load | `layout.tsx` L113-117 | -1 network request, -100ms | Trivial | None |
| 2 | **Lazy-initialize PostHog** - defer `posthog.init()` until after hydration via `requestIdleCallback` | `PostHogProvider.tsx` | -50ms TBT, -22KB from critical path | Low | Low |
| 3 | **Move FeedbackWidget to a client-only wrapper with lazy import** - prevents framer-motion in shared chunk | `layout.tsx` + new wrapper | -32KB from shared chunk | Medium | Low |

### HIGH (Strong Impact)

| # | Optimization | File | Expected Impact | Difficulty | Risk |
|---|-------------|------|-----------------|------------|------|
| 4 | **Limit Discover page initial render to 12 items** + "Load More" button | `discover/page.tsx` | -60% DOM nodes, -150ms TBT | Low | Low |
| 5 | **Defer WardrobeProvider hydration** - only call APIs after `requestIdleCallback` or on wardrobe route | `WardrobeContext.tsx` | -4 API calls on non-wardrobe pages | Medium | Medium |
| 6 | **Replace Lenis RAF with event-driven updates** - use passive wheel listener instead of continuous RAF | `lenis.tsx` | -2ms/frame CPU, better INP | Medium | Medium |

### MEDIUM (Moderate Impact)

| # | Optimization | File | Expected Impact | Difficulty | Risk |
|---|-------------|------|-----------------|------------|------|
| 7 | **Move static product data to a JSON file** served as static asset (not JS) | `src/data/*.ts` → `public/data/*.json` | -10KB from route bundles | Medium | Medium |
| 8 | **Add `fetchPriority="low"` to avatar images** in HeroScannerCard (below-fold on mobile) | `HeroScannerCard.tsx` | -100ms LCP (stops competing with fonts) | Trivial | None |
| 9 | **Remove duplicate preconnect** to fonts.gstatic.com | `layout.tsx` L116 | -1 connection, cleaner waterfall | Trivial | None |
| 10 | **Defer Sentry initialization** - use `Sentry.init()` in `afterInteractive` strategy | Sentry config | -30KB from critical path | Medium | Low |

### LOW (Cleanup, Diminishing Returns)

| # | Optimization | File | Expected Impact | Difficulty | Risk |
|---|-------------|------|-----------------|------------|------|
| 11 | Remove `react-scroll` - replace with native CSS `scroll-behavior: smooth` | `HomePageClient.tsx` | -4KB (route-scoped, minimal) | Medium | Medium |
| 12 | Use `React.memo` on ProductCard (renders 30-49 times) | `ProductCard.tsx` | -50ms re-render on filter change | Trivial | None |
| 13 | Add `will-change: transform` to scroll-animated elements | motion components | -jank on low-end mobile | Trivial | None |
| 14 | Remove unused `@vercel/analytics` import if Vercel auto-injects | `layout.tsx` | -1KB | Trivial | Low |

---

## Phased Implementation Plan

### Phase 1 - Quick Wins (30 minutes, +10-15 Lighthouse points)

1. Remove duplicate Material Symbols preload
2. Remove redundant preconnect
3. Lazy-initialize PostHog (requestIdleCallback)
4. Limit Discover initial render to 12 items
5. Add fetchPriority="low" to HeroScannerCard avatars

### Phase 2 - Bundle Optimization (1-2 hours, +5-8 points)

6. Move FeedbackWidget framer-motion out of shared chunk
7. Defer WardrobeProvider API calls on non-wardrobe pages
8. React.memo on ProductCard

### Phase 3 - Rendering Optimization (1-2 hours, +3-5 points)

9. Replace Lenis continuous RAF with idle-based updates
10. Move static data to JSON (or eliminate from discover/outfit bundles)
11. Add will-change hints to animated elements

### Phase 4 - Network Optimization (30 minutes, +2-3 points)

12. Defer Sentry to afterInteractive
13. Remove react-scroll if Lenis covers the use case

### Phase 5 - Long-term (Future sprint)

14. Replace ALL Material Symbols with Lucide icons (eliminates 200KB+ external font entirely)
15. Implement virtual scroll on Discover grid for 50+ items
16. Server-side render Discover page with RSC data fetching

---

## Expected Final Scores (After All Phases)

| Metric | Current Est. | After Phase 1 | After All |
|--------|-------------|---------------|-----------|
| Desktop Performance | 85-92 | 92-96 | 95-98 |
| Mobile Performance | 70-82 | 82-90 | 90-95 |
| FCP | 1.2-1.8s | 0.9-1.4s | 0.8-1.2s |
| LCP | 1.8-2.8s | 1.5-2.2s | 1.2-1.8s |
| TBT | 300-500ms | 150-250ms | 100-180ms |
| INP | 200-400ms | 150-250ms | 100-200ms |

---

## Items NOT Recommended

| Item | Reason |
|------|--------|
| Remove framer-motion entirely | Core design system - animations are a product requirement |
| Remove PostHog entirely | Business requirement for analytics/session replay |
| Remove Sentry entirely | Error tracking required for production Beta |
| SSG the landing page | Uses `react-scroll` (client) + dynamic HeroScannerCard - would require refactor |
| Remove Lenis entirely | Smooth scroll is a UX differentiator - optimize, don't remove |
| Remove SpeedInsights | <1KB, negligible impact |
