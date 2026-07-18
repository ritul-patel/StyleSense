"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import RequireAdmin from "../../components/RequireAdmin";
import AdminLayout from "../../components/AdminLayout";
import { apiFetch, API_BASE_URL } from "@/lib/api";import { AppIcon } from "@/components/ui/AppIcon";


type ImportResult = { imported: number; skipped: number; failed: number; duplicates: number; errors: { row: number; field: string; message: string }[] };
type ImportState = "idle" | "preview" | "importing" | "done";

function OutfitImportContent() {
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
      const lines = text.split(/\r?\n/).filter((l) => l.trim());
      if (lines.length < 2) { setError("CSV must have headers + at least 1 row."); return; }
      const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
      if (!headers.includes("outfit_name")) { setError("CSV must have 'outfit_name' column."); return; }
      const preview = lines.slice(1, 6).map((line) => {
        const vals = line.split(",");
        const row: Record<string, string> = {};
        headers.forEach((h, i) => { row[h] = (vals[i] || "").trim().slice(0, 40); });
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
    if (file && file.name.endsWith(".csv")) handleFile(file);
    else setError("Please upload a .csv file.");
  }, [handleFile]);

  const startImport = async () => {
    setState("importing");
    setError("");
    try {
      const res = await apiFetch("/api/v1/admin/import/outfits", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ csv: csvText }) });
      if (!res.ok) { setError("Import failed."); setState("preview"); return; }
      setResult(await res.json());
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
            <h1 className="text-3xl font-bold tracking-tight" style={{ fontFamily: "Manrope, sans-serif" }}>Import Outfits</h1>
            <p className="text-sm text-gray-500 mt-1">Bulk import outfit combinations from CSV.</p>
          </div>
          <div className="flex gap-3">
            <a href={`${API_BASE_URL}/api/v1/admin/import/outfits/template`} className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-2">
              <AppIcon name="download" size={14} /> Template
            </a>
            <Link href="/admin/outfits" className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-bold text-gray-700 hover:bg-gray-50">← Outfits</Link>
          </div>
        </div>

        {error && <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">{error}</div>}

        {state === "idle" && (
          <div onDragOver={(e) => e.preventDefault()} onDrop={handleDrop} onClick={() => fileRef.current?.click()}
            className="bg-white border-2 border-dashed border-gray-300 rounded-2xl p-16 text-center cursor-pointer hover:border-[#002b92]/40 hover:bg-[#002b92]/5 transition-all">
            <AppIcon name="upload_file" size={56} className="text-gray-300 mb-4" />
            <p className="text-lg font-semibold text-gray-700 mb-2">Drop outfit CSV here</p>
            <p className="text-sm text-gray-400">Required: outfit_name. Product slugs must reference existing products.</p>
            <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
          </div>
        )}

        {state === "preview" && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div><p className="text-sm font-bold">{fileName}</p><p className="text-xs text-gray-500">{totalRows} rows</p></div>
                <button onClick={reset} className="text-xs text-gray-500 hover:text-red-500">Cancel</button>
              </div>
              <div className="overflow-x-auto border rounded-xl">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50"><tr>{Object.keys(previewRows[0] || {}).slice(0, 5).map((h) => <th key={h} className="px-3 py-2 text-left font-semibold text-gray-600 uppercase">{h}</th>)}</tr></thead>
                  <tbody>{previewRows.map((row, i) => (<tr key={i} className="border-t border-gray-50">{Object.values(row).slice(0, 5).map((v, j) => <td key={j} className="px-3 py-2 text-gray-700 truncate max-w-[120px]">{v || "-"}</td>)}</tr>))}</tbody>
                </table>
              </div>
            </div>
            <button onClick={startImport} className="px-8 py-3 rounded-xl text-white font-bold text-sm" style={{ background: "linear-gradient(135deg, #003ec7, #002b92)" }}>Import {totalRows} Outfits</button>
          </div>
        )}

        {state === "importing" && (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <div className="w-12 h-12 border-4 border-[#002b92] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm font-semibold">Importing outfits...</p>
          </div>
        )}

        {state === "done" && result && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h3 className="text-lg font-bold mb-4">Import Complete</h3>
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
                    <tbody>{result.errors.slice(0, 20).map((e, i) => (<tr key={i} className="border-t border-red-50"><td className="px-3 py-2">{e.row}</td><td className="px-3 py-2 font-mono">{e.field}</td><td className="px-3 py-2 text-red-600">{e.message}</td></tr>))}</tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <button onClick={reset} className="px-6 py-2.5 rounded-xl border border-gray-200 text-sm font-bold">Import More</button>
              <Link href="/admin/outfits" className="px-6 py-2.5 rounded-xl text-white text-sm font-bold" style={{ background: "linear-gradient(135deg, #003ec7, #002b92)" }}>View Outfits</Link>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default function OutfitImportPage() {
  return (<RequireAdmin><OutfitImportContent /></RequireAdmin>);
}
