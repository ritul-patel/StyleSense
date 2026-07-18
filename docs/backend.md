# Backend Architecture

The StyleSense backend is a **Node.js + Express 5** REST API written in TypeScript. It is stateless, horizontally scalable, and structured into clearly separated layers: middleware → routes → services → data.

---

## Entry Point

`server/src/index.ts` bootstraps the application in this order:

1. **Sentry** - initialized first, before any other import, to capture startup errors
2. **Express app** - created and configured
3. **Trust proxy** - `app.set('trust proxy', 1)` for accurate IP detection behind Railway/Render
4. **Middleware stack** - applied in a strict, load-sensitive order
5. **Route modules** - mounted at their prefixes
6. **Sentry error handler** - must come before the custom error handler
7. **Global error handler** - catches all unhandled errors
8. **Server listen** - binds to `PORT` (default: 4000)

---

## Middleware Stack

Middleware is applied in this exact order - order matters for security and correctness:

```
1. helmet()           - security headers (X-Frame-Options, CSP, etc.)
2. cors()             - origin allowlist (stylesense.co.in + localhost in dev)
3. express.json()     - parse JSON bodies (10 MB limit)
4. logger             - request logging
5. rateLimit()        - 100 req/min per IP (general)
   └─ analysisLimiter - 10 req/min per IP (analysis + AI routes only)
6. Routes
7. Sentry.setupExpressErrorHandler()
8. errorHandler()     - global catch-all → structured JSON error response
```

---

## Route Modules

| Mount Path | File | Purpose |
|---|---|---|
| `/api/v1/analysis` | `routes/analysis.ts` | Photo upload + manual analysis |
| `/api/v1/recommendations` | `routes/recommendations.ts` | Scored product recommendations |
| `/api/v1/wardrobe` | `routes/wardrobe.ts` | Virtual wardrobe CRUD |
| `/api/v1/products` | `routes/products.ts` | Product catalog |
| `/api/v1/profile` | `routes/profile.ts` | User style profile |
| `/api/v1/saved-outfits` | `routes/savedOutfits.ts` | Bookmarked outfits |
| `/api/v1/feedback` | `routes/feedback.ts` | User feedback |
| `/api/v1/admin` | `routes/admin.ts` | Admin: user management |
| `/api/v1/admin/products` | `routes/adminProducts.ts` | Admin: product CRUD |
| `/api/v1/admin/outfits` | `routes/adminOutfits.ts` | Admin: outfit management |
| `/api/v1/admin/import` | `routes/adminImport.ts` | Admin: bulk import |
| `/api/v1/admin/images` | `routes/adminImages.ts` | Admin: image pipeline status |
| `/api/v1/admin/metadata` | `routes/adminMetadata.ts` | Admin: AI metadata trigger |

---

## Folder Structure

```
server/src/
├── index.ts              # App bootstrap + server listen
├── config/               # Supabase client, env validation
├── data/                 # Color profile JSON data
│   └── colorProfiles.json
├── engine/               # Core recommendation engine
│   ├── recommendationEngine.ts
│   └── tests/
├── lib/                  # Shared utilities (DB wrapper, etc.)
├── middleware/
│   ├── auth.ts           # Supabase JWT verification
│   ├── adminAuth.ts      # Admin-only JWT verification
│   ├── errorHandler.ts   # Global structured error response
│   └── logger.ts         # Request logging middleware
├── routes/               # One file per route group (see table above)
├── services/
│   ├── geminiMetadataService.ts   # Gemini 2.5 Flash AI integration
│   ├── imagePipeline.ts           # Download → process → store pipeline
│   ├── metadataProvider.ts        # Provider interface + validation
│   ├── recommendationEngine.ts    # Service-level scorer (uses DB)
│   └── storageService.ts          # Supabase Storage helpers
├── types/                # Shared TypeScript interfaces
└── utils/
    ├── db.ts             # pg query wrapper with retry logic
    ├── urlValidator.ts   # SSRF protection for image URLs
    └── sentry.ts         # Sentry init helper
```

---

## Error Handling

All errors flow to the global `errorHandler` middleware in `middleware/errorHandler.ts`. It:

1. Detects **Zod validation errors** → maps to field-level `VALIDATION_ERROR` response
2. Detects custom `AppError` instances → uses their `code` and `statusCode`
3. Falls back to `500 INTERNAL_ERROR` for everything else
4. Logs unexpected errors to Sentry

**Response shape (all errors):**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "skin_tone is required",
    "field": "skin_tone"
  }
}
```

**Rule:** Never use `try/catch` that swallows errors. Every catch block must either re-throw, call `next(err)`, or set a structured error state.

---

## Authentication Middleware

`middleware/auth.ts` - verifies the Supabase JWT on every protected route:

1. Reads `Authorization: Bearer <token>` header
2. Calls Supabase `auth.getUser(token)` with the service role key
3. Attaches `req.user` for use in route handlers
4. Returns `401 UNAUTHORIZED` if the token is missing or invalid

`middleware/adminAuth.ts` - additionally checks that `req.user` has admin privileges.

---

## Database Access

All database queries go through `utils/db.ts` - a thin wrapper around the `pg` client that:

- Implements retry logic (`DB_MAX_ATTEMPTS`, `DB_RETRY_DELAY_MS`)
- Provides a consistent `query(sql, params)` interface
- Logs slow or failed queries

---

## Rate Limiting

Two limiters are configured in `index.ts`:

| Limiter | Limit | Applied To |
|---|---|---|
| `limiter` | 100 req/min per IP | All routes |
| `analysisLimiter` | 10 req/min per IP | `/api/v1/analysis` only |

The stricter `analysisLimiter` protects expensive AI and image processing operations from abuse.

---

## Recommendation Engine

`engine/recommendationEngine.ts` is a pure scoring function:

```
UserStyleProfile + Product[] → ScoredProduct[]
```

It scores each product across 7 dimensions (color, season, undertone, occasion, style, material, formality) with confidence adjustment. Output includes:

- `score` (0–100)
- `reasons[]` - plain-English positive factors
- `negatives[]` - why a product scored lower
- `breakdown` - per-dimension scores for debugging

The engine has no hardcoded UI rules - everything comes from the product's `ai_metadata` field populated by the Gemini pipeline.

---

## Process Error Handling

The server handles unhandled promise rejections and uncaught exceptions at the process level:

```typescript
process.on('unhandledRejection', (reason) => {
  console.error('[UnhandledRejection]', reason);
  Sentry.captureException(reason);
});

process.on('uncaughtException', (error) => {
  console.error('[UncaughtException]', error);
  Sentry.captureException(error);
});
```

This ensures all unexpected failures are logged and captured before the process terminates.
