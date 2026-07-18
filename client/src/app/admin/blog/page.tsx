"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import RequireAdmin from "../components/RequireAdmin";
import AdminLayout from "../components/AdminLayout";
import { apiFetch } from "@/lib/api";
import { AppIcon } from "@/components/ui/AppIcon";

type BlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  status: string;
  featured_image: string;
  published_at: string | null;
  scheduled_at: string | null;
  reading_time: number;
  word_count: number;
  views: number;
  created_at: string;
  updated_at: string;
  author_name: string | null;
  author_avatar: string | null;
  category_name: string | null;
  category_slug: string | null;
};

type Stats = {
  total: number;
  drafts: number;
  published: number;
  scheduled: number;
  archived: number;
  trash: number;
  total_views: number;
};

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  published: "bg-green-100 text-green-700",
  scheduled: "bg-blue-100 text-blue-700",
  archived: "bg-amber-100 text-amber-700",
  trash: "bg-red-100 text-red-600",
};

function BlogContent() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState("");

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const fetchStats = useCallback(async () => {
    try {
      const res = await apiFetch("/api/v1/admin/blog/stats");
      if (res.ok) setStats(await res.json());
    } catch {}
  }, []);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (filter !== "all") params.set("status", filter);
      if (search) params.set("search", search);
      const res = await apiFetch(`/api/v1/admin/blog/posts?${params}`);
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts || []);
        setTotal(data.total || 0);
      }
    } catch {}
    finally { setLoading(false); }
  }, [page, filter, search]);

  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const deletePost = async (id: string, title: string) => {
    if (!confirm(`Move "${title}" to trash?`)) return;
    const res = await apiFetch(`/api/v1/admin/blog/posts/${id}`, { method: "DELETE" });
    if (res.ok) { showToast("Moved to trash"); fetchPosts(); fetchStats(); }
  };

  const duplicatePost = async (id: string) => {
    const res = await apiFetch(`/api/v1/admin/blog/posts/${id}/duplicate`, { method: "POST" });
    if (res.ok) { showToast("Post duplicated"); fetchPosts(); }
  };

  const formatDate = (d: string | null) => {
    if (!d) return "-";
    return new Date(d).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <AdminLayout>
      {toast && <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] px-5 py-3 rounded-full bg-[#1b1c1b] text-white text-sm font-bold shadow-xl">{toast}</div>}

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight" style={{ fontFamily: "Manrope, sans-serif" }}>Blog</h1>
            <p className="text-sm text-gray-500 mt-1">Manage articles and content</p>
          </div>
          <Link href="/admin/blog/new" className="px-5 py-2.5 rounded-xl text-white text-sm font-bold flex items-center gap-2" style={{ background: "linear-gradient(135deg, #003ec7, #002b92)" }}>
            <AppIcon name="add" size={16} />
            New Post
          </Link>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {[
              { label: "Total", value: stats.total, color: "bg-gray-50" },
              { label: "Drafts", value: stats.drafts, color: "bg-gray-50" },
              { label: "Published", value: stats.published, color: "bg-green-50" },
              { label: "Scheduled", value: stats.scheduled, color: "bg-blue-50" },
              { label: "Archived", value: stats.archived, color: "bg-amber-50" },
              { label: "Trash", value: stats.trash, color: "bg-red-50" },
              { label: "Views", value: stats.total_views, color: "bg-indigo-50" },
            ].map((s) => (
              <div key={s.label} className={`rounded-xl p-3 border text-center ${s.color}`}>
                <p className="text-xl font-bold">{s.value}</p>
                <p className="text-[9px] uppercase tracking-wider font-bold text-gray-500">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex rounded-lg border border-gray-200 overflow-hidden">
            {["all", "draft", "published", "scheduled", "archived", "trash"].map((f) => (
              <button key={f} onClick={() => { setFilter(f); setPage(1); }} className={`px-3 py-1.5 text-[10px] font-bold capitalize ${filter === f ? "bg-[#002b92] text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}>
                {f}
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="Search posts..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="flex-1 max-w-xs border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#002b92]/20"
          />
        </div>

        {/* Posts Table */}
        {loading ? (
          <div className="bg-white rounded-xl p-12 border text-center text-gray-400 text-sm">Loading...</div>
        ) : posts.length === 0 ? (
          <div className="bg-white rounded-xl p-12 border text-center">
            <AppIcon name="inbox" size={36} className="text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-400">No posts found</p>
            <Link href="/admin/blog/new" className="inline-block mt-4 px-5 py-2 rounded-xl text-white text-sm font-bold" style={{ background: "linear-gradient(135deg, #003ec7, #002b92)" }}>
              Create your first post
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Title</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Status</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600 hidden md:table-cell">Category</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600 hidden lg:table-cell">Date</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600 hidden lg:table-cell">Views</th>
                  <th className="text-right px-5 py-3 font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((post) => (
                  <tr key={post.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-5 py-3">
                      <div>
                        <Link href={`/admin/blog/${post.id}`} className="font-medium text-gray-800 hover:text-[#002b92] line-clamp-1">
                          {post.title || "Untitled"}
                        </Link>
                        {post.author_name && <p className="text-[10px] text-gray-400 mt-0.5">{post.author_name} • {post.reading_time} min read</p>}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${STATUS_COLORS[post.status] || "bg-gray-100"}`}>
                        {post.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-500 hidden md:table-cell">{post.category_name || "-"}</td>
                    <td className="px-5 py-3 text-gray-500 text-xs hidden lg:table-cell">{formatDate(post.published_at || post.created_at)}</td>
                    <td className="px-5 py-3 text-gray-500 hidden lg:table-cell">{post.views}</td>
                    <td className="px-5 py-3 text-right space-x-2">
                      <Link href={`/admin/blog/${post.id}`} className="text-[#002b92] text-xs font-bold hover:underline">Edit</Link>
                      <button onClick={() => duplicatePost(post.id)} className="text-gray-500 text-xs font-bold hover:underline">Duplicate</button>
                      <button onClick={() => deletePost(post.id, post.title)} className="text-red-500 text-xs font-bold hover:underline">Trash</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {total > 20 && (
          <div className="flex items-center justify-center gap-3">
            <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="px-4 py-2 rounded-lg border text-sm disabled:opacity-40">Previous</button>
            <span className="text-sm text-gray-500">Page {page} of {Math.ceil(total / 20)}</span>
            <button onClick={() => setPage(page + 1)} disabled={page * 20 >= total} className="px-4 py-2 rounded-lg border text-sm disabled:opacity-40">Next</button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default function AdminBlogPage() {
  return (<RequireAdmin><BlogContent /></RequireAdmin>);
}
