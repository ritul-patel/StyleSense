# StyleSense

> **AI-powered personal color and style analysis for men.** Upload a photo or select your skin tone, and StyleSense delivers a personalized palette, outfit combinations, and curated product recommendations - in under 60 seconds.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org)
[![Node.js](https://img.shields.io/badge/Node.js-Express-green)](https://expressjs.com)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green)](https://supabase.com)

---

## What Is StyleSense?

Most men buy clothes that don't suit their skin tone. StyleSense solves this with a fast, personalized styling engine that maps your skin tone and undertone to:

- A curated **color palette** (colors to wear + colors to avoid)
- **Outfit combinations** tailored to your tone
- AI-enriched **product recommendations** from a scored catalog
- A **virtual wardrobe** to save and revisit looks

The recommendation engine scores every product across 7 dimensions - color match, season suitability, undertone fit, occasion, style, material, and formality - and returns ranked results with plain-English explanations.

---

## Features

| Feature | Description |
|---|---|
| 🎨 **Color Analysis** | Photo upload or manual skin tone + undertone selection |
| 🤖 **AI Metadata Enrichment** | Gemini 2.5 Flash generates structured product metadata via JSON schema output |
| 🏆 **Scoring Engine** | 7-dimension product scoring engine with weighted relevance |
| 👕 **Outfit Builder** | Curated top-10 outfit combinations for your profile |
| 👔 **Virtual Wardrobe** | Save, organize, and revisit personal outfit picks |
| 🛍️ **Product Discovery** | Catalog of fashion products matched to your style profile |
| 🔐 **Auth** | Supabase Auth with email/password and Google OAuth |
| 📊 **Analytics** | PostHog product analytics + Vercel Speed Insights |
| 🔍 **Error Monitoring** | Sentry for both client and server with source maps |
| ⚡ **Performance** | Turbopack dev, AVIF/WebP images, 1-year asset cache, CDN delivery |
| 🛡️ **Security** | Helmet, CORS allowlist, rate limiting (10 analysis/min), EXIF stripping, SHA-256 image deduplication |
| 📱 **Responsive** | Mobile-first design with smooth scroll (Lenis) and Framer Motion animations |

---

## Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| **Next.js 16** (App Router) | React framework with SSR/SSG |
| **TypeScript 5** | End-to-end type safety |
| **Tailwind CSS 4** | Utility-first styling |
| **Framer Motion** | Page transitions and micro-animations |
| **Lenis** | Smooth scroll experience |
| **Supabase JS** | Auth client + Realtime |
| **PostHog** | Product analytics |
| **Sentry** | Client-side error tracking |
| **Vercel** | Hosting + Edge CDN |

### Backend
| Technology | Purpose |
|---|---|
| **Node.js + Express 5** | REST API server |
| **TypeScript** | Full type safety |
| **Supabase (PostgreSQL)** | Primary database + file storage |
| **Cloudinary** | Legacy image upload |
| **Sharp** | Image processing - resize, WebP conversion, EXIF strip |
| **Google Gemini 2.5 Flash** | AI product metadata generation (structured JSON output) |
| **Anthropic Claude** | AI integration (secondary) |
| **Zod** | Runtime schema validation |
| **Multer** | Multipart file upload handling |
| **Helmet + express-rate-limit** | Security hardening |
| **Sentry** | Server-side error tracking |

### Database & Storage
| Technology | Purpose |
|---|---|
| **PostgreSQL (Supabase)** | Users, analyses, results, products, wardrobe |
| **Supabase Storage** | Product images (content-addressed, immutable cache) |
| **node-pg-migrate** | Schema migrations |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    USER BROWSER                         │
│                                                         │
│  Next.js 16 (App Router)                                │
│  ├── Auth (Supabase Auth / Google OAuth)                │
│  ├── Analysis Flow (Upload or Manual Input)             │
│  ├── Results + Outfit Recommendations                   │
│  ├── Product Discovery + Wardrobe                       │
│  └── Admin Panel (product import, metadata QA)          │
└─────────────┬───────────────────────────────────────────┘
              │  HTTPS  (REST + multipart)
              ▼
┌─────────────────────────────────────────────────────────┐
│              Node.js / Express 5 API                    │
│                                                         │
│  Middleware Stack                                        │
│  ├── Helmet (security headers)                          │
│  ├── CORS (production origin allowlist)                 │
│  ├── Rate Limiter (100 req/min general, 10/min AI)      │
│  ├── Auth middleware (Supabase JWT verification)        │
│  └── Global error handler (Sentry + structured JSON)    │
│                                                         │
│  Route Modules                                          │
│  ├── /api/v1/analysis        ← Photo upload + manual    │
│  ├── /api/v1/recommendations ← Scored product ranking   │
│  ├── /api/v1/wardrobe        ← Save / retrieve outfits  │
│  ├── /api/v1/products        ← Product catalog          │
│  ├── /api/v1/profile         ← User style profile       │
│  ├── /api/v1/saved-outfits   ← Bookmarked looks         │
│  └── /api/v1/admin/*         ← Import + metadata QA     │
│                                                         │
│  Core Services                                          │
│  ├── recommendationEngine.ts  ← 7-dimension scorer      │
│  ├── geminiMetadataService.ts ← Gemini AI integration   │
│  ├── imagePipeline.ts         ← Download/process/store  │
│  └── storageService.ts        ← Supabase Storage util   │
└──────┬──────────────────────┬───────────────────────────┘
       │                      │
       ▼                      ▼
┌──────────────┐    ┌─────────────────────┐
│  PostgreSQL  │    │  Supabase Storage   │
│  (Supabase)  │    │  (product-images)   │
│              │    │  - WebP, 1200×1600  │
│  users       │    │  - SHA-256 dedup    │
│  analyses    │    │  - 1yr immutable    │
│  results     │    │    cache headers    │
│  products    │    └─────────────────────┘
│  outfits     │
│  wardrobe    │
└──────────────┘
```

### AI Pipeline - Gemini 2.5 Flash

```
Admin uploads product image URL
         │
         ▼
  validateImageUrl()    ← SSRF protection
         │
         ▼
  downloadWithRetry()   ← exponential backoff (3 retries)
         │
         ▼
  sharp: resize + WebP  ← max 1200×1600, quality 82
         │
         ▼
  SHA-256 content hash  ← deduplication check
         │
         ▼
  Supabase Storage      ← immutable, content-addressed path
         │
         ▼
  GeminiMetadataProvider
  ├── inlineData (base64 image)
  ├── JSON Schema (responseSchema → structured output)
  └── generateContent → validated ProductMetadata
```

### Recommendation Scoring Engine

```
UserStyleProfile + Product[]
         │
         ▼
  ScoreBreakdown (7 dimensions):
  ├── color        (primary_color vs best_colors)
  ├── season       (product.seasons vs user.season)
  ├── undertone    (recommended_undertones match)
  ├── occasion     (product.occasions relevance)
  ├── style        (formality + style alignment)
  ├── material     (seasonal suitability)
  └── confidence   (analysis confidence adjustment)
         │
         ▼
  ScoredProduct[] with score (0–100)
  + reasons[] (plain-English positive factors)
  + negatives[] (why something scored lower)
```

---

## Project Structure

```
StyleSense/
├── client/                   # Next.js 16 frontend
│   ├── src/
│   │   ├── app/              # Next.js App Router pages
│   │   │   ├── (auth)/       # Auth routes (login, signup, reset)
│   │   │   ├── analysis/     # Core analysis flow
│   │   │   ├── result/       # Recommendation results
│   │   │   ├── wardrobe/     # Virtual wardrobe
│   │   │   ├── outfit/       # Outfit builder
│   │   │   ├── discover/     # Product discovery
│   │   │   ├── history/      # Analysis history
│   │   │   ├── admin/        # Admin panel
│   │   │   └── api/          # Next.js API routes (edge)
│   │   ├── components/       # Reusable UI components
│   │   │   ├── ui/           # Base design system
│   │   │   ├── icons/        # SVG icon components
│   │   │   └── motion/       # Framer Motion wrappers
│   │   ├── lib/              # Client utilities
│   │   │   ├── api.ts        # Typed API client
│   │   │   ├── supabase.ts   # Supabase client
│   │   │   ├── motion.ts     # Animation variants
│   │   │   ├── auth-context.tsx
│   │   │   └── wardrobe-repository.ts
│   │   ├── data/             # Static data (color profiles)
│   │   ├── types/            # Shared TypeScript types
│   │   └── utils/            # Helper functions
│   ├── public/               # Static assets
│   ├── next.config.ts        # Next.js + Sentry config
│   └── package.json
│
├── server/                   # Node.js / Express 5 API
│   ├── src/
│   │   ├── routes/           # Express route handlers
│   │   │   ├── analysis.ts
│   │   │   ├── recommendations.ts
│   │   │   ├── wardrobe.ts
│   │   │   ├── products.ts
│   │   │   ├── profile.ts
│   │   │   ├── savedOutfits.ts
│   │   │   ├── feedback.ts
│   │   │   └── admin*.ts     # Admin import + metadata routes
│   │   ├── engine/           # Core recommendation engine
│   │   │   ├── recommendationEngine.ts
│   │   │   └── tests/
│   │   ├── services/         # Business logic services
│   │   │   ├── geminiMetadataService.ts
│   │   │   ├── imagePipeline.ts
│   │   │   ├── metadataProvider.ts
│   │   │   ├── recommendationEngine.ts
│   │   │   └── storageService.ts
│   │   ├── middleware/       # Express middleware
│   │   │   ├── auth.ts
│   │   │   ├── adminAuth.ts
│   │   │   ├── errorHandler.ts
│   │   │   └── logger.ts
│   │   ├── config/           # App configuration
│   │   ├── data/             # Color profile JSON data
│   │   ├── lib/              # Shared library utilities
│   │   ├── types/            # TypeScript interfaces
│   │   └── utils/            # DB helpers, URL validator
│   ├── migrations/           # node-pg-migrate SQL migrations
│   ├── scripts/              # Utility scripts
│   └── requirements.txt      # Python skin-tone analysis deps
│
├── docs/                     # Architecture + product docs
│   ├── prd.md                # Product Requirements Document
│   ├── trd.md                # Technical Requirements Document
│   ├── implementation_roadmap.md
│   └── backend_integration_architecture.md
│
├── .github/                  # GitHub templates + workflows
├── scripts/                  # Root-level dev scripts
└── package.json              # Monorepo root (dev:client, dev:server)
```

---

## Getting Started

### Prerequisites

- **Node.js** 20+
- **npm** or **pnpm**
- **Supabase** project (free tier works)
- **Gemini API key** ([Google AI Studio](https://aistudio.google.com))
- **Cloudinary** account (optional, for legacy upload flow)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/StyleSense.git
cd StyleSense

# Install root dependencies
npm install

# Install client dependencies
npm --prefix client install

# Install server dependencies
npm --prefix server install
```

### Environment Variables

**`client/.env.local`** (copy from `client/.env.example`)
```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your_supabase_anon_key
```

**`server/.env`** (copy from `server/.env.example`)
```env
PORT=4000

# Database
DATABASE_URL=your_postgresql_connection_string

# Supabase
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# AI
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash
ANTHROPIC_API_KEY=your_anthropic_api_key   # optional

# Image storage (legacy)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
CLOUDINARY_FOLDER=stylesense

# Tuning (optional)
DB_MAX_ATTEMPTS=3
DB_RETRY_DELAY_MS=400
PYTHON_TIMEOUT_MS=25000
```

### Database Setup

```bash
# Apply all migrations
npm --prefix server run migrate up
```

### Running Locally

```bash
# Start both client and server (recommended)
npm run dev

# Or start individually
npm run dev:client    # Next.js → http://localhost:3000
npm run dev:server    # Express  → http://localhost:4000
```

Verify the backend is healthy:
```bash
curl http://localhost:4000/health
# → Server is healthy
```

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start client + server concurrently |
| `npm run dev:client` | Start Next.js only |
| `npm run dev:server` | Start Express only |
| `npm --prefix server run build` | Compile TypeScript server |
| `npm --prefix server run test` | Run Jest unit tests |
| `npm --prefix server run migrate up` | Apply pending migrations |
| `npm --prefix client run lint` | Lint client code |
| `npm --prefix client run build` | Production build (Next.js) |

---

## API Overview

**Base URL:** `/api/v1`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/health` | None | Liveness check |
| `POST` | `/analysis/upload` | JWT | Upload photo for analysis |
| `POST` | `/analysis/manual` | JWT | Manual skin tone + undertone |
| `GET` | `/analysis/result/:id` | JWT | Fetch analysis result |
| `GET` | `/recommendations` | JWT | Scored product recommendations |
| `GET` | `/products` | JWT | Product catalog |
| `GET/POST` | `/wardrobe` | JWT | Virtual wardrobe management |
| `GET/POST` | `/saved-outfits` | JWT | Saved outfit bookmarks |
| `GET/PUT` | `/profile` | JWT | User style profile |
| `POST` | `/feedback` | JWT | Submit feedback |
| `POST` | `/admin/import` | Admin JWT | Bulk product import |
| `POST` | `/admin/metadata` | Admin JWT | AI metadata generation |

Full request/response contracts and error codes are documented in [`docs/trd.md`](docs/trd.md) and [`docs/backend_integration_architecture.md`](docs/backend_integration_architecture.md).

**Unified Error Shape:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable message",
    "field": "skin_tone"
  }
}
```

---

## Authentication

StyleSense uses **Supabase Auth** for identity management.

- **Email/Password** - standard registration with email verification
- **Google OAuth** - one-click sign-in via Google
- **JWT** - server validates Supabase JWTs via the service role key on every protected route
- **Password Reset** - email-based reset flow with Supabase email templates
- **Auth state** - managed client-side via `AuthContext` (`lib/auth-context.tsx`)

---

## AI Features

### Gemini 2.5 Flash - Structured Product Metadata

The admin import pipeline uses Gemini's `responseSchema` parameter (structured output) to extract rich metadata from product images. This guarantees fully-conformant JSON - no markdown wrapping, no hallucinated fields, no post-processing regex.

**Extracted attributes:** `primary_color`, `secondary_colors`, `material`, `pattern`, `fit`, `sleeve_type`, `neck_type`, `formality`, `style`, `occasion[]`, `season[]`, `temperature_suitability`, `recommended_undertones[]`, `gender_category`, `product_type`, `description`, `keywords[]`, `confidence`.

If parsing fails, the service retries once before throwing a structured error - every failure is logged with the raw response for debugging.

### Recommendation Engine - 7-Dimension Scoring

Every product in the catalog is scored against the user's style profile across 7 weighted dimensions. Results are sorted by score (0–100) and include human-readable `reasons[]` and `negatives[]` per product - making recommendations explainable and trustworthy rather than opaque.

---

## Performance

| Optimization | Implementation |
|---|---|
| Turbopack dev | Enabled in `next.config.ts` for fast local rebuilds |
| AVIF + WebP | `next/image` with `formats: ['image/avif', 'image/webp']` |
| 1-year asset cache | `Cache-Control: public, max-age=31536000, immutable` |
| Content-addressed images | SHA-256 hash in storage path - safe for immutable caching |
| Package import optimization | `optimizePackageImports` for heavy dependencies |
| WebP compression | Sharp: quality 82, effort 4, smart subsampling |
| Compression offloaded | `compress: false` - handled by Vercel CDN, not Node.js |

---

## Security

| Control | Implementation |
|---|---|
| Secure HTTP headers | Helmet.js on all responses |
| CORS | Allowlist: `stylesense.co.in` only (localhost in dev) |
| Rate limiting | 100 req/min general; 10 req/min on analysis routes |
| SSRF protection | `validateImageUrl()` blocks private/loopback IPs |
| EXIF stripping | Sharp auto-rotates and strips metadata |
| Image deduplication | SHA-256 content hash prevents re-upload |
| JWT verification | Supabase service role key validates all protected routes |
| Input validation | Zod schemas on all API request bodies |
| No sensitive data in URLs | `analysis_id` passed in body/header, never query string |

---

## Deployment

### Frontend - Vercel

1. Connect `client/` to a Vercel project
2. Set environment variables in the Vercel dashboard
3. Push to `main` - Vercel builds and deploys automatically

Sentry source maps are uploaded during the production build (configured in `next.config.ts`).

### Backend - Railway / Render

```bash
# Build
npm --prefix server run build

# Start
node server/dist/index.js
```

Set all `server/.env` variables in your platform's environment dashboard.

### Deploy Order

```
1. PostgreSQL (Supabase)  →  run: npm --prefix server run migrate up
2. Supabase Storage       →  create bucket: product-images (public read)
3. Backend                →  deploy; verify: GET /health → 200
4. Frontend               →  set NEXT_PUBLIC_API_URL; deploy to Vercel
```

---

## Roadmap

| Status | Feature |
|---|---|
| ✅ Done | Color analysis (photo + manual) |
| ✅ Done | Express API + PostgreSQL + Supabase Auth |
| ✅ Done | Gemini 2.5 Flash AI metadata pipeline |
| ✅ Done | 7-dimension product scoring engine |
| ✅ Done | Virtual wardrobe |
| ✅ Done | Admin product import + metadata QA |
| 🔄 In Progress | Outfit builder (occasion-based) |
| 🔜 Planned | Photo-based skin tone detection (Python/MediaPipe) |
| 🔜 Planned | Style card export (shareable PNG) |
| 🔜 Planned | Affiliate shopping link integration |
| 🔜 Future | Mobile app (React Native) |

---

## Contributing

Contributions are welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md) before submitting a pull request.

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Commit using [Conventional Commits](https://www.conventionalcommits.org): `git commit -m 'feat: add your feature'`
4. Push and open a pull request against `main`

For bug reports and feature requests, use the [GitHub Issues](../../issues) templates.

---

## License

[MIT](LICENSE)

---

## Author

Built by **Ritul Patel** - focused on building practical, AI-augmented consumer products.

🌐 [stylesense.co.in](https://www.stylesense.co.in)
