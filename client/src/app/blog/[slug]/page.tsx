"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/app/components/Navbar";
import { apiFetch } from "@/lib/api";
import { AppIcon } from "@/components/ui/AppIcon";

type BlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  body_md: string;
  body_html: string;
  featured_image: string;
  featured_image_alt: string;
  published_at: string;
  reading_time: number;
  word_count: number;
  views: number;
  meta_title: string;
  meta_description: string;
  faq_schema: any[];
  author_name: string | null;
  author_slug: string | null;
  author_avatar: string | null;
  author_bio: string | null;
  category_name: string | null;
  category_slug: string | null;
  category_color: string | null;
  tags: { name: string; slug: string }[];
  related: { id: string; title: string; slug: string; excerpt: string; featured_image: string; published_at: string; reading_time: number }[];
  prev: { id: string; title: string; slug: string } | null;
  next: { id: string; title: string; slug: string } | null;
};

// Simple Markdown → HTML renderer (covers headings, paragraphs, lists, bold, italic, links, images, code, blockquotes, tables, hr)
function renderMarkdown(md: string): string {
  let html = md
    // Code blocks
    .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre class="blog-code"><code class="language-$1">$2</code></pre>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code class="blog-inline-code">$1</code>')
    // Images
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="blog-img" loading="lazy" />')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="blog-link" target="_blank" rel="noopener noreferrer">$1</a>')
    // Bold
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    // Headings
    .replace(/^######\s+(.+)$/gm, '<h6 class="blog-h6">$1</h6>')
    .replace(/^#####\s+(.+)$/gm, '<h5 class="blog-h5">$1</h5>')
    .replace(/^####\s+(.+)$/gm, '<h4 class="blog-h4">$1</h4>')
    .replace(/^###\s+(.+)$/gm, '<h3 class="blog-h3" id="$1">$1</h3>')
    .replace(/^##\s+(.+)$/gm, '<h2 class="blog-h2" id="$1">$1</h2>')
    .replace(/^#\s+(.+)$/gm, '<h1 class="blog-h1">$1</h1>')
    // Horizontal rule
    .replace(/^---$/gm, '<hr class="blog-hr" />')
    // Blockquote
    .replace(/^>\s+(.+)$/gm, '<blockquote class="blog-quote">$1</blockquote>')
    // Unordered list items
    .replace(/^- (.+)$/gm, '<li class="blog-li">$1</li>')
    // Ordered list items
    .replace(/^\d+\.\s+(.+)$/gm, '<li class="blog-li-ol">$1</li>')
    // Callout boxes
    .replace(/<div class="callout-box">\n?([\s\S]*?)<\/div>/g, '<div class="blog-callout">$1</div>')
    // Paragraphs (lines that aren't already HTML)
    .replace(/^(?!<[a-z/]|$)(.+)$/gm, '<p class="blog-p">$1</p>');

  // Wrap consecutive <li> in <ul>
  html = html.replace(/(<li class="blog-li">[\s\S]*?<\/li>\n?)+/g, (match) => `<ul class="blog-ul">${match}</ul>`);
  html = html.replace(/(<li class="blog-li-ol">[\s\S]*?<\/li>\n?)+/g, (match) => `<ol class="blog-ol">${match}</ol>`);

  // Clean up empty paragraphs
  html = html.replace(/<p class="blog-p"><\/p>/g, '');

  return html;
}

// Extract TOC from markdown headings
function extractTOC(md: string): { id: string; title: string; level: number }[] {
  const headings: { id: string; title: string; level: number }[] = [];
  const regex = /^(#{2,3})\s+(.+)$/gm;
  let match;
  while ((match = regex.exec(md)) !== null) {
    headings.push({
      id: match[2].replace(/[^a-z0-9\s-]/gi, "").replace(/\s+/g, "-").toLowerCase(),
      title: match[2].replace(/\{#[^}]+\}/g, "").trim(),
      level: match[1].length,
    });
  }
  return headings;
}

export default function BlogPostPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    apiFetch(`/api/v1/blog/posts/${encodeURIComponent(slug)}`)
      .then(async (res) => {
        if (!res.ok) { setError("Post not found"); return; }
        setPost(await res.json());
      })
      .catch(() => setError("Failed to load post"))
      .finally(() => setLoading(false));
  }, [slug]);

  const toc = useMemo(() => post ? extractTOC(post.body_md) : [], [post]);
  const renderedHtml = useMemo(() => post ? renderMarkdown(post.body_md) : "", [post]);

  const formatDate = (d: string) => new Date(d).toLocaleDateString("en-IN", { month: "long", day: "numeric", year: "numeric" });

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: post?.title, url }); } catch {}
    } else {
      navigator.clipboard.writeText(url);
    }
  };

  if (loading) {
    return (
      <div className="bg-[#fcf9f8] min-h-screen">
        <Navbar activePath="none" />
        <div className="pt-32 max-w-3xl mx-auto px-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-100 rounded w-1/2" />
            <div className="h-64 bg-gray-100 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="bg-[#fcf9f8] min-h-screen">
        <Navbar activePath="none" />
        <div className="pt-32 text-center px-6">
          <AppIcon name="error" size={48} className="text-gray-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Post Not Found</h1>
          <p className="text-gray-500 mb-6">This article may have been moved or deleted.</p>
          <Link href="/blog" className="text-[#002b92] font-bold hover:underline">← Back to Blog</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#fcf9f8] text-[#1b1c1b] min-h-screen" style={{ fontFamily: "Inter, sans-serif" }}>
      <Navbar activePath="none" />

      <article className="pt-24 md:pt-32 pb-20">
        {/* Hero */}
        <header className="max-w-3xl mx-auto px-4 sm:px-6 mb-10">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs text-gray-400 mb-6">
            <Link href="/blog" className="hover:text-[#002b92]">Blog</Link>
            <span>/</span>
            {post.category_name && (
              <>
                <Link href={`/blog?category=${post.category_slug}`} className="hover:text-[#002b92]">{post.category_name}</Link>
                <span>/</span>
              </>
            )}
            <span className="text-gray-600 truncate max-w-[200px]">{post.title}</span>
          </nav>

          {post.category_name && (
            <span className="inline-block px-3 py-0.5 rounded-full text-[10px] font-bold uppercase text-white mb-4" style={{ background: post.category_color || "#002b92" }}>
              {post.category_name}
            </span>
          )}

          <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight mb-4" style={{ fontFamily: "Manrope, sans-serif" }}>
            {post.title}
          </h1>

          {post.excerpt && (
            <p className="text-lg text-[#5a6060] leading-relaxed mb-6">{post.excerpt}</p>
          )}

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-6">
            {post.author_name && (
              <div className="flex items-center gap-2">
                {post.author_avatar && <img src={post.author_avatar} alt={post.author_name} className="w-8 h-8 rounded-full object-cover" />}
                <span className="font-medium text-[#1b1c1b]">{post.author_name}</span>
              </div>
            )}
            <span>{formatDate(post.published_at)}</span>
            <span>{post.reading_time} min read</span>
            <button onClick={handleShare} className="flex items-center gap-1 text-[#002b92] font-medium hover:underline">
              <AppIcon name="share" size={14} /> Share
            </button>
          </div>
        </header>

        {/* Featured Image */}
        {post.featured_image && (
          <div className="max-w-4xl mx-auto px-4 sm:px-6 mb-10">
            <div className="relative w-full aspect-[2/1] rounded-2xl overflow-hidden">
              <Image
                src={post.featured_image}
                alt={post.featured_image_alt || post.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 900px"
                priority
              />
            </div>
          </div>
        )}

        {/* Content + TOC */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-12">
          {/* Main Content */}
          <div
            className="prose-blog max-w-3xl"
            dangerouslySetInnerHTML={{ __html: renderedHtml }}
          />

          {/* Sticky TOC */}
          {toc.length > 2 && (
            <aside className="hidden lg:block">
              <div className="sticky top-28">
                <h4 className="text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-3">Table of Contents</h4>
                <nav className="space-y-1.5 border-l-2 border-gray-100 pl-3">
                  {toc.map((item) => (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      className={`block text-xs text-gray-500 hover:text-[#002b92] transition-colors ${item.level === 3 ? "pl-3" : ""}`}
                    >
                      {item.title}
                    </a>
                  ))}
                </nav>
              </div>
            </aside>
          )}
        </div>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="max-w-3xl mx-auto px-4 sm:px-6 mt-10 flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <Link key={tag.slug} href={`/blog?tag=${tag.slug}`} className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 hover:bg-[#002b92] hover:text-white transition-colors">
                #{tag.name}
              </Link>
            ))}
          </div>
        )}

        {/* Author Card */}
        {post.author_name && post.author_bio && (
          <div className="max-w-3xl mx-auto px-4 sm:px-6 mt-12">
            <div className="bg-white rounded-2xl p-6 border border-gray-100 flex gap-4">
              {post.author_avatar && <img src={post.author_avatar} alt={post.author_name} className="w-14 h-14 rounded-full object-cover flex-shrink-0" />}
              <div>
                <h4 className="font-bold text-[#1b1c1b]" style={{ fontFamily: "Manrope, sans-serif" }}>{post.author_name}</h4>
                <p className="text-sm text-gray-500 mt-1">{post.author_bio}</p>
              </div>
            </div>
          </div>
        )}

        {/* Prev/Next Navigation */}
        {(post.prev || post.next) && (
          <div className="max-w-3xl mx-auto px-4 sm:px-6 mt-12 grid grid-cols-2 gap-4">
            {post.prev ? (
              <Link href={`/blog/${post.prev.slug}`} className="p-4 rounded-xl border border-gray-100 hover:border-[#002b92]/30 transition-colors">
                <span className="text-[10px] text-gray-400 uppercase">Previous</span>
                <p className="text-sm font-semibold mt-1 line-clamp-2">{post.prev.title}</p>
              </Link>
            ) : <div />}
            {post.next ? (
              <Link href={`/blog/${post.next.slug}`} className="p-4 rounded-xl border border-gray-100 hover:border-[#002b92]/30 transition-colors text-right">
                <span className="text-[10px] text-gray-400 uppercase">Next</span>
                <p className="text-sm font-semibold mt-1 line-clamp-2">{post.next.title}</p>
              </Link>
            ) : <div />}
          </div>
        )}

        {/* Related Posts */}
        {post.related && post.related.length > 0 && (
          <div className="max-w-4xl mx-auto px-4 sm:px-6 mt-16">
            <h3 className="text-xl font-bold mb-6" style={{ fontFamily: "Manrope, sans-serif" }}>Related Articles</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {post.related.map((r) => (
                <Link key={r.id} href={`/blog/${r.slug}`} className="group bg-white rounded-xl overflow-hidden border border-gray-100 hover:shadow-lg transition-all">
                  {r.featured_image && (
                    <div className="relative h-32 bg-gray-100">
                      <Image src={r.featured_image} alt={r.title} fill className="object-cover group-hover:scale-105 transition-transform" sizes="300px" />
                    </div>
                  )}
                  <div className="p-4">
                    <h4 className="text-sm font-bold line-clamp-2 group-hover:text-[#002b92] transition-colors">{r.title}</h4>
                    <p className="text-[10px] text-gray-400 mt-2">{r.reading_time} min read</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="max-w-3xl mx-auto px-4 sm:px-6 mt-16 text-center">
          <div className="rounded-2xl p-10 text-white" style={{ background: "linear-gradient(135deg, #002b92, #003ec7)" }}>
            <h3 className="text-2xl font-bold mb-3" style={{ fontFamily: "Manrope, sans-serif" }}>Ready to find your colors?</h3>
            <p className="text-white/80 mb-6">Upload a photo and get personalized recommendations in seconds.</p>
            <Link href="/analysis" className="inline-flex items-center gap-2 bg-white text-[#002b92] px-8 py-3 rounded-full font-bold hover:scale-[1.02] transition-transform">
              Start Free Analysis
              <AppIcon name="arrow_forward" size={18} />
            </Link>
          </div>
        </div>
      </article>
    </div>
  );
}
