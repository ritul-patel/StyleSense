-- ═══════════════════════════════════════════════════════════════
-- StyleSense Blog CMS Schema
-- Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- Blog Authors (linked to auth.users for admin authors)
CREATE TABLE public.blog_authors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  bio text DEFAULT '',
  avatar_url text DEFAULT '',
  website_url text DEFAULT '',
  twitter_handle text DEFAULT '',
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Blog Categories
CREATE TABLE public.blog_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  description text DEFAULT '',
  color text DEFAULT '#002b92',
  sort_order smallint DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Blog Tags
CREATE TABLE public.blog_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Blog Posts (core content table)
CREATE TABLE public.blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  excerpt text DEFAULT '',
  body_md text NOT NULL DEFAULT '',
  body_html text NOT NULL DEFAULT '',
  featured_image text DEFAULT '',
  featured_image_alt text DEFAULT '',
  author_id uuid REFERENCES public.blog_authors(id) ON DELETE SET NULL,
  category_id uuid REFERENCES public.blog_categories(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'scheduled', 'archived', 'trash')),
  published_at timestamptz,
  scheduled_at timestamptz,
  reading_time smallint DEFAULT 0,
  word_count integer DEFAULT 0,
  -- SEO fields
  meta_title text DEFAULT '',
  meta_description text DEFAULT '',
  canonical_url text DEFAULT '',
  og_image text DEFAULT '',
  -- Schema/structured data
  faq_schema jsonb DEFAULT '[]'::jsonb,
  -- Tracking
  views integer DEFAULT 0,
  version smallint DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Blog Post <-> Tag junction
CREATE TABLE public.blog_post_tags (
  post_id uuid NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES public.blog_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);

-- Blog Media Library
CREATE TABLE public.blog_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  filename text NOT NULL,
  storage_path text NOT NULL,
  public_url text NOT NULL,
  mime_type text NOT NULL,
  size_bytes integer DEFAULT 0,
  width smallint,
  height smallint,
  alt_text text DEFAULT '',
  caption text DEFAULT '',
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════════
-- Indexes
-- ═══════════════════════════════════════════════════════════════

CREATE INDEX idx_blog_posts_status ON public.blog_posts(status);
CREATE INDEX idx_blog_posts_published ON public.blog_posts(published_at DESC) WHERE status = 'published';
CREATE INDEX idx_blog_posts_author ON public.blog_posts(author_id);
CREATE INDEX idx_blog_posts_category ON public.blog_posts(category_id);
CREATE INDEX idx_blog_posts_created ON public.blog_posts(created_at DESC);
CREATE INDEX idx_blog_media_uploaded_by ON public.blog_media(uploaded_by);

-- ═══════════════════════════════════════════════════════════════
-- RLS
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_authors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_post_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_media ENABLE ROW LEVEL SECURITY;

-- Public read for published posts
CREATE POLICY "Public read published posts" ON public.blog_posts
  FOR SELECT USING (status = 'published');
CREATE POLICY "Service role blog_posts" ON public.blog_posts
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Public read authors" ON public.blog_authors
  FOR SELECT USING (is_active = true);
CREATE POLICY "Service role blog_authors" ON public.blog_authors
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Public read categories" ON public.blog_categories
  FOR SELECT USING (true);
CREATE POLICY "Service role blog_categories" ON public.blog_categories
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Public read tags" ON public.blog_tags
  FOR SELECT USING (true);
CREATE POLICY "Service role blog_tags" ON public.blog_tags
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Public read post_tags" ON public.blog_post_tags
  FOR SELECT USING (true);
CREATE POLICY "Service role blog_post_tags" ON public.blog_post_tags
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role blog_media" ON public.blog_media
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- ═══════════════════════════════════════════════════════════════
-- Triggers (uses existing update_updated_at function)
-- ═══════════════════════════════════════════════════════════════

CREATE TRIGGER blog_posts_updated_at
  BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER blog_authors_updated_at
  BEFORE UPDATE ON public.blog_authors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
