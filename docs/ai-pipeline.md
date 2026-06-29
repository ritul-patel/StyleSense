# AI Pipeline

StyleSense uses **Google Gemini 2.5 Flash** to generate rich, structured metadata for fashion products. This metadata powers the 7-dimension recommendation scoring engine.

---

## Overview

The AI pipeline runs as a server-side admin operation. When a product is imported, the pipeline:

1. **Downloads** the product image from an external URL
2. **Validates** and **processes** the image (resize, WebP, EXIF strip)
3. **Deduplicates** by SHA-256 content hash
4. **Uploads** to Supabase Storage with an immutable cache path
5. **Calls Gemini** with the image + a structured JSON schema
6. **Validates** the AI response and stores the metadata

---

## Image Pipeline (`imagePipeline.ts`)

### Configuration

```typescript
const CONFIG = {
  download: {
    timeoutMs: 15_000,
    maxSizeBytes: 15 * 1024 * 1024,  // 15 MB
    maxRedirects: 3,
    userAgent: 'StyleSense-ImageBot/1.0',
  },
  processing: {
    maxWidth: 1200,
    maxHeight: 1600,
    webpQuality: 82,
    webpEffort: 4,        // faster encoding, small quality trade-off
  },
  retry: {
    maxRetries: 3,
    baseDelayMs: 2000,
    backoffMultiplier: 4,
    maxDelayMs: 30_000,
    retryableStatuses: [429, 500, 502, 503, 504],
  },
};
```

### Pipeline Steps

```
validateImageUrl(sourceUrl)
  ├── Checks URL format
  └── Blocks private IPs (SSRF protection)
         │
         ▼
downloadWithRetry(url)
  ├── Exponential backoff on network errors + 5xx responses
  ├── AbortController timeout (15s)
  ├── Content-Type validation
  └── Size limit enforcement (15 MB)
         │
         ▼
sharp(buffer)
  ├── .rotate()              ← auto-orient from EXIF
  ├── .resize(1200, 1600)    ← fit inside, no upscaling
  └── .webp({ quality: 82, smartSubsample: true })
         │
         ▼
SHA-256 content hash
  └── Check product_images table for existing hash
      ├── Duplicate found → return existing storagePath (no re-upload)
      └── Not found → continue
         │
         ▼
Supabase Storage upload
  ├── Path: products/<category>/<hash_prefix>-<slug>.webp
  ├── Cache-Control: public, max-age=31536000, immutable
  └── upsert: false (never overwrite)
```

### SSRF Protection

`validateImageUrl()` (in `utils/urlValidator.ts`) blocks:
- Private IP ranges (10.x.x.x, 172.16.x.x, 192.168.x.x)
- Loopback addresses (127.x.x.x, ::1)
- Non-HTTP protocols
- Localhost hostnames

This prevents server-side request forgery attacks where an attacker could trick the server into fetching internal resources.

---

## Gemini Metadata Service (`geminiMetadataService.ts`)

### Model

- **Model:** `gemini-2.5-flash` (configurable via `GEMINI_MODEL` env var)
- **Temperature:** 0.2 (deterministic output)
- **Max output tokens:** 1024
- **Response format:** `application/json` with `responseSchema`

### Structured Output

The key engineering decision is using Gemini's **`responseSchema` parameter** to force structured JSON output. The SDK validates the response against the schema — no markdown fences, no explanatory text, no hallucinated fields.

```typescript
const METADATA_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    primary_color:          { type: Type.STRING },
    secondary_colors:       { type: Type.ARRAY, items: { type: Type.STRING } },
    material:               { type: Type.STRING },
    pattern:                { type: Type.STRING },
    fit:                    { type: Type.STRING },
    formality:              { type: Type.STRING },
    style:                  { type: Type.STRING },
    occasion:               { type: Type.ARRAY, items: { type: Type.STRING } },
    season:                 { type: Type.ARRAY, items: { type: Type.STRING } },
    recommended_undertones: { type: Type.ARRAY, items: { type: Type.STRING } },
    gender_category:        { type: Type.STRING },
    product_type:           { type: Type.STRING },
    description:            { type: Type.STRING },
    keywords:               { type: Type.ARRAY, items: { type: Type.STRING } },
    confidence:             { type: Type.NUMBER },
    // ... additional fields
  },
  required: ['primary_color', 'material', 'fit', 'formality', 'style', /* ... */],
};
```

### Request Construction

Each Gemini request includes:
1. **Image as inline base64** — the processed product image is fetched and encoded
2. **Text prompt** — product name, category, and instruction to generate metadata
3. **JSON schema** — `responseSchema` enforces the output structure

### Parse Resilience

Despite structured output, the service includes three fallback parse strategies:

1. **Direct `JSON.parse()`** — expected path with structured output
2. **Strip markdown fences** — handles edge case where Gemini wraps output in ` ```json ``` `
3. **Regex extraction** — extracts `{...}` from mixed text

If all three fail, the service retries the full Gemini call once before throwing.

### Logging

Every request is logged with a sequential counter `[gemini:req#N]`:

```
[gemini:req#1] Timestamp: 2026-06-01T10:00:00.000Z
[gemini:req#1] Product: "Slim Linen Shirt" (uuid)
[gemini:req#1] Model: gemini-2.5-flash
[gemini:req#1] ✓ Response received in 1842ms
[gemini:req#1] Finish reason: STOP
[gemini:req#1] Tokens — prompt: 312, response: 187, total: 499
```

---

## Generated Metadata Fields

| Field | Example Values |
|---|---|
| `primary_color` | `"navy blue"`, `"beige"`, `"charcoal"` |
| `secondary_colors` | `["white", "cream"]` |
| `material` | `"cotton"`, `"linen"`, `"denim"` |
| `pattern` | `"solid"`, `"striped"`, `"checked"` |
| `fit` | `"slim"`, `"regular"`, `"oversized"` |
| `sleeve_type` | `"short"`, `"long"`, `"3/4"` |
| `neck_type` | `"round"`, `"v-neck"`, `"collar"` |
| `formality` | `"casual"`, `"smart-casual"`, `"formal"` |
| `style` | `"minimalist"`, `"streetwear"`, `"preppy"` |
| `occasion` | `["daily", "office", "casual"]` |
| `season` | `["spring", "summer"]` |
| `recommended_undertones` | `["warm", "neutral"]` |
| `gender_category` | `"men"`, `"women"`, `"unisex"` |
| `confidence` | `0.0` – `1.0` |

---

## Environment Variables

| Variable | Description |
|---|---|
| `GEMINI_API_KEY` | Google AI Studio API key |
| `GEMINI_MODEL` | Model to use (default: `gemini-2.5-flash`) |
| `ANTHROPIC_API_KEY` | Anthropic Claude API key (secondary AI integration) |
| `PYTHON_TIMEOUT_MS` | Timeout for Python skin-tone detection subprocess (default: 25000) |

---

## Python Skin-Tone Detection (Planned)

A Python service using **FastAPI** + **MediaPipe** + **OpenCV** is scaffolded for automated skin tone detection from uploaded photos. Dependencies are in `server/requirements.txt`:

```
fastapi
uvicorn
numpy
opencv-python-headless
mediapipe
pydantic
```

This pipeline will eventually replace manual skin tone selection for users who upload photos.
