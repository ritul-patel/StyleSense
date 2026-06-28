"use client";

import { useState, useEffect, useCallback } from "react";
import RequireAdmin from "../../components/RequireAdmin";
import AdminLayout from "../../components/AdminLayout";
import { apiFetch } from "@/lib/api";

type MigrationStatus = {
  total_products_with_images: number;
  migrated: number;
  pending: number;
  processing: number;
  failed: number;
  percent: number;
};

type MigrationResult = {
  product_id: string;
  status: string;
  error?: string;
};

function MigrationContent() {
  const [status, setStatus] = useState<MigrationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<MigrationResult[]>([]);
  const [toast, setToast] = useState("");

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 4000); };

  const fetchStatus = useCallback(async () => {
    try {
      const res = await apiFetch("/api/v1/admin/images/migration/status");
      if (res.ok) {
        const data = await res.json();
        setStatus(data.data);
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  const startMigration = async () => {
    setRunning(true);
    setResults([]);
    try {
      const res = await apiFetch("/api/v1/admin/images/migration/start", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setResults(data.data.results || []);
        showToast(`Migration batch complete: ${data.data.completed} imported, ${data.data.failed} failed, ${data.data.skipped} skipped`);
      } else {
        showToast(data.message || "Migration failed");
      }
    } catch { showToast("Migration request failed"); }
    finally {
      setRunning(false);
      fetchStatus();
    }
  };

  const retryFailed = async () => {
    try {
      const res = await apiFetch("/api/v1/admin/images/migration/retry", { method: "POST" });
      const data = await res.json();
      showToast(`Reset ${data.data?.reset_count || 0} failed items to pending`);
      fetchStatus();
    } catch { showToast("Retry request failed"); }
  };

  const percent = status?.percent || 0;
  const total = status?.total_products_with_images || 0;

  return (
    <AdminLayout>
      {toast && <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] px-5 py-3 rounded-full bg-[#1b1c1b] text-white text-sm font-bold shadow-xl">{toast}</div>}

      <div className="max-w-3xl">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "Manrope, sans-serif" }}>Image Migration</h1>
          <p className="text-sm text-gray-500 mt-1">Import all external product images into Supabase Storage</p>
        </header>

        {loading ? (
          <div className="bg-white rounded-2xl p-8 border border-gray-100 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-48 mb-4" />
            <div className="h-3 bg-gray-100 rounded w-full" />
          </div>
        ) : (
          <>
            {/* Progress Card */}
            <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm mb-6">
              {/* Progress bar */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold text-gray-700">Progress</span>
                  <span className="text-sm font-bold text-[#002b92]">{percent}%</span>
                </div>
                <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${percent}%`, background: "linear-gradient(90deg, #002b92, #003ec7)" }}
                  />
                </div>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-gray-900">{total}</p>
                  <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mt-1">Total</p>
                </div>
                <div className="bg-green-50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-green-700">{status?.migrated || 0}</p>
                  <p className="text-[10px] uppercase tracking-wider text-green-600 font-bold mt-1">Migrated</p>
                </div>
                <div className="bg-amber-50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-amber-700">{status?.pending || 0}</p>
                  <p className="text-[10px] uppercase tracking-wider text-amber-600 font-bold mt-1">Pending</p>
                </div>
                <div className="bg-blue-50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-blue-700">{status?.processing || 0}</p>
                  <p className="text-[10px] uppercase tracking-wider text-blue-600 font-bold mt-1">Processing</p>
                </div>
                <div className="bg-red-50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-red-700">{status?.failed || 0}</p>
                  <p className="text-[10px] uppercase tracking-wider text-red-600 font-bold mt-1">Failed</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={startMigration}
                  disabled={running || (status?.pending || 0) === 0}
                  className="px-6 py-3 rounded-xl text-white text-sm font-bold disabled:opacity-40 flex items-center gap-2"
                  style={{ background: "linear-gradient(135deg, #003ec7, #002b92)" }}
                >
                  <span className="material-symbols-outlined text-sm">{running ? "progress_activity" : "cloud_sync"}</span>
                  {running ? "Migrating..." : "Start Migration"}
                </button>

                {(status?.failed || 0) > 0 && (
                  <button
                    onClick={retryFailed}
                    className="px-6 py-3 rounded-xl border-2 border-[#002b92]/20 text-[#002b92] text-sm font-bold hover:bg-[#002b92]/5 flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-sm">refresh</span>
                    Retry Failed ({status?.failed})
                  </button>
                )}

                <button
                  onClick={fetchStatus}
                  className="px-4 py-3 rounded-xl border border-gray-200 text-gray-600 text-sm font-bold hover:bg-gray-50 flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm">refresh</span>
                  Refresh
                </button>
              </div>

              {/* Estimated time */}
              {(status?.pending || 0) > 0 && (
                <p className="text-xs text-gray-400 mt-4">
                  Estimated time: ~{Math.ceil((status?.pending || 0) * 3.5 / 60)} minutes ({status?.pending} images × ~3.5s each)
                </p>
              )}
            </div>

            {/* Results Log */}
            {results.length > 0 && (
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <h3 className="text-sm font-bold mb-4" style={{ fontFamily: "Manrope, sans-serif" }}>Migration Log</h3>
                <div className="max-h-80 overflow-y-auto space-y-2">
                  {results.map((r, i) => (
                    <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                      <span className={`material-symbols-outlined text-sm ${
                        r.status === "completed" || r.status === "duplicate" ? "text-green-600" :
                        r.status === "failed" ? "text-red-500" :
                        r.status === "already_migrated" ? "text-blue-500" : "text-gray-400"
                      }`}>
                        {r.status === "completed" || r.status === "duplicate" ? "check_circle" :
                         r.status === "failed" ? "error" :
                         r.status === "already_migrated" ? "info" : "pending"}
                      </span>
                      <span className="text-xs font-mono text-gray-500 w-20 shrink-0">{r.product_id.slice(0, 8)}...</span>
                      <span className={`text-xs font-semibold ${
                        r.status === "completed" ? "text-green-700" :
                        r.status === "duplicate" ? "text-green-600" :
                        r.status === "failed" ? "text-red-600" :
                        "text-blue-600"
                      }`}>
                        {r.status}
                      </span>
                      {r.error && <span className="text-[10px] text-red-400 truncate max-w-[200px]">{r.error}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Help */}
            <div className="mt-6 bg-[#f6f3f2] rounded-xl p-5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">How it works</h4>
              <ul className="text-xs text-gray-600 space-y-1.5 leading-relaxed">
                <li>• Click <strong>Start Migration</strong> to process up to 100 products per batch</li>
                <li>• Each image is downloaded, resized to max 1200×1600, converted to WebP (82% quality)</li>
                <li>• Uploaded to Supabase Storage with immutable cache headers</li>
                <li>• Product `image_url` is updated to the new Storage URL</li>
                <li>• Duplicate images are detected by content hash and reused</li>
                <li>• Run multiple batches until all products are migrated</li>
              </ul>
            </div>

            {/* Outfit Images */}
            <OutfitMigration showToast={showToast} />
          </>
        )}
      </div>
    </AdminLayout>
  );
}

// ─── Outfit Image Migration ─────────────────────────────────────────────────

function OutfitMigration({ showToast }: { showToast: (msg: string) => void }) {
  const [running, setRunning] = useState(false);
  const [outfitResults, setOutfitResults] = useState<Array<{ outfit_id: string; status: string; storage_url?: string; error?: string }>>([]);

  const importOutfitImages = async () => {
    setRunning(true);
    setOutfitResults([]);
    try {
      // Known outfit URLs from the static data file
      const OUTFIT_URLS = [
        { outfit_id: "O001", imageUrl: "https://i.pinimg.com/736x/7b/f7/5a/7bf75acdc1d1c58e5ac02fac72ca62ba.jpg" },
        { outfit_id: "O002", imageUrl: "https://i.pinimg.com/1200x/dc/9b/2b/dc9b2bf3802ffb84bd73dbd46beb3862.jpg" },
        { outfit_id: "O003", imageUrl: "https://i.pinimg.com/736x/ef/76/da/ef76daaf83ba3ec31e7d34c1d7930857.jpg" },
        { outfit_id: "O004", imageUrl: "https://i.pinimg.com/1200x/b4/92/5b/b4925bfe2292fecc75944b63fa4f9fb3.jpg" },
        { outfit_id: "O005", imageUrl: "https://i.pinimg.com/1200x/35/38/85/353885058ac47f5a8169adf9b5e06402.jpg" },
        { outfit_id: "O006", imageUrl: "https://i.pinimg.com/1200x/6a/83/93/6a8393f4aa0e8e01c93308ec8f37bd5c.jpg" },
        { outfit_id: "O007", imageUrl: "https://i.pinimg.com/736x/9d/32/14/9d3214d318c351a25e443dd413485215.jpg" },
        { outfit_id: "O008", imageUrl: "https://i.pinimg.com/736x/31/c4/01/31c401af58ca337fa47c1b374dfef5eb.jpg" },
        { outfit_id: "O009", imageUrl: "https://i.pinimg.com/1200x/da/af/37/daaf3788146f1cae3f56b73e687e6949.jpg" },
        { outfit_id: "O010", imageUrl: "https://i.pinimg.com/736x/2b/9e/08/2b9e08c0389b5634382c698f64e6a51d.jpg" },
        { outfit_id: "O011", imageUrl: "https://i.pinimg.com/736x/e9/de/55/e9de55c00985341065e5a1dc54cc2c93.jpg" },
        { outfit_id: "O012", imageUrl: "https://i.pinimg.com/1200x/f6/ac/4e/f6ac4e8340b43c0c403fff51bd794fc0.jpg" },
        { outfit_id: "O013", imageUrl: "https://i.pinimg.com/736x/19/b7/fc/19b7fc6669068f69c0b2a135a96c0842.jpg" },
        { outfit_id: "O014", imageUrl: "https://i.pinimg.com/736x/c3/f8/80/c3f88064806496953268f77dc1a4ca83.jpg" },
        { outfit_id: "O015", imageUrl: "https://i.pinimg.com/736x/3a/34/86/3a3486818b4d4d32688d0470883a638d.jpg" },
        { outfit_id: "O016", imageUrl: "https://i.pinimg.com/736x/b1/86/21/b186210bf89323b132442c625ce097ba.jpg" },
        { outfit_id: "O017", imageUrl: "https://i.pinimg.com/1200x/5c/29/87/5c29877e25b85e8a4300cba9cf514038.jpg" },
        { outfit_id: "O018", imageUrl: "https://i.pinimg.com/736x/a4/be/0b/a4be0b5b6d97f6576cff979d11d059b5.jpg" },
        { outfit_id: "O019", imageUrl: "https://i.pinimg.com/736x/ce/4d/4a/ce4d4a44feb9fbd8ea7ca67a4156b9f8.jpg" },
        { outfit_id: "O020", imageUrl: "https://i.pinimg.com/736x/fc/9b/0d/fc9b0d2d1981716a7741c50b400db0e9.jpg" },
        { outfit_id: "O021", imageUrl: "https://i.pinimg.com/1200x/e2/be/f3/e2bef3275e5fddee6ef0b7d13411718e.jpg" },
        { outfit_id: "O022", imageUrl: "https://i.pinimg.com/1200x/11/30/d8/1130d8b84fab43b53138e08c199d6fe3.jpg" },
        { outfit_id: "O023", imageUrl: "https://i.pinimg.com/1200x/b5/27/e3/b527e3129dc9014650816a766a655761.jpg" },
        { outfit_id: "O024", imageUrl: "https://i.pinimg.com/736x/d1/b1/b6/d1b1b6cf26d798f6fdb400563749b197.jpg" },
        { outfit_id: "O025", imageUrl: "https://i.pinimg.com/736x/8a/2f/72/8a2f72a0aa757997b55496df9f6472c3.jpg" },
        { outfit_id: "O026", imageUrl: "https://i.pinimg.com/1200x/ab/db/30/abdb3076e7dd1a0a31ab0a04ef3c04ca.jpg" },
        { outfit_id: "O027", imageUrl: "https://i.pinimg.com/736x/41/57/e8/4157e81791ac50bba198118b740d26b2.jpg" },
        { outfit_id: "O028", imageUrl: "https://i.pinimg.com/736x/a0/b1/4d/a0b14d9bdd492b19da9c60e34c74a7cf.jpg" },
        { outfit_id: "O029", imageUrl: "https://i.pinimg.com/1200x/b2/c7/60/b2c76014da9b0b9b61df114313cd012d.jpg" },
        { outfit_id: "O030", imageUrl: "https://i.pinimg.com/736x/55/49/1d/55491d57362a0961a711c77de64e0d7d.jpg" },
      ];

      const res = await apiFetch("/api/v1/admin/images/import-outfits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ outfits: OUTFIT_URLS }),
      });
      const data = await res.json();
      if (data.success) {
        setOutfitResults(data.data.results || []);
        showToast(`Outfit import: ${data.data.completed} completed, ${data.data.failed} failed`);
      } else {
        showToast(data.message || "Outfit import failed");
      }
    } catch { showToast("Outfit import request failed"); }
    finally { setRunning(false); }
  };

  return (
    <div className="mt-6 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold" style={{ fontFamily: "Manrope, sans-serif" }}>Outfit Cover Images</h3>
          <p className="text-xs text-gray-500 mt-1">Import outfit cover photos from external URLs into Supabase Storage</p>
        </div>
        <button
          onClick={importOutfitImages}
          disabled={running}
          className="px-5 py-2.5 rounded-xl text-white text-xs font-bold disabled:opacity-40 flex items-center gap-2"
          style={{ background: "linear-gradient(135deg, #003ec7, #002b92)" }}
        >
          <span className="material-symbols-outlined text-sm">{running ? "progress_activity" : "cloud_sync"}</span>
          {running ? "Importing..." : "Import Outfits"}
        </button>
      </div>

      {outfitResults.length > 0 && (
        <div className="mt-3 space-y-3">
          <div className="max-h-48 overflow-y-auto space-y-1.5">
            {outfitResults.map((r, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <span className={`material-symbols-outlined text-sm ${r.status === "completed" ? "text-green-600" : "text-red-500"}`}>
                  {r.status === "completed" ? "check_circle" : "error"}
                </span>
                <span className="font-mono text-gray-500">{r.outfit_id}</span>
                {r.storage_url && <span className="text-green-600 truncate max-w-[200px]">→ Storage ✓</span>}
                {r.error && <span className="text-red-400 truncate max-w-[200px]">{r.error}</span>}
              </div>
            ))}
          </div>

          {/* Copy-paste snippet */}
          {outfitResults.some(r => r.storage_url) && (
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Updated outfits.ts URLs</span>
                <button
                  onClick={() => {
                    const lines = outfitResults
                      .filter(r => r.storage_url)
                      .map(r => `    imageUrl: "${r.storage_url}",  // ${r.outfit_id}`)
                      .join("\n");
                    navigator.clipboard.writeText(lines);
                    showToast("Copied to clipboard");
                  }}
                  className="text-[10px] font-bold text-[#002b92] hover:underline"
                >
                  Copy All URLs
                </button>
              </div>
              <pre className="text-[9px] text-gray-600 max-h-32 overflow-y-auto whitespace-pre-wrap">
                {outfitResults.filter(r => r.storage_url).map(r => `${r.outfit_id}: ${r.storage_url}`).join("\n")}
              </pre>
            </div>
          )}
        </div>
      )}

      <p className="text-[10px] text-gray-400 mt-3">
        Note: After import, update <code>client/src/data/outfits.ts</code> with the returned Storage URLs.
      </p>
    </div>
  );
}

export default function ImageMigrationPage() {
  return (<RequireAdmin><MigrationContent /></RequireAdmin>);
}
