-- Performance fix: composite index for the main products listing query
-- WHERE is_published = true ORDER BY created_at DESC LIMIT N
-- Run in Supabase SQL Editor

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_published_created
  ON public.products (is_published, created_at DESC);

-- Optional: drop the now-redundant single-column indexes if desired
-- DROP INDEX IF EXISTS idx_products_published;
-- DROP INDEX IF EXISTS idx_products_created;
