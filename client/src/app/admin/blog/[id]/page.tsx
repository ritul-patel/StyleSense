"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import RequireAdmin from "../../components/RequireAdmin";
import AdminLayout from "../../components/AdminLayout";
import { apiFetch } from "@/lib/api";
import { AppIcon } from "@/components/ui/AppIcon";

type Category = { id: string; name: string; slug: string };
type Tag = { id: string; name: string; slug: string };
type Author = { id: string; name: string; slug: string };

function EditContent() {
  const router = useRouter();
  const params = useParams();
  const postId = params?.id as string;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const [unsaved, setUnsaved] = useState(false);
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [bodyMd, setBodyMd] = useState("");
  const [featuredImage, setFeaturedImage] = useState("");
  const [featuredImageAlt, setFeaturedImageAlt] = useState("");
  const [authorId, setAuthorId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [status, setStatus] = useState("draft");
  const [scheduledAt, setScheduledAt] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [canonicalUrl, setCanonicalUrl] = useState("");
  const [version, setVersion] = useState(1);
  const [views, setViews] = useState(0);

  // Options
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  // Load post + options
  useEffect(() => {
    if (!postId) return;
    Promise.all([
      apiFetch(`/api/v1/admin/blog/posts/${postId}`).then(r => r.ok ? r.json() : null),
      apiFetch("/api/v1/admin/blog/categories").then(r => r.ok ? r.json() : []),
      apiFetch("/api/v1/admin/blog/tags").then(r => r.ok ? r.json() : []),
      apiFetch("/api/v1/admin/blog/authors").then(r => r.ok ? r.json() : []),
    ]).then(([post, cats, tgs, auths]) => {
      setCategories(cats);
      setTags(tgs);
      setAuthors(auths);
      if (post) {
        setTitle(post.title || "");
        setSlug(post.slug || "");
        setExcerpt(post.excerpt || "");
        setBodyMd(post.body_md || "");
        setFeaturedImage(post.featured_image || "");
        setFeaturedImageAlt(post.featured_image_alt || "");
        setAuthorId(post.author_id || "");
        setCategoryId(post.category_id || "");
        setStatus(post.status || "draft");
        setScheduledAt(post.scheduled_at ? post.scheduled_at.slice(0, 16) : "");
        setMetaTitle(post.meta_title || "");
        setMetaDescription(post.meta_description || "");
        setCanonicalUrl(post.canonical_url || "");
        setVersion(post.version || 1);
        setViews(post.views || 0);
        setSelectedTags((post.tags || []).map((t: any) => t.id));
      }
    }).finally(() => setLoading(false));
  }, [postId]);

  // Autosave
  useEffect(() => {
    if (!unsaved || !title.trim()) return;
    autosaveTimer.current = setTimeout(() => handleSave(undefined, true), 30000);
    return () => { if (autosaveTimer.current) clearTimeout(autosaveTimer.current); };
  }, [unsaved, bodyMd]);

  // Warn before leaving
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => { if (unsaved) { e.preventDefault(); e.returnValue = ""; } };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [unsaved]);

  function markUnsaved() { setUnsaved(true); }

  const handleSave = async (targetStatus?: string, isAutosave = false) => {
    if (!title.trim()) { showToast("Title is required"); return; }
    setSaving(true);
    try {
      const body: any = {
        title: title.trim(),
        slug,
        excerpt,
        body_md: bodyMd,
        featured_image: featuredImage,
        featured_image_alt: featuredImageAlt,
        author_id: authorId || null,
        category_id: categoryId || null,
        meta_title: metaTitle,
        meta_description: metaDescription,
        canonical_url: canonicalUrl,
        tags: selectedTags,
      };
      if (targetStatus) body.status = targetStatus;
      if (scheduledAt) body.scheduled_at = scheduledAt;

      const res = await apiFetch(`/api/v1/admin/blog/posts/${postId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setUnsaved(false);
        setVersion(v => v + 1);
        showToast(isAutosave ? "Autosaved" : targetStatus === "published" ? "Published!" : "Saved");
      } else {
        showToast(data.message || "Save failed");
      }
    } catch { showToast("Network error"); }
    finally { setSaving(false); }
  };

  // Markdown import
  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.name.endsWith(".md")) { showToast("Please select a .md file"); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      if (!content) return;
      const lines = content.split("\n");
      let bodyStart = 0;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith("---") && i > 2) { bodyStart = i + 1; break; }
      }
      const metaBlock = lines.slice(0, bodyStart).join("\n");
      const seoTitle = metaBlock.match(/\*\*SEO Title:\*\*\s*(.+)/)?.[1]?.trim() || "";
      const metaDesc = metaBlock.match(/\*\*Meta Description:\*\*\s*(.+)/)?.[1]?.trim() || "";
      const urlSlug = metaBlock.match(/\*\*URL Slug:\*\*\s*(.+)/)?.[1]?.trim().replace(/^\/blog\//, "") || "";
      const bodyContent = bodyStart > 0 ? lines.slice(bodyStart).join("\n").trim() : content;
      if (seoTitle && !title) setTitle(seoTitle);
      if (urlSlug) setSlug(urlSlug);
      if (metaDesc) setMetaDescription(metaDesc);
      setBodyMd(bodyContent);
      markUnsaved();
      showToast("Markdown imported");
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const wordCount = bodyMd.trim().split(/\s+/).filter(Boolean).length;
  const readingTime = Math.max(1, Math.ceil(wordCount / 230));

  if (loading) {
    return <AdminLayout><div className="py-20 text-center text-gray-400">Loading post...</div></AdminLayout>;
  }

  return (
    <AdminLayout>
      {toast && <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] px-5 py-3 rounded-full bg-[#1b1c1b] text-white text-sm font-bold shadow-xl">{toast}</div>}

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push("/admin/blog")} className="text-gray-400 hover:text-gray-700">
              <AppIcon name="arrow_back" size={20} />
            </button>
            <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "Manrope, sans-serif" }}>Edit Post</h1>
            {unsaved && <span className="text-[9px] uppercase tracking-wider font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Unsaved</span>}
            <span className="text-[9px] text-gray-400">v{version} • {views} views</span>
          </div>
          <div className="flex items-center gap-2">
            <label className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-bold text-gray-700 hover:bg-gray-50 cursor-pointer flex items-center gap-2">
              <AppIcon name="upload_file" size={14} />
              Import .md
              <input type="file" accept=".md" className="hidden" onChange={handleFileImport} />
            </label>
            <button onClick={() => handleSave()} disabled={saving} className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-40">
              {saving ? "Saving..." : "Save"}
            </button>
            {status !== "published" && (
              <button onClick={() => handleSave("published")} disabled={saving || !title.trim()} className="px-5 py-2 rounded-xl text-white text-sm font-bold disabled:opacity-40" style={{ background: "linear-gradient(135deg, #003ec7, #002b92)" }}>
                Publish
              </button>
            )}
            {status === "published" && (
              <button onClick={() => handleSave("draft")} disabled={saving} className="px-4 py-2 rounded-xl border border-amber-200 text-sm font-bold text-amber-700 hover:bg-amber-50 disabled:opacity-40">
                Unpublish
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Editor */}
          <div className="lg:col-span-2 space-y-4">
            <input type="text" value={title} onChange={(e) => { setTitle(e.target.value); markUnsaved(); }} placeholder="Post title..." className="w-full text-3xl font-bold border-0 border-b border-gray-100 pb-3 focus:outline-none focus:border-[#002b92] placeholder-gray-300" style={{ fontFamily: "Manrope, sans-serif" }} />
            <textarea value={excerpt} onChange={(e) => { setExcerpt(e.target.value); markUnsaved(); }} placeholder="Short excerpt..." rows={2} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#002b92]/20" />
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 bg-gray-50">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Markdown</span>
                <span className="text-[10px] text-gray-400">{wordCount} words • {readingTime} min</span>
              </div>
              <textarea value={bodyMd} onChange={(e) => { setBodyMd(e.target.value); markUnsaved(); }} placeholder="Write in Markdown..." rows={24} className="w-full px-4 py-4 text-sm font-mono resize-y focus:outline-none min-h-[400px]" spellCheck />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl border p-4 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Settings</h3>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-gray-400 font-bold block mb-1">Status</label>
                <select value={status} onChange={(e) => { setStatus(e.target.value); markUnsaved(); }} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              {status === "scheduled" && (
                <input type="datetime-local" value={scheduledAt} onChange={(e) => { setScheduledAt(e.target.value); markUnsaved(); }} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              )}
              <div>
                <label className="text-[10px] uppercase tracking-wider text-gray-400 font-bold block mb-1">Slug</label>
                <input type="text" value={slug} onChange={(e) => { setSlug(e.target.value); markUnsaved(); }} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-gray-400 font-bold block mb-1">Category</label>
                <select value={categoryId} onChange={(e) => { setCategoryId(e.target.value); markUnsaved(); }} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                  <option value="">None</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-gray-400 font-bold block mb-1">Author</label>
                <select value={authorId} onChange={(e) => { setAuthorId(e.target.value); markUnsaved(); }} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                  <option value="">None</option>
                  {authors.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-gray-400 font-bold block mb-1">Tags</label>
                <div className="flex flex-wrap gap-1.5">
                  {tags.map(t => (
                    <button key={t.id} onClick={() => { setSelectedTags(prev => prev.includes(t.id) ? prev.filter(x => x !== t.id) : [...prev, t.id]); markUnsaved(); }}
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${selectedTags.includes(t.id) ? "bg-[#002b92] text-white border-[#002b92]" : "bg-white text-gray-600 border-gray-200"}`}>
                      {t.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border p-4 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Featured Image</h3>
              <input type="text" value={featuredImage} onChange={(e) => { setFeaturedImage(e.target.value); markUnsaved(); }} placeholder="Image URL..." className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              {featuredImage && <img src={featuredImage} alt="Preview" className="w-full h-32 object-cover rounded-lg border" />}
              <input type="text" value={featuredImageAlt} onChange={(e) => { setFeaturedImageAlt(e.target.value); markUnsaved(); }} placeholder="Alt text..." className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            </div>

            <div className="bg-white rounded-xl border p-4 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">SEO</h3>
              <input type="text" value={metaTitle} onChange={(e) => { setMetaTitle(e.target.value); markUnsaved(); }} placeholder="Meta title..." className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              <textarea value={metaDescription} onChange={(e) => { setMetaDescription(e.target.value); markUnsaved(); }} placeholder="Meta description..." rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none" />
              <input type="text" value={canonicalUrl} onChange={(e) => { setCanonicalUrl(e.target.value); markUnsaved(); }} placeholder="Canonical URL..." className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              <div className="bg-gray-50 rounded-lg p-3 space-y-1">
                <p className="text-[10px] font-bold text-gray-400 uppercase">SEO Preview</p>
                <p className="text-sm text-[#1a0dab] font-medium line-clamp-1">{metaTitle || title || "Title"}</p>
                <p className="text-[11px] text-green-700">stylesense.co.in/blog/{slug || "slug"}</p>
                <p className="text-xs text-gray-500 line-clamp-2">{metaDescription || excerpt || "Description"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export default function EditBlogPostPage() {
  return (<RequireAdmin><EditContent /></RequireAdmin>);
}
