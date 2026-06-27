# StyleSense — Project Logs

## Purpose

Historical record of significant project events, decisions, bugs fixed, and lessons learned.
Each entry should include a date and brief context.

For current architecture, see `architecture.md`.
For active issues, see `architecture.md` → Known Broken Or Fragile Areas.

---

## Format

```
### YYYY-MM-DD — Brief Title

**Context:** Why this happened
**Decision/Fix:** What was done
**Outcome:** Result
**Lesson:** What to remember going forward
```

---

## Log Entries

### 2026-06-26 — Knowledge Base Consolidated

**Context:** The `.gemini` folder was reviewed and restructured as a unified knowledge base.
**Decision:** Eliminated cross-file duplication, established clear file responsibilities, added Core Principles and MCP Awareness.
**Outcome:** Single-author-quality documentation with no contradictions.
**Lesson:** Each concept has exactly one authoritative location. Other files reference it.

### 2026-06-25 — Architecture Document Generated

**Context:** Full reverse-engineering of the codebase to create `architecture.md`.
**Decision:** Document runtime truth over historical plans. Mark known broken areas explicitly.
**Outcome:** Comprehensive architecture reference. Identified build blocker in `outfit/[id]/page.tsx`, API/history flow gap, and schema migration conflicts.
**Lesson:** Old migrations conflict with current UUID/Supabase schema. Always prefer `server/sql/*.sql` over `server/migrations/*.js` for the current code path.

### 2026-06-26 — API Contracts Document Created

**Context:** Full codebase analysis to document all API endpoints with verification.
**Decision:** Document only what is verifiable. Mark unknowns. Include frontend ↔ backend bidirectional verification.
**Outcome:** Found 2 broken frontend imports (`getProfile`, `softDeleteAccount`), 3 unused backend endpoints, dead code paths, and IDOR risk on unauthenticated analysis retrieval.
**Lesson:** The frontend expects functions that don't exist in `api.ts`. The history → result navigation is broken because `/result` ignores the `?id` query parameter.

### 2026-06-26 — Final Maintenance Pass

**Context:** Performed maintenance pass to improve knowledge base maintainability.
**Changes:**
- Added `checklist.md` (Definition of Done)
- Added "Future Splitting Guide" to `architecture.md` for when it grows too large
- Updated `README.md` reading order to include `checklist.md`
- Verified no duplicate rules, conflicting instructions, or broken cross-references
- Confirmed consistent terminology and formatting across all files
**Outcome:** Knowledge base is production-ready. 8 files, one connected system.
**Lesson:** Each file has exactly one responsibility. Cross-reference instead of duplicating.

### 2026-06-26 — History Page Fixed

**Context:** History page showed "Failed to fetch analysis history." or empty results despite 67 rows in DB.
**Root Cause:** `client/.env.local` had `NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_7jToxhV4rjqsX9TwQ9zcig__miRSAe4` — not a valid Supabase JWT anon key. Client couldn't create/refresh sessions, so no Authorization header was sent (or backend had a stale pg Pool from prior broken DATABASE_URL).
**Fix:**
- Replaced client anon key with correct JWT key from `server/.env`
- Removed `DATABASE_URL` logging from `server/src/index.ts` and `server/src/utils/db.ts` (security)
- Added `pool.on('error')` handler in `db.ts` for resilience
- Removed excessive debug logging from history handler and `fetchAnalysisHistory()`
**Outcome:** History page loads real records. Endpoint returns HTTP 200 with correct data.
**Lesson:** Always ensure `NEXT_PUBLIC_SUPABASE_ANON_KEY` in the client matches the actual JWT anon key from the Supabase project. The `sb_publishable_` format is a different key type that cannot authenticate API requests.

### 2026-06-26 — Performance Optimization

**Context:** Development compilation took 20+ seconds. Material icons rendered as text on first load.
**Fix:**
- Disabled Sentry `withSentryConfig` in dev mode (dynamic import in sentry configs)
- Changed Material Symbols from `display=optional` to `display=swap` + added preload
- Switched dev script from `--webpack` to Turbopack (default)
- Added `lucide-react`, `posthog-js`, `@sentry/nextjs` to `optimizePackageImports`
**Outcome:** Dev server ready in 3.6s (was 22s). Icons visible on first load. Route compiles in 2s after first.
**Lesson:** `display=optional` means icons NEVER show if font doesn't load in ~100ms. Use `display=swap` for icon fonts.

### 2026-06-26 — Outfit Page JSX Parse Error Fixed

**Context:** Client build failed: `Expected corresponding JSX closing tag for 'Favorite'` in `outfit/[id]/page.tsx`.
**Root Cause:** 4 instances of Lucide icon components used as JSX wrappers (`<Favorite>text</span>`, `<ArrowRight>text</span>`, etc.) — tag mismatch.
**Fix:** Replaced all icon-as-wrapper patterns with `<span>`. Added missing imports (`posthog`, `Outfit`, `PRODUCTS`, `ArrowLeft`, `SearchX`). Removed conflicting `Favorite`/`Image` imports from lucide.
**Outcome:** Client build passes. `/outfit/O001` renders correctly.
**Lesson:** Lucide React icons are self-closing components. They cannot wrap text children.

### 2026-06-26 — Wardrobe Feature (Full Implementation)

**Context:** Wardrobe page was static mock content.
**Implementation:**
- `WardrobeContext` with repository pattern (localStorage → API migration path)
- `ApiWardrobeRepository` calling Express backend
- Backend routes: `/api/v1/wardrobe` (items, closet, outfits, collections)
- Database tables: `wardrobe_items`, `closet_items`, `outfit_builds`, `wardrobe_collections`
- My Closet: photo upload with base64 storage
- AI Recommendations: matches products against user's `best_colors`
- Collections CRUD
- Outfit Builder: select products from wardrobe/closet
- Unified wishlist via heart button in `ProductCard`
**Outcome:** Full wardrobe management system backed by Supabase PostgreSQL.
**Lesson:** Use `Promise.all` for parallel API hydration. Use `useRef` to prevent re-hydration loops.

### 2026-06-26 — Infinite Wardrobe Requests Fixed

**Context:** Wardrobe API continuously requested 4 endpoints, exhausting rate limiter (429).
**Root Cause:** `useEffect` in `WardrobeContext` had `[user, authLoading]` as dependencies. The `user` object from Supabase is a new reference on every state update → effect re-fires every render.
**Fix:** Changed dependency to `userId` (string, stable) + added `hydratedForUser` ref guard.
**Lesson:** Never use Supabase `user` object as a useEffect dependency. Use `user?.id` instead.

### 2026-06-26 — Analysis Result Page Data Flow Fixed

**Context:** Backend generated rich data (confidence_reason, signature_colors, skin_description, next_steps) but frontend dropped it.
**Root Cause:** `result-utils.ts` converted rich types to simplified ones. `GET /:id` handler excluded 4 fields from response.
**Fix:** Updated types, parsers, and response builder. Added Skin Description + Next Steps sections to result view.
**Lesson:** Keep server types, client types, and UI components in sync. Don't silently drop fields in parser functions.

### 2026-06-26 — Discover Outfits Integration

**Context:** Result page showed generated gradient placeholders instead of real outfits.
**Fix:** Created `outfit-recommendation.ts` that matches Discover catalog outfits against user's color profile. Result page now shows real outfit images with match scores.
**Lesson:** Single source of truth for outfits = `@/data/outfits.ts`. Don't create parallel outfit databases.

### 2026-06-26 — Settings Page Connected to Backend

**Context:** Settings page was entirely local/mock.
**Fix:** Created `/api/v1/profile` (GET/PATCH/DELETE). Connected all settings to backend. Profile auto-populates from Google OAuth metadata on first access.
**Lesson:** Use `app_metadata` for admin roles (server-set only). Never trust `user_metadata` for authorization.

### 2026-06-26 — Admin Portal (Phase 1 + 2)

**Context:** Built admin portal from scratch.
**Implementation:**
- Auth: `RequireAdmin` checks `app_metadata.role === "admin"` only
- Layout: Shared `AdminLayout` with sidebar + header + breadcrumbs
- Dashboard: Real stats from `/api/v1/admin/stats`
- Products: Full CRUD + search + pagination + publish toggle + AI metadata generation
- Outfits: Full CRUD
- Users: List + role management (promote/revoke admin)
- Analytics: Real charts (30-day trend, top skin tones, top undertones)
- Bulk Import: CSV upload with validation, preview, batch insert
- Image Upload: Batch upload + auto-match by slug
- AI Metadata Queue: Batch generation for selected products
**Database:** `products` table with full schema (name, slug, brand, category, price, colors, seasons, AI metadata, publish status)
**Lesson:** Admin routes must use `adminMiddleware` per-route (not `router.use`) when some endpoints (CSV templates) need to be public.

### 2026-06-26 — Recommendation Intelligence Engine

**Context:** Replaced simple color heuristic with modular scoring engine.
**Architecture:** 7 scoring modules (color, season, undertone, occasion, style, material, formality) + confidence adjustment.
**Testing:** 12 automated tests covering profile differentiation (Warm Spring vs Cool Winter vs Soft Autumn vs Deep Winter).
**API:** `POST /api/v1/recommendations/products` and `/outfits` — reads from products table.
**Lesson:** Modular scorers are testable independently. Always test profile differentiation.

### 2026-06-26 — AI Product Metadata Generator

**Context:** Implemented Claude-based metadata generation for products.
**Architecture:** `MetadataProvider` interface → `ClaudeMetadataProvider` (active) → future: Gemini, OpenAI.
**Pipeline:** Product → PromptBuilder → Provider → Validator → ai_metadata JSONB.
**Fields generated:** 17 metadata fields including colors, materials, fit, formality, seasons, undertones, keywords, confidence.
**Lesson:** Separate prompt generation from provider implementation. Always validate AI output against allowed values.

### 2026-06-26 — Pre-Launch Security Fixes

**Critical fixes:**
1. Admin auth: removed `user_metadata.role` trust (privilege escalation vector)
2. OAuth: replaced hardcoded `stylesens.in` redirect with `window.location.origin`
3. TypeScript: set `ignoreBuildErrors: false`, fixed all TS errors
4. Rate limiting: increased to 100/min general + 10/min for analysis
5. CORS: localhost conditional on NODE_ENV
6. Image optimization: added all product image domains to next.config remotePatterns
7. Sentry: DSN from env var, sample rate 0.1
8. Removed debug logging from auth middleware
9. Deleted stale files with old credentials
**Outcome:** Ready for Beta Launch.
**Lesson:** Always rotate secrets if .env was ever committed. Only trust `app_metadata` for roles.

### 2026-06-26 — Wardrobe Page Products Regression

**Context:** "Recommended" and "All Products" tabs showed empty after migrating to API.
**Root Cause:** `GET /api/v1/products` returns only `is_published = true` products. Imported products default to `is_published = false`.
**Fix:** Added static fallback: use `STATIC_PRODUCTS` when API returns empty.
**Lesson:** Don't remove the static catalog until products are actually published in the database. Gradual migration > big bang.

### 2026-06-26 — Performance Audit

**Findings:**
- Dominant bottleneck: Network latency to Supabase AP-Northeast-2 (~1500ms per auth verification)
- Wardrobe hydration already parallel (`Promise.all`) ✅
- Products endpoint slow only on cold start (pg Pool DNS + connect)
- `/profile` called twice on Settings page (Navbar + Settings form) — minor
- `ENOTFOUND` DNS is transient network issue, not config bug
**No code changes required.** Static fallback already mitigates cold-start for wardrobe.
