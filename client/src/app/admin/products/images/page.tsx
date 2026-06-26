"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import RequireAdmin from "../../components/RequireAdmin";
import AdminLayout from "../../components/AdminLayout";
import { apiFetch } from "@/lib/api";

type UploadResult = { filename: string; slug: string; url?: string; error?: string; matched?: boolean; productId?: string };
type BatchResult = { total: number; uploaded: number; matched: number; unmatched: number; failed: number; results: UploadResult[] };

function ImagesContent() {
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<BatchResult | null>(null);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(async (files: FileList) => {
    setUploading(true);
    setError("");
    setResult(null);
    setProgress(0);

    const imageFiles = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (imageFiles.length === 0) { setError("No image files found."); setUploading(false); return; }

    // Upload in batches of 10
    const allResults: UploadResult[] = [];
    const batchSize = 10;

    for (let i = 0; i < imageFiles.length; i += batchSize) {
      const batch = imageFiles.slice(i, i + batchSize);
      const formData = new FormData();
      batch.forEach((f) => formData.append("images", f));

      try {
        const res = await apiFetch("/api/v1/admin/images/upload-batch", { method: "POST", body: formData });
        if (res.ok) {
          const data = await res.json();
          allResults.push(...data.results);
        } else {
          batch.forEach((f) => allResults.push({ filename: f.name, slug: "", error: "Upload failed" }));
        }
      } catch {
        batch.forEach((f) => allResults.push({ filename: f.name, slug: "", error: "Network error" }));
      }

      setProgress(Math.round(((i + batch.length) / imageFiles.length) * 100));
    }

    const uploaded = allResults.filter((r) => r.url).length;
    const matched = allResults.filter((r) => r.matched).length;
    setResult({ total: imageFiles.length, uploaded, matched, unmatched: uploaded - matched, failed: allResults.filter((r) => r.error).length, results: allResults });
    setUploading(false);
  }, []);

  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files); };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-5xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight" style={{ fontFamily: "Manrope, sans-serif" }}>Upload Images</h1>
            <p className="text-sm text-gray-500 mt-1">Upload product images. Files are auto-matched to products by filename → slug.</p>
          </div>
          <Link href="/admin/products" className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-bold text-gray-700 hover:bg-gray-50">← Products</Link>
        </div>

        {error && <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">{error}</div>}

        {/* Upload Zone */}
        {!uploading && !result && (
          <div onDragOver={(e) => e.preventDefault()} onDrop={handleDrop} onClick={() => fileRef.current?.click()}
            className="bg-white border-2 border-dashed border-gray-300 rounded-2xl p-16 text-center cursor-pointer hover:border-[#002b92]/40 hover:bg-[#002b92]/5 transition-all">
            <span className="material-symbols-outlined text-gray-300 mb-4" style={{ fontSize: 56 }}>add_photo_alternate</span>
            <p className="text-lg font-semibold text-gray-700 mb-2">Drop images here or click to select</p>
            <p className="text-sm text-gray-400">Supports JPEG, PNG, WebP. Files are matched to products by filename.</p>
            <p className="text-xs text-gray-400 mt-2">Example: <code className="bg-gray-100 px-1 rounded">beige-oversized-tshirt.jpg</code> → product slug <code className="bg-gray-100 px-1 rounded">beige-oversized-tshirt</code></p>
            <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => { if (e.target.files?.length) handleFiles(e.target.files); }} />
          </div>
        )}

        {/* Progress */}
        {uploading && (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
            <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden mb-4">
              <div className="h-full bg-[#002b92] rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-sm font-semibold">Uploading... {progress}%</p>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h3 className="text-lg font-bold mb-4">Upload Complete</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                <div className="bg-blue-50 rounded-xl p-3 text-center"><p className="text-xl font-bold text-blue-700">{result.total}</p><p className="text-[9px] text-blue-600 font-bold uppercase">Total</p></div>
                <div className="bg-green-50 rounded-xl p-3 text-center"><p className="text-xl font-bold text-green-700">{result.uploaded}</p><p className="text-[9px] text-green-600 font-bold uppercase">Uploaded</p></div>
                <div className="bg-purple-50 rounded-xl p-3 text-center"><p className="text-xl font-bold text-purple-700">{result.matched}</p><p className="text-[9px] text-purple-600 font-bold uppercase">Matched</p></div>
                <div className="bg-yellow-50 rounded-xl p-3 text-center"><p className="text-xl font-bold text-yellow-700">{result.unmatched}</p><p className="text-[9px] text-yellow-600 font-bold uppercase">Unmatched</p></div>
                <div className="bg-red-50 rounded-xl p-3 text-center"><p className="text-xl font-bold text-red-700">{result.failed}</p><p className="text-[9px] text-red-600 font-bold uppercase">Failed</p></div>
              </div>

              {/* Results table */}
              <div className="border rounded-xl overflow-hidden max-h-[400px] overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 sticky top-0"><tr><th className="px-3 py-2 text-left">File</th><th className="px-3 py-2 text-left">Slug</th><th className="px-3 py-2 text-left">Status</th></tr></thead>
                  <tbody>
                    {result.results.map((r, i) => (
                      <tr key={i} className="border-t border-gray-50">
                        <td className="px-3 py-2 font-mono truncate max-w-[200px]">{r.filename}</td>
                        <td className="px-3 py-2 font-mono text-gray-500">{r.slug}</td>
                        <td className="px-3 py-2">
                          {r.error ? <span className="text-red-600">{r.error}</span> :
                           r.matched ? <span className="text-green-600 font-bold">✓ Matched</span> :
                           <span className="text-yellow-600">Uploaded (no match)</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <button onClick={() => { setResult(null); setProgress(0); }} className="px-6 py-2.5 rounded-xl border border-gray-200 text-sm font-bold">Upload More</button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default function ProductImagesPage() {
  return (<RequireAdmin><ImagesContent /></RequireAdmin>);
}
