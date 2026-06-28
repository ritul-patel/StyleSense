"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/app/components/Navbar";
import posthog from "posthog-js";
import RequireAuth from "../components/RequireAuth";
const PENDING_IMAGE_KEY = "pending_image";
const MAX_DIMENSION = 1200; // Max px on longest side for sessionStorage
const JPEG_QUALITY = 0.85;
const MAX_FILE_SIZE_MB = 25; // Reject files over 25MB before any processing
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

type ErrorState = { kind: "no_face" | "too_large" | "generic"; message: string } | null;

/**
 * Compress an image data URL to fit within sessionStorage quota.
 * Resizes to MAX_DIMENSION on the longest side and encodes as JPEG.
 */
function compressImageDataUrl(dataUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      // Scale down if needed
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        if (width > height) {
          height = Math.round(height * (MAX_DIMENSION / width));
          width = MAX_DIMENSION;
        } else {
          width = Math.round(width * (MAX_DIMENSION / height));
          height = MAX_DIMENSION;
        }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("Canvas context unavailable")); return; }
      ctx.drawImage(img, 0, 0, width, height);
      const compressed = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
      resolve(compressed);
    };
    img.onerror = () => reject(new Error("Failed to load image for compression"));
    img.src = dataUrl;
  });
}

const NO_FACE_TIPS = [
  { icon: "face", text: "Face looking directly at the camera" },
  { icon: "light_mode", text: "Good, even lighting on your face" },
  { icon: "person", text: "Only one person in the photo" },
  { icon: "crop_free", text: "Face fills most of the frame" },
  { icon: "visibility_off", text: "Remove sunglasses or hats" },
  { icon: "contrast", text: "Avoid heavy shadows on your face" },
];

export default function AnalysisPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [compressing, setCompressing] = useState(false);
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
    // Validate file size before processing
    if (selected.size > MAX_FILE_SIZE_BYTES) {
      setUploadError({ kind: "too_large", message: `Image is ${Math.round(selected.size / 1024 / 1024)}MB — please use a photo under ${MAX_FILE_SIZE_MB}MB.` });
      return;
    }

    // Validate file type
    if (!selected.type.startsWith("image/")) {
      setUploadError({ kind: "generic", message: "Please select an image file (JPEG, PNG, or WebP)." });
      return;
    }

    setFile(selected);
    setUploadError(null);
    setCompressing(true);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const rawDataUrl = e.target?.result as string;
      try {
        // Pre-compress for preview and storage
        const compressed = await compressImageDataUrl(rawDataUrl);
        setPreview(compressed);
      } catch {
        // Fallback to raw if compression fails (small images)
        setPreview(rawDataUrl);
      } finally {
        setCompressing(false);
      }
    };
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

  // Store pre-compressed image in sessionStorage, then navigate to /loading
  const handleAnalyze = async () => {
    if (!preview || submitting) return;
    setSubmitting(true);
    try {
      posthog.capture("analysis_started");
      sessionStorage.setItem(PENDING_IMAGE_KEY, preview);
      router.push("/loading");
    } catch (err) {
      setSubmitting(false);
      const message = err instanceof DOMException && err.name === "QuotaExceededError"
        ? "Image is too large even after compression. Please use a smaller photo."
        : err instanceof Error ? err.message : "Could not store image. Please try again.";
      setUploadError({ kind: "too_large", message });
    }
  };

  const hasFile = !!file;

  return (
    <RequireAuth>
      <div
        className="bg-[#fcf9f8] text-[#1b1c1b] min-h-screen flex flex-col items-center antialiased"
        style={{ fontFamily: "Inter, sans-serif" }}
      >
        {/* Background blobs */}
        <div className="fixed top-[-10%] right-[-5%] w-[40vw] h-[40vw] rounded-full bg-[#dde1ff]/20 blur-[120px] -z-10 pointer-events-none" />
        <div className="fixed bottom-[-10%] left-[-5%] w-[30vw] h-[30vw] rounded-full bg-[#fedbca]/20 blur-[100px] -z-10 pointer-events-none" />

        {/* Header */}
        <Navbar activePath="analysis" />

        {/* Main */}
        <main className="flex-grow flex items-center justify-center pt-24 md:pt-32 pb-28 md:pb-20 px-4 sm:px-6 w-full max-w-[1440px]">
          <div className="w-full flex flex-col items-center">
            {/* Header text */}
            <div className="text-center mb-6 md:mb-10">
              <span className="inline-block text-[10px] md:text-xs font-bold tracking-[0.2em] text-[#5a6060] uppercase mb-2 md:mb-3">
                AI ANALYSIS
              </span>
              <h1
                className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tighter text-[#1b1c1b] mb-3 md:mb-4"
                style={{ fontFamily: "Manrope, sans-serif" }}
              >
                Start Your Analysis
              </h1>
              <p className="text-base md:text-lg text-[#5a6060] max-w-md mx-auto leading-relaxed">
                Upload a clear portrait to get your personalized color analysis.
              </p>
            </div>

            {/* Error banner — face gate, size limit, or generic */}
            {uploadError && (
              <div
                role="alert"
                className="w-full max-w-[680px] rounded-2xl px-5 py-5 mb-5"
                style={{
                  background: uploadError.kind === "no_face" ? "#fff7ed" : uploadError.kind === "too_large" ? "#fef3c7" : "#fef2f2",
                  border: `1px solid ${uploadError.kind === "no_face" ? "#fdba74" : uploadError.kind === "too_large" ? "#fcd34d" : "#fecaca"}`,
                }}
              >
                <div className="flex gap-3 items-start">
                  <span
                    className="material-symbols-outlined flex-shrink-0 mt-0.5"
                    style={{ fontSize: 22, color: uploadError.kind === "no_face" ? "#c2410c" : uploadError.kind === "too_large" ? "#a16207" : "#b91c1c" }}
                  >
                    {uploadError.kind === "no_face" ? "face_retouching_off" : uploadError.kind === "too_large" ? "photo_size_select_large" : "error"}
                  </span>
                  <div className="flex-1">
                    <p
                      className="text-xs font-bold uppercase tracking-widest mb-1"
                      style={{ color: uploadError.kind === "no_face" ? "#9a3412" : uploadError.kind === "too_large" ? "#854d0e" : "#991b1b", fontFamily: "Space Grotesk, sans-serif", letterSpacing: "0.12em" }}
                    >
                      {uploadError.kind === "no_face" ? "We couldn't find a face" : uploadError.kind === "too_large" ? "Image too large" : "Analysis failed"}
                    </p>
                    <p className="text-sm leading-snug text-[#1b1c1b]">
                      {uploadError.kind === "no_face"
                        ? "Our AI needs a clear view of your face to analyze your skin tone. Try again with a photo that follows these guidelines:"
                        : uploadError.message}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setUploadError(null)}
                    className="text-stone-400 hover:text-[#1b1c1b] transition-colors flex-shrink-0"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
                  </button>
                </div>

                {/* Tips for no_face error */}
                {uploadError.kind === "no_face" && (
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 pl-9">
                    {NO_FACE_TIPS.map((tip) => (
                      <div key={tip.text} className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm text-[#c2410c]/70">{tip.icon}</span>
                        <span className="text-xs text-[#78350f] font-medium">{tip.text}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Upload card */}
            <div
              className="w-full max-w-[680px] bg-white rounded-2xl p-4 sm:p-6 mb-6 md:mb-8"
              style={{ boxShadow: "0px 12px 32px rgba(27,28,27,0.04)" }}
            >
              {/* Drop zone */}
              <div
                className="group relative flex flex-col items-center justify-center w-full min-h-[260px] sm:min-h-[340px] border-2 border-dashed rounded-xl cursor-pointer transition-all duration-300"
                style={{
                  borderColor: dragActive ? "#003ec7" : "#c4c5d7",
                  backgroundColor: dragActive ? "#f0f7ff" : "#fafafa",
                }}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => !hasFile && fileInputRef.current?.click()}
                role="button"
                aria-label="Upload image area. Click or drag and drop a portrait photo."
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); !hasFile && fileInputRef.current?.click(); }}}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                  aria-label="Select image file"
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
                    {compressing ? (
                      <p className="mt-2 text-[#002b92] font-medium text-sm flex items-center justify-center gap-1">
                        Optimizing image...
                        <span className="material-symbols-outlined text-sm" style={{ animation: "spin 1s linear infinite" }}>progress_activity</span>
                      </p>
                    ) : (
                      <p className="mt-2 text-green-600 font-medium text-sm flex items-center justify-center gap-1">
                        Looks good{" "}
                        <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
                      </p>
                    )}
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
                disabled={!hasFile || submitting || compressing}
                onClick={handleAnalyze}
                className="w-full md:w-auto min-w-[240px] px-12 py-4 rounded-full font-bold text-lg flex items-center justify-center gap-2 transition-all duration-200"
                style={
                  hasFile && !submitting && !compressing
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
        

        <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
      </div>
    </RequireAuth>
  );
}
