# API Reference

**Base URL (development):** `http://localhost:4000/api/v1`  
**Base URL (production):** `https://api.stylesense.co.in/api/v1`

---

## Authentication

All protected endpoints require a valid **Supabase JWT** in the `Authorization` header:

```
Authorization: Bearer <supabase_access_token>
```

Admin endpoints additionally require an admin-scoped JWT (verified by `adminAuth` middleware).

---

## Health Check

### `GET /health`

Liveness check. No authentication required.

**Response:** `200 OK`
```
Server is healthy
```

---

## Analysis

### `POST /api/v1/analysis/upload`

Upload a photo for skin tone analysis.

**Request:** `multipart/form-data`
| Field | Type | Description |
|---|---|---|
| `image` | `File` | JPEG, PNG, or WebP. Max 10 MB. |

**Response:** `200 OK`
```json
{
  "analysis_id": "uuid",
  "image_url": "https://...",
  "status": "done"
}
```

---

### `POST /api/v1/analysis/manual`

Run analysis from manually selected skin tone + undertone.

**Request:** `application/json`
```json
{
  "skin_tone": "medium",
  "undertone": "warm"
}
```

| Field | Values |
|---|---|
| `skin_tone` | `"light"` \| `"medium"` \| `"dark"` |
| `undertone` | `"warm"` \| `"cool"` \| `"neutral"` |

**Response:** `200 OK`
```json
{
  "analysis_id": "uuid",
  "result": {
    "skin_tone": "medium",
    "undertone": "warm",
    "season": "Autumn",
    "best_colors": ["olive", "beige", "terracotta", "brown", "cream"],
    "avoid_colors": ["icy blue", "bright neon"],
    "outfits": [
      "Olive shirt + beige chinos",
      "Brown t-shirt + black jeans"
    ]
  }
}
```

---

### `GET /api/v1/analysis/result/:id`

Fetch a previously created analysis result.

**Path parameter:** `id` - the `analysis_id` UUID

**Response:** `200 OK`
```json
{
  "analysis_id": "uuid",
  "skin_tone": "medium",
  "undertone": "warm",
  "season": "Autumn",
  "best_colors": ["olive", "beige"],
  "avoid_colors": ["icy blue"],
  "outfits": ["Olive shirt + beige chinos"]
}
```

**Error:** `404 Not Found`
```json
{ "error": { "code": "ANALYSIS_NOT_FOUND", "message": "Analysis not found." } }
```

---

## Recommendations

### `GET /api/v1/recommendations`

Returns products from the catalog scored against the authenticated user's style profile.

**Query parameters:**
| Param | Type | Default | Description |
|---|---|---|---|
| `limit` | `number` | `20` | Number of results |
| `offset` | `number` | `0` | Pagination offset |
| `category` | `string` | - | Filter by category (e.g. `shirts`, `trousers`) |

**Response:** `200 OK`
```json
{
  "products": [
    {
      "product": {
        "id": "uuid",
        "name": "Slim Linen Shirt",
        "brand": "...",
        "category": "shirts",
        "price": 1299,
        "image_url": "https://...",
        "primary_color": "beige",
        "fit": "slim"
      },
      "score": 87,
      "reasons": ["Strong color match", "Good season fit"],
      "negatives": [],
      "breakdown": {
        "color": 30,
        "season": 20,
        "undertone": 15,
        "occasion": 10,
        "style": 8,
        "material": 4,
        "formality": 0,
        "confidence_adj": 0
      }
    }
  ],
  "total": 142
}
```

---

## Products

### `GET /api/v1/products`

Fetch the product catalog without scoring.

**Query parameters:** `limit`, `offset`, `category` (same as recommendations)

---

## Wardrobe

### `GET /api/v1/wardrobe`

Fetch the authenticated user's wardrobe items.

### `POST /api/v1/wardrobe`

Add an item to the wardrobe.

**Request body:**
```json
{
  "product_id": "uuid",
  "note": "optional user note"
}
```

### `DELETE /api/v1/wardrobe/:id`

Remove a wardrobe item.

---

## Saved Outfits

### `GET /api/v1/saved-outfits`

Fetch saved outfit bookmarks for the authenticated user.

### `POST /api/v1/saved-outfits`

Save an outfit bookmark.

### `DELETE /api/v1/saved-outfits/:id`

Remove a saved outfit.

---

## Profile

### `GET /api/v1/profile`

Fetch the authenticated user's style profile.

### `PUT /api/v1/profile`

Update the user's style profile.

---

## Feedback

### `POST /api/v1/feedback`

Submit user feedback.

**Request body:**
```json
{
  "type": "recommendation",
  "rating": 4,
  "message": "The suggestions were accurate."
}
```

---

## Admin (Protected)

All `/api/v1/admin/*` endpoints require admin JWT verification.

### `POST /api/v1/admin/import`

Bulk import products from external URLs.

### `POST /api/v1/admin/metadata`

Trigger Gemini AI metadata generation for products missing metadata.

### `GET /api/v1/admin/images`

Inspect image pipeline status for imported products.

---

## Error Codes

All errors return a consistent JSON shape:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable description",
    "field": "field_name"
  }
}
```

| Code | HTTP | Meaning |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Invalid request body - `field` indicates which field |
| `UNAUTHORIZED` | 401 | Missing or invalid JWT |
| `FORBIDDEN` | 403 | Authenticated but not authorized (e.g. non-admin accessing admin route) |
| `ANALYSIS_NOT_FOUND` | 404 | No analysis found for the given ID |
| `FILE_TOO_LARGE` | 400 | Uploaded image exceeds 10 MB |
| `UNSUPPORTED_FORMAT` | 400 | File is not JPEG, PNG, or WebP |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests - wait and retry |
| `INTERNAL_ERROR` | 500 | Unexpected server error (logged to Sentry) |
