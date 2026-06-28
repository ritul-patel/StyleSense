-- Products catalog schema for StyleSense Admin Portal
-- Run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE,
  brand text DEFAULT '',
  category text NOT NULL DEFAULT 'other',
  description text DEFAULT '',
  price numeric(10,2) NOT NULL DEFAULT 0,
  currency text DEFAULT 'INR',
  image_url text DEFAULT '',
  affiliate_url text DEFAULT '',
  store_url text DEFAULT '',
  primary_color text DEFAULT '',
  secondary_colors jsonb DEFAULT '[]'::jsonb,
  seasons jsonb DEFAULT '[]'::jsonb,
  occasions jsonb DEFAULT '[]'::jsonb,
  styles jsonb DEFAULT '[]'::jsonb,
  materials jsonb DEFAULT '[]'::jsonb,
  fit text DEFAULT '',
  formality text DEFAULT '',
  ai_metadata jsonb DEFAULT '{}'::jsonb,
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products (category);
CREATE INDEX IF NOT EXISTS idx_products_brand ON public.products (brand);
CREATE INDEX IF NOT EXISTS idx_products_published ON public.products (is_published);
CREATE INDEX IF NOT EXISTS idx_products_price ON public.products (price);
CREATE INDEX IF NOT EXISTS idx_products_created ON public.products (created_at DESC);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS products_updated_at ON public.products;
CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
