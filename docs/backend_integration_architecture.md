# StyleSense — Backend Integration Architecture

> **Scope:** This document defines the API connection structure, service layer pattern, error handling strategy, loading state logic, and security enforcement rules for the StyleSense (Color & Style Analyzer) app. It is written to bridge the current local-logic MVP to a stable, production-ready backend integration.

---

## 1. API Connection Structure

### Base Configuration

```
Base URL  : /api/v1
Protocol  : HTTPS (enforced in production)
Format    : JSON (application/json)
Uploads   : multipart/form-data (image endpoint only)
Versioning: URL-based (/v1, /v2 …)
```

### Endpoint Map

| Method | Endpoint              | Purpose                          | Auth Required |
|--------|-----------------------|----------------------------------|---------------|
| POST   | `/analysis/upload`    | Upload photo, begin analysis     | Guest UUID    |
| POST   | `/analysis/manual`    | Manual skin tone + undertone     | Guest UUID    |
| GET    | `/analysis/result/:id`| Fetch recommendation result      | Guest UUID    |
| GET    | `/health`             | Liveness check                   | None          |

### Request / Response Contracts

**POST `/analysis/upload`**
```
Request  : multipart/form-data { image: File, guest_id: string }
Response : { analysis_id: string, image_url: string, status: "processing" | "done" }
```

**POST `/analysis/manual`**
```
Request  : { skin_tone: "light"|"medium"|"dark", undertone: "warm"|"cool"|"neutral", guest_id: string }
Response : { analysis_id: string, result: ResultObject }
```

**GET `/analysis/result/:id`**
```
Response : {
  analysis_id: string,
  skin_tone   : string,
  undertone   : string,
  best_colors : string[],
  avoid_colors: string[],
  outfits     : string[]
}
```

**Unified Error Shape**
```json
{
  "error": {
    "code"   : "VALIDATION_ERROR",
    "message": "Human-readable message",
    "field"  : "skin_tone"       // optional, for field-level errors
  }
}
```

---

## 2. Service Layer Pattern

The service layer is the **only** place that talks to the API. Screens and components never call `fetch` directly.

### Folder Structure

```
src/
└── services/
    ├── api.ts            ← Axios/fetch instance with base config
    ├── styleService.ts   ← All StyleSense API calls (replaces local logic)
    ├── storageService.ts ← localStorage helpers (guest_id, cached results)
    └── types/
        └── api.types.ts  ← Request/response TypeScript interfaces
```

### `api.ts` — Single HTTP Client

```typescript
import axios from "axios";
import { storageService } from "./storageService";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL ?? "/api/v1",
  timeout: 15_000,
  headers: { "Content-Type": "application/json" },
});

// Attach guest_id to every request
api.interceptors.request.use((config) => {
  const guestId = storageService.getGuestId();
  if (guestId) config.headers["x-guest-id"] = guestId;
  return config;
});

// Normalize error shape
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const apiError = err.response?.data?.error ?? {
      code: "UNKNOWN_ERROR",
      message: "Something went wrong. Please try again.",
    };
    return Promise.reject(apiError);
  }
);

export default api;
```

### `styleService.ts` — Domain Service

```typescript
import api from "./api";
import type { AnalysisResult, ManualInput } from "./types/api.types";

export const styleService = {

  async uploadPhoto(file: File): Promise<{ analysis_id: string }> {
    const form = new FormData();
    form.append("image", file);
    const { data } = await api.post("/analysis/upload", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },

  async analyzeManual(input: ManualInput): Promise<AnalysisResult> {
    const { data } = await api.post("/analysis/manual", input);
    return data.result;
  },

  async getResult(analysisId: string): Promise<AnalysisResult> {
    const { data } = await api.get(`/analysis/result/${analysisId}`);
    return data;
  },

};
```

### `storageService.ts` — Guest ID Persistence

```typescript
const GUEST_KEY = "ss_guest_id";

export const storageService = {
  getGuestId(): string {
    let id = localStorage.getItem(GUEST_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(GUEST_KEY, id);
    }
    return id;
  },
  clearGuestId() {
    localStorage.removeItem(GUEST_KEY);
  },
};
```

### `api.types.ts` — Shared Types

```typescript
export type SkinTone  = "light" | "medium" | "dark";
export type Undertone = "warm"  | "cool"   | "neutral";

export interface ManualInput {
  skin_tone: SkinTone;
  undertone: Undertone;
}

export interface AnalysisResult {
  analysis_id : string;
  skin_tone   : SkinTone;
  undertone   : Undertone;
  best_colors : string[];
  avoid_colors: string[];
  outfits     : string[];
}
```

---

## 3. Error Handling Strategy

### Three-Layer Model

```
Layer 1 — Input Validation  (before any network call)
Layer 2 — API Error Mapping (in axios interceptor)
Layer 3 — UI Error Feedback (in screen components)
```

### Layer 1 — Input Validation (`src/utils/validators.ts`)

```typescript
export function validateImage(file: File): string | null {
  const MAX_MB = 5;
  const ALLOWED = ["image/jpeg", "image/png", "image/webp"];
  if (!ALLOWED.includes(file.type)) return "Only JPG, PNG, or WebP images are allowed.";
  if (file.size > MAX_MB * 1024 * 1024) return `Image must be under ${MAX_MB} MB.`;
  return null; // valid
}

export function validateManualInput(tone?: string, under?: string): string | null {
  if (!tone) return "Please select a skin tone.";
  if (!under) return "Please select an undertone.";
  return null;
}
```

### Layer 2 — API Error Code Map

| API Error Code         | Meaning                          | User Message                              |
|------------------------|----------------------------------|-------------------------------------------|
| `VALIDATION_ERROR`     | Bad request payload              | Show field-level hint                     |
| `FILE_TOO_LARGE`       | Image exceeds server limit       | "Upload a smaller image (max 5 MB)."      |
| `UNSUPPORTED_FORMAT`   | Wrong file type                  | "Use JPG, PNG, or WebP."                  |
| `ANALYSIS_NOT_FOUND`   | Invalid analysis_id              | "Session expired. Please start again."    |
| `RATE_LIMIT_EXCEEDED`  | Too many requests                | "Too many requests. Wait a moment."       |
| `TIMEOUT`              | Request timed out                | "Request timed out. Check your connection."|
| `UNKNOWN_ERROR`        | Fallback                         | "Something went wrong. Please try again." |

### Layer 3 — Screen-Level Error State

```typescript
// Pattern used in every screen that calls an API
const [error, setError] = useState<string | null>(null);

async function handleSubmit() {
  setError(null);
  const validationMsg = validateManualInput(skinTone, undertone);
  if (validationMsg) { setError(validationMsg); return; }

  try {
    const result = await styleService.analyzeManual({ skin_tone, undertone });
    navigation.navigate("ResultScreen", { result });
  } catch (apiErr: any) {
    setError(apiErr.message ?? "Something went wrong.");
  }
}
```

> **Rule:** Never swallow errors silently. Every `catch` must either set an error state, log to a monitoring tool, or both.

---

## 4. Loading State Logic

### Loading State Contract

Every screen that performs async work must track **three states**:

```typescript
type AsyncState = "idle" | "loading" | "success" | "error";
const [status, setStatus] = useState<AsyncState>("idle");
```

### Full Lifecycle

```typescript
async function runAnalysis() {
  setStatus("loading");
  setError(null);

  try {
    const result = await styleService.analyzeManual(input);
    setStatus("success");
    navigation.navigate("ResultScreen", { result });
  } catch (err: any) {
    setStatus("error");
    setError(err.message);
  }
}
```

### UI Binding Rules

| Status      | Button          | Overlay           | Error Banner  |
|-------------|-----------------|-------------------|---------------|
| `idle`      | Enabled         | Hidden            | Hidden        |
| `loading`   | Disabled + Spinner | Shown (`<Loader/>`) | Hidden    |
| `success`   | N/A (navigated) | Hidden            | Hidden        |
| `error`     | Enabled (retry) | Hidden            | Visible       |

### Screen-Specific Behavior

| Screen             | Loading Trigger         | Loader Type      |
|--------------------|-------------------------|------------------|
| `UploadScreen`     | Photo upload starts     | Full-screen overlay (`ProcessingScreen`) |
| `ManualScreen`     | Analyze button tapped   | Inline spinner on button |
| `ProcessingScreen` | Polling result API      | Progress animation |
| `ResultScreen`     | Initial data fetch      | Skeleton cards   |

### Polling Pattern (ProcessingScreen)

For photo uploads where backend processing is async:

```typescript
useEffect(() => {
  if (!analysisId) return;

  const poll = setInterval(async () => {
    try {
      const result = await styleService.getResult(analysisId);
      clearInterval(poll);
      setResult(result);
      setStatus("success");
    } catch (err: any) {
      if (err.code !== "ANALYSIS_NOT_FOUND") {
        clearInterval(poll);
        setStatus("error");
        setError(err.message);
      }
      // ANALYSIS_NOT_FOUND = still processing, keep polling
    }
  }, 2000); // poll every 2 s

  return () => clearInterval(poll); // cleanup on unmount
}, [analysisId]);
```

> **Rule:** Always clean up polling/timeouts in the `useEffect` return function to prevent memory leaks.

---

## 5. Security Enforcement Rules

### 5.1 Input Sanitization

| Point            | Rule                                                              |
|------------------|-------------------------------------------------------------------|
| File upload       | Validate MIME type and file extension before sending to API      |
| Text inputs       | Strip leading/trailing whitespace; use allowlist enum validation  |
| API responses     | Never render raw HTML from API strings; use text nodes only       |

```typescript
// Safe rendering — never dangerouslySetInnerHTML with API data
<Text>{result.outfits[0]}</Text>  // ✅ Safe
```

### 5.2 Guest Identity Rules

```
- guest_id is generated only with crypto.randomUUID() (cryptographically random)
- guest_id is stored in localStorage, never in a cookie (no CSRF surface)
- guest_id is sent in a custom header (x-guest-id), not in the URL
- guest_id is never logged or displayed in the UI
```

### 5.3 Image Upload Security

```
Client Enforcement
  ✅ Max file size: 5 MB (checked before upload)
  ✅ Allowed MIME types: image/jpeg, image/png, image/webp
  ✅ No EXIF data inspection on client; backend strips metadata

Server Enforcement (backend must implement)
  ✅ Re-validate MIME type via magic bytes (not just extension)
  ✅ Resize/recompress before storing to S3/Cloudinary
  ✅ Store in private S3 bucket; serve via signed URLs or CDN only
```

### 5.4 Transport Security

```
✅ All API calls use HTTPS in production
✅ No sensitive data (analysis_id, guest_id) in query strings
✅ API base URL loaded from environment variable (REACT_APP_API_URL)
✅ CORS: backend restricts origin to app domain only
```

### 5.5 Rate Limiting (Backend Contract)

The backend must enforce rate limiting; the frontend must handle `429` gracefully:

```typescript
// In axios interceptor (api.ts)
if (err.response?.status === 429) {
  return Promise.reject({
    code: "RATE_LIMIT_EXCEEDED",
    message: "Too many requests. Please wait a moment and try again.",
  });
}
```

### 5.6 No Sensitive Data in Local Storage

```
✅ Store : guest_id (non-sensitive random UUID)
❌ Never : API keys, tokens, image files, analysis results long-term
```

### 5.7 Environment Variable Rules

```
REACT_APP_API_URL   = https://api.stylesense.io  (prod)
                    = http://localhost:4000       (dev)

❌ Never hardcode API URLs in source files
❌ Never commit .env files to version control
✅ Add .env to .gitignore
✅ Use .env.example with placeholder values for onboarding
```

---

## 6. Integration Checklist

Use this before shipping any screen that touches the API.

- [ ] API base URL comes from environment variable
- [ ] Guest UUID generated via `storageService.getGuestId()`
- [ ] Input validated **before** any network call is made
- [ ] Loading state set to `"loading"` immediately on submit
- [ ] Button is disabled while `status === "loading"`
- [ ] Error state displayed on both validation failure and API failure
- [ ] Error message is user-friendly (no raw error objects shown)
- [ ] Polling intervals cleaned up on unmount
- [ ] No `dangerouslySetInnerHTML` used with API data
- [ ] Image MIME type and size validated on the client
- [ ] `.env` files excluded from version control

---

*Document version: 1.0 | Product: StyleSense MVP | Last updated: March 2026*
