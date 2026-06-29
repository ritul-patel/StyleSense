# Changelog

All notable changes to StyleSense are documented here.

This project follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) conventions and [Semantic Versioning](https://semver.org/).

---

## [Unreleased]

### In Progress
- Outfit builder with occasion-based filtering
- Photo-based skin tone detection via Python/MediaPipe

---

## [0.1.0] — 2026-06

### Added

#### Core Analysis
- Manual skin tone + undertone selection (light/medium/dark × warm/cool/neutral)
- Photo upload flow with Cloudinary image storage
- Rule-based color recommendation engine — maps 9 tone/undertone combinations to color palettes
- Result page displaying best colors, colors to avoid, and outfit suggestions

#### AI Pipeline
- Gemini 2.5 Flash integration for product metadata generation
- Structured JSON schema output (`responseSchema`) — guaranteed conformant JSON from Gemini
- Retry logic with detailed per-request logging (`[gemini:req#N]`)
- Metadata validation via shared `validateMetadata()` function

#### Recommendation Engine
- 7-dimension product scoring engine (color, season, undertone, occasion, style, material, formality)
- Per-product score (0–100), plain-English `reasons[]`, and `negatives[]`
- Works entirely from database product metadata — no hardcoded UI rules

#### Backend API
- `POST /api/v1/analysis/upload` — photo upload and analysis
- `POST /api/v1/analysis/manual` — manual skin tone + undertone analysis
- `GET /api/v1/analysis/result/:id` — fetch analysis result
- `GET /api/v1/recommendations` — scored product recommendations
- `GET /api/v1/products` — product catalog
- `GET/POST /api/v1/wardrobe` — virtual wardrobe management
- `GET/POST /api/v1/saved-outfits` — bookmark outfits
- `GET/PUT /api/v1/profile` — user style profile
- `POST /api/v1/feedback` — user feedback
- Admin routes: `/api/v1/admin/*` for product import, metadata, images

#### Image Pipeline
- Download with exponential backoff retry (3 attempts)
- SSRF protection via `validateImageUrl()` — blocks private/loopback IPs
- Sharp processing: resize to 1200×1600, convert to WebP (quality 82), auto-rotate + EXIF strip
- SHA-256 content hash for deduplication — prevents re-upload of identical images
- Immutable cache headers (`Cache-Control: public, max-age=31536000, immutable`)

#### Authentication
- Supabase Auth — email/password + Google OAuth
- JWT verification middleware on all protected routes
- Password reset via email with custom Supabase email templates

#### Frontend
- Next.js 16 App Router with TypeScript
- Tailwind CSS 4 for styling
- Framer Motion page transitions and micro-animations
- Lenis smooth scroll
- Analysis, Result, Wardrobe, Outfit, Discover, History pages
- Admin panel for product import and metadata QA
- Auth pages: login, signup, forgot password, reset password

#### Security
- Helmet.js security headers
- CORS allowlist (`stylesense.co.in` + localhost in dev)
- Rate limiting: 100 req/min general, 10 req/min on analysis routes
- Zod validation on all API request bodies
- No secrets in source — all loaded from environment variables

#### Observability
- Sentry error tracking on client and server with source map upload
- PostHog product analytics on client
- Vercel Speed Insights
- Structured request logging middleware

#### Performance
- Turbopack for fast local development
- AVIF + WebP image optimization via `next/image`
- 1-year immutable cache on static assets and product images
- `optimizePackageImports` for heavy dependencies (framer-motion, supabase, lucide-react)
- Compression offloaded to Vercel CDN (`compress: false` in Next.js config)

#### Developer Experience
- Monorepo structure (`/client`, `/server`) with concurrent dev scripts
- `node-pg-migrate` for SQL migrations
- Jest unit tests for the recommendation engine
- `.env.example` files for both client and server

---

*Older development history is tracked in git commit log.*
