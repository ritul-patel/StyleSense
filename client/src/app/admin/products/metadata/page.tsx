"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import RequireAdmin from "../../components/RequireAdmin";
import AdminLayout from "../../components/AdminLayout";
import { apiFetch } from "@/lib/api";import { AppIcon } from "@/components/ui/AppIcon";


type Product = {
  id: string;
  name: string;
  brand: string;
  category: string;
  image_url: string;
  primary_color: string;
  ai_metadata: any;
  is_published: boolean;
};

type GenResult = { id: string; name: string; success: boolean; duration_ms: number; retries: number; error?: string; skipped?: boolean };

function getProductStatus(p: Product): { label: string; color: string; tooltip: string } {
  const hasMetadata = p.ai_metadata && JSON.stringify(p.ai_metadata) !== "{}";
  if (p.is_published) return { label: "Published", color: "bg-green-100 text-green-700", tooltip: "Live on the website" };
  if (hasMetadata && p.ai_metadata?._audit?.edited_at) return { label: "Edited", color: "bg-purple-100 text-purple-700", tooltip: "Metadata edited by admin" };
  if (hasMetadata) return { label: "Completed", color: "bg-blue-100 text-blue-700", tooltip: "AI metadata generated" };
  if (!p.image_url) return { label: "Pending", color: "bg-gray-100 text-gray-600", tooltip: "Needs image first" };
  return { label: "Needs AI", color: "bg-amber-100 text-amber-700", tooltip: "Ready for AI generation" };
}

function MetadataContent() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, currentName: "" });
  const [results, setResults] = useState<GenResult[]>([]);
  const [status, setStatus] = useState<any>(null);
  const [toast, setToast] = useState("");
  const [filter, setFilter] = useState<"all" | "needs" | "has" | "published">("needs");
  const [viewProduct, setViewProduct] = useState<Product | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState<any>({});

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 4000); };

  const fetchStatus = useCallback(async () => {
    try {
      const res = await apiFetch("/api/v1/admin/metadata/status");
      if (res.ok) setStatus(await res.json());
    } catch {}
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/api/v1/admin/products?limit=200");
      if (res.ok) { const data = await res.json(); setProducts(data.products || []); }
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchProducts(); fetchStatus(); }, [fetchProducts, fetchStatus]);

  const filteredProducts = products.filter((p) => {
    const hasM = p.ai_metadata && JSON.stringify(p.ai_metadata) !== "{}";
    if (filter === "needs") return !hasM;
    if (filter === "has") return hasM;
    if (filter === "published") return p.is_published;
    return true;
  });

  const toggleSelect = (id: string) => setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const selectAll = () => setSelected(selected.size === filteredProducts.length ? new Set() : new Set(filteredProducts.map((p) => p.id)));

  // ─── Generate with progress ───────────────────────────────────────────────
  const generateMetadata = async (retryFailed = false) => {
    const ids = retryFailed
      ? results.filter((r) => !r.success && !r.skipped).map((r) => r.id)
      : Array.from(selected);
    if (ids.length === 0) return;

    setGenerating(true);
    setResults([]);
    setProgress({ current: 0, total: ids.length, currentName: "Starting..." });

    // Send all IDs - backend processes one at a time with proper pacing
    try {
      const res = await apiFetch("/api/v1/admin/metadata/generate-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productIds: ids, skipExisting: !retryFailed, retryFailed }),
      });
      const data = await res.json();
      if (data.results) {
        setResults(data.results);
        setProgress({ current: ids.length, total: ids.length, currentName: "Done" });
        const succeeded = data.results.filter((r: any) => r.success && !r.skipped).length;
        const skipped = data.results.filter((r: any) => r.skipped).length;
        const failed = data.results.filter((r: any) => !r.success).length;
        showToast(`Done: ${succeeded} generated, ${skipped} skipped, ${failed} failed`);
      } else {
        showToast(data.message || "Generation failed");
      }
    } catch {
      showToast("Network error - batch request failed");
    }

    setSelected(new Set());
    setGenerating(false);
    fetchProducts();
    fetchStatus();
  };

  // ─── Publish / Unpublish ──────────────────────────────────────────────────
  const publishSelected = async (publish: boolean) => {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    try {
      const res = await apiFetch("/api/v1/admin/metadata/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productIds: ids, publish }),
      });
      const data = await res.json();
      showToast(`${publish ? "Published" : "Unpublished"} ${data.updated || 0} products`);
      setSelected(new Set());
      fetchProducts();
      fetchStatus();
    } catch { showToast("Operation failed"); }
  };

  // ─── Save edited metadata ─────────────────────────────────────────────────
  const saveMetadata = async () => {
    if (!viewProduct) return;
    try {
      const res = await apiFetch(`/api/v1/admin/metadata/update/${viewProduct.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ metadata: editForm }),
      });
      if (res.ok) {
        showToast("Metadata saved");
        setEditMode(false);
        setViewProduct(null);
        fetchProducts();
      } else { showToast("Save failed"); }
    } catch { showToast("Network error"); }
  };

  const openViewer = (p: Product) => {
    setViewProduct(p);
    setEditMode(false);
    const meta = p.ai_metadata || {};
    const { _audit, ...fields } = meta;
    setEditForm(fields);
  };

  return (
    <AdminLayout>
      {toast && <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] px-5 py-3 rounded-full bg-[#1b1c1b] text-white text-sm font-bold shadow-xl">{toast}</div>}

      {/* ─── Metadata Viewer/Editor Modal ─── */}
      {viewProduct && (
        <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-start justify-center pt-16 px-4 overflow-y-auto" onClick={() => setViewProduct(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-2xl mb-16" data-lenis-prevent onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold" style={{ fontFamily: "Manrope, sans-serif" }}>{viewProduct.name}</h2>
                <p className="text-xs text-gray-500">{viewProduct.brand} • {viewProduct.category}</p>
              </div>
              <div className="flex items-center gap-2">
                {!editMode && <button onClick={() => setEditMode(true)} className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-bold hover:bg-gray-50">Edit</button>}
                {editMode && <button onClick={saveMetadata} className="px-3 py-1.5 rounded-lg bg-[#002b92] text-white text-xs font-bold">Save</button>}
                {editMode && <button onClick={() => setEditMode(false)} className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-bold hover:bg-gray-50">Cancel</button>}
                <button onClick={() => setViewProduct(null)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100"><AppIcon name="close" size={18} /></button>
              </div>
            </div>

            {viewProduct.ai_metadata && JSON.stringify(viewProduct.ai_metadata) !== "{}" ? (
              <div className="space-y-4">
                {/* Audit Info */}
                {viewProduct.ai_metadata._audit && (
                  <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-500 flex flex-wrap gap-x-4 gap-y-1">
                    {viewProduct.ai_metadata._audit.generated_at && <span>Generated: {new Date(viewProduct.ai_metadata._audit.generated_at).toLocaleString()}</span>}
                    {viewProduct.ai_metadata._audit.provider && <span>Provider: {viewProduct.ai_metadata._audit.provider}</span>}
                    {viewProduct.ai_metadata._audit.model && <span>Model: {viewProduct.ai_metadata._audit.model}</span>}
                    {viewProduct.ai_metadata._audit.duration_ms && <span>Duration: {viewProduct.ai_metadata._audit.duration_ms}ms</span>}
                    {viewProduct.ai_metadata._audit.edited_at && <span>Edited: {new Date(viewProduct.ai_metadata._audit.edited_at).toLocaleString()}</span>}
                  </div>
                )}

                {/* Metadata Fields */}
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(viewProduct.ai_metadata).filter(([k]) => k !== "_audit" && k !== "confidence").map(([key, val]) => (
                    <div key={key} className="bg-gray-50 rounded-xl p-3">
                      <label className="text-[9px] uppercase tracking-wider text-gray-400 font-bold block mb-1">{key.replace(/_/g, " ")}</label>
                      {editMode ? (
                        <input
                          type="text"
                          value={Array.isArray(editForm[key]) ? (editForm[key] as string[]).join(", ") : String(editForm[key] || "")}
                          onChange={(e) => {
                            const v = e.target.value;
                            setEditForm({ ...editForm, [key]: Array.isArray(viewProduct.ai_metadata[key]) ? v.split(",").map((s: string) => s.trim()).filter(Boolean) : v });
                          }}
                          className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#002b92]/30"
                        />
                      ) : (
                        <span className="text-xs font-medium text-gray-700">{Array.isArray(val) ? (val as string[]).join(", ") || "-" : String(val) || "-"}</span>
                      )}
                    </div>
                  ))}
                </div>

                {/* Confidence */}
                {viewProduct.ai_metadata.confidence !== undefined && (
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500">Confidence:</span>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-[#002b92]" style={{ width: `${Math.round(viewProduct.ai_metadata.confidence * 100)}%` }} />
                    </div>
                    <span className="text-xs font-bold">{Math.round(viewProduct.ai_metadata.confidence * 100)}%</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-sm text-gray-400">No metadata generated yet.</div>
            )}
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "Manrope, sans-serif" }}>AI Metadata Queue</h1>
            <p className="text-sm text-gray-500 mt-1">Generate product metadata using Gemini 2.5 Flash</p>
          </div>
          <Link href="/admin/products" className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-bold text-gray-700 hover:bg-gray-50">← Products</Link>
        </div>

        {/* Status Cards */}
        {status && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: "Total", value: status.total, color: "bg-gray-50 border-gray-100" },
              { label: "Needs AI", value: status.needs_metadata, color: "bg-amber-50 border-amber-100" },
              { label: "Generated", value: status.has_metadata, color: "bg-blue-50 border-blue-100" },
              { label: "Ready", value: status.ready_to_publish, color: "bg-green-50 border-green-100" },
              { label: "Published", value: status.published, color: "bg-indigo-50 border-indigo-100" },
            ].map((s) => (
              <div key={s.label} className={`rounded-xl p-3 border text-center ${s.color}`}>
                <p className="text-xl font-bold">{s.value}</p>
                <p className="text-[9px] uppercase tracking-wider font-bold text-gray-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Progress Bar (during generation) */}
        {generating && (
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-gray-600">
                Generating... {progress.current} / {progress.total}
              </span>
              <span className="text-xs text-gray-400">{progress.currentName}</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%`, background: "linear-gradient(90deg, #002b92, #003ec7)" }}
              />
            </div>
            <p className="text-[10px] text-gray-400 mt-2">
              ~{Math.ceil(((progress.total - progress.current) * 6) / 60)} min remaining (4s/product + retries)
            </p>
          </div>
        )}

        {/* Actions Bar */}
        <div className="bg-white rounded-xl p-4 border border-gray-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-gray-200 overflow-hidden">
              {(["needs", "all", "has", "published"] as const).map((f) => (
                <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 text-[10px] font-bold capitalize ${filter === f ? "bg-[#002b92] text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}>
                  {f === "needs" ? "Needs AI" : f === "has" ? "Generated" : f}
                </button>
              ))}
            </div>
            <span className="text-[10px] text-gray-400">{filteredProducts.length} items • {selected.size} selected</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={selectAll} className="px-3 py-1.5 rounded-lg border border-gray-200 text-[10px] font-bold text-gray-600 hover:bg-gray-50">
              {selected.size === filteredProducts.length ? "Deselect" : "Select All"}
            </button>
            <button onClick={() => publishSelected(true)} disabled={selected.size === 0} className="px-3 py-1.5 rounded-lg border border-green-200 text-[10px] font-bold text-green-700 hover:bg-green-50 disabled:opacity-30">Publish</button>
            <button onClick={() => publishSelected(false)} disabled={selected.size === 0} className="px-3 py-1.5 rounded-lg border border-gray-200 text-[10px] font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-30">Unpublish</button>
            <button onClick={() => generateMetadata(false)} disabled={selected.size === 0 || generating} className="px-4 py-1.5 rounded-lg text-white text-[10px] font-bold disabled:opacity-40 flex items-center gap-1.5" style={{ background: "linear-gradient(135deg, #003ec7, #002b92)" }}>
              <AppIcon name="auto_awesome" size={14} />
              {generating ? "Working..." : "Generate AI"}
            </button>
          </div>
        </div>

        {/* Results Log */}
        {results.length > 0 && !generating && (
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold">Last Run Results</h3>
              {results.some((r) => !r.success && !r.skipped) && (
                <button
                  onClick={() => generateMetadata(true)}
                  className="px-3 py-1 rounded-lg border border-amber-200 text-[10px] font-bold text-amber-700 hover:bg-amber-50 flex items-center gap-1"
                >
                  <AppIcon name="refresh" size={12} />
                  Retry Failed ({results.filter((r) => !r.success && !r.skipped).length})
                </button>
              )}
            </div>
            <div className="max-h-40 overflow-y-auto space-y-1" data-lenis-prevent>
              {results.map((r, i) => (
                <div key={i} className="flex items-center gap-2 text-[11px] py-1 border-b border-gray-50 last:border-0">
                  <AppIcon name={r.success ? (r.skipped ? "check_circle" : "check_circle") : "error"} size={14} className={r.success ? (r.skipped ? "text-gray-400" : "text-green-600") : "text-red-500"} />
                  <span className="font-medium text-gray-700 w-36 truncate">{r.name}</span>
                  {r.skipped && <span className="text-gray-400">skipped</span>}
                  {!r.skipped && r.success && <span className="text-green-600">{r.duration_ms ? `${Math.round(r.duration_ms / 1000)}s` : ""}{r.retries > 0 ? ` (${r.retries} retries)` : ""}</span>}
                  {!r.success && (
                    <>
                      {(r as any).errorType && <span className="px-1.5 py-0.5 rounded bg-red-50 text-red-600 text-[9px] font-bold uppercase">{(r as any).errorType?.replace("_", " ")}</span>}
                      <span className="text-red-400 truncate max-w-[200px]">{r.error}</span>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Product Table */}
        {loading ? (
          <div className="bg-white rounded-xl p-8 border border-gray-100 text-center text-sm text-gray-400">Loading...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-white rounded-xl p-8 border border-gray-100 text-center">
            <AppIcon name="inventory_2" size={36} className="text-gray-300 block mb-2" />
            <p className="text-sm text-gray-400">No products match this filter.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="w-8 p-2.5"><input type="checkbox" checked={selected.size === filteredProducts.length && filteredProducts.length > 0} onChange={selectAll} className="w-3.5 h-3.5 rounded" /></th>
                  <th className="p-2.5 text-left text-[9px] uppercase tracking-wider text-gray-500 font-bold">Product</th>
                  <th className="p-2.5 text-left text-[9px] uppercase tracking-wider text-gray-500 font-bold">Category</th>
                  <th className="p-2.5 text-left text-[9px] uppercase tracking-wider text-gray-500 font-bold">Status</th>
                  <th className="p-2.5 text-left text-[9px] uppercase tracking-wider text-gray-500 font-bold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.slice(0, 100).map((p) => {
                  const st = getProductStatus(p);
                  return (
                    <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="p-2.5"><input type="checkbox" checked={selected.has(p.id)} onChange={() => toggleSelect(p.id)} className="w-3.5 h-3.5 rounded" /></td>
                      <td className="p-2.5">
                        <div className="flex items-center gap-2">
                          {p.image_url ? <img src={p.image_url} alt="" className="w-8 h-8 rounded-lg object-cover border border-gray-100" /> : <div className="w-8 h-8 rounded-lg bg-gray-100" />}
                          <div>
                            <p className="font-medium text-gray-800 truncate max-w-[180px]">{p.name}</p>
                            <p className="text-[9px] text-gray-400">{p.brand || "-"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-2.5 text-gray-500 capitalize">{p.category}</td>
                      <td className="p-2.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold ${st.color}`} title={st.tooltip}>{st.label}</span>
                      </td>
                      <td className="p-2.5">
                        <button onClick={() => openViewer(p)} className="text-[10px] font-bold text-[#002b92] hover:underline">View</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default function MetadataQueuePage() {
  return (<RequireAdmin><MetadataContent /></RequireAdmin>);
}
