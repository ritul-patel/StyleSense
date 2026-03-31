# StyleSense — Implementation Roadmap
## Senior Architect Review | Controlled Execution Plan

> **Scope:** Full stack — from current local-logic MVP to a backend-wired, production-ready V1.  
> **Codebase:** React Native (Expo) frontend | Node.js/Express backend | PostgreSQL | Cloudinary

---

## Phase Overview

```
Phase 0 → Foundation Setup          (no frontend changes)
Phase 1 → Backend Core              (API + DB + logic engine)
Phase 2 → Frontend Wiring           (service layer + state)
Phase 3 → Integration               (connect frontend ↔ backend)
Phase 4 → Hardening                 (error handling, security, edge cases)
Phase 5 → Verification & Launch     (testing, performance, deploy)
```

---

## Phase 0 — Foundation Setup

**Goal:** Establish project scaffolding so no future phase is blocked.

### Step 0.1 — Repository & Environment
- [x] Create monorepo or dual-repo (`/client`, `/server`)
- [x] Add `.env` and `.env.example` to both; add `.env` to `.gitignore`
- [x] Define `REACT_APP_API_URL` (dev = `http://localhost:4000`, prod = real URL)

### Step 0.2 — Backend Scaffold
- [x] Init Node.js + Express project (`/server`)
- [x] Install core deps: `express`, `dotenv`, `cors`, `helmet`, `zod`, `multer`, `sharp`, `pg`, `uuid`
- [x] Add dev deps: `nodemon`, `ts-node`, `typescript`, `@types/*`
- [x] Set up `tsconfig.json`
- [x] Add `GET /health` endpoint — smoke-test that server boots

### Step 0.3 — Database Setup
- [x] Provision PostgreSQL (local Docker or Railway/Render for dev)
- [x] Run migrations for: `users`, `analyses`, `results`
- [x] Seed one row of color profile config JSON for testing

### Step 0.4 — Image Storage Setup
- [x] Create Cloudinary (or S3) account; store credentials in `.env`
- [x] Write a single `uploadImage()` util and verify it returns a URL

**✅ Phase 0 Exit Criteria:** `GET /health` returns 200, DB migrations run clean, image upload util tested.

---

## Phase 1 — Backend Core

**Goal:** Implement all business logic on the server before touching the frontend.

### Step 1.1 — Color Mapping Engine (Most Critical Logic)

Build this first — everything else depends on it.

```
Input:  skin_tone + undertone
Output: best_colors[], avoid_colors[], outfits[]
```

- [x] Create `/server/src/data/colorProfiles.json` — full dataset for all 9 combinations (3 tones × 3 undertones)
- [x] Create `/server/src/engine/recommendationEngine.ts`
  - `getRecommendation(skinTone, undertone): RecommendationResult`
  - Lookup → JSON profile → return result (pure function, easily testable)
- [x] Unit test all 9 combinations before wiring to API

### Step 1.2 — API Layer

**Dependency order:** Implement in this exact sequence.

| Order | Endpoint | Depends On |
|---|---|---|
| 1 | `GET /health` | Nothing |
| 2 | `POST /analysis/manual` | Color engine |
| 3 | `POST /analysis/upload` | Cloudinary util + color engine |
| 4 | `GET /analysis/result/:id` | DB |

#### `POST /analysis/manual`
- [x] Validate input with Zod: `{ skin_tone, undertone }`
- [x] Call `recommendationEngine.getRecommendation()`
- [x] Save to `analyses` + `results` tables
- [x] Return `{ analysis_id, result }`

#### `POST /analysis/upload`
- [x] Accept `multipart/form-data` via Multer
- [x] Validate: MIME type (magic bytes, not just extension), max 5 MB
- [x] Upload to Cloudinary → get `image_url`
- [x] For V1: use manual fallback (prompt user to confirm skin tone after upload)
- [x] Save to `analyses` table
- [x] Return `{ analysis_id, image_url, status: "done" }`

#### `GET /analysis/result/:id`
- [x] Look up `analysis_id` in DB
- [x] Return joined result from `results` table
- [x] Return `404 + ANALYSIS_NOT_FOUND` if not found

### Step 1.3 — Middleware Stack

Apply in this order (order is load-sensitive):

```
1. helmet()          ← security headers
2. cors()            ← restrict to frontend origin
3. json()            ← body parser
4. rateLimit()       ← 20 req/min per IP
5. guestIdCheck()    ← validate x-guest-id header exists
6. Routes
7. errorHandler()    ← global catch-all
```

- [x] Implement `guestIdCheck` middleware (validate UUID format of `x-guest-id`)
- [x] Implement `errorHandler` — maps Zod errors and custom `AppError` → unified JSON shape

**✅ Phase 1 Exit Criteria:** All 4 endpoints tested via Postman/curl. All 9 color profile lookups return correct data. Errors return correct shape.

---

## Phase 2 — Frontend Wiring (Service Layer)

**Goal:** Replace all hardcoded/local logic in screens with the service layer. Do NOT wire to real API yet — stub first.

### Step 2.1 — Add Service Files

Create in dependency order:

```
1. src/services/api.ts            ← Axios instance (base URL from env)
2. src/services/storageService.ts ← guest_id via crypto.randomUUID()
3. src/services/types/api.types.ts ← shared TS interfaces
4. src/services/styleService.ts   ← domain calls (upload, manual, getResult)
```

- [ ] `api.ts`: attach `x-guest-id` in request interceptor; normalize errors in response interceptor
- [ ] `storageService.ts`: `getGuestId()` — generate + persist UUID in `AsyncStorage` (React Native)
- [ ] `styleService.ts`: implement `uploadPhoto()`, `analyzeManual()`, `getResult()`

> **Note:** Use `AsyncStorage` (React Native), not `localStorage`.

### Step 2.2 — State Management Plan

**Pattern: Local `useState` + async status enum (no global store for V1)**

Each screen that talks to the API must implement:

```typescript
type AsyncState = 'idle' | 'loading' | 'success' | 'error';
const [status, setStatus] = useState<AsyncState>('idle');
const [error,  setError]  = useState<string | null>(null);
```

| Screen | State Needed | Source |
|---|---|---|
| `HomeScreen` | None | — |
| `UploadScreen` | `image`, `status`, `error` | `useImagePicker` hook + `styleService` |
| `ManualScreen` | `skinTone`, `undertone`, `status`, `error` | local + `styleService` |
| `ProcessingScreen` | `status`, polling timer | `styleService.getResult()` |
| `ResultScreen` | `result`, `status` | route params or `styleService` |

### Step 2.3 — Update Existing Screens

Apply changes in this order (least dependent → most dependent):

| Order | Screen | Change |
|---|---|---|
| 1 | `ManualScreen` | Wire `analyzeManual()`, replace hardcoded nav |
| 2 | `UploadScreen` | Wire `uploadPhoto()`, use `useImagePicker` |
| 3 | `ProcessingScreen` | Replace `setTimeout` with real polling via `getResult()` |
| 4 | `ResultScreen` | Read real data from route params, not hardcoded mock |

### Step 2.4 — Update Validators

- [ ] `validateImage(file)` — check MIME + size before any upload call
- [ ] `validateManualInput(tone, undertone)` — check both fields present

**✅ Phase 2 Exit Criteria:** All screens compile. Service layer stubs return mock data. No screen uses hardcoded data or direct `fetch`.

---

## Phase 3 — Integration (Connect Frontend ↔ Backend)

**Goal:** Point the frontend at the real backend and validate end-to-end flows.

### Step 3.1 — Environment Switch
- [ ] Set `REACT_APP_API_URL` to `http://localhost:4000/api/v1` in `.env.development`
- [ ] Verify Axios baseURL picks it up correctly

### Step 3.2 — Integration Test: Manual Flow (simpler, test first)
```
ManualScreen → POST /analysis/manual → ProcessingScreen → GET /analysis/result/:id → ResultScreen
```
- [ ] Submit light + warm → verify olive/beige palette returned
- [ ] Submit all 9 combos → verify correct profiles

### Step 3.3 — Integration Test: Upload Flow
```
UploadScreen → POST /analysis/upload → ProcessingScreen (polling) → ResultScreen
```
- [ ] Upload JPEG, PNG, WebP — all should succeed
- [ ] Upload PDF / oversized image — should get client-side error before API call
- [ ] Upload valid image — verify Cloudinary URL stored, result returned

### Step 3.4 — Error Flow Tests
- [ ] Kill backend server → verify "Check your connection" message appears
- [ ] Send bad `analysis_id` → verify "Session expired" message
- [ ] Rapid-fire requests → verify rate-limit error handled gracefully

**✅ Phase 3 Exit Criteria:** Both main flows (manual + upload) work end-to-end. All error paths show correct user-facing messages.

---

## Phase 4 — Hardening

**Goal:** Make the product stable and secure before any real users.

### Step 4.1 — Security Hardening

- [ ] Backend re-validates MIME via `file-type` (magic bytes), not just `Content-Type`
- [ ] Strip EXIF from uploaded images via Sharp before storing
- [ ] Set CORS `origin` to production frontend URL only
- [ ] Confirm `x-guest-id` is UUID format (backend middleware rejects malformed IDs)
- [ ] Confirm no `analysis_id` or `guest_id` appear in any URL query string

### Step 4.2 — Edge Case Handling

| Edge Case | Handling |
|---|---|
| Multiple faces in photo | V1: proceed, no detection — note in UI |
| Poor lighting | Client shows warning tip, doesn't block |
| ProcessingScreen open > 10s | Show "Taking longer than usual… Retry" |
| User leaves app mid-upload | Upload cancels gracefully, no orphan records |
| Guest ID missing / corrupted | Regenerate and continue |
| Result not found after poll | Max 5 polls, then show error |

### Step 4.3 — Loading State Audit

- [ ] Every submit button is disabled while `status === 'loading'`
- [ ] No double-submission possible
- [ ] `ProcessingScreen` polls max 5 times (every 2s) then shows error
- [ ] All `useEffect` intervals/timeouts have cleanup functions

**✅ Phase 4 Exit Criteria:** Security checklist passed. All edge cases produce graceful UX. No memory leaks in polling.

---

## Phase 5 — Verification & Launch

### Step 5.1 — Pre-Launch Checklist

- [ ] Remove all `console.log` debug statements
- [ ] Remove all hardcoded mock data from screens
- [ ] Test on low-end Android + iOS device (MVP targets budget users)
- [ ] Verify app loads and completes flow within 60 seconds on 3G
- [ ] Verify all env vars are set correctly in production environment

### Step 5.2 — Deploy Order

Deploy in this sequence (dependents last):

```
1. PostgreSQL  → provision + run migrations
2. Cloudinary  → verify credentials
3. Backend     → deploy to Railway/Render; confirm /health returns 200
4. Frontend    → update REACT_APP_API_URL to production URL; deploy to Vercel/Expo
```

### Step 5.3 — Smoke Tests Post-Deploy

- [ ] `GET /api/v1/health` → 200
- [ ] Manual flow → result returned
- [ ] Upload flow → Cloudinary URL stored, result returned
- [ ] Rate limiter active (20 req/min)

**✅ Phase 5 Exit Criteria:** Both flows verified in production. Monitoring active. No regressions.

---

## Data Flow Map

```
User Action
    │
    ▼
UI Layer (Screen)
    │  validates input (validators.ts)
    ▼
Service Layer (styleService.ts)
    │  attaches guest_id (storageService.ts)
    │  calls api.ts (Axios)
    ▼
Backend API (Express Route)
    │  validates (Zod)
    │  middleware checks (CORS, rate limit, guest ID)
    ▼
Business Logic (recommendationEngine.ts)
    │  looks up colorProfiles.json
    ▼
Database (PostgreSQL)
    │  writes analyses + results rows
    ▼
Response → Service Layer → Screen State → UI Update
```

---

## Risk Areas

| Risk | Severity | Mitigation |
|---|---|---|
| Hardcoded mock data left in `ResultScreen` | 🔴 High | Phase 2 removes all mocks; PR checklist enforces this |
| `setTimeout` in `ProcessingScreen` not replaced with real polling | 🔴 High | Phase 2.3 explicitly replaces it |
| MIME type spoofing (user renames `.exe` to `.jpg`) | 🔴 High | Backend validates via magic bytes (not extension) |
| guest_id not sent → backend rejects all requests | 🟡 Medium | `storageService` always generates one; interceptor always attaches it |
| Color profile gap (missing skin_tone+undertone combo) | 🟡 Medium | Seed all 9 combos in Phase 1.1; add fallback to "medium_neutral" |
| Polling loop not cleaned up on unmount (memory leak) | 🟡 Medium | Phase 4.3 audit; always return `clearInterval` in useEffect |
| No auth in V1 — anyone can guess analysis IDs | 🟢 Low | UUIDs make guessing statistically impossible; acceptable for MVP |
| Image upload fails silently on slow connections | 🟢 Low | Axios timeout (15s) throws → error interceptor catches → user sees message |

---

## Dependency Order Summary

> Strict execution order — do not start a step until its dependencies are done.

```
colorProfiles.json
    └── recommendationEngine.ts
            └── POST /analysis/manual
            └── POST /analysis/upload
                    └── Cloudinary upload util
            └── GET /analysis/result/:id
                    └── PostgreSQL DB

storageService.ts
    └── api.ts (attaches guest_id)
            └── styleService.ts
                    └── ManualScreen (wired)
                    └── UploadScreen (wired)
                            └── useImagePicker.ts
                    └── ProcessingScreen (real polling)
                    └── ResultScreen (real data)
```

---

*Roadmap Version: 1.0 | Product: StyleSense MVP | March 2026*
