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
          </>
        )}
      </div>
    </AdminLayout>
  );
}

export default function ImageMigrationPage() {
  return (<RequireAdmin><MigrationContent /></RequireAdmin>);
}
