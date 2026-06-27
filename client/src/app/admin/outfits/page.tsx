"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import RequireAdmin from "../components/RequireAdmin";
import AdminLayout from "../components/AdminLayout";
import { apiFetch } from "@/lib/api";

type Outfit = { id: string; name: string; productIds: string[]; closetItemIds: string[]; createdAt: number };
type SearchProduct = { id: string; name: string; brand: string; category: string; image_url: string; price: number };

function OutfitsContent() {
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  // Editor state
  const [outfitName, setOutfitName] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<SearchProduct[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchProduct[]>([]);
  const [searching, setSearching] = useState(false);

  const fetchOutfits = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`/api/v1/admin/outfits?page=${page}&limit=30`);
      if (res.ok) { const d = await res.json(); setOutfits(d.outfits); setTotal(d.total); }
    } catch {} finally { setLoading(false); }
  }, [page]);

  useEffect(() => { fetchOutfits(); }, [fetchOutfits]);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  // Product search (debounced)
  useEffect(() => {
    if (searchQuery.length < 2) { setSearchResults([]); return; }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await apiFetch(`/api/v1/admin/products?search=${encodeURIComponent(searchQuery)}&limit=10`);
        if (res.ok) {
          const data = await res.json();
          // Filter out already-selected products
          const selectedIds = new Set(selectedProducts.map((p) => p.id));
          setSearchResults((data.products || []).filter((p: SearchProduct) => !selectedIds.has(p.id)));
        }
      } catch {} finally { setSearching(false); }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedProducts]);

  const addProduct = (product: SearchProduct) => {
    setSelectedProducts((prev) => [...prev, product]);
    setSearchQuery("");
    setSearchResults([]);
  };

  const removeProduct = (id: string) => {
    setSelectedProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const moveProduct = (index: number, direction: "up" | "down") => {
    setSelectedProducts((prev) => {
      const arr = [...prev];
      const target = direction === "up" ? index - 1 : index + 1;
      if (target < 0 || target >= arr.length) return arr;
      [arr[index], arr[target]] = [arr[target], arr[index]];
      return arr;
    });
  };

  const openNew = () => {
    setEditId(null);
    setOutfitName("");
    setSelectedProducts([]);
    setSearchQuery("");
    setShowEditor(true);
  };

  const openEdit = (o: Outfit) => {
    setEditId(o.id);
    setOutfitName(o.name);
    setSelectedProducts([]); // Products will be loaded from IDs
    setSearchQuery("");
    setShowEditor(true);
    // Fetch product details for existing IDs
    if (o.productIds.length > 0) {
      Promise.all(
        o.productIds.slice(0, 10).map(async (pid) => {
          try {
            const res = await apiFetch(`/api/v1/admin/products/${pid}`);
            if (res.ok) {
              const p = await res.json();
              return { id: p.id, name: p.name, brand: p.brand, category: p.category, image_url: p.image_url, price: Number(p.price) } as SearchProduct;
            }
          } catch {}
          return null;
        })
      ).then((results) => {
        setSelectedProducts(results.filter((r): r is SearchProduct => r !== null));
      });
    }
  };

  const save = async () => {
    if (!outfitName.trim() || selectedProducts.length < 2) return;
    setSaving(true);
    const productIds = selectedProducts.map((p) => p.id);
    const url = editId ? `/api/v1/admin/outfits/${editId}` : "/api/v1/admin/outfits";
    const method = editId ? "PATCH" : "POST";
    try {
      const res = await apiFetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: outfitName.trim(), productIds, closetItemIds: [] }) });
      if (res.ok) { showToast(editId ? "Outfit updated" : "Outfit created"); setShowEditor(false); fetchOutfits(); }
      else { const b = await res.json().catch(() => ({})); showToast(b.message || "Failed"); }
    } catch { showToast("Network error"); } finally { setSaving(false); }
  };

  const deleteOutfit = async (id: string) => {
    if (!confirm("Delete this outfit permanently?")) return;
    await apiFetch(`/api/v1/admin/outfits/${id}`, { method: "DELETE" });
    showToast("Outfit deleted");
    fetchOutfits();
  };

  return (
    <AdminLayout>
      {toast && <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] px-5 py-3 rounded-full bg-[#1b1c1b] text-white text-sm font-bold shadow-xl">{toast}</div>}

      {/* Editor Modal */}
      {showEditor && (
        <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-start justify-center pt-12 px-4 overflow-y-auto" onClick={() => setShowEditor(false)}>
          <div className="bg-white rounded-2xl p-8 w-full max-w-2xl shadow-2xl mb-20" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-6" style={{ fontFamily: "Manrope, sans-serif" }}>{editId ? "Edit Outfit" : "Create Outfit"}</h2>

            <div className="space-y-5">
              {/* Name */}
              <div>
                <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold block mb-1">Outfit Name</label>
                <input type="text" value={outfitName} onChange={(e) => setOutfitName(e.target.value)} placeholder="e.g. Weekend Casual" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#002b92]/20" />
              </div>

              {/* Product Search */}
              <div>
                <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold block mb-1">Add Products</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">search</span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search products by name or brand..."
                    className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#002b92]/20"
                  />
                  {searching && <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm animate-spin">progress_activity</span>}
                </div>

                {/* Search Results Dropdown */}
                {searchResults.length > 0 && (
                  <div className="mt-1 border border-gray-200 rounded-xl bg-white shadow-lg max-h-[200px] overflow-y-auto">
                    {searchResults.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => addProduct(p)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-left border-b border-gray-50 last:border-0"
                      >
                        {p.image_url ? (
                          <img src={p.image_url} alt={p.name} className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-gray-100 flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{p.name}</p>
                          <p className="text-[10px] text-gray-500">{p.brand} • {p.category} • ₹{p.price}</p>
                        </div>
                        <span className="material-symbols-outlined text-green-600 text-lg flex-shrink-0">add_circle</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected Products */}
              <div>
                <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold block mb-2">
                  Selected Products ({selectedProducts.length})
                </label>
                {selectedProducts.length === 0 ? (
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center text-gray-400 text-sm">
                    Search and add at least 2 products to create an outfit
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedProducts.map((p, index) => (
                      <div key={p.id} className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-2.5 group">
                        {p.image_url ? (
                          <img src={p.image_url} alt={p.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-gray-200 flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{p.name}</p>
                          <p className="text-[10px] text-gray-500">{p.brand} • ₹{p.price}</p>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => moveProduct(index, "up")} disabled={index === 0} className="w-6 h-6 rounded bg-white border border-gray-200 flex items-center justify-center disabled:opacity-30">
                            <span className="material-symbols-outlined text-xs">arrow_upward</span>
                          </button>
                          <button onClick={() => moveProduct(index, "down")} disabled={index === selectedProducts.length - 1} className="w-6 h-6 rounded bg-white border border-gray-200 flex items-center justify-center disabled:opacity-30">
                            <span className="material-symbols-outlined text-xs">arrow_downward</span>
                          </button>
                        </div>
                        <button onClick={() => removeProduct(p.id)} className="text-red-400 hover:text-red-600 transition-colors flex-shrink-0">
                          <span className="material-symbols-outlined text-lg">close</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 mt-8">
              <button onClick={() => setShowEditor(false)} className="px-6 py-2.5 rounded-xl border border-gray-200 text-sm font-bold">Cancel</button>
              <button
                onClick={save}
                disabled={saving || !outfitName.trim() || selectedProducts.length < 2}
                className="px-6 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-40"
                style={{ background: "linear-gradient(135deg, #003ec7, #002b92)" }}
              >
                {saving ? "Saving..." : editId ? "Update Outfit" : "Create Outfit"}
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
              + Create Outfit
            </button>
          </div>
        </div>

        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}
          </div>
        )}

        {!loading && outfits.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
            <span className="material-symbols-outlined text-gray-300 mb-4" style={{ fontSize: 48 }}>checkroom</span>
            <p className="text-gray-600 font-medium mb-2">No outfits yet</p>
            <p className="text-sm text-gray-500">Create your first outfit by combining products from the catalog.</p>
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
                    <td className="px-5 py-3">
                      <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold">{o.productIds.length} items</span>
                    </td>
                    <td className="px-5 py-3 text-gray-500 text-xs">{new Date(o.createdAt).toLocaleDateString()}</td>
                    <td className="px-5 py-3 text-right space-x-2">
                      <button onClick={() => openEdit(o)} className="text-[#002b92] hover:underline text-xs font-bold">Edit</button>
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
            <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="px-4 py-2 rounded-lg border border-gray-200 text-sm disabled:opacity-40">Previous</button>
            <span className="text-sm text-gray-500">Page {page} of {Math.ceil(total / 30)}</span>
            <button onClick={() => setPage(page + 1)} disabled={page * 30 >= total} className="px-4 py-2 rounded-lg border border-gray-200 text-sm disabled:opacity-40">Next</button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default function AdminOutfitsPage() {
  return (<RequireAdmin><OutfitsContent /></RequireAdmin>);
}
