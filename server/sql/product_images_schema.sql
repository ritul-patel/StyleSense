-- Product Images Schema for StyleSense
-- Supports multiple images per product with processing pipeline tracking.
-- Run in Supabase SQL Editor.

-- ─── Table ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,

  -- Position & role
  position smallint NOT NULL DEFAULT 0,           -- 0 = primary, 1+ = additional
  role text NOT NULL DEFAULT 'primary',           -- primary, front, back, side, model, detail

  -- Source
  source_url text DEFAULT '',                     -- Original external URL (kept for re-import)

  -- Storage (path only — URLs generated at serve time)
  storage_path text DEFAULT '',                   -- e.g. products/shirt/a1b2c3d4-name.webp

  -- Image metadata
  content_hash text DEFAULT '',                   -- SHA-256 of processed content (dedup key)
  width smallint,                                 -- Processed width in px
  height smallint,                                -- Processed height in px
  size_bytes integer,                             -- Processed file size
  format text DEFAULT 'webp',                     -- Output format (always webp for now)

  -- Processing state
  processing_status text NOT NULL DEFAULT 'pending',  -- pending | processing | completed | failed
  processing_error text DEFAULT '',               -- Error message if failed
  retry_count smallint NOT NULL DEFAULT 0,        -- Number of retry attempts
  last_attempted_at timestamptz,                  -- Last processing attempt timestamp

  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ─── Indexes ────────────────────────────────────────────────────────────────

-- Primary lookup: get images for a product ordered by position
CREATE INDEX IF NOT EXISTS idx_product_images_product
  ON public.product_images (product_id, position);

-- Unique constraint: one image per position per product
CREATE UNIQUE INDEX IF NOT EXISTS idx_product_images_unique_position
  ON public.product_images (product_id, position);

-- Duplicate detection: lookup by content hash
CREATE INDEX IF NOT EXISTS idx_product_images_hash
  ON public.product_images (content_hash)
  WHERE content_hash != '' AND content_hash IS NOT NULL;

-- Migration/admin: find items by processing status
CREATE INDEX IF NOT EXISTS idx_product_images_status
  ON public.product_images (processing_status)
  WHERE processing_status != 'completed';

-- ─── Trigger: auto-update updated_at ────────────────────────────────────────

-- Reuse the update_updated_at() function from products_catalog_schema.sql
-- (already exists if products table was created first)
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS product_images_updated_at ON public.product_images;
CREATE TRIGGER product_images_updated_at
  BEFORE UPDATE ON public.product_images
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── RLS (Row Level Security) ───────────────────────────────────────────────
-- Public read access (images are public), admin write access.

ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

-- Anyone can read (images are served publicly)
CREATE POLICY "product_images_public_read"
  ON public.product_images FOR SELECT
  USING (true);

-- Only service role can insert/update/delete (admin operations via backend)
CREATE POLICY "product_images_service_write"
  ON public.product_images FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
