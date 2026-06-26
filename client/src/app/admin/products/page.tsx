"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import RequireAdmin from "../components/RequireAdmin";
import AdminLayout from "../components/AdminLayout";
import { apiFetch } from "@/lib/api";

type Product = {
  id: string;
  name: string;
  slug: string;
  brand: string;
  category: string;
  price: number;
  currency: string;
  image_url: string;
  primary_color: string;
  is_published: boolean;
  created_at: string;
};

type EditorProduct = {
  name: string;
  brand: string;
  category: string;
  description: string;
  price: number;
  image_url: string;
  affiliate_url: string;
  store_url: string;
  primary_color: string;
  is_published: boolean;
};

const CATEGORIES = ["tshirt", "polo", "shirt", "jeans", "sneakers", "jacket", "pants", "accessories", "other"];
const EMPTY_PRODUCT: EditorProduct = { name: "", brand: "", category: "tshirt", description: "", price: 0, image_url: "", affiliate_url: "", store_url: "", primary_color: "", is_published: false };

function ProductsContent() {
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<EditorProduct>(EMPTY_PRODUCT);
  const [showEditor, setShowEditor] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "30" });
      if (search) params.set("search", search);
      const res = await apiFetch(`/api/v1/admin/products?${params}`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products);
        setTotal(data.total);
      }
    } catch { /* */ }
    finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const openNew = () => { setEditId(null); setForm(EMPTY_PRODUCT); setShowEditor(true); };
  const openEdit = async (id: string) => {
    const res = await apiFetch(`/api/v1/admin/products/${id}`);
    if (res.ok) {
      const p = await res.json();
      setForm({ name: p.name, brand: p.brand, category: p.category, description: p.description || "", price: p.price, image_url: p.image_url, affiliate_url: p.affiliate_url, store_url: p.store_url, primary_color: p.primary_color, is_published: p.is_published });
      setEditId(id);
      setShowEditor(true);
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      const url = editId ? `/api/v1/admin/products/${editId}` : "/api/v1/admin/products";
      const method = editId ? "PATCH" : "POST";
      const res = await apiFetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (res.ok) { showToast(editId ? "Product updated" : "Product created"); setShowEditor(false); fetchProducts(); }
      else { const b = await res.json().catch(() => ({})); showToast(b.message || "Failed"); }
    } catch { showToast("Network error"); }
    finally { setSaving(false); }
  };

  const togglePublish = async (id: string, current: boolean) => {
    await apiFetch(`/api/v1/admin/products/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ is_published: !current }) });
    fetchProducts();
  };

  const deleteProduct = async (id: string) => {
    if (!confirm("Delete this product permanently?")) return;
    await apiFetch(`/api/v1/admin/products/${id}`, { method: "DELETE" });
    showToast("Product deleted");
    fetchProducts();
  };

  // AI Metadata
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);

  const generateMetadata = async () => {
    if (!editId) return;
    setAiLoading(true);
    setAiResult(null);
    try {
      const res = await apiFetch(`/api/v1/admin/products/${editId}/generate-metadata`, { method: "POST" });
      const data = await res.json();
      if (data.success && data.metadata) {
        setAiResult(data);
        showToast(`Generated in ${data.duration_ms}ms via ${data.provider}`);
      } else {
        showToast(data.message || "Generation failed");
      }
    } catch { showToast("Network error"); }
    finally { setAiLoading(false); }
  };

  const applyAiMetadata = () => {
    if (!aiResult?.metadata) return;
    const m = aiResult.metadata;
    setForm((f) => ({
      ...f,
      primary_color: m.primary_color || f.primary_color,
      description: m.description || f.description,
    }));
    showToast("AI metadata applied — review and save");
    setAiResult(null);
  };

  return (
    <AdminLayout>
      {toast && <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] px-5 py-3 rounded-full bg-[#1b1c1b] text-white text-sm font-bold shadow-xl">{toast}</div>}

      {/* Editor Modal */}
      {showEditor && (
        <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-start justify-center pt-20 px-4 overflow-y-auto" onClick={() => setShowEditor(false)}>
          <div className="bg-white rounded-2xl p-8 w-full max-w-2xl shadow-2xl mb-20" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-6" style={{ fontFamily: "Manrope, sans-serif" }}>{editId ? "Edit Product" : "Add Product"}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold block mb-1">Name</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#002b92]/20" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold block mb-1">Brand</label>
                <input type="text" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#002b92]/20" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold block mb-1">Category</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none">
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold block mb-1">Price (₹)</label>
                <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#002b92]/20" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold block mb-1">Primary Color</label>
                <input type="text" value={form.primary_color} onChange={(e) => setForm({ ...form, primary_color: e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#002b92]/20" />
              </div>
              <div className="md:col-span-2">
                <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold block mb-1">Image URL</label>
                <input type="text" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#002b92]/20" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold block mb-1">Store URL</label>
                <input type="text" value={form.store_url} onChange={(e) => setForm({ ...form, store_url: e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#002b92]/20" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold block mb-1">Affiliate URL</label>
                <input type="text" value={form.affiliate_url} onChange={(e) => setForm({ ...form, affiliate_url: e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#002b92]/20" />
              </div>
              <div className="md:col-span-2">
                <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold block mb-1">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#002b92]/20 resize-none" />
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="pub" checked={form.is_published} onChange={(e) => setForm({ ...form, is_published: e.target.checked })} className="w-4 h-4" />
                <label htmlFor="pub" className="text-sm font-medium">Published</label>
              </div>
            </div>
            <div className="flex justify-between gap-3 mt-8">
              {/* AI Generate button (only when editing existing product) */}
              {editId && (
                <button onClick={generateMetadata} disabled={aiLoading} className="px-5 py-2.5 rounded-xl border-2 border-[#002b92]/20 text-[#002b92] text-sm font-bold hover:bg-[#002b92]/5 disabled:opacity-40 flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">auto_awesome</span>
                  {aiLoading ? "Generating..." : "Generate AI Metadata"}
                </button>
              )}
              <div className="flex gap-3 ml-auto">
                <button onClick={() => { setShowEditor(false); setAiResult(null); }} className="px-6 py-2.5 rounded-xl border border-gray-200 text-sm font-bold">Cancel</button>
                <button onClick={save} disabled={saving || !form.name.trim()} className="px-6 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-40" style={{ background: "linear-gradient(135deg, #003ec7, #002b92)" }}>
                  {saving ? "Saving..." : editId ? "Update" : "Create"}
                </button>
              </div>
            </div>

            {/* AI Metadata Preview */}
            {aiResult?.metadata && (
              <div className="mt-6 border border-[#002b92]/20 rounded-xl p-5 bg-[#002b92]/5">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-bold text-[#002b92] flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">auto_awesome</span>
                    AI Generated Metadata
                    <span className="text-[10px] font-normal text-gray-500 ml-2">
                      {aiResult.provider} • {aiResult.duration_ms}ms • {Math.round(aiResult.metadata.confidence * 100)}% confidence
                    </span>
                  </h4>
                  <button onClick={applyAiMetadata} className="px-4 py-1.5 rounded-lg bg-[#002b92] text-white text-xs font-bold hover:opacity-90">
                    Apply to Form
                  </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                  {Object.entries(aiResult.metadata).filter(([k]) => k !== "confidence").map(([key, val]) => (
                    <div key={key} className="bg-white rounded-lg p-2 border border-gray-100">
                      <span className="text-[9px] uppercase tracking-wider text-gray-400 block">{key.replace(/_/g, " ")}</span>
                      <span className="text-[#1b1c1b] font-medium">{Array.isArray(val) ? (val as string[]).join(", ") || "—" : String(val) || "—"}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight" style={{ fontFamily: "Manrope, sans-serif" }}>Products</h1>
            <p className="text-sm text-gray-500 mt-1">{total} total products</p>
          </div>
          <div className="flex gap-3">
            <Link href="/admin/products/import" className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">upload_file</span> Import CSV
            </Link>
            <button onClick={openNew} className="px-5 py-2.5 rounded-xl text-white text-sm font-bold" style={{ background: "linear-gradient(135deg, #003ec7, #002b92)" }}>
              + Add Product
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="flex gap-3">
          <input type="text" placeholder="Search by name or brand..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="flex-1 max-w-md border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#002b92]/20" />
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-gray-400 text-sm">Loading...</div>
          ) : products.length === 0 ? (
            <div className="p-12 text-center text-gray-400 text-sm">No products found. Add your first product.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600 w-12"></th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Product</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Brand</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Category</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Price</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Status</th>
                  <th className="text-right px-5 py-3 font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-5 py-3">
                      {p.image_url ? <img src={p.image_url} alt="" className="w-10 h-10 rounded-lg object-cover" /> : <div className="w-10 h-10 rounded-lg bg-gray-100" />}
                    </td>
                    <td className="px-5 py-3 font-medium text-[#1b1c1b] max-w-[200px] truncate">{p.name}</td>
                    <td className="px-5 py-3 text-gray-600">{p.brand || "—"}</td>
                    <td className="px-5 py-3 text-gray-600">{p.category}</td>
                    <td className="px-5 py-3 font-semibold">₹{Number(p.price).toLocaleString("en-IN")}</td>
                    <td className="px-5 py-3">
                      <button onClick={() => togglePublish(p.id, p.is_published)} className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${p.is_published ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {p.is_published ? "Published" : "Draft"}
                      </button>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button onClick={() => openEdit(p.id)} className="text-[#002b92] hover:underline text-xs font-bold mr-3">Edit</button>
                      <button onClick={() => deleteProduct(p.id)} className="text-red-500 hover:underline text-xs font-bold">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {total > 30 && (
          <div className="flex items-center justify-center gap-3">
            <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="px-4 py-2 rounded-lg border border-gray-200 text-sm disabled:opacity-40">Previous</button>
            <span className="text-sm text-gray-500">Page {page} of {Math.ceil(total / 30)}</span>
            <button onClick={() => setPage(page + 1)} disabled={page * 30 >= total} className="px-4 py-2 rounded-lg border border-gray-200 text-sm disabled:opacity-40">Next</button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default function AdminProductsPage() {
  return (<RequireAdmin><ProductsContent /></RequireAdmin>);
}
