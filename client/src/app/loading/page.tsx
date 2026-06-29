"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import posthog from "posthog-js";
import { type AnalysisResultData } from "../components/result/types";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { AppIcon } from "@/components/ui/AppIcon";


const PENDING_IMAGE_KEY = "pending_image";
const ANALYSIS_RESULT_KEY = "analysis_result";
const LAST_ANALYSIS_KEY = "last_analysis";
const ANALYSIS_ERROR_KEY = "analysis_error";
const ANALYSIS_NOTICE_KEY = "analysis_notice";

type RgbTuple = [number, number, number];

type AnalysisNotice = {
  kind: "demo";
  message: string;
};

type FallbackResult = {
  skin_tone: string;
  undertone: string;
  season: string;
  confidence: number;
  rgb: RgbTuple;
  hex: string;
  best_colors: Array<{ name: string; hex: string }>;
  avoid_colors: Array<{ name: string; hex: string }>;
  outfits: Array<{
    title: string;
    description: string;
    colors: string[];
    occasion: string;
    category: "daily" | "casual" | "formal" | "party" | "summer" | "winter" | "minimal";
    season_suitability: string;
  }>;
  style_rules: string[];
  season_explanation: string;
  materials: Array<{ name: string; finish: "matte" | "sheen" | "glossy" | "textured" | "any"; note: string }>;
  accessories: Array<{ type: string; value: string; note: string }>;
};

function clampChannel(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function rgbToHex([r, g, b]: RgbTuple): string {
  return `#${[r, g, b]
    .map((channel) => clampChannel(channel).toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase()}`;
}

function shiftColor([r, g, b]: RgbTuple, delta: number): RgbTuple {
  return [clampChannel(r + delta), clampChannel(g + delta), clampChannel(b + delta)];
}

function detectUndertone([r, , b]: RgbTuple): "warm" | "cool" | "neutral" {
  if (r - b > 14) return "warm";
  if (b - r > 14) return "cool";
  return "neutral";
}

function detectSkinTone(luminance: number): string {
  if (luminance >= 200) return "Type I";
  if (luminance >= 170) return "Type II";
  if (luminance >= 140) return "Type III";
  if (luminance >= 110) return "Type IV";
  if (luminance >= 80) return "Type V";
  return "Type VI";
}

function detectSeason(undertone: "warm" | "cool" | "neutral", luminance: number): string {
  if (undertone === "warm") return luminance < 130 ? "Deep Autumn" : "Warm Spring";
  if (undertone === "cool") return luminance < 130 ? "Deep Winter" : "Cool Summer";
  return luminance < 130 ? "Soft Autumn" : "Soft Summer";
}

function buildBestColors(base: RgbTuple): Array<{ name: string; hex: string }> {
  return [
    { name: "Core", hex: rgbToHex(base) },
    { name: "Light", hex: rgbToHex(shiftColor(base, 24)) },
    { name: "Rich", hex: rgbToHex(shiftColor(base, -20)) },
    { name: "Deep", hex: rgbToHex(shiftColor(base, -40)) },
    { name: "Accent", hex: rgbToHex([clampChannel(base[0] + 8), clampChannel(base[1] - 6), clampChannel(base[2] + 16)]) },
  ];
}

function buildAvoidColors(base: RgbTuple): Array<{ name: string; hex: string }> {
  return [
    { name: "Washed Beige", hex: rgbToHex(shiftColor(base, 56)) },
    { name: "Muted Gray", hex: rgbToHex([clampChannel(base[0] - 28), clampChannel(base[1] - 10), clampChannel(base[2] - 10)]) },
    { name: "Neon Contrast", hex: "#C7FF00" },
  ];
}

function getAverageRgbFromDataUrl(dataUrl: string): Promise<RgbTuple> {
  return new Promise((resolve) => {
    const img = new (globalThis as any).Image() as HTMLImageElement;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const size = 24;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve([154, 121, 108]);
        return;
      }
      ctx.drawImage(img, 0, 0, size, size);
      const { data } = ctx.getImageData(0, 0, size, size);
      let totalR = 0;
      let totalG = 0;
      let totalB = 0;
      let count = 0;

      for (let i = 0; i < data.length; i += 4) {
        const alpha = data[i + 3];
        if (alpha < 16) continue;
        totalR += data[i];
        totalG += data[i + 1];
        totalB += data[i + 2];
        count += 1;
      }

      if (count === 0) {
        resolve([154, 121, 108]);
        return;
      }

      resolve([
        clampChannel(totalR / count),
        clampChannel(totalG / count),
        clampChannel(totalB / count),
      ]);
    };
    img.onerror = () => resolve([154, 121, 108]);
    img.src = dataUrl;
  });
}

async function buildFallbackResult(dataUrl: string): Promise<FallbackResult> {
  const rgb = await getAverageRgbFromDataUrl(dataUrl);
  const luminance = 0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2];
  const undertone = detectUndertone(rgb);
  const season = detectSeason(undertone, luminance);
  const skinTone = detectSkinTone(luminance);
  const bestColors = buildBestColors(rgb);
  const avoidColors = buildAvoidColors(rgb);

  return {
    skin_tone: skinTone,
    undertone,
    season,
    confidence: 68,
    rgb,
    hex: rgbToHex(rgb),
    best_colors: bestColors,
    avoid_colors: avoidColors,
    outfits: [
      {
        title: "Monochrome Layering",
        description: `Build your outfit around ${bestColors[0].hex} and add one deep tone for contrast.`,
        colors: [bestColors[0].hex, bestColors[2].hex, bestColors[3].hex],
        occasion: "Everyday",
        category: "casual",
        season_suitability: "All season",
      },
      {
        title: "Smart Casual Pairing",
        description: `Use ${bestColors[1].hex} in tops and anchor with ${bestColors[3].hex} in bottoms.`,
        colors: [bestColors[1].hex, bestColors[3].hex],
        occasion: "Work or brunch",
        category: "daily",
        season_suitability: "All season",
      },
      {
        title: "Evening Accent",
        description: `Keep base tones neutral and add ${bestColors[4].hex} as a single accent.`,
        colors: [bestColors[0].hex, bestColors[4].hex],
        occasion: "Evening",
        category: "party",
        season_suitability: "All season",
      },
    ],
    style_rules: [
      "Prefer medium contrast instead of stark black and white combinations.",
      "Repeat your strongest color family in at least two pieces.",
      "Use one accent color per look and keep the rest grounded.",
    ],
    season_explanation:
      "Preview generated on the client because backend analysis is currently unavailable.",
    materials: [
      { name: "Cotton twill", finish: "matte", note: "Reliable base texture for daily wear." },
      { name: "Wool blend", finish: "textured", note: "Adds depth without heavy shine." },
      { name: "Satin accents", finish: "sheen", note: "Use in small areas only." },
    ],
    accessories: [
      { type: "metal", value: undertone === "cool" ? "silver" : undertone === "warm" ? "gold" : "mixed metals", note: "Match your dominant undertone." },
      { type: "bag", value: bestColors[2].hex, note: "Choose one deep neutral for repeat use." },
      { type: "shoes", value: bestColors[3].hex, note: "Keep footwear in darker palette anchors." },
    ],
  };
}

// Progress-band → status message mapping
function getStatusMessage(progress: number): string {
  if (progress < 30) return "Detecting skin tone...";
  if (progress < 60) return "Analyzing undertones...";
  return "Generating palette...";
}

export default function LoadingPage() {
  const router = useRouter();
  const calledRef = useRef(false);

  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  // Safety timeout: If loading exceeds 60 seconds, show error state
  useEffect(() => {
    const fallbackTimeout = setTimeout(() => {
      console.warn("Safety timeout triggered: Analysis exceeded 60 seconds.");
      setError("This is taking longer than expected.");
    }, 60000);
    return () => clearTimeout(fallbackTimeout);
  }, []);

  // Make the API call once on mount
  useEffect(() => {
    if (calledRef.current) return;
    calledRef.current = true;

    async function runAnalysis() {
      const raw = sessionStorage.getItem(PENDING_IMAGE_KEY);
      if (!raw) {
        router.replace("/analysis");
        return;
      }

      const persistAndNavigate = (resultData: unknown, notice?: AnalysisNotice) => {
        posthog.capture("analysis_completed");
        sessionStorage.removeItem(PENDING_IMAGE_KEY);
        sessionStorage.setItem(ANALYSIS_RESULT_KEY, JSON.stringify(resultData));
        localStorage.setItem(LAST_ANALYSIS_KEY, JSON.stringify(resultData));
        if (notice) {
          sessionStorage.setItem(ANALYSIS_NOTICE_KEY, JSON.stringify(notice));
        } else {
          sessionStorage.removeItem(ANALYSIS_NOTICE_KEY);
        }
        setProgress(100);
        router.replace("/result");

      };

      const runClientFallback = async (message: string) => {

        setProgress(80);
        const fallbackResult = await buildFallbackResult(raw);
        persistAndNavigate(fallbackResult, { kind: "demo", message });
      };

      let timeoutId: ReturnType<typeof setTimeout> | null = null;
      try {

        setProgress(20);

        // Convert base64 data URL back to a File blob
        const splitRaw = raw.split(",");
        if (splitRaw.length < 2) throw new Error("Invalid image data");
        const meta = splitRaw[0];
        const b64 = splitRaw[1];

        const mime = meta.match(/:(.*?);/)?.[1] ?? "image/jpeg";
        const bytes = atob(b64);
        const arr = new Uint8Array(bytes.length);
        for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
        const blob = new Blob([arr], { type: mime });

        const formData = new FormData();
        formData.append("image", blob, "photo.jpg");

        const controller = new AbortController();
        timeoutId = setTimeout(() => controller.abort(), 40000);

        setProgress(40);
        const res = await apiFetch("/api/v1/analysis/upload", {
          method: "POST",
          body: formData,
          signal: controller.signal,
        });

        if (timeoutId) { clearTimeout(timeoutId); timeoutId = null; }


        setProgress(60);

        if (!res.ok) {
          if (res.status === 401) { router.push("/login"); return; }

          let errPayload = null;
          try { errPayload = await res.json(); } catch { errPayload = null; }

          const msg =
            errPayload?.message ||
            errPayload?.error ||
            (res.status === 500 && "Server error. Try again.") ||
            (res.status === 400 && "Invalid image. Try another.") ||
            "Analysis failed. Please try again.";

          console.warn("Backend error:", errPayload || res.status);

          // Face gate: redirect back to /analysis with the specific error
          if (res.status === 422 && typeof msg === "string" && /no face/i.test(msg)) {
            sessionStorage.setItem(ANALYSIS_ERROR_KEY, JSON.stringify({ kind: "no_face", message: msg }));
            router.replace("/analysis");
            return;
          }

          // Keep the flow usable when backend contract is changing or unavailable.
          if (res.status === 400) {
            setError(msg);
            return;
          }
          await runClientFallback("Service unavailable. Showing client-side preview.");
          return;
        }

        const ct = res.headers.get("content-type") || "";
        if (!ct.includes("application/json")) {
          await runClientFallback("Service unavailable. Showing client-side preview.");
          return;
        }

        setProgress(80);
        const payload = await res.json();
        if (!payload.success) {
          await runClientFallback("Service unavailable. Showing client-side preview.");
          return;
        }

        const resultData = payload.data ?? payload;

        persistAndNavigate(resultData);
      } catch (err: any) {
        if (timeoutId) clearTimeout(timeoutId);
        console.warn("Analysis caught error:", err);

        if (err instanceof DOMException && err.name === "AbortError") {
          await runClientFallback("Service unavailable. Showing client-side preview.");
          return;
        }
        if (err instanceof TypeError && /failed to fetch|networkerror|network error/i.test(err?.message || "")) {
          await runClientFallback("Service unavailable. Showing client-side preview.");
          return;
        }
        await runClientFallback("Analysis service unavailable. Showing client-side preview.");
      }
    }

    runAnalysis();
  }, [router]);

  if (error) {
    return (
      <div className="min-h-screen bg-[#fcf9f8] flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-6">
            <AppIcon name="error" size={30} className="text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-[#1b1c1b] mb-3" style={{ fontFamily: "Manrope, sans-serif" }}>
            Something went wrong
          </h2>
          <p className="text-[#5a6060] mb-8">{error}</p>
          <Link
            href="/analysis"
            className="inline-block px-8 py-3 rounded-full text-white font-semibold transition-transform hover:scale-[1.02] mb-4"
            style={{ background: "linear-gradient(135deg, #002b92 0%, #003ec7 100%)" }}
          >
            Retry Analysis
          </Link>
          <div className="block">
            <button
              onClick={() => router.back()}
              className="text-[#5a6060] font-semibold hover:text-[#1b1c1b] transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-[#fcf9f8] text-[#1b1c1b] antialiased"
      style={{ fontFamily: "Manrope, sans-serif" }}
    >
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 bg-[#fcf9f8]/80 backdrop-blur-xl flex justify-between items-center px-4 sm:px-8 py-4">
        <Link href="/" className="flex items-center gap-2.5">
          <img src="/logo.png" alt="StyleSense" className="w-8 h-8 object-contain" />
          <span className="text-xl font-bold tracking-tight text-[#1b1c1b]" style={{ fontFamily: "Manrope, sans-serif" }}>StyleSense</span>
        </Link>
        <div className="hidden md:flex items-center gap-8">
          <Link href="/discover" className="text-[#1b1c1b]/60 font-medium hover:text-[#002b92] transition-colors">Discover</Link>
          <span className="text-[#002b92] font-bold border-b-2 border-[#002b92] pb-1">Analysis</span>
          <Link href="/wardrobe" className="text-[#1b1c1b]/60 font-medium hover:text-[#002b92] transition-colors">Wardrobe</Link>
          <Link href="/history" className="text-[#1b1c1b]/60 font-medium hover:text-[#002b92] transition-colors">History</Link>
          <Link href="/settings" className="text-[#1b1c1b]/60 font-medium hover:text-[#002b92] transition-colors">Settings</Link>
        </div>
        <div className="flex items-center gap-4">
          <button className="text-[#5a6060] hover:text-[#002b92] transition-all p-2 rounded-full hover:bg-[#f0edec]" aria-label="Notifications">
            <AppIcon name="inbox" size={20} />
          </button>
        </div>
      </nav>

      <main className="pt-24 sm:pt-32 pb-24 min-h-screen px-4 sm:px-6 max-w-7xl mx-auto flex flex-col items-center">
        {/* Progress stepper */}
        <div className="w-full max-w-2xl mb-16 px-4">
          <div className="flex justify-between items-center relative">
            {/* Track */}
            <div className="absolute top-5 left-0 w-full h-[1px] bg-[#c3c5d9]/30 -z-10" />
            <div className="absolute top-5 left-0 w-1/2 h-[1px] bg-[#002b92] -z-10" />

            {/* Step 1: Upload (done) */}
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#002b92] flex items-center justify-center text-white shadow-lg">
                <AppIcon name="check" size={14} />
              </div>
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#002b92] font-bold">Upload</span>
            </div>

            {/* Step 2: Analyze (active) */}
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#dde1ff] flex items-center justify-center text-[#002b92] relative">
                <div
                  className="absolute inset-0 rounded-full border-2 border-[#002b92]"
                  style={{ animation: "avatar-pulse 3s cubic-bezier(0.4,0,0.6,1) infinite" }}
                />
                <AppIcon name="progress_activity" size={14} />
              </div>
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#002b92] font-bold">Analyze</span>
            </div>

            {/* Step 3: Results */}
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#f0edec] flex items-center justify-center text-[#5a6060]/40">
                <AppIcon name="auto_awesome" size={14} />
              </div>
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#5a6060]/40 font-medium">Results</span>
            </div>
          </div>
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 w-full items-center">
          {/* Sidebar */}
          <div className="lg:col-span-5 xl:col-span-4 flex flex-col justify-center order-2 lg:order-1 max-w-sm">
            <div className="inline-flex px-3 py-1 bg-[#dde1ff] rounded-full mb-6 w-fit">
              <span className="text-[10px] uppercase tracking-widest text-[#001452] font-bold">AI Processing</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tighter text-[#1b1c1b] leading-[1.1] mb-2">
              Perfecting Your <br />
              <span className="text-[#002b92]">Color Story</span>
            </h1>
            <p className="text-[#002b92] text-xs uppercase tracking-widest font-bold mb-6">
              Analyzing your features in real time
            </p>
            <p className="text-[#5a6060] text-lg leading-relaxed mb-10">
              Our neural networks are mapping your unique characteristics to curate an editorial-grade palette specifically for you.
            </p>
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 rounded-lg bg-[#f6f3f2] border border-[#c3c5d9]/10">
                <AppIcon name="face" className="text-[#002b92]" />
                <span className="text-xs uppercase tracking-wider font-semibold">
                  Skin Tone Analysis:{" "}
                  <span className="text-[#002b92] animate-pulse">In Progress</span>
                </span>
              </div>
              <div className="flex items-center gap-4 p-4 rounded-lg bg-[#f6f3f2] border border-[#c3c5d9]/10">
                <AppIcon name="palette" className="text-[#5a6060]/40" />
                <span className="text-xs uppercase tracking-wider font-semibold text-[#5a6060]/40">
                  Pattern Recognition: <span>Queued</span>
                </span>
              </div>
            </div>
          </div>

          {/* Center: Processing card */}
          <div className="lg:col-span-7 xl:col-span-8 flex items-center justify-center order-1 lg:order-2">
            <div
              className="w-full max-w-2xl rounded-[2rem] md:rounded-[2.5rem] bg-white p-6 sm:p-8 md:p-12 flex flex-col items-center justify-center relative overflow-hidden border border-[#c3c5d9]/20"
              style={{ boxShadow: "0 40px 60px -20px rgba(28,27,27,0.05)" }}
            >
              {/* Decorative blobs */}
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#dde1ff]/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-[#dbe1ff]/10 rounded-full blur-3xl pointer-events-none" />
              {/* Shimmer sweep */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.4) 50%, rgba(255,255,255,0) 100%)",
                  animation: "shimmer 4s infinite",
                }}
              />

              <div className="relative flex flex-col items-center w-full max-w-md">
                {/* Pulsing circle placeholder (no user photo available) */}
                <div className="relative w-40 h-40 sm:w-48 sm:h-48 md:w-56 md:h-56 mb-8 md:mb-12 flex items-center justify-center">
                  <div
                    className="absolute -inset-4 rounded-full border border-[#002b92]/20"
                    style={{ animation: "avatar-pulse 3s cubic-bezier(0.4,0,0.6,1) infinite" }}
                  />
                  <div
                    className="absolute -inset-8 rounded-full border border-[#002b92]/10"
                    style={{ animation: "avatar-pulse 3s cubic-bezier(0.4,0,0.6,1) infinite", animationDelay: "1.5s" }}
                  />
                  <div className="absolute inset-0 border border-[#c3c5d9]/20 rounded-full" />
                  <div className="absolute inset-4 rounded-full overflow-hidden border-4 border-white shadow-xl bg-[#f0edec] flex items-center justify-center">
                    <AppIcon name="progress_activity" className="text-[#002b92]" />
                  </div>
                </div>

                {/* Progress */}
                <div className="w-full text-center space-y-6">
                  <div className="space-y-4">
                    <div className="relative pt-1">
                      <div className="flex mb-3 items-center justify-between">
                        <span className="text-[10px] font-bold py-1 px-2 uppercase rounded-full text-[#001452] bg-[#dde1ff]">
                          Live Processing
                        </span>
                        <span className="text-xs font-bold text-[#002b92] tracking-widest">
                          {Math.round(progress)}%
                        </span>
                      </div>
                      {/* Progress bar */}
                      <div className="w-full h-[6px] bg-[#002b92]/8 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full relative transition-all duration-500"
                          style={{
                            width: `${progress}%`,
                            background: "linear-gradient(90deg, #002b92, #003ec7)",
                          }}
                        >
                          {/* Striped overlay */}
                          <div
                            className="absolute inset-0 rounded-full"
                            style={{
                              backgroundImage: "linear-gradient(-45deg, rgba(255,255,255,.2) 25%, transparent 25%, transparent 50%, rgba(255,255,255,.2) 50%, rgba(255,255,255,.2) 75%, transparent 75%, transparent)",
                              backgroundSize: "50px 50px",
                              animation: "move-stripes 2s linear infinite",
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Status message — derived from progress band */}
                    <div className="h-6 relative overflow-hidden">
                      <p className="absolute inset-0 text-[#5a6060] text-[11px] uppercase tracking-[0.3em] text-center transition-all duration-500">
                        {getStatusMessage(progress)}
                      </p>
                    </div>
                    <p className="text-[#5a6060]/40 text-[9px] uppercase tracking-[0.2em] italic animate-pulse">
                      ~5 seconds remaining
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature grid */}
        <div className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
          {[
            { icon: "fingerprint", title: "Precision Matching", body: "Our AI detects over 4,000 unique skin undertones to ensure perfect coordination." },
            { icon: "style", title: "Curated Wardrobe", body: "Automated styling suggestions based on current editorial trends and your base profile." },
            { icon: "insights", title: "Dynamic Learning", body: "The engine evolves as you upload more photos, refining your personal style profile." },
          ].map((f) => (
            <div key={f.title} className="p-8 rounded-lg bg-[#f6f3f2]/50 flex flex-col gap-4 border border-[#c3c5d9]/5">
              <AppIcon name={f.icon} size={30} className="text-[#002b92]" />
              <h3 className="font-bold text-xl">{f.title}</h3>
              <p className="text-[#5a6060] text-sm leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="bg-[#f6f3f2] w-full py-12 flex flex-col md:flex-row justify-between items-center px-4 sm:px-8 md:px-12 gap-6 border-t border-[#c3c5d9]/10">
        <div className="flex items-center gap-2 text-xs font-bold text-[#002b92]">
          <img src="/logo.png" alt="StyleSense" className="w-5 h-5 object-contain" />
          StyleSense
        </div>
        <div className="text-[10px] uppercase tracking-widest text-[#1b1c1b]/40">
          © 2026 StyleSense. All rights reserved.
        </div>
        <div className="flex gap-8">
          {["Terms", "Privacy", "Support"].map((l) => (
            <a key={l} href="#" className="text-[10px] uppercase tracking-widest text-[#1b1c1b]/40 hover:text-[#002b92] transition-colors">
              {l}
            </a>
          ))}
        </div>
      </footer>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes avatar-pulse {
          0%   { transform: scale(1);    opacity: 0.8; box-shadow: 0 0 0 0 rgba(0,43,146,0.4); }
          70%  { transform: scale(1.05); opacity: 0.4; box-shadow: 0 0 0 20px rgba(0,43,146,0); }
          100% { transform: scale(1);    opacity: 0.8; box-shadow: 0 0 0 0 rgba(0,43,146,0); }
        }
        @keyframes shimmer {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes move-stripes {
          0%   { background-position: 0 0; }
          100% { background-position: 50px 50px; }
        }
      `}</style>
    </div>
  );
}
