"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AnalysisResultView from "../components/result/AnalysisResultView";
import { parseResultPayload } from "../components/result/result-utils";
import type { AnalysisResultData } from "../components/result/types";
import RequireAuth from "../components/RequireAuth";

function ResultPageContent() {
  const router = useRouter();
  const [result, setResult] = useState<AnalysisResultData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const rawNotice = sessionStorage.getItem("analysis_notice");
    if (rawNotice) {
      try {
        const parsedNotice = JSON.parse(rawNotice) as { message?: unknown } | null;
        if (parsedNotice && typeof parsedNotice.message === "string") {
          setNotice(parsedNotice.message);
        }
      } catch {
        // Ignore malformed client notice payload
      } finally {
        sessionStorage.removeItem("analysis_notice");
      }
    }

    // Primary: sessionStorage (set by /loading after successful API call)
    // Fallback: localStorage (persists across page refresh)
    const raw =
      sessionStorage.getItem("analysis_result") ||
      localStorage.getItem("last_analysis");

    if (!raw) {
      router.replace("/analysis");
      return;
    }

    try {
      const parsed = JSON.parse(raw);
      setResult(parseResultPayload(parsed));
    } catch {
      setError("Could not read result data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f9f9f8] flex items-center justify-center">
        <div className="rounded-3xl bg-white px-8 py-6 text-sm text-[#5a6060] shadow-[0_18px_40px_rgba(12,15,14,0.08)]">
          Loading your analysis...
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-[#f9f9f8] flex items-center justify-center px-6">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-[0_18px_40px_rgba(12,15,14,0.08)]">
          <h2 className="text-2xl font-bold text-[#2d3433]">Something went wrong</h2>
          <p className="mt-3 text-sm text-[#9f403d]">{error}</p>
          <button
            type="button"
            className="mt-6 rounded-2xl bg-[#5f5e5e] px-6 py-3 text-sm font-semibold text-[#faf7f6] transition-opacity duration-300 hover:opacity-90"
            onClick={() => router.push("/analysis")}
          >
            Try Again
          </button>
        </div>
      </main>
    );
  }

  if (!result) return null;

  return (
    <div className="relative">
      {notice && (
        <div className="fixed left-1/2 top-24 z-[60] -translate-x-1/2 rounded-full border border-[#f6c89a] bg-[#fff3e6] px-5 py-2 text-xs font-semibold text-[#8a4b08] shadow-sm">
          {notice}
        </div>
      )}
      <AnalysisResultView data={result} onRetry={() => router.push("/analysis")} />
    </div>
  );
}

export default function ResultPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#f9f9f8] flex items-center justify-center">
          <div className="rounded-3xl bg-white px-8 py-6 text-sm text-[#5a6060] shadow-[0_18px_40px_rgba(12,15,14,0.08)]">
            Loading your analysis...
          </div>
        </main>
      }
    >
      <ResultPageContent />
    </Suspense>
  );
}
