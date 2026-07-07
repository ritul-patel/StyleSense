"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import RequireAdmin from "../../components/RequireAdmin";
import AdminLayout from "../../components/AdminLayout";
import { apiFetch } from "@/lib/api";
import { AppIcon } from "@/components/ui/AppIcon";

type Category = { id: string; name: string; slug: string };
type Tag = { id: string; name: string; slug: string };
type Author = { id: string; name: string; slug: string };

function EditorContent() {
  const router = useRouter();
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

  // Options
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  // Load categories, tags, authors
  useEffect(() => {
    Promise.all([
      apiFetch("/api/v1/admin/blog/categories").then(r => r.ok ? r.json() : []),
      apiFetch("/api/v1/admin/blog/tags").then(r => r.ok ? r.json() : []),
      apiFetch("/api/v1/admin/blog/authors").then(r => r.ok ? r.json() : []),
    ]).then(([cats, tgs, auths]) => {
      setCategories(cats);
      setTags(tgs);
      setAuthors(auths);
    });
  }, []);

  // Auto-generate slug from title
  useEffect(() => {
    if (!slug || slug === makeSlug(title.slice(0, -1))) {
      setSlug(makeSlug(title));
    }
  }, [title]);

  // Autosave (every 30s if unsaved)
  useEffect(() => {
    if (!unsaved || !title.trim()) return;
    autosaveTimer.current = setTimeout(() => {
      handleSave("draft", true);
    }, 30000);
    return () => { if (autosaveTimer.current) clearTimeout(autosaveTimer.current); };
  }, [unsaved, bodyMd]);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (unsaved) { e.preventDefault(); e.returnValue = ""; }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [unsaved]);

  function makeSlug(text: string): string {
    return text.trim().toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 200);
  }

  function markUnsaved() { setUnsaved(true); }

  const handleSave = async (targetStatus?: string, isAutosave = false) => {
    if (!title.trim()) { showToast("Title is required"); return; }
    setSaving(true);
    try {
      const body = {
        title: title.trim(),
        slug: slug || makeSlug(title),
        excerpt,
        body_md: bodyMd,
        body_html: "", // Will be rendered client-side or via a future parser
        featured_image: featuredImage,
        featured_image_alt: featuredImageAlt,
        author_id: authorId || null,
        category_id: categoryId || null,
        status: targetStatus || status,
        scheduled_at: scheduledAt || null,
        meta_title: metaTitle,
        meta_description: metaDescription,
        canonical_url: canonicalUrl,
        tags: selectedTags,
      };

      const res = await apiFetch("/api/v1/admin/blog/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setUnsaved(false);
        if (!isAutosave) {
          showToast(targetStatus === "published" ? "Published!" : "Saved as draft");
          router.push(`/admin/blog/${data.post.id}`);
        } else {
          showToast("Autosaved");
        }
      } else {
        showToast(data.message || "Save failed");
      }
    } catch { showToast("Network error"); }
    finally { setSaving(false); }
  };

  // Markdown file import
  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.name.endsWith(".md")) { showToast("Please select a .md file"); return; }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      if (!content) return;

      // Extract SEO metadata block
      const lines = content.split("\n");
      let inMeta = false;
      let metaBlock = "";
      let bodyStart = 0;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.startsWith("# SEO Metadata") || line.startsWith("**SEO Title:**")) {
          inMeta = true;
        }
        if (inMeta && line.startsWith("---")) {
          bodyStart = i + 1;
          break;
        }
        if (inMeta) metaBlock += line + "\n";
      }

      // Parse metadata
      const seoTitle = metaBlock.match(/\*\*SEO Title:\*\*\s*(.+)/)?.[1]?.trim() || "";
      const metaTitleVal = metaBlock.match(/\*\*Meta Title:\*\*\s*(.+)/)?.[1]?.trim() || "";
      const metaDesc = metaBlock.match(/\*\*Meta Description:\*\*\s*(.+)/)?.[1]?.trim() || "";
      const urlSlug = metaBlock.match(/\*\*URL Slug:\*\*\s*(.+)/)?.[1]?.trim().replace(/^\/blog\//, "") || "";

      // Extract first H1 as title if no SEO title
      const h1Match = content.match(/^#\s+(.+)$/m);
      const extractedTitle = seoTitle || h1Match?.[1] || file.name.replace(".md", "");

      // Body is everything after the metadata separator
      const bodyContent = bodyStart > 0 ? lines.slice(bodyStart).join("\n").trim() : content;

      setTitle(extractedTitle);
      if (urlSlug) setSlug(urlSlug);
      if (metaTitleVal) setMetaTitle(metaTitleVal);
      if (metaDesc) setMetaDescription(metaDesc);
      setBodyMd(bodyContent);
      setUnsaved(true);
      showToast("Markdown imported successfully");
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const wordCount = bodyMd.trim().split(/\s+/).filter(Boolean).length;
  const readingTime = Math.max(1, Math.ceil(wordCount / 230));

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
            <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "Manrope, sans-serif" }}>New Post</h1>
            {unsaved && <span className="text-[9px] uppercase tracking-wider font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Unsaved</span>}
          </div>
          <div className="flex items-center gap-2">
            <label className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-bold text-gray-700 hover:bg-gray-50 cursor-pointer flex items-center gap-2">
              <AppIcon name="upload_file" size={14} />
              Import .md
              <input type="file" accept=".md" className="hidden" onChange={handleFileImport} />
            </label>
            <button onClick={() => handleSave("draft")} disabled={saving} className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-40">
              {saving ? "Saving..." : "Save Draft"}
            </button>
            <button onClick={() => handleSave("published")} disabled={saving || !title.trim()} className="px-5 py-2 rounded-xl text-white text-sm font-bold disabled:opacity-40" style={{ background: "linear-gradient(135deg, #003ec7, #002b92)" }}>
              Publish
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Editor */}
          <div className="lg:col-span-2 space-y-4">
            {/* Title */}
            <input
              type="text"
              value={title}
              onChange={(e) => { setTitle(e.target.value); markUnsaved(); }}
              placeholder="Post title..."
              className="w-full text-3xl font-bold border-0 border-b border-gray-100 pb-3 focus:outline-none focus:border-[#002b92] placeholder-gray-300"
              style={{ fontFamily: "Manrope, sans-serif" }}
            />

            {/* Excerpt */}
            <textarea
              value={excerpt}
              onChange={(e) => { setExcerpt(e.target.value); markUnsaved(); }}
              placeholder="Short excerpt (appears in listings and SEO)..."
              rows={2}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#002b92]/20"
            />

            {/* Body (Markdown) */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 bg-gray-50">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Markdown Editor</span>
                <span className="text-[10px] text-gray-400">{wordCount} words • {readingTime} min read</span>
              </div>
              <textarea
                value={bodyMd}
                onChange={(e) => { setBodyMd(e.target.value); markUnsaved(); }}
                placeholder="Write your post in Markdown..."
                rows={24}
                className="w-full px-4 py-4 text-sm font-mono resize-y focus:outline-none min-h-[400px]"
                spellCheck
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Publish Settings */}
            <div className="bg-white rounded-xl border p-4 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Publish</h3>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-gray-400 font-bold block mb-1">Status</label>
                <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="scheduled">Scheduled</option>
                </select>
              </div>
              {status === "scheduled" && (
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-gray-400 font-bold block mb-1">Schedule Date</label>
                  <input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                </div>
              )}
              <div>
                <label className="text-[10px] uppercase tracking-wider text-gray-400 font-bold block mb-1">Slug</label>
                <input type="text" value={slug} onChange={(e) => { setSlug(e.target.value); markUnsaved(); }} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono" />
              </div>
            </div>

            {/* Category & Tags */}
            <div className="bg-white rounded-xl border p-4 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Organization</h3>
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
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition-all ${selectedTags.includes(t.id) ? "bg-[#002b92] text-white border-[#002b92]" : "bg-white text-gray-600 border-gray-200 hover:border-[#002b92]"}`}>
                      {t.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Featured Image */}
            <div className="bg-white rounded-xl border p-4 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Featured Image</h3>
              <input type="text" value={featuredImage} onChange={(e) => { setFeaturedImage(e.target.value); markUnsaved(); }} placeholder="Image URL..." className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              {featuredImage && <img src={featuredImage} alt="Preview" className="w-full h-32 object-cover rounded-lg border" />}
              <input type="text" value={featuredImageAlt} onChange={(e) => { setFeaturedImageAlt(e.target.value); markUnsaved(); }} placeholder="Alt text..." className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            </div>

            {/* SEO */}
            <div className="bg-white rounded-xl border p-4 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">SEO</h3>
              <input type="text" value={metaTitle} onChange={(e) => { setMetaTitle(e.target.value); markUnsaved(); }} placeholder="Meta title (auto from title if empty)" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              <textarea value={metaDescription} onChange={(e) => { setMetaDescription(e.target.value); markUnsaved(); }} placeholder="Meta description..." rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none" />
              <input type="text" value={canonicalUrl} onChange={(e) => { setCanonicalUrl(e.target.value); markUnsaved(); }} placeholder="Canonical URL (optional)" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              {/* SEO Preview */}
              <div className="bg-gray-50 rounded-lg p-3 space-y-1">
                <p className="text-[10px] font-bold text-gray-400 uppercase">Preview</p>
                <p className="text-sm text-[#1a0dab] font-medium line-clamp-1">{metaTitle || title || "Post title"}</p>
                <p className="text-[11px] text-green-700">stylesense.co.in/blog/{slug || "post-slug"}</p>
                <p className="text-xs text-gray-500 line-clamp-2">{metaDescription || excerpt || "Post description..."}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export default function NewBlogPostPage() {
  return (<RequireAdmin><EditorContent /></RequireAdmin>);
}
