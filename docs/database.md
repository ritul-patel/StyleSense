# Database Overview

StyleSense uses **PostgreSQL** hosted on **Supabase**. Migrations are managed by `node-pg-migrate`.

---

## Connection

Database access uses the `pg` Node.js client via a wrapper in `server/src/utils/db.ts`.

The connection string is set via the `DATABASE_URL` environment variable.

For Supabase:
- Use the **direct connection URL** (Session Mode, port 5432) for migrations and server queries
- The pooler URL (port 6543) is for edge functions — do not use it for `node-pg-migrate`

---

## Running Migrations

```bash
# Apply all pending migrations
npm --prefix server run migrate up

# Roll back the last migration
npm --prefix server run migrate down
```

Migrations live in `server/migrations/` as numbered JavaScript files (node-pg-migrate format).

---

## Schema

### `users`

Stores guest and registered user records.

```sql
CREATE TABLE users (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_guest   BOOLEAN NOT NULL DEFAULT TRUE
);
```

Authenticated users are also tracked in Supabase Auth. The `users` table holds application-level metadata.

---

### `analyses`

One row per style analysis (photo upload or manual selection).

```sql
CREATE TABLE analyses (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES users(id),
  image_url  TEXT,
  skin_tone  VARCHAR(20),
  undertone  VARCHAR(20),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

### `results`

Stores the output of the recommendation engine for each analysis.

```sql
CREATE TABLE results (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id  UUID REFERENCES analyses(id) ON DELETE CASCADE,
  best_colors  JSONB NOT NULL,
  avoid_colors JSONB NOT NULL,
  outfits      JSONB NOT NULL
);
```

---

### `products`

The fashion product catalog. Each product has AI-generated metadata in the `ai_metadata` JSONB column.

Key columns:
- `id` — UUID primary key
- `name`, `brand`, `category` — product identity
- `price` — in paise (integer) or rupees (float, depending on migration)
- `image_url` — public URL or Supabase Storage path
- `primary_color`, `secondary_colors` — from AI metadata
- `seasons`, `occasions`, `styles`, `materials`, `fit`, `formality` — structured attributes
- `ai_metadata` — full raw Gemini response (JSONB) for debugging and future use
- `recommended_undertones` — which undertones this product suits

---

### `product_images`

Tracks images processed through the image pipeline.

Key columns:
- `storage_path` — content-addressed path in Supabase Storage
- `content_hash` — SHA-256 hash of the processed WebP file (deduplication key)
- `width`, `height`, `size_bytes`, `format`
- `source_url` — original external URL the image was downloaded from

---

### `wardrobe`

User's saved wardrobe items.

```sql
CREATE TABLE wardrobe (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL,
  product_id UUID REFERENCES products(id),
  note       TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

### `saved_outfits`

User's bookmarked outfit combinations.

---

### `profiles`

Extended user style profile, updated after each analysis.

Key columns:
- `user_id` — references Supabase Auth user
- `skin_tone`, `undertone`, `season`
- `best_colors`, `avoid_colors` — JSONB arrays
- `confidence` — analysis confidence score (0–100)
- `last_analysis_id` — FK to the most recent analysis

---

## Query Patterns

### Retry Logic

All DB queries go through `utils/db.ts` which wraps `pg.query()` with retry logic:

```typescript
// Automatically retries up to DB_MAX_ATTEMPTS times with DB_RETRY_DELAY_MS between attempts
const result = await db.query('SELECT * FROM products WHERE id = $1', [id]);
```

### JSONB Queries

AI metadata is stored as JSONB for flexible querying without schema changes:

```sql
-- Find products suitable for warm undertones
SELECT * FROM products
WHERE ai_metadata->'recommended_undertones' ? 'warm';

-- Filter by season
SELECT * FROM products
WHERE 'Autumn' = ANY(seasons);
```

---

## Supabase Storage

Product images are stored in the `product-images` bucket on Supabase Storage.

- **Path format:** `products/<category>/<sha256_prefix>-<slug>.webp`
- **Access:** Public read (URLs generated via `supabase.storage.from('product-images').getPublicUrl(path)`)
- **Cache:** Images are served with `Cache-Control: public, max-age=31536000, immutable` — the content-addressed path makes this safe

---

## Migrations

Migrations are in `server/migrations/` and use `node-pg-migrate` format:

```javascript
// Example migration
exports.up = (pgm) => {
  pgm.createTable('analyses', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    user_id: { type: 'uuid', references: 'users' },
    skin_tone: { type: 'varchar(20)' },
    undertone: { type: 'varchar(20)' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });
};

exports.down = (pgm) => {
  pgm.dropTable('analyses');
};
```
