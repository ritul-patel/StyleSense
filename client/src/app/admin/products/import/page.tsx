"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import RequireAdmin from "../../components/RequireAdmin";
import AdminLayout from "../../components/AdminLayout";
import { apiFetch, API_BASE_URL } from "@/lib/api";

type ImportResult = { imported: number; skipped: number; failed: number; duplicates: number; errors: { row: number; field: string; message: string }[] };
type ImportState = "idle" | "preview" | "importing" | "done";

function ProductImportContent() {
  const [state, setState] = useState<ImportState>("idle");
  const [csvText, setCsvText] = useState("");
  const [fileName, setFileName] = useState("");
  const [previewRows, setPreviewRows] = useState<Record<string, string>[]>([]);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    setError("");
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setCsvText(text);
      // Parse preview
      const lines = text.split(/\r?\n/).filter((l) => l.trim());
      if (lines.length < 2) { setError("CSV must have headers + at least 1 row."); return; }
      const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
      if (!headers.includes("name") || !headers.includes("category")) {
        setError("CSV must have 'name' and 'category' columns.");
        return;
      }
      const preview = lines.slice(1, 6).map((line) => {
        const vals = line.split(",");
        const row: Record<string, string> = {};
        headers.forEach((h, i) => { row[h] = (vals[i] || "").trim().slice(0, 50); });
        return row;
      });
      setPreviewRows(preview);
      setState("preview");
    };
    reader.readAsText(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith(".csv") || file.type === "text/csv")) handleFile(file);
    else setError("Please upload a .csv file.");
  }, [handleFile]);

  const startImport = async () => {
    setState("importing");
    setError("");
    try {
      const res = await apiFetch("/api/v1/admin/import/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv: csvText }),
      });
      if (!res.ok) { setError("Import request failed."); setState("preview"); return; }
      const data = await res.json();
      setResult(data);
      setState("done");
    } catch { setError("Network error."); setState("preview"); }
  };

  const reset = () => { setState("idle"); setCsvText(""); setFileName(""); setPreviewRows([]); setResult(null); setError(""); };
  const totalRows = csvText ? csvText.split(/\r?\n/).filter((l) => l.trim()).length - 1 : 0;

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight" style={{ fontFamily: "Manrope, sans-serif" }}>Import Products</h1>
            <p className="text-sm text-gray-500 mt-1">Bulk import products from CSV.</p>
          </div>
          <div className="flex gap-3">
            <a href={`${API_BASE_URL}/api/v1/admin/import/products/template`} className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">download</span> Template
            </a>
            <Link href="/admin/products" className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-bold text-gray-700 hover:bg-gray-50">← Products</Link>
          </div>
        </div>

        {error && <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">{error}</div>}

        {/* Upload Zone */}
        {state === "idle" && (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            className="bg-white border-2 border-dashed border-gray-300 rounded-2xl p-16 text-center cursor-pointer hover:border-[#002b92]/40 hover:bg-[#002b92]/5 transition-all"
          >
            <span className="material-symbols-outlined text-gray-300 mb-4" style={{ fontSize: 56 }}>upload_file</span>
            <p className="text-lg font-semibold text-gray-700 mb-2">Drop CSV here or click to upload</p>
            <p className="text-sm text-gray-400">Requires: name, category. Optional: brand, price, image_url, etc.</p>
            <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
          </div>
        )}

        {/* Preview */}
        {state === "preview" && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-bold">{fileName}</p>
                  <p className="text-xs text-gray-500">{totalRows} rows detected</p>
                </div>
                <button onClick={reset} className="text-xs text-gray-500 hover:text-red-500">Cancel</button>
              </div>

              {/* Preview table */}
              <div className="overflow-x-auto border rounded-xl">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50">
                    <tr>{Object.keys(previewRows[0] || {}).slice(0, 6).map((h) => <th key={h} className="px-3 py-2 text-left font-semibold text-gray-600 uppercase">{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row, i) => (
                      <tr key={i} className="border-t border-gray-50">
                        {Object.values(row).slice(0, 6).map((v, j) => <td key={j} className="px-3 py-2 text-gray-700 truncate max-w-[150px]">{v || "—"}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {totalRows > 5 && <p className="text-[10px] text-gray-400 mt-2">Showing first 5 of {totalRows} rows</p>}
            </div>

            <button onClick={startImport} className="px-8 py-3 rounded-xl text-white font-bold text-sm" style={{ background: "linear-gradient(135deg, #003ec7, #002b92)" }}>
              Import {totalRows} Products
            </button>
          </div>
        )}

        {/* Importing */}
        {state === "importing" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
            <div className="w-12 h-12 border-4 border-[#002b92] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm font-semibold">Importing {totalRows} products...</p>
            <p className="text-xs text-gray-500 mt-1">This may take a moment for large files.</p>
          </div>
        )}

        {/* Results */}
        {state === "done" && result && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h3 className="text-lg font-bold mb-4" style={{ fontFamily: "Manrope, sans-serif" }}>Import Complete</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-green-50 rounded-xl p-4 text-center"><p className="text-2xl font-bold text-green-700">{result.imported}</p><p className="text-[10px] text-green-600 font-bold uppercase">Imported</p></div>
                <div className="bg-yellow-50 rounded-xl p-4 text-center"><p className="text-2xl font-bold text-yellow-700">{result.duplicates}</p><p className="text-[10px] text-yellow-600 font-bold uppercase">Duplicates</p></div>
                <div className="bg-gray-50 rounded-xl p-4 text-center"><p className="text-2xl font-bold text-gray-700">{result.skipped}</p><p className="text-[10px] text-gray-600 font-bold uppercase">Skipped</p></div>
                <div className="bg-red-50 rounded-xl p-4 text-center"><p className="text-2xl font-bold text-red-700">{result.failed}</p><p className="text-[10px] text-red-600 font-bold uppercase">Failed</p></div>
              </div>

              {result.errors.length > 0 && (
                <div className="border border-red-100 rounded-xl overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-red-50"><tr><th className="px-3 py-2 text-left">Row</th><th className="px-3 py-2 text-left">Field</th><th className="px-3 py-2 text-left">Error</th></tr></thead>
                    <tbody>
                      {result.errors.slice(0, 20).map((e, i) => (
                        <tr key={i} className="border-t border-red-50"><td className="px-3 py-2">{e.row}</td><td className="px-3 py-2 font-mono">{e.field}</td><td className="px-3 py-2 text-red-600">{e.message}</td></tr>
                      ))}
                    </tbody>
                  </table>
                  {result.errors.length > 20 && <p className="text-[10px] text-gray-400 p-2">...and {result.errors.length - 20} more errors</p>}
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button onClick={reset} className="px-6 py-2.5 rounded-xl border border-gray-200 text-sm font-bold">Import More</button>
              <Link href="/admin/products" className="px-6 py-2.5 rounded-xl text-white text-sm font-bold" style={{ background: "linear-gradient(135deg, #003ec7, #002b92)" }}>View Products</Link>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default function ProductImportPage() {
  return (<RequireAdmin><ProductImportContent /></RequireAdmin>);
}
