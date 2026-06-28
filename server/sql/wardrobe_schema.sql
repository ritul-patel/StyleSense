-- Wardrobe system schema for StyleSense
-- Run in Supabase SQL Editor

-- Wardrobe items (saved products)
CREATE TABLE IF NOT EXISTS public.wardrobe_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  product_id text NOT NULL,
  collection text NOT NULL DEFAULT 'Wishlist',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_wardrobe_user_product
  ON public.wardrobe_items (user_id, product_id);
CREATE INDEX IF NOT EXISTS idx_wardrobe_user_id
  ON public.wardrobe_items (user_id);

-- Closet items (user-uploaded clothing photos)
CREATE TABLE IF NOT EXISTS public.closet_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  image_url text NOT NULL,
  name text NOT NULL,
  category text NOT NULL DEFAULT 'Other',
  color text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_closet_user_id
  ON public.closet_items (user_id);

-- Outfit builds (user-created outfit combinations)
CREATE TABLE IF NOT EXISTS public.outfit_builds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  product_ids text[] NOT NULL DEFAULT '{}',
  closet_item_ids text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_outfits_user_id
  ON public.outfit_builds (user_id);

-- Collections (user-defined wardrobe groupings)
CREATE TABLE IF NOT EXISTS public.wardrobe_collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_collections_user_name
  ON public.wardrobe_collections (user_id, name);
CREATE INDEX IF NOT EXISTS idx_collections_user_id
  ON public.wardrobe_collections (user_id);
