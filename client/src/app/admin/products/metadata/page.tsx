"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import RequireAdmin from "../../components/RequireAdmin";
import AdminLayout from "../../components/AdminLayout";
import { apiFetch } from "@/lib/api";

type Product = { id: string; name: string; brand: string; category: string; image_url: string; primary_color: string; ai_metadata: any };
type GenResult = { id: string; name: string; success: boolean; duration_ms: number; error?: string };
type StatusCounts = { total: number; has_image: number; has_metadata: number; published: number; draft: number; needs_metadata: number; ready_to_publish: number };

function MetadataContent() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [results, setResults] = useState<GenResult[] | null>(null);
  const [status, setStatus] = useState<StatusCounts | null>(null);
  const [toast, setToast] = useState("");

  // Fetch products without metadata
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/api/v1/admin/products?limit=100&published=false");
      if (res.ok) {
        const data = await res.json();
        // Filter to products that need metadata
        setProducts(data.products.filter((p: any) => !p.ai_metadata || Object.keys(p.ai_metadata || {}).length < 3));
      }
    } catch {} finally { setLoading(false); }
  }, []);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await apiFetch("/api/v1/admin/metadata/status");
      if (res.ok) setStatus(await res.json());
    } catch {}
  }, []);

  useEffect(() => { fetchProducts(); fetchStatus(); }, [fetchProducts, fetchStatus]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const selectAll = () => {
    if (selected.size === products.length) setSelected(new Set());
    else setSelected(new Set(products.map((p) => p.id)));
  };

  const generate = async () => {
    if (selected.size === 0) return;
    setGenerating(true);
    setResults(null);
    try {
      const res = await apiFetch("/api/v1/admin/metadata/generate-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productIds: [...selected] }),
      });
      if (res.ok) {
        const data = await res.json();
        setResults(data.results);
        setToast(`Generated: ${data.succeeded}/${data.total}`);
        setTimeout(() => setToast(""), 3000);
        setSelected(new Set());
        fetchProducts();
        fetchStatus();
      }
    } catch { setToast("Generation failed"); setTimeout(() => setToast(""), 3000); }
    finally { setGenerating(false); }
  };

  return (
    <AdminLayout>
      {toast && <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] px-5 py-3 rounded-full bg-[#1b1c1b] text-white text-sm font-bold shadow-xl">{toast}</div>}

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight" style={{ fontFamily: "Manrope, sans-serif" }}>AI Metadata Queue</h1>
            <p className="text-sm text-gray-500 mt-1">Generate metadata for products using AI.</p>
          </div>
          <Link href="/admin/products" className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-bold text-gray-700 hover:bg-gray-50">← Products</Link>
        </div>

        {/* Status overview */}
        {status && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {[
              { label: "Total", value: status.total, color: "#1b1c1b" },
              { label: "Draft", value: status.draft, color: "#6b7280" },
              { label: "Has Image", value: status.has_image, color: "#002b92" },
              { label: "Needs Meta", value: status.needs_metadata, color: "#b06000" },
              { label: "Has Meta", value: status.has_metadata, color: "#137333" },
              { label: "Ready", value: status.ready_to_publish, color: "#4e5b92" },
              { label: "Published", value: status.published, color: "#137333" },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-xl p-3 border border-gray-100 text-center">
                <p className="text-lg font-bold" style={{ color: s.color }}>{s.value}</p>
                <p className="text-[9px] text-gray-500 font-bold uppercase">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Selection + Generate */}
        <div className="flex items-center gap-4">
          <button onClick={selectAll} className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-bold hover:bg-gray-50">
            {selected.size === products.length ? "Deselect All" : "Select All"}
          </button>
          <button onClick={generate} disabled={selected.size === 0 || generating}
            className="px-5 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-40 flex items-center gap-2"
            style={{ background: "linear-gradient(135deg, #003ec7, #002b92)" }}>
            <span className="material-symbols-outlined text-sm">auto_awesome</span>
            {generating ? "Generating..." : `Generate (${selected.size})`}
          </button>
          <span className="text-xs text-gray-500">{products.length} products need metadata</span>
        </div>

        {/* Results */}
        {results && (
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <h4 className="text-sm font-bold mb-3">Generation Results</h4>
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {results.map((r) => (
                <div key={r.id} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                  <span className="text-xs font-medium truncate max-w-[250px]">{r.name}</span>
                  <span className={`text-[10px] font-bold ${r.success ? "text-green-600" : "text-red-500"}`}>
                    {r.success ? `✓ ${r.duration_ms}ms` : `✗ ${r.error}`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Product list */}
        {loading && <div className="text-sm text-gray-400 py-8 text-center">Loading products...</div>}

        {!loading && products.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <span className="material-symbols-outlined text-green-300 mb-4" style={{ fontSize: 48 }}>check_circle</span>
            <p className="text-sm text-gray-500">All products have metadata generated.</p>
          </div>
        )}

        {!loading && products.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b"><tr>
                <th className="px-4 py-2 w-8"></th>
                <th className="text-left px-4 py-2 font-semibold text-gray-600">Product</th>
                <th className="text-left px-4 py-2 font-semibold text-gray-600">Category</th>
                <th className="text-left px-4 py-2 font-semibold text-gray-600">Image</th>
              </tr></thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50/50 cursor-pointer" onClick={() => toggleSelect(p.id)}>
                    <td className="px-4 py-2"><input type="checkbox" checked={selected.has(p.id)} readOnly className="w-4 h-4" /></td>
                    <td className="px-4 py-2 font-medium truncate max-w-[250px]">{p.name}</td>
                    <td className="px-4 py-2 text-gray-500">{p.category}</td>
                    <td className="px-4 py-2">{p.image_url ? <span className="text-green-600 text-xs">✓</span> : <span className="text-gray-400 text-xs">—</span>}</td>
                  </tr>
                ))}
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
