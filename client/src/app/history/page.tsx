"use client";

import Link from "next/link";
import Navbar from "@/app/components/Navbar";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchAnalysisHistory, type AnalysisHistoryItem } from "@/lib/api";
import RequireAuth from "../components/RequireAuth";

function formatDate(value: string | null): string {
  if (!value) return "Unknown date";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Unknown date";
  return parsed.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// Deterministic palette chips from hex
function getPaletteChips(hex: string): string[] {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16) || 128;
  const g = parseInt(h.slice(2, 4), 16) || 128;
  const b = parseInt(h.slice(4, 6), 16) || 128;
  return [
    hex,
    `rgb(${Math.min(r + 40, 255)},${Math.max(g - 20, 0)},${Math.max(b - 20, 0)})`,
    `rgb(${Math.max(r - 30, 0)},${Math.min(g + 30, 255)},${Math.max(b - 10, 0)})`,
    `rgb(${Math.min(r + 60, 255)},${Math.min(g + 40, 255)},${Math.min(b + 40, 255)})`,
  ];
}

function shortId(id: string): string {
  return `#VAI-${id.slice(0, 8).toUpperCase()}`;
}

function HistoryCard({ item, onReanalyze }: { item: AnalysisHistoryItem; onReanalyze: (id: string) => void }) {
  const chips = getPaletteChips(item.hex || "#808080");

  return (
    <div
      className="group bg-white rounded-[2rem] p-8 flex flex-col justify-between transition-all duration-500 cursor-pointer hover:shadow-2xl"
      style={{ boxShadow: "0 20px 40px -10px rgba(28,27,27,0.06)" }}
    >
      <div>
        {/* Top row: palette + ID */}
        <div className="flex justify-between items-start mb-8">
          <div className="flex -space-x-3">
            {chips.map((c, i) => (
              <div
                key={i}
                className="w-12 h-12 rounded-full border-4 border-white shrink-0"
                style={{ background: c, zIndex: chips.length - i }}
              />
            ))}
          </div>
          <span
            className="text-[#434654] text-[10px] bg-[#f6f3f2] px-2 py-1 rounded"
            style={{ fontFamily: "monospace" }}
          >
            {shortId(item.analysisId)}
          </span>
        </div>

        {/* Content */}
        <div className="space-y-4 mb-8">
          <div className="space-y-1">
            <h3
              className="text-2xl font-extrabold text-[#1b1c1b]"
              style={{ fontFamily: "Manrope, sans-serif" }}
            >
              {item.skin_tone || "Unknown"}
            </h3>
            <div className="flex items-center gap-2 text-[#002b92] text-[10px] uppercase tracking-widest font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#002b92]" />
              {item.undertone || "Unknown"} Undertone
            </div>
          </div>

          <div className="border-t border-[#f0edec] flex justify-between items-center pt-4">
            <div>
              <p className="text-[10px] text-[#747686] uppercase tracking-wider mb-1">Skin Hex</p>
              <p className="text-lg font-extrabold text-[#1b1c1b]" style={{ fontFamily: "Manrope, sans-serif" }}>
                {item.hex || "—"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-[#747686] uppercase tracking-wider mb-1">Date</p>
              <p className="text-sm font-medium text-[#1b1c1b]">{formatDate(item.created_at)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 w-full">
        <Link
          href={`/result?id=${encodeURIComponent(item.analysisId)}`}
          className="flex-1 py-3 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90"
          style={{
            background: "linear-gradient(135deg, #003ec7, #002b92)",
            fontFamily: "Manrope, sans-serif",
          }}
        >
          <span className="material-symbols-outlined text-sm">visibility</span>
          View Analysis
        </Link>
        <button
          className="flex-1 py-3 rounded-xl border border-[#002b92] text-[#002b92] font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#002b92]/5 transition-all"
          style={{ fontFamily: "Manrope, sans-serif" }}
          onClick={() => onReanalyze(item.analysisId)}
        >
          <span className="material-symbols-outlined text-sm">refresh</span>
          Re-analyze
        </button>
      </div>
    </div>
  );
}

function HistoryPageContent() {
  const router = useRouter();
  const [items, setItems] = useState<AnalysisHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;
    async function loadHistory() {
      setLoading(true);
      setError("");
      try {
        const history = await fetchAnalysisHistory();
        if (!isMounted) return;
        setItems(history);
      } catch (err) {
        console.error("Failed to load analysis history:", err);
        if (!isMounted) return;
        setError("Could not load analysis history.");
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    void loadHistory();
    return () => { isMounted = false; };
  }, []);

  const hasItems = useMemo(() => items.length > 0, [items]);

  const handleReanalyze = (id: string) => {
    router.push("/analysis");
  };

  return (
    <div
      className="bg-[#fcf9f8] text-[#1b1c1b] antialiased min-h-screen"
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      {/* Nav */}
      <Navbar activePath="history" />

      <main className="pt-32 pb-20 px-8 max-w-[1400px] mx-auto min-h-screen">
        {/* Header */}
        <header className="mb-16 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-[#dde1ff] text-[#001452] text-[10px] uppercase tracking-widest mb-4 font-bold">
              Personalized Archives
            </div>
            <h1
              className="text-5xl md:text-6xl font-bold tracking-tight text-[#1b1c1b]"
              style={{ fontFamily: "Manrope, sans-serif" }}
            >
              Analysis History
            </h1>
            <p className="text-[#434654] text-lg max-w-lg font-light">
              View your previous style insights and track your color evolution through our proprietary AI engine.
            </p>
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-6 py-3 rounded-xl border border-[#c3c5d9] hover:bg-[#f6f3f2] transition-colors text-xs uppercase tracking-widest font-bold">
              <span className="material-symbols-outlined text-sm">filter_list</span>
              Filter
            </button>
            <Link
              href="/analysis"
              className="flex items-center gap-2 px-6 py-3 rounded-xl text-white hover:opacity-90 transition-all text-xs uppercase tracking-widest font-bold"
              style={{ background: "linear-gradient(135deg, #003ec7, #002b92)", boxShadow: "0 4px 16px rgba(0,62,199,0.3)" }}
            >
              <span className="material-symbols-outlined text-sm">add</span>
              New Analysis
            </Link>
          </div>
        </header>

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-[2rem] p-8 h-64 animate-pulse" style={{ boxShadow: "0 20px 40px -10px rgba(28,27,27,0.06)" }}>
                <div className="flex gap-3 mb-6">
                  {[1, 2, 3, 4].map((j) => (
                    <div key={j} className="w-12 h-12 rounded-full bg-[#e4e2e1]" />
                  ))}
                </div>
                <div className="h-6 bg-[#e4e2e1] rounded mb-3 w-2/3" />
                <div className="h-4 bg-[#e4e2e1] rounded w-1/3" />
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="bg-white rounded-[2rem] p-8" style={{ boxShadow: "0 20px 40px -10px rgba(28,27,27,0.06)" }}>
            <h2 className="text-xl font-semibold text-[#1b1c1b]" style={{ fontFamily: "Manrope, sans-serif" }}>
              Something went wrong
            </h2>
            <p className="mt-2 text-sm text-[#ba1a1a]">{error}</p>
            <button
              onClick={() => { setError(""); setLoading(true); fetchAnalysisHistory().then(setItems).catch(() => setError("Could not load analysis history.")).finally(() => setLoading(false)); }}
              className="mt-4 px-5 py-2.5 rounded-xl border border-[#002b92] text-[#002b92] text-xs font-bold uppercase tracking-wider hover:bg-[#002b92]/5 transition-all"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && !hasItems && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-full bg-[#dde1ff] flex items-center justify-center mb-6">
              <span className="material-symbols-outlined text-[#002b92]" style={{ fontSize: 40 }}>history</span>
            </div>
            <h2 className="text-2xl font-bold text-[#1b1c1b] mb-3" style={{ fontFamily: "Manrope, sans-serif" }}>
              No analyses yet
            </h2>
            <p className="text-[#434654] mb-8 max-w-sm">
              Your history will appear here once you complete an analysis.
            </p>
            <Link
              href="/analysis"
              className="px-8 py-4 rounded-full text-white font-bold transition-transform hover:scale-[1.02]"
              style={{ background: "linear-gradient(135deg, #003ec7, #002b92)", fontFamily: "Manrope, sans-serif" }}
            >
              Start Your First Analysis
            </Link>
          </div>
        )}

        {/* Items grid */}
        {!loading && !error && hasItems && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {items.map((item) => (
              <HistoryCard key={item.analysisId} item={item} onReanalyze={handleReanalyze} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default function HistoryPage() {
  return (
    <RequireAuth>
      <HistoryPageContent />
    </RequireAuth>
  );
}
