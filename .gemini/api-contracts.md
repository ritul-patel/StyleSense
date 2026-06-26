# StyleSense API Contracts

> **Single source of truth** for all backend APIs.
> Generated from codebase analysis only — verified against actual implementation.
> Accuracy over completeness. If unverifiable, marked: `UNKNOWN - NEEDS VERIFICATION`
>
> For system architecture, see `architecture.md`.
> For security policies, see `security.md`.
> For workflow rules, see `workflow.md`.
>
> Last updated: 2026-06-26

---

## Maintenance Note

This document is intentionally kept as a single file while it remains manageable.

If it grows beyond approximately 15,000 tokens or becomes difficult to navigate, split it into smaller focused documents while preserving all cross-references.

Do not split prematurely.

## Table of Contents

- [Global Configuration](#global-configuration)
- [Authentication](#authentication)
- [Analysis — Upload](#post-apiv1analysisupload)
- [Analysis — Manual](#post-apiv1analysismanual)
- [History](#get-apiv1analysishistory)
- [Statistics](#get-apiv1analysisstats)
- [Analysis Retrieval — Split Format](#get-apiv1analysisresultid)
- [Analysis Retrieval — Flat Format](#get-apiv1analysisid)
- [Health Check](#get-health)
- [Internal / Testing](#internal--testing-endpoints)
- [AI Service](#ai-service)
- [Uploads / Cloudinary](#uploads--cloudinary)
- [Database Tables](#database-tables)
- [Frontend ↔ Backend Verification](#frontend--backend-verification)
- [Security Review](#security-review)
- [API Verification Report](#api-verification-report)

---

## Global Configuration

### Server

| Property | Value | Source |
|----------|-------|--------|
| Framework | Express 5.2.x | `server/package.json` |
| Default Port | `4000` | `server/src/index.ts` (`STYLESENSE_PORT` or `PORT` env) |
| Base Path | `/api/v1` | `server/src/index.ts` |
| Trust Proxy | `1` | `server/src/index.ts` |
| Node Runtime | TypeScript via ts-node | `server/package.json` scripts |

### Global Middleware Chain (order of execution)

| Order | Middleware | Package/File | Purpose |
|-------|-----------|--------------|---------|
| 1 | `helmet()` | `helmet@8.x` | Security headers |
| 2 | `cors()` | `cors@2.x` | CORS — origin whitelist |
| 3 | `express.json()` | Express built-in | JSON body parsing |
| 4 | `logger` | `server/src/middleware/logger.ts` | Request timing & logging |
| 5 | `rateLimit` | `express-rate-limit@8.x` | Global IP-based rate limit |

### Error Handler (registered last)

| File | Handles |
|------|---------|
| `server/src/middleware/errorHandler.ts` | ZodError, MulterError, AppError, unhandled exceptions |

### CORS Allowed Origins

```
http://localhost:3000
https://www.stylesens.in
https://stylesens.in
```

Requests with no `Origin` header are allowed (e.g. server-to-server, Postman).

### Global Rate Limiting

| Property | Value |
|----------|-------|
| Window | 1 minute (`60_000 ms`) |
| Max Requests | 20 per IP per window |
| Response (429) | `{ "error": "Too many requests from this IP, please try again after a minute" }` |

> No per-endpoint rate limiting exists. All routes share the global limit.

### Error Response Formats

**Standard error (non-upload routes):**
```json
{ "error": "Human-readable message" }
```

**Analysis route errors (upload + manual):**
```json
{ "success": false, "message": "Human-readable message", "requestId": "timestamp-randomhex" }
```

**Zod validation error (non-upload routes):**
```json
{ "error": "Validation Error", "details": { "field_name": ["error description"] } }
```

**Dev-only unhandled errors (`NODE_ENV !== 'production'`):**
```json
{ "error": "Raw error message", "stack": "..." }
```

---

## Authentication

**Mechanism:** Supabase Auth — JWT Bearer tokens

There are **no auth endpoints** on the Express server. All auth flows (sign-up, sign-in, OAuth, password reset, sign-out) are handled client-side via `@supabase/supabase-js`.

### Auth Middleware Variants

| Middleware | File | Behavior |
|-----------|------|----------|
| `authMiddleware` | `server/src/middleware/auth.ts` | **Required.** No token → 401. Invalid token → 401. Sets `req.user`. |
| `optionalAuthMiddleware` | `server/src/middleware/auth.ts` | **Optional.** No token → guest (`req.user` undefined). Invalid token → 401. |

### Token Verification Flow

1. Extract Bearer token from `Authorization` header
2. Call `supabase.auth.getUser(token)` using **service role key**
3. If valid → set `req.user` to Supabase `User` object
4. If invalid → return 401

### 401 Response Bodies

```json
{ "success": false, "message": "Unauthorized" }
```
```json
{ "success": false, "message": "Invalid token" }
```

### Related Files

| File | Purpose |
|------|---------|
| `server/src/middleware/auth.ts` | Middleware implementation |
| `server/src/config/supabase.ts` | SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY validation |
| `server/src/lib/supabase.ts` | Server Supabase client (publishable key) |
| `client/src/lib/supabase.ts` | Client Supabase client (anon key) |
| `client/src/lib/auth-context.tsx` | React context + `useAuth()` hook |
| `client/src/lib/api.ts` | `getAccessToken()`, `getAuthHeaders()` |

---

## POST `/api/v1/analysis/upload`

Upload a face image for AI-powered skin tone analysis and style recommendations.

| Property | Value |
|----------|-------|
| **Status** | Production |
| **Authentication Required** | Yes |
| **Authorization Requirements** | Any authenticated Supabase user |
| **Middleware Used** | `authMiddleware`, `multer.single("image")` |
| **Rate Limiting** | Global (20 req/min/IP) |
| **Controller Location** | `server/src/routes/analysis.ts` → `router.post("/upload", ...)` |
| **Service Location** | `server/src/engine/recommendationEngine.ts` → `getRecommendation()` |
| **Validation Schema** | `multer` file filter + `sharp` metadata + `detectSchema` (Zod) |

### Request Headers

| Header | Required | Value |
|--------|----------|-------|
| `Authorization` | Yes | `Bearer <supabase_access_token>` |
| `Content-Type` | Yes | `multipart/form-data` (set automatically by browser/fetch) |

### URL Parameters

None.

### Query Parameters

None.

### Request Body

`multipart/form-data`:

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `image` | File | Yes | Max 5 MB. MIME: `image/jpeg`, `image/png`, `image/webp` |

### Validation Rules

1. File must be present → 400 "No image file provided."
2. MIME type header must be jpeg/png/webp → 400 "Invalid file type in header. Only JPEG, PNG, and WebP are allowed."
3. File size ≤ 5 MB → 400 "File is too large. Maximum size is 5 MB."
4. Actual image format verified by `sharp` metadata → 400 "The uploaded file is corrupt or not a valid image."
5. Python detection script must detect a face → 422 "No face detected. Please upload a clear, front-facing photo in good lighting."
6. Python output must validate against `detectSchema` (Zod) → 502

### Success Response (200)

```json
{
  "success": true,
  "analysisId": "uuid-string | null",
  "data": {
    "skin_tone": "Type IV",
    "undertone": "warm",
    "season": "Autumn",
    "confidence": 85,
    "rgb": [154, 121, 108],
    "hex": "#9A796C",
    "best_colors": [
      { "name": "Terracotta", "hex": "#CC6633", "why": "...", "usage": "...", "group": "everyday" }
    ],
    "avoid_colors": [
      { "name": "Neon Yellow", "hex": "#FFFF00", "reason": "...", "effect": "..." }
    ],
    "outfits": [
      {
        "title": "Weekend Casual",
        "description": "...",
        "colors": ["#CC6633", "#4A3728"],
        "occasion": "casual brunch",
        "category": "casual",
        "season_suitability": "year-round"
      }
    ],
    "style_rules": ["Pair warm earth tones with muted neutrals"],
    "season_explanation": "...",
    "materials": [{ "name": "Linen", "finish": "matte", "note": "..." }],
    "accessories": [{ "type": "earring", "value": "gold hoops", "note": "..." }],
    "confidence_reason": {
      "undertone": "high", "contrast": "medium",
      "brightness": "high", "facial_harmony": "medium"
    },
    "signature_colors": [{ "name": "Terracotta", "hex": "#CC6633", "reason": "..." }],
    "skin_description": "...",
    "next_steps": ["..."]
  },
  "requestId": "1719400000000-abc123"
}
```

### Error Responses

| Status | Condition | Message |
|--------|-----------|---------|
| 400 | No file | "No image file provided." |
| 400 | Bad MIME | "Invalid file type in header. Only JPEG, PNG, and WebP are allowed." |
| 400 | Too large | "File is too large. Maximum size is 5 MB." |
| 400 | Corrupt | "The uploaded file is corrupt or not a valid image." |
| 401 | No/bad auth | "Unauthorized" / "Invalid token" |
| 422 | No face | "No face detected. Please upload a clear, front-facing photo in good lighting." |
| 429 | Rate limit | Global rate limit message |
| 500 | Unhandled | "Analysis failed. Please try again." |
| 502 | Bad Python output | "Python analysis returned invalid data." |
| 502 | Python crash | "Image analysis runtime failed. Please try another image." |
| 504 | Python timeout | "Image analysis timed out. Please try a clearer image." |

### Database Operations

| Operation | Table | Details |
|-----------|-------|---------|
| INSERT | `analyses` | Columns: `image_url`, `skin_tone`, `undertone`, `result` (JSONB), `user_id` |

> DB save is non-fatal — failure is logged but doesn't fail the request.

### Related Database Tables

- `analyses`

### Related Frontend API Function

- `apiFetch("/api/v1/analysis/upload", { method: "POST", body: formData })` in `client/src/lib/api.ts`

### Related Frontend Pages

- `client/src/app/loading/page.tsx` — triggers upload, stores result in sessionStorage

### Related Components

- `client/src/app/analysis/page.tsx` — image capture UI, stores to localStorage, navigates to `/loading`

### Related Files

| Layer | File |
|-------|------|
| Route | `server/src/routes/analysis.ts` |
| Auth Middleware | `server/src/middleware/auth.ts` |
| Multer Config | `server/src/routes/analysis.ts` (inline) |
| Python Script | `server/python/detect.py` |
| Recommendation Engine | `server/src/engine/recommendationEngine.ts` |
| Cloudinary Upload | `server/src/utils/cloudinary.ts` |
| DB Layer | `server/src/utils/db.ts` |
| Error Utility | `server/src/utils/AppError.ts` |
| Frontend API | `client/src/lib/api.ts` |
| Frontend Page | `client/src/app/loading/page.tsx` |

### Notes

- Temp file is always cleaned up via `fs.unlink()` in `finally` block.
- Cloudinary upload is non-fatal — skipped on misconfiguration.
- Server dynamically checks for `result` and `user_id` column existence at runtime.

---

## POST `/api/v1/analysis/manual`

Generate style recommendations from user-provided skin tone and undertone (no image).

| Property | Value |
|----------|-------|
| **Status** | Production |
| **Authentication Required** | Yes |
| **Authorization Requirements** | Any authenticated Supabase user |
| **Middleware Used** | `authMiddleware` |
| **Rate Limiting** | Global (20 req/min/IP) |
| **Controller Location** | `server/src/routes/analysis.ts` → `router.post("/manual", ...)` |
| **Service Location** | `server/src/engine/recommendationEngine.ts` → `getRecommendation()` |
| **Validation Schema** | `manualSchema` (Zod) |

### Request Headers

| Header | Required | Value |
|--------|----------|-------|
| `Authorization` | Yes | `Bearer <supabase_access_token>` |
| `Content-Type` | Yes | `application/json` |

### URL Parameters

None.

### Query Parameters

None.

### Request Body

```json
{
  "skin_tone": "string",
  "undertone": "string"
}
```

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `skin_tone` | string | Yes | Non-empty after trim. Accepts Fitzpatrick labels ("Type IV", "IV") or descriptive ("olive", "fair"). |
| `undertone` | string | Yes | Non-empty after trim. Free text ("warm", "cool", "neutral"). |

### Validation Rules

- Zod `manualSchema`: both fields required, `z.string().trim().min(1)`
- `skin_tone` parsed to Fitzpatrick I–VI via `parseFitzpatrick()` (defaults to "III" if unrecognized)
- `undertone` lowercased before use

### Success Response (200)

```json
{
  "success": true,
  "analysisId": "uuid-string | null",
  "data": { /* Full AnalysisPayload — same structure as /upload */ },
  "requestId": "1719400000000-abc123"
}
```

> `rgb` defaults to `[122, 122, 122]` and `hex` defaults to `#9A796C` since no image is analyzed.
> `image_url` stored as literal string `"manual"` in the database.

### Error Responses

| Status | Condition | Message |
|--------|-----------|---------|
| 400 | Zod validation fail | `{ "error": "Validation Error", "details": {...} }` |
| 401 | No/bad auth | "Unauthorized" / "Invalid token" |
| 429 | Rate limit | Global rate limit message |
| 500 | Unhandled | "Manual analysis failed." |

### Database Operations

| Operation | Table | Details |
|-----------|-------|---------|
| INSERT | `analyses` | `image_url` = `"manual"`, `skin_tone`, `undertone`, `result` (JSONB), `user_id` |

### Related Database Tables

- `analyses`

### Related Frontend API Function

- **None found.** No frontend code calls this endpoint.

### Related Frontend Pages

- **None found.** No UI for manual analysis exists in current frontend.

### Related Files

| Layer | File |
|-------|------|
| Route | `server/src/routes/analysis.ts` |
| Auth Middleware | `server/src/middleware/auth.ts` |
| Recommendation Engine | `server/src/engine/recommendationEngine.ts` |
| DB Layer | `server/src/utils/db.ts` |
| Frontend API | — (not consumed) |

### Notes

- This endpoint is fully implemented on the backend but has no corresponding frontend UI or API call.
- May be intended for future "manual entry" feature or API-only consumers.

---

## GET `/api/v1/analysis/history`

Retrieve the authenticated user's most recent analysis summaries.

| Property | Value |
|----------|-------|
| **Status** | Production |
| **Authentication Required** | No (returns `[]` for unauthenticated) |
| **Authorization Requirements** | Optional. Results scoped to `user_id` if authenticated. |
| **Middleware Used** | `optionalAuthMiddleware` |
| **Rate Limiting** | Global (20 req/min/IP) |
| **Controller Location** | `server/src/routes/analysis.ts` → `router.get("/history", ...)` |
| **Service Location** | Direct DB query (no service layer) |
| **Validation Schema** | None (no input besides auth token) |

### Request Headers

| Header | Required | Value |
|--------|----------|-------|
| `Authorization` | No | `Bearer <supabase_access_token>` |

### URL Parameters

None.

### Query Parameters

None.

### Request Body

None.

### Validation Rules

None (query is hardcoded).

### Success Response (200)

```json
[
  {
    "analysisId": "uuid-string",
    "skin_tone": "Type IV",
    "undertone": "warm",
    "hex": "#9A796C",
    "created_at": "2025-01-15T10:30:00.000Z"
  }
]
```

Returns `[]` when:
- No auth token provided
- User has no analyses
- `user_id` column missing from DB (graceful degradation → `WHERE FALSE`)

Max 10 items, ordered by `created_at DESC`.

### Error Responses

| Status | Condition | Message |
|--------|-----------|---------|
| 401 | Invalid token (present but bad) | "Invalid token" |
| 429 | Rate limit | Global rate limit message |
| 500 | DB error | "Failed to fetch analysis history." |

### Database Operations

| Operation | Table | Query |
|-----------|-------|-------|
| SELECT | `analyses` | `id, skin_tone, undertone, created_at, result WHERE user_id = $1 ORDER BY created_at DESC LIMIT 10` |

### Related Database Tables

- `analyses`

### Related Frontend API Function

- `fetchAnalysisHistory()` in `client/src/lib/api.ts`

### Related Frontend Pages

- `client/src/app/history/page.tsx`

### Related Components

- `HistoryCard` component (inline in `history/page.tsx`)

### Related Files

| Layer | File |
|-------|------|
| Route | `server/src/routes/analysis.ts` |
| Auth Middleware | `server/src/middleware/auth.ts` |
| DB Layer | `server/src/utils/db.ts` |
| Frontend API | `client/src/lib/api.ts` → `fetchAnalysisHistory()` |
| Frontend Page | `client/src/app/history/page.tsx` |

### Notes

- Contains debug `console.log` statements (SQL queries, params, user object).
- `hex` is extracted from the `result` JSONB column, not a top-level DB field.

---

## GET `/api/v1/analysis/stats`

Aggregate statistics for the authenticated user's analyses.

| Property | Value |
|----------|-------|
| **Status** | Production |
| **Authentication Required** | No (returns zeroed stats for unauthenticated) |
| **Authorization Requirements** | Optional. Results scoped to `user_id` if authenticated. |
| **Middleware Used** | `optionalAuthMiddleware` |
| **Rate Limiting** | Global (20 req/min/IP) |
| **Controller Location** | `server/src/routes/analysis.ts` → `router.get("/stats", ...)` |
| **Service Location** | Direct DB query |
| **Validation Schema** | None |

### Request Headers

| Header | Required | Value |
|--------|----------|-------|
| `Authorization` | No | `Bearer <supabase_access_token>` |

### URL Parameters

None.

### Query Parameters

None.

### Request Body

None.

### Validation Rules

None.

### Success Response (200)

```json
{
  "most_common_skin_tone": "Type IV",
  "most_common_undertone": "warm",
  "total_analyses": 5
}
```

Returns zeroed stats for unauthenticated users:
```json
{
  "most_common_skin_tone": null,
  "most_common_undertone": null,
  "total_analyses": 0
}
```

### Error Responses

| Status | Condition | Message |
|--------|-----------|---------|
| 401 | Invalid token | "Invalid token" |
| 429 | Rate limit | Global rate limit message |
| 500 | DB error | "Failed to fetch analysis stats." |

### Database Operations

| Operation | Table | Query |
|-----------|-------|-------|
| SELECT | `analyses` | Aggregate: most frequent `skin_tone`, most frequent `undertone`, `COUNT(*)` scoped to `user_id` |

### Related Database Tables

- `analyses`

### Related Frontend API Function

- `fetchAnalysisStats()` in `client/src/lib/api.ts`

### Related Frontend Pages

- **None found.** Function is exported but never consumed by any page/component.

### Related Files

| Layer | File |
|-------|------|
| Route | `server/src/routes/analysis.ts` |
| Auth Middleware | `server/src/middleware/auth.ts` |
| DB Layer | `server/src/utils/db.ts` |
| Frontend API | `client/src/lib/api.ts` → `fetchAnalysisStats()` |

### Notes

- Endpoint is fully implemented but appears unused by the frontend.

---

## GET `/api/v1/analysis/result/:id`

Retrieve a specific analysis with split metadata/recommendations format.

| Property | Value |
|----------|-------|
| **Status** | Production |
| **Authentication Required** | No (ownership filter applied if authenticated) |
| **Authorization Requirements** | Optional. If authenticated, analysis must belong to user. |
| **Middleware Used** | `optionalAuthMiddleware` |
| **Rate Limiting** | Global (20 req/min/IP) |
| **Controller Location** | `server/src/routes/analysis.ts` → `router.get("/result/:id", ...)` |
| **Service Location** | Direct DB query |
| **Validation Schema** | UUID regex validation (inline) |

### Request Headers

| Header | Required | Value |
|--------|----------|-------|
| `Authorization` | No | `Bearer <supabase_access_token>` |

### URL Parameters

| Parameter | Type | Required | Constraints |
|-----------|------|----------|-------------|
| `id` | string | Yes | UUID v1-5 format |

### Query Parameters

None.

### Request Body

None.

### Validation Rules

- `id` must match: `/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i`
- If authenticated, query adds `AND user_id = $2` (ownership check)

### Success Response (200)

```json
{
  "success": true,
  "analysisId": "uuid-string",
  "analysis": {
    "id": "uuid-string",
    "image_url": "https://res.cloudinary.com/..." | null,
    "skin_tone": "Type IV",
    "undertone": "warm",
    "created_at": "2025-01-15T10:30:00.000Z" | null
  },
  "result": {
    "season": "Autumn",
    "confidence": 85,
    "rgb": [154, 121, 108],
    "hex": "#9A796C",
    "best_colors": [...],
    "avoid_colors": [...],
    "outfits": [...],
    "style_rules": [...],
    "season_explanation": "...",
    "materials": [...],
    "accessories": [...]
  },
  "requestId": "1719400000000-abc123"
}
```

### Error Responses

| Status | Condition | Message |
|--------|-----------|---------|
| 400 | Invalid UUID | "Invalid analysis ID parameter." |
| 401 | Invalid token | "Invalid token" |
| 404 | Not found / not owned | "Analysis not found." |
| 429 | Rate limit | Global rate limit message |
| 500 | DB error | "Failed to fetch result." |

### Database Operations

| Operation | Table | Query |
|-----------|-------|-------|
| SELECT | `analyses` | `id, image_url, skin_tone, undertone, created_at, result WHERE id = $1 [AND user_id = $2] LIMIT 1` |

### Related Database Tables

- `analyses`

### Related Frontend API Function

- **None.** No frontend function calls `/result/:id` — `fetchAnalysisById()` calls `/:id` instead.

### Related Frontend Pages

- **None found** consuming this endpoint directly.

### Related Files

| Layer | File |
|-------|------|
| Route | `server/src/routes/analysis.ts` |
| Auth Middleware | `server/src/middleware/auth.ts` |
| DB Layer | `server/src/utils/db.ts` |

### Notes

- Returns **split format** (`analysis` + `result` as separate keys) unlike `GET /:id` which returns flat `data`.
- Appears unused by current frontend. May serve external consumers or future features.

---

## GET `/api/v1/analysis/:id`

Retrieve a specific analysis in flat `data` format.

| Property | Value |
|----------|-------|
| **Status** | Production |
| **Authentication Required** | No (ownership filter applied if authenticated) |
| **Authorization Requirements** | Optional. If authenticated, analysis must belong to user. |
| **Middleware Used** | `optionalAuthMiddleware` |
| **Rate Limiting** | Global (20 req/min/IP) |
| **Controller Location** | `server/src/routes/analysis.ts` → `router.get("/:id", ...)` |
| **Service Location** | Direct DB query |
| **Validation Schema** | UUID regex validation (inline) |

### Request Headers

| Header | Required | Value |
|--------|----------|-------|
| `Authorization` | No | `Bearer <supabase_access_token>` |

### URL Parameters

| Parameter | Type | Required | Constraints |
|-----------|------|----------|-------------|
| `id` | string | Yes | UUID v1-5 format |

### Query Parameters

None.

### Request Body

None.

### Validation Rules

- `id` must match UUID regex
- If authenticated, query adds `AND user_id = $2` (ownership check)

### Success Response (200)

```json
{
  "success": true,
  "analysisId": "uuid-string",
  "data": {
    "skin_tone": "Type IV",
    "undertone": "warm",
    "season": "Autumn",
    "confidence": 85,
    "rgb": [154, 121, 108],
    "hex": "#9A796C",
    "best_colors": [...],
    "avoid_colors": [...],
    "outfits": [...],
    "style_rules": [...],
    "season_explanation": "...",
    "materials": [...],
    "accessories": [...]
  },
  "requestId": "1719400000000-abc123"
}
```

> Note: `confidence_reason`, `signature_colors`, `skin_description`, `next_steps` are NOT included in this response.

### Error Responses

| Status | Condition | Message |
|--------|-----------|---------|
| 400 | Invalid UUID | "Invalid analysis ID parameter." |
| 401 | Invalid token | "Invalid token" |
| 404 | Not found / not owned | "Analysis not found." |
| 429 | Rate limit | Global rate limit message |
| 500 | DB error | "Failed to fetch analysis." |

### Database Operations

| Operation | Table | Query |
|-----------|-------|-------|
| SELECT | `analyses` | `id, result, skin_tone, undertone WHERE id = $1 [AND user_id = $2] LIMIT 1` |

### Related Database Tables

- `analyses`

### Related Frontend API Function

- `fetchAnalysisById(analysisId)` in `client/src/lib/api.ts`

### Related Frontend Pages

- `client/src/app/history/page.tsx` — links to `/result?id=...`

### Related Components

- `client/src/app/components/result/AnalysisResultView.tsx` (displays the data)

### Related Files

| Layer | File |
|-------|------|
| Route | `server/src/routes/analysis.ts` |
| Auth Middleware | `server/src/middleware/auth.ts` |
| DB Layer | `server/src/utils/db.ts` |
| Frontend API | `client/src/lib/api.ts` → `fetchAnalysisById()` |
| Frontend Page | `client/src/app/history/page.tsx` |

### Notes

- `fetchAnalysisById()` is exported but **never actually called** by any page. The result page reads from sessionStorage/localStorage, not the API.
- The history page links to `/result?id=...` but the result page does NOT read the `id` query param.
- This creates a **dead path**: history → result link that doesn't actually fetch by ID.

---

## GET `/health`

Simple liveness probe.

| Property | Value |
|----------|-------|
| **Status** | Production |
| **Authentication Required** | No |
| **Authorization Requirements** | None |
| **Middleware Used** | Global only (helmet, cors, logger, rate limiter) |
| **Rate Limiting** | Global (20 req/min/IP) |
| **Controller Location** | `server/src/index.ts` (inline handler) |
| **Service Location** | None |
| **Validation Schema** | None |

### Request Headers

None required.

### URL Parameters

None.

### Query Parameters

None.

### Request Body

None.

### Success Response (200)

```
Server is healthy
```

Content-Type: `text/html` (Express default for `res.send()`)

### Error Responses

| Status | Condition | Message |
|--------|-----------|---------|
| 429 | Rate limit | Global rate limit message |

### Database Operations

None.

### Related Database Tables

None.

### Related Frontend API Function

None.

### Related Frontend Pages

None.

### Related Files

| Layer | File |
|-------|------|
| Route | `server/src/index.ts` |

---

## Internal / Testing Endpoints

### GET `/api/sentry-example-api` (Next.js)

| Property | Value |
|----------|-------|
| **Status** | Test/Debug only — NOT production |
| **Authentication Required** | No |
| **Authorization Requirements** | None |
| **Middleware Used** | None (Next.js API route) |
| **Rate Limiting** | None (runs on Next.js server, not Express) |
| **Controller Location** | `pages/api/sentry-example-api.js` |

### Notes

- **Always throws** `SentryExampleAPIError` — designed to test Sentry error capture.
- `res.status(200).json(...)` is **unreachable dead code**.
- Runs on the **Next.js frontend server**, NOT the Express backend.
- Should not be deployed to production.

---

## AI Service

### Recommendation Engine (Local)

| Property | Value |
|----------|-------|
| **File** | `server/src/engine/recommendationEngine.ts` |
| **Type** | Local, synchronous, deterministic palette lookup |
| **Function** | `getRecommendation(profile: SkinProfile): RecommendationResult` |
| **External API calls** | None in sync version |

The engine maps Fitzpatrick type + undertone to pre-built palettes. No external AI/LLM call at runtime.

An async variant `getRecommendationAsync()` exists — UNKNOWN - NEEDS VERIFICATION whether it calls `@anthropic-ai/sdk` or wraps the sync function.

### Python Skin Detection Script

| Property | Value |
|----------|-------|
| **File** | `server/python/detect.py` |
| **Invoked by** | `child_process.execFile` in `server/src/routes/analysis.ts` |
| **Timeout** | 25 seconds (`PYTHON_TIMEOUT_MS`) |
| **Python binary** | `PYTHON_BIN` env (default: `python`) |
| **Input** | File path to uploaded image (CLI argument) |
| **Output** | JSON to stdout |

#### Output Schema (validated by Zod `detectSchema`)

```json
{
  "success": true,
  "data": {
    "fitzpatrick_type": "I" | "II" | "III" | "IV" | "V" | "VI",
    "fitzpatrick_desc": "string",
    "undertone": "string",
    "rgb": [int, int, int],
    "hex": "string",
    "ita_angle": number,
    "L_star": number,
    "a_star": number,
    "b_star": number,
    "regions_sampled": int,
    "face_detected": boolean,
    "region_delta_e": number,
    "confidence": number,
    "elapsed_ms": number
  }
}
```

---

## Uploads / Cloudinary

| Property | Value |
|----------|-------|
| **Service** | Cloudinary v2 |
| **File** | `server/src/utils/cloudinary.ts` |
| **Upload Folder** | `stylesense` (env: `CLOUDINARY_FOLDER`) |
| **Timeout** | 30s (env: `CLOUDINARY_UPLOAD_TIMEOUT_MS`) |
| **Processing** | Resize max 1600×1600, JPEG q85, auto-rotate |
| **Failure Behavior** | Non-fatal — logged, doesn't fail request |

### Environment Variables

| Variable | Required | Default |
|----------|----------|---------|
| `CLOUDINARY_CLOUD_NAME` | Yes | — |
| `CLOUDINARY_API_KEY` | Yes | — |
| `CLOUDINARY_API_SECRET` | Yes | — |
| `CLOUDINARY_FOLDER` | No | `stylesense` |
| `CLOUDINARY_UPLOAD_TIMEOUT_MS` | No | `30000` |

---

## Database Tables

### `analyses` (Primary — active)

Source: `server/sql/analysis_history_schema.sql`

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `user_id` | uuid | Yes | — | Auth user ID (runtime-checked) |
| `skin_tone` | text | No | — | e.g. "Type IV" |
| `undertone` | text | No | — | e.g. "warm" |
| `result` | jsonb | Yes | `'{}'::jsonb` | Full AnalysisPayload (runtime-checked) |
| `image_url` | text | Yes | — | Cloudinary URL or "manual" |
| `created_at` | timestamptz | No | `now()` | Creation timestamp |

**Indexes:**
- `idx_analyses_created_at` — `created_at DESC`
- `idx_analyses_skin_tone` — `skin_tone`
- `idx_analyses_undertone` — `undertone`
- `idx_analyses_user_id` — `user_id`

### `results` (Legacy — unused by current code)

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | uuid | No | `gen_random_uuid()` |
| `analysis_id` | uuid | No | FK → `analyses.id` CASCADE, UNIQUE |
| `best_colors` | jsonb | Yes | — |
| `avoid_colors` | jsonb | Yes | — |
| `outfits` | jsonb | Yes | — |
| `color_profile` | jsonb | Yes | — |
| `created_at` | timestamptz | No | `now()` |

> Status: **DEPRECATED** — current code never reads/writes this table.

### `profiles` (Supabase RLS — not accessed by Express)

Source: `server/sql/profiles_schema.sql`

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | uuid | No | FK → `auth.users(id)` CASCADE |
| `full_name` | text | Yes | `''` |
| `avatar_url` | text | Yes | `''` |
| `analysis_reminders` | boolean | Yes | `true` |
| `email_notifs` | boolean | Yes | `true` |
| `marketing_notifs` | boolean | Yes | `false` |
| `is_deleted` | boolean | Yes | `false` |
| `deleted_at` | timestamptz | Yes | — |

**RLS:** Users can only SELECT/UPDATE/INSERT their own row.
**Functions:** `public.reactivate_account()` — resets soft-delete for current user.

> The Express backend does NOT interact with this table. Managed via Supabase client SDK.

### `users` (Legacy migration — likely unused)

Source: `server/migrations/1679981263711_create-users-table.js`

| Column | Type |
|--------|------|
| `id` | serial PK |
| `email` | varchar(255) UNIQUE |
| `created_at` | timestamp |

> Status: **LIKELY UNUSED** — predates Supabase Auth adoption.

---

## Frontend ↔ Backend Verification

### Backend Route → Frontend Usage

| Backend Route | Frontend Caller | Status |
|---------------|-----------------|--------|
| `POST /api/v1/analysis/upload` | `client/src/app/loading/page.tsx` via `apiFetch()` | ✅ Verified — request matches |
| `POST /api/v1/analysis/manual` | **None** | ⚠️ Unused by frontend |
| `GET /api/v1/analysis/history` | `client/src/app/history/page.tsx` via `fetchAnalysisHistory()` | ✅ Verified — response matches |
| `GET /api/v1/analysis/stats` | **None** | ⚠️ Exported in api.ts but never called |
| `GET /api/v1/analysis/result/:id` | **None** | ⚠️ Unused by frontend |
| `GET /api/v1/analysis/:id` | `fetchAnalysisById()` exported but **never called** | ⚠️ Dead code |
| `GET /health` | **None** | Expected (infrastructure probe) |

### Frontend API Call → Backend Route

| Frontend Function/Call | Backend Route | Status |
|------------------------|---------------|--------|
| `apiFetch("/api/v1/analysis/upload", { method: "POST" })` | `POST /upload` | ✅ Match |
| `fetchAnalysisHistory()` → `GET /api/v1/analysis/history` | `GET /history` | ✅ Match |
| `fetchAnalysisStats()` → `GET /api/v1/analysis/stats` | `GET /stats` | ✅ Match (but unused) |
| `fetchAnalysisById(id)` → `GET /api/v1/analysis/:id` | `GET /:id` | ✅ Match (but unused) |
| `getProfile()` imported in `ProfileDropdown.tsx` | **NO BACKEND ROUTE** | ❌ Function not defined |
| `softDeleteAccount()` imported in `DangerZone.tsx` | **NO BACKEND ROUTE** | ❌ Function not defined |

### Mismatches & Issues

1. **`getProfile` — MISSING IMPLEMENTATION**
   - Imported by `client/src/app/components/ProfileDropdown.tsx` from `@/lib/api`
   - Not exported from `client/src/lib/api.ts`
   - No corresponding backend endpoint exists
   - **Impact:** Build/TypeScript error or runtime crash

2. **`softDeleteAccount` — MISSING IMPLEMENTATION**
   - Imported by `client/src/app/components/DangerZone.tsx` from `@/lib/api`
   - Not exported from `client/src/lib/api.ts`
   - No corresponding backend endpoint exists
   - Likely should use Supabase RLS on `profiles.is_deleted` directly
   - **Impact:** Build/TypeScript error or runtime crash

3. **History → Result navigation gap**
   - `history/page.tsx` links to `/result?id=<analysisId>`
   - `result/page.tsx` does NOT read the `id` query param
   - `result/page.tsx` only reads from `sessionStorage` / `localStorage`
   - **Impact:** Clicking a history item may show stale/wrong data or redirect to `/analysis`

4. **`fetchAnalysisById()` — exported but never called**
   - The result page does not use it
   - No other consumer found
   - **Status:** Dead code in api.ts

5. **`fetchAnalysisStats()` — exported but never called**
   - No page or component imports/uses it
   - **Status:** Dead code in api.ts

---

## Security Review

### Per-Endpoint Security Analysis

| Endpoint | Auth | Authz | SQL Injection | XSS | File Validation | Input Validation | Rate Limit | Ownership |
|----------|------|-------|---------------|-----|-----------------|------------------|------------|-----------|
| POST /upload | ✅ | ✅ User | ✅ Parameterized | ✅ JSON response | ✅ MIME + sharp | ✅ multer limits | ✅ Global | ✅ user_id |
| POST /manual | ✅ | ✅ User | ✅ Parameterized | ✅ JSON response | N/A | ✅ Zod schema | ✅ Global | ✅ user_id |
| GET /history | Optional | Scoped | ✅ Parameterized | ✅ JSON response | N/A | N/A | ✅ Global | ✅ user_id filter |
| GET /stats | Optional | Scoped | ✅ Parameterized | ✅ JSON response | N/A | N/A | ✅ Global | ✅ user_id filter |
| GET /result/:id | Optional | Scoped | ✅ Parameterized | ✅ JSON response | N/A | ✅ UUID regex | ✅ Global | ⚠️ Partial |
| GET /:id | Optional | Scoped | ✅ Parameterized | ✅ JSON response | N/A | ✅ UUID regex | ✅ Global | ⚠️ Partial |
| GET /health | None | None | N/A | ✅ Plain text | N/A | N/A | ✅ Global | N/A |

### Security Issues Found

1. **IDOR risk on GET /result/:id and GET /:id (unauthenticated access)**
   - When no auth token is provided, `optionalAuthMiddleware` proceeds as guest
   - The `user_id` filter is only applied when `req.user?.id` exists
   - **Result:** An unauthenticated request with a known UUID can access ANY user's analysis
   - **Severity:** Medium — UUIDs are not guessable but exposure is possible via shared links
   - **Recommendation:** Consider requiring authentication, or accept this as intentional (share-by-link)

2. **Debug console.log in /history handler**
   - Logs full user object, SQL queries, and params to stdout
   - Not a direct security vulnerability but could leak info in log aggregators
   - **Location:** `server/src/routes/analysis.ts` lines in `/history` handler

3. **Error messages leak in development**
   - When `NODE_ENV !== 'production'`, unhandled errors expose raw message + stack
   - This is standard practice but should be verified in production deployment

4. **No CSRF protection**
   - Express API uses Bearer token auth (not cookies) so CSRF is not applicable
   - **Status:** Not a vulnerability in this architecture

5. **Helmet() provides security headers**
   - XSS protection headers are set by default
   - **Status:** Adequate

6. **File upload safety**
   - multer limits file size (5 MB)
   - MIME type checked at header level
   - Actual format verified via sharp metadata
   - Temp files cleaned up in finally block
   - **Status:** Adequate

7. **`@anthropic-ai/sdk` in dependencies**
   - UNKNOWN - NEEDS VERIFICATION — if used, API keys may be exposed in environment
   - Not confirmed to be called at runtime

---

## API Verification Report

### Summary

| Metric | Count |
|--------|-------|
| Total endpoints discovered | 7 (Express) + 1 (Next.js test) = **8** |
| Total verified (implementation confirmed) | **7** |
| Total unknown | **1** (`getRecommendationAsync` external call) |
| Total protected endpoints (auth required) | **2** (upload, manual) |
| Total public endpoints | **5** (history, stats, result/:id, /:id, /health) |
| Total optionally-authenticated | **4** |

### Unused Backend Endpoints

| Endpoint | Reason |
|----------|--------|
| `POST /api/v1/analysis/manual` | No frontend UI calls this endpoint |
| `GET /api/v1/analysis/result/:id` | No frontend code consumes this route |
| `GET /api/v1/analysis/stats` | Exported in api.ts but no page/component calls it |

### Frontend API Calls With No Backend Implementation

| Frontend Import | File | Issue |
|-----------------|------|-------|
| `getProfile` | `client/src/app/components/ProfileDropdown.tsx` | Function not defined in `api.ts`, no backend endpoint |
| `softDeleteAccount` | `client/src/app/components/DangerZone.tsx` | Function not defined in `api.ts`, no backend endpoint |

### Duplicate Endpoints

| Pattern | Routes | Notes |
|---------|--------|-------|
| Get analysis by ID | `GET /result/:id` and `GET /:id` | Different response formats (split vs flat) — intentional but potentially confusing |

### Deprecated Endpoints

| Item | Evidence |
|------|----------|
| `results` DB table | SQL comment: "Optional compatibility table used by older versions" |
| `users` migration table | Predates Supabase Auth; unreferenced in code |
| `GET /api/sentry-example-api` | Test-only; throws intentionally |

### Missing Validation

| Endpoint | Issue |
|----------|-------|
| `GET /history` | No input validation needed (no user input beyond auth) |
| `GET /stats` | No input validation needed |
| All endpoints | No request body size limit beyond Express defaults (JSON) and multer (file) |

### Missing Authentication

| Endpoint | Issue |
|----------|-------|
| `GET /result/:id` | Accessible without auth — analysis viewable by anyone with UUID |
| `GET /:id` | Accessible without auth — analysis viewable by anyone with UUID |

### Missing Authorization

None beyond the ownership checks noted above.

### Missing Ownership Checks

| Endpoint | Issue |
|----------|-------|
| `GET /result/:id` | Ownership only enforced when user IS authenticated. Unauthenticated requests bypass. |
| `GET /:id` | Same as above. |

### Missing Rate Limiting (per-endpoint)

All endpoints rely on global 20/min/IP limit. No endpoint-specific limiting exists for:
- `POST /upload` (expensive: Python + Cloudinary + AI)
- `POST /manual` (calls recommendation engine)

### Potential Security Issues

1. IDOR on `/:id` and `/result/:id` for unauthenticated requests
2. Debug logging in `/history` (SQL + params + user)
3. Dev error messages in non-production mode
4. `@anthropic-ai/sdk` usage unverified

### TODO/FIXME Comments Related to APIs

None found in `server/src/**/*.ts`.

---

## Environment Variables

For the complete environment variables reference, see `architecture.md` → Configuration section.

Key variables relevant to API behavior:

| Variable | Relevance |
|----------|-----------|
| `STYLESENSE_PORT` / `PORT` | Server listen port (default: 4000) |
| `DATABASE_URL` | PostgreSQL connection |
| `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` | Token verification |
| `CLOUDINARY_*` | Image upload |
| `PYTHON_BIN` | Python detection script |

---

## Data Types Reference

### `AnalysisPayload`

```typescript
interface AnalysisPayload {
  skin_tone: string;
  undertone: string;
  season: string;
  confidence: number;              // 0–100 integer
  rgb: [number, number, number];
  hex: string;                     // "#RRGGBB" uppercase
  best_colors: ColorEntry[];
  avoid_colors: AvoidColor[];
  outfits: Outfit[];
  style_rules: string[];
  season_explanation: string;
  materials: Material[];
  accessories: Accessory[];
  confidence_reason?: ConfidenceReason;
  signature_colors?: SignatureColor[];
  skin_description?: string;
  next_steps?: string[];
}
```

### Sub-Types

```typescript
interface ColorEntry {
  name: string;
  hex: string;
  why: string;
  usage: string;
  group: "neutrals" | "statement" | "everyday" | "accent";
}

interface AvoidColor {
  name: string;
  hex: string;
  reason: string;
  effect: string;
}

interface Outfit {
  title: string;
  description: string;
  colors: string[];
  occasion: string;
  category: "daily" | "casual" | "formal" | "party" | "summer" | "winter" | "minimal";
  season_suitability: string;
}

interface Material {
  name: string;
  finish: "matte" | "sheen" | "glossy" | "textured" | "any";
  note: string;
}

interface Accessory {
  type: string;
  value: string;
  note: string;
}

interface ConfidenceReason {
  undertone: "low" | "medium" | "high";
  contrast: "low" | "medium" | "high";
  brightness: "low" | "medium" | "high";
  facial_harmony: "low" | "medium" | "high";
}

interface SignatureColor {
  name: string;
  hex: string;
  reason: string;
}
```

### `AnalysisHistoryItem`

```typescript
interface AnalysisHistoryItem {
  analysisId: string;
  skin_tone: string;
  undertone: string;
  hex: string;
  created_at: string | null;  // ISO 8601
}
```

### `AnalysisStats`

```typescript
interface AnalysisStats {
  most_common_skin_tone: string | null;
  most_common_undertone: string | null;
  total_analyses: number;
}
```

---

## Endpoint Quick-Reference Table

| # | Method | Route | Auth | Status |
|---|--------|-------|------|--------|
| 1 | GET | `/health` | None | Production |
| 2 | POST | `/api/v1/analysis/upload` | Required | Production |
| 3 | POST | `/api/v1/analysis/manual` | Required | Production (unused by FE) |
| 4 | GET | `/api/v1/analysis/history` | Optional | Production |
| 5 | GET | `/api/v1/analysis/stats` | Optional | Production (unused by FE) |
| 6 | GET | `/api/v1/analysis/result/:id` | Optional | Production (unused by FE) |
| 7 | GET | `/api/v1/analysis/:id` | Optional | Production (FE dead code) |
| 8 | GET | `/api/sentry-example-api` | None | Test only (Next.js) |

---

*End of document. Accuracy over completeness.*
