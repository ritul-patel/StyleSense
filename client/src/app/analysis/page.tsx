"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const PENDING_IMAGE_KEY = "pending_image";

type ErrorState = { kind: "no_face" | "generic"; message: string } | null;

export default function AnalysisPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadError, setUploadError] = useState<ErrorState>(null);

  // Read face-gate error from sessionStorage (set by /loading on 422)
  useState(() => {
    if (typeof window === "undefined") return;
    const raw = sessionStorage.getItem("analysis_error");
    if (raw) {
      try { setUploadError(JSON.parse(raw)); } catch { /* ignore */ }
      sessionStorage.removeItem("analysis_error");
    }
  });

  function handleFileSelect(selected: File) {
    setFile(selected);
    setUploadError(null);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(selected);
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFileSelect(f);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFileSelect(f);
  };

  const resetUpload = () => {
    setFile(null);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Store image in sessionStorage then navigate to /loading (500ms delay for smooth UX)
  const handleAnalyze = () => {
    if (!preview || submitting) return;
    setSubmitting(true);
    try {
      sessionStorage.setItem(PENDING_IMAGE_KEY, preview);
      setTimeout(() => router.push("/loading"), 500);
    } catch {
      setSubmitting(false);
      alert("Could not store image. Please try again.");
    }
  };

  const hasFile = !!file;

  return (
    <div
      className="bg-[#fcf9f8] text-[#1b1c1b] min-h-screen flex flex-col items-center antialiased"
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      {/* Background blobs */}
      <div className="fixed top-[-10%] right-[-5%] w-[40vw] h-[40vw] rounded-full bg-[#dde1ff]/20 blur-[120px] -z-10 pointer-events-none" />
      <div className="fixed bottom-[-10%] left-[-5%] w-[30vw] h-[30vw] rounded-full bg-[#fedbca]/20 blur-[100px] -z-10 pointer-events-none" />

      {/* Header */}
      <header className="bg-[#fcf9f8]/70 backdrop-blur-xl fixed top-0 left-0 right-0 z-50 border-b border-black/5">
        <div className="flex justify-between items-center px-8 h-20 w-full max-w-screen-2xl mx-auto">
          <Link
            href="/"
            className="text-2xl font-black tracking-tighter text-[#002b92]"
            style={{ fontFamily: "Manrope, sans-serif" }}
          >
            ATELIER AI
          </Link>
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/discover" className="text-stone-400 font-medium hover:text-[#002b92] transition-colors">Discover</Link>
            <span className="text-[#002b92] font-bold border-b-2 border-[#002b92]">Analysis</span>
            <Link href="/wardrobe" className="text-stone-400 font-medium hover:text-[#002b92] transition-colors">Wardrobe</Link>
            <Link href="/history" className="text-stone-400 font-medium hover:text-[#002b92] transition-colors">History</Link>
            <Link href="/settings" className="text-stone-400 font-medium hover:text-[#002b92] transition-colors">Settings</Link>
          </nav>
          <div className="flex items-center gap-4">
            <span className="material-symbols-outlined text-[#1b1c1b] hover:text-[#002b92] transition-colors cursor-pointer">
              account_circle
            </span>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-grow flex items-center justify-center pt-32 pb-20 px-6 w-full max-w-4xl">
        <div className="w-full flex flex-col items-center">
          {/* Header text */}
          <div className="text-center mb-10">
            <span className="inline-block text-xs font-bold tracking-[0.2em] text-[#5a6060] uppercase mb-3">
              AI ANALYSIS
            </span>
            <h1
              className="text-5xl font-extrabold tracking-tighter text-[#1b1c1b] mb-4"
              style={{ fontFamily: "Manrope, sans-serif" }}
            >
              Start Your Analysis
            </h1>
            <p className="text-lg text-[#5a6060] max-w-md mx-auto leading-relaxed">
              Upload a clear portrait to get your personalized color analysis.
            </p>
          </div>

          {/* Error banner — face gate (422) or generic */}
          {uploadError && (
            <div
              role="alert"
              className="w-full max-w-[680px] flex gap-3 items-start rounded-2xl px-5 py-4 mb-5"
              style={{
                background: uploadError.kind === "no_face" ? "#fff7ed" : "#fef2f2",
                border: `1px solid ${uploadError.kind === "no_face" ? "#fdba74" : "#fecaca"}`,
              }}
            >
              <span
                className="material-symbols-outlined flex-shrink-0 mt-0.5"
                style={{ fontSize: 22, color: uploadError.kind === "no_face" ? "#c2410c" : "#b91c1c" }}
              >
                {uploadError.kind === "no_face" ? "face_retouching_off" : "error"}
              </span>
              <div className="flex-1">
                <p
                  className="text-xs font-bold uppercase tracking-widest mb-1"
                  style={{ color: uploadError.kind === "no_face" ? "#9a3412" : "#991b1b", fontFamily: "Space Grotesk, sans-serif", letterSpacing: "0.12em" }}
                >
                  {uploadError.kind === "no_face" ? "No face detected" : "Analysis failed"}
                </p>
                <p className="text-sm leading-snug text-[#1b1c1b]">{uploadError.message}</p>
              </div>
              <button
                type="button"
                onClick={() => setUploadError(null)}
                className="text-stone-400 hover:text-[#1b1c1b] transition-colors flex-shrink-0"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
              </button>
            </div>
          )}

          {/* Upload card */}
          <div
            className="w-full max-w-[680px] bg-white rounded-2xl p-6 mb-8"
            style={{ boxShadow: "0px 12px 32px rgba(27,28,27,0.04)" }}
          >
            {/* Drop zone */}
            <div
              className="group relative flex flex-col items-center justify-center w-full min-h-[340px] border-2 border-dashed rounded-xl cursor-pointer transition-all duration-300"
              style={{
                borderColor: dragActive ? "#003ec7" : "#c4c5d7",
                backgroundColor: dragActive ? "#f0f7ff" : "#fafafa",
              }}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => !hasFile && fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />

              {/* Empty state */}
              {!hasFile && (
                <div className="flex flex-col items-center text-center p-12 transition-all duration-300">
                  <div className="w-14 h-14 rounded-full bg-[#dde1ff] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <span className="material-symbols-outlined text-[#002b92] text-2xl">cloud_upload</span>
                  </div>
                  <h3 className="text-xl font-bold text-[#1b1c1b] mb-1" style={{ fontFamily: "Manrope, sans-serif" }}>
                    Drag &amp; drop your portrait here
                  </h3>
                  <p className="text-[#5a6060]">
                    or <span className="text-[#002b92] font-semibold">click to browse</span>
                  </p>
                </div>
              )}

              {/* Uploaded state */}
              {hasFile && preview && (
                <div className="flex flex-col items-center justify-center w-full h-full p-4 transition-all duration-300">
                  <div className="relative">
                    <img
                      src={preview}
                      alt="Preview"
                      className="max-h-[280px] w-auto rounded-lg shadow-md object-cover"
                    />
                    <button
                      type="button"
                      className="absolute -top-3 -right-3 w-8 h-8 bg-white text-[#1b1c1b] rounded-full shadow-lg flex items-center justify-center hover:bg-red-50 hover:text-red-600 transition-colors z-30"
                      onClick={(e) => { e.stopPropagation(); resetUpload(); }}
                    >
                      <span className="material-symbols-outlined text-lg">close</span>
                    </button>
                  </div>
                  <p className="mt-4 text-sm font-medium text-[#5a6060]">{file?.name}</p>
                  <p className="mt-2 text-green-600 font-medium text-sm flex items-center justify-center gap-1">
                    Looks good{" "}
                    <span
                      className="material-symbols-outlined text-sm"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      check
                    </span>
                  </p>
                </div>
              )}
            </div>

            {/* Tips */}
            <div className="mt-8 flex flex-wrap justify-center gap-x-8 gap-y-3">
              {["Face clearly visible", "Good lighting", "No heavy filters"].map((tip) => (
                <div key={tip} className="flex items-center gap-2">
                  <span
                    className="material-symbols-outlined text-[#002b92] text-lg"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    check_circle
                  </span>
                  <p className="text-sm text-[#5a6060] font-medium">{tip}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col items-center gap-4 w-full">
            <button
              type="button"
              disabled={!hasFile || submitting}
              onClick={handleAnalyze}
              className="w-full md:w-auto min-w-[240px] px-12 py-4 rounded-full font-bold text-lg flex items-center justify-center gap-2 transition-all duration-200"
              style={
                hasFile && !submitting
                  ? {
                      background: "linear-gradient(135deg, #002b92 0%, #003ec7 100%)",
                      color: "white",
                      boxShadow: "0 10px 25px rgba(0,43,146,0.25)",
                      cursor: "pointer",
                      fontFamily: "Manrope, sans-serif",
                    }
                  : {
                      background: "#e5e7eb",
                      color: "rgba(255,255,255,0.7)",
                      cursor: "not-allowed",
                      opacity: 0.5,
                      fontFamily: "Manrope, sans-serif",
                    }
              }
            >
              <span>{submitting ? "Starting..." : "Analyze Now"}</span>
              {submitting ? (
                <span className="material-symbols-outlined" style={{ animation: "spin 1s linear infinite" }}>
                  progress_activity
                </span>
              ) : (
                <span className="material-symbols-outlined">arrow_forward</span>
              )}
            </button>

            {hasFile && !submitting && (
              <button
                type="button"
                onClick={resetUpload}
                className="text-[#5a6060] hover:text-[#002b92] transition-all font-semibold flex items-center gap-2 py-2"
              >
                Choose another photo
              </button>
            )}
          </div>
        </div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 bg-[#fcf9f8]/80 backdrop-blur-2xl border-t border-black/5 flex justify-around items-center px-4 h-20">
        <Link href="/discover" className="flex flex-col items-center justify-center text-stone-400 px-4 py-2">
          <span className="material-symbols-outlined">explore</span>
          <span className="text-[10px] font-semibold uppercase tracking-widest mt-1">Discover</span>
        </Link>
        <div className="flex flex-col items-center justify-center bg-[#002b92] text-white rounded-full px-4 py-2">
          <span className="material-symbols-outlined">add_circle</span>
          <span className="text-[10px] font-semibold uppercase tracking-widest mt-1">Analysis</span>
        </div>
        <Link href="/wardrobe" className="flex flex-col items-center justify-center text-stone-400 px-4 py-2">
          <span className="material-symbols-outlined">checkroom</span>
          <span className="text-[10px] font-semibold uppercase tracking-widest mt-1">Wardrobe</span>
        </Link>
        <Link href="/history" className="flex flex-col items-center justify-center text-stone-400 px-4 py-2">
          <span className="material-symbols-outlined">history</span>
          <span className="text-[10px] font-semibold uppercase tracking-widest mt-1">History</span>
        </Link>
      </nav>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
