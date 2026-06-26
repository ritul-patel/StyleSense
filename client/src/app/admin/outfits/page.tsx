"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import RequireAdmin from "../components/RequireAdmin";
import AdminLayout from "../components/AdminLayout";
import { apiFetch } from "@/lib/api";

type Outfit = { id: string; name: string; productIds: string[]; closetItemIds: string[]; createdAt: number };
type EditorForm = { name: string; productIds: string; };

function OutfitsContent() {
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<EditorForm>({ name: "", productIds: "" });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  const fetchOutfits = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`/api/v1/admin/outfits?page=${page}&limit=30`);
      if (res.ok) { const d = await res.json(); setOutfits(d.outfits); setTotal(d.total); }
    } catch {} finally { setLoading(false); }
  }, [page]);

  useEffect(() => { fetchOutfits(); }, [fetchOutfits]);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const openNew = () => { setEditId(null); setForm({ name: "", productIds: "" }); setShowEditor(true); };
  const openEdit = (o: Outfit) => { setEditId(o.id); setForm({ name: o.name, productIds: o.productIds.join(", ") }); setShowEditor(true); };

  const save = async () => {
    setSaving(true);
    const productIds = form.productIds.split(",").map((s) => s.trim()).filter(Boolean);
    const url = editId ? `/api/v1/admin/outfits/${editId}` : "/api/v1/admin/outfits";
    const method = editId ? "PATCH" : "POST";
    try {
      const res = await apiFetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: form.name, productIds, closetItemIds: [] }) });
      if (res.ok) { showToast(editId ? "Updated" : "Created"); setShowEditor(false); fetchOutfits(); }
      else { const b = await res.json().catch(() => ({})); showToast(b.message || "Failed"); }
    } catch { showToast("Network error"); } finally { setSaving(false); }
  };

  const deleteOutfit = async (id: string) => {
    if (!confirm("Delete this outfit?")) return;
    await apiFetch(`/api/v1/admin/outfits/${id}`, { method: "DELETE" });
    showToast("Deleted");
    fetchOutfits();
  };

  return (
    <AdminLayout>
      {toast && <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] px-5 py-3 rounded-full bg-[#1b1c1b] text-white text-sm font-bold shadow-xl">{toast}</div>}

      {/* Editor Modal */}
      {showEditor && (
        <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-start justify-center pt-20 px-4" onClick={() => setShowEditor(false)}>
          <div className="bg-white rounded-2xl p-8 w-full max-w-lg shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-6" style={{ fontFamily: "Manrope, sans-serif" }}>{editId ? "Edit Outfit" : "Add Outfit"}</h2>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold block mb-1">Name</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#002b92]/20" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold block mb-1">Product IDs / Slugs (comma separated)</label>
                <textarea value={form.productIds} onChange={(e) => setForm({ ...form, productIds: e.target.value })} rows={3} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#002b92]/20 resize-none" placeholder="product-slug-1, product-slug-2, ..." />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowEditor(false)} className="px-6 py-2.5 rounded-xl border border-gray-200 text-sm font-bold">Cancel</button>
              <button onClick={save} disabled={saving || !form.name.trim()} className="px-6 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-40" style={{ background: "linear-gradient(135deg, #003ec7, #002b92)" }}>
                {saving ? "Saving..." : editId ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight" style={{ fontFamily: "Manrope, sans-serif" }}>Outfits</h1>
            <p className="text-sm text-gray-500 mt-1">{total} outfits</p>
          </div>
          <div className="flex gap-3">
            <Link href="/admin/outfits/import" className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">upload_file</span> Import
            </Link>
            <button onClick={openNew} className="px-5 py-2.5 rounded-xl text-white text-sm font-bold" style={{ background: "linear-gradient(135deg, #003ec7, #002b92)" }}>
              + Add Outfit
            </button>
          </div>
        </div>

        {loading && <div className="text-sm text-gray-400 py-12 text-center">Loading...</div>}

        {!loading && outfits.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
            <span className="material-symbols-outlined text-gray-300 mb-4" style={{ fontSize: 48 }}>checkroom</span>
            <p className="text-sm text-gray-500">No outfits yet. Create one or import from CSV.</p>
          </div>
        )}

        {!loading && outfits.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Name</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Products</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Created</th>
                  <th className="text-right px-5 py-3 font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {outfits.map((o) => (
                  <tr key={o.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-5 py-3 font-medium">{o.name}</td>
                    <td className="px-5 py-3 text-gray-500 text-xs">{o.productIds.length} items</td>
                    <td className="px-5 py-3 text-gray-500 text-xs">{new Date(o.createdAt).toLocaleDateString()}</td>
                    <td className="px-5 py-3 text-right">
                      <button onClick={() => openEdit(o)} className="text-[#002b92] hover:underline text-xs font-bold mr-3">Edit</button>
                      <button onClick={() => deleteOutfit(o.id)} className="text-red-500 hover:underline text-xs font-bold">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {total > 30 && (
          <div className="flex items-center justify-center gap-3">
            <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="px-4 py-2 rounded-lg border text-sm disabled:opacity-40">Previous</button>
            <span className="text-sm text-gray-500">Page {page}</span>
            <button onClick={() => setPage(page + 1)} disabled={page * 30 >= total} className="px-4 py-2 rounded-lg border text-sm disabled:opacity-40">Next</button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default function AdminOutfitsPage() {
  return (<RequireAdmin><OutfitsContent /></RequireAdmin>);
}
