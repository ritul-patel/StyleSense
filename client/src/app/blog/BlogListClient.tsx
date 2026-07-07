"use client";

import { useState, useEffect, useCallback } from "react";
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
  featured_image: string;
  featured_image_alt: string;
  published_at: string;
  reading_time: number;
  author_name: string | null;
  author_slug: string | null;
  author_avatar: string | null;
  category_name: string | null;
  category_slug: string | null;
  category_color: string | null;
};

type Category = {
  id: string;
  name: string;
  slug: string;
  color: string;
  post_count: number;
};

export default function BlogListClient() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("");
  const [search, setSearch] = useState("");

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "9" });
      if (activeCategory) params.set("category", activeCategory);
      if (search) params.set("search", search);
      const res = await apiFetch(`/api/v1/blog/posts?${params}`);
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts || []);
        setTotal(data.total || 0);
      }
    } catch {}
    finally { setLoading(false); }
  }, [page, activeCategory, search]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  useEffect(() => {
    apiFetch("/api/v1/blog/categories").then(r => r.ok ? r.json() : []).then(setCategories).catch(() => {});
  }, []);

  const formatDate = (d: string) => {
    return new Date(d).toLocaleDateString("en-IN", { month: "long", day: "numeric", year: "numeric" });
  };

  return (
    <div className="bg-[#fcf9f8] text-[#1b1c1b] min-h-screen antialiased" style={{ fontFamily: "Inter, sans-serif" }}>
      <Navbar activePath="none" />

      <main className="pt-24 md:pt-32 pb-20 px-4 sm:px-6 md:px-12 max-w-[1200px] mx-auto">
        {/* Header */}
        <header className="mb-12 text-center">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-[#dde1ff] text-[#001452] text-[10px] uppercase tracking-widest font-bold mb-4">
            StyleSense Blog
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4" style={{ fontFamily: "Manrope, sans-serif" }}>
            Style Guides & Insights
          </h1>
          <p className="text-[#5a6060] text-lg max-w-lg mx-auto">
            Expert tips on color analysis, personal styling, and building a wardrobe that works for you.
          </p>
        </header>

        {/* Search + Categories */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-10">
          <div className="flex gap-2 flex-wrap justify-center">
            <button
              onClick={() => { setActiveCategory(""); setPage(1); }}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${!activeCategory ? "bg-[#1b1c1b] text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
            >
              All
            </button>
            {categories.filter(c => c.post_count > 0).map((cat) => (
              <button
                key={cat.id}
                onClick={() => { setActiveCategory(cat.slug); setPage(1); }}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${activeCategory === cat.slug ? "bg-[#1b1c1b] text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
              >
                {cat.name}
              </button>
            ))}
          </div>
          <div className="relative w-full md:w-64">
            <AppIcon name="search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search articles..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#002b92]/20"
            />
          </div>
        </div>

        {/* Posts Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-100 animate-pulse">
                <div className="h-48 bg-gray-100" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-gray-100 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-full" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20">
            <AppIcon name="inbox" size={48} className="text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-400 mb-2">No articles yet</h3>
            <p className="text-sm text-gray-400">Check back soon for style guides and tips.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post, idx) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                {/* Image */}
                <div className="relative h-48 bg-gray-100 overflow-hidden">
                  {post.featured_image ? (
                    <Image
                      src={post.featured_image}
                      alt={post.featured_image_alt || post.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      priority={idx < 3}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <AppIcon name="image" size={32} className="text-gray-300" />
                    </div>
                  )}
                  {post.category_name && (
                    <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase text-white" style={{ background: post.category_color || "#002b92" }}>
                      {post.category_name}
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="p-5">
                  <h2 className="text-lg font-bold text-[#1b1c1b] line-clamp-2 mb-2 group-hover:text-[#002b92] transition-colors" style={{ fontFamily: "Manrope, sans-serif" }}>
                    {post.title}
                  </h2>
                  {post.excerpt && (
                    <p className="text-sm text-[#5a6060] line-clamp-2 mb-4">{post.excerpt}</p>
                  )}
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <div className="flex items-center gap-2">
                      {post.author_avatar && (
                        <img src={post.author_avatar} alt={post.author_name || ""} className="w-5 h-5 rounded-full object-cover" />
                      )}
                      <span>{post.author_name || "StyleSense"}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span>{formatDate(post.published_at)}</span>
                      <span>{post.reading_time} min read</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {total > 9 && (
          <div className="flex items-center justify-center gap-3 mt-12">
            <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-bold disabled:opacity-40">Previous</button>
            <span className="text-sm text-gray-500">Page {page} of {Math.ceil(total / 9)}</span>
            <button onClick={() => setPage(page + 1)} disabled={page * 9 >= total} className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-bold disabled:opacity-40">Next</button>
          </div>
        )}

        {/* CTA */}
        <div className="mt-20 text-center bg-white rounded-2xl p-10 border border-gray-100">
          <h3 className="text-2xl font-bold mb-3" style={{ fontFamily: "Manrope, sans-serif" }}>Discover Your Colors</h3>
          <p className="text-[#5a6060] mb-6 max-w-md mx-auto">Upload a photo and get personalized color recommendations based on your unique skin tone.</p>
          <Link href="/analysis" className="inline-flex items-center gap-2 px-8 py-3 rounded-full text-white font-bold hover:scale-[1.02] transition-transform" style={{ background: "linear-gradient(135deg, #002b92, #003ec7)" }}>
            Try Free Analysis
            <AppIcon name="arrow_forward" size={18} />
          </Link>
        </div>
      </main>
    </div>
  );
}
