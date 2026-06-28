"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import Navbar from "@/app/components/Navbar";
import type { AnalysisResultData } from "./types";
import { getRecommendedOutfits } from "@/lib/outfit-recommendation";
import { revealContainer, revealItem, toastVariants } from "@/lib/motion";

// ─── constants ────────────────────────────────────────────────────────────────

const SKIN_DEPTH: Record<string, string> = {
  I: "Very Fair", II: "Fair", III: "Medium", IV: "Olive", V: "Brown", VI: "Deep",
};

// ─── helpers ──────────────────────────────────────────────────────────────────

function fitzFromSkinTone(skinTone: string): string {
  return skinTone.replace(/^type\s+/i, "").trim() || "?";
}

// ─── sub-components ───────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-primary font-[family-name:var(--font-label)] mb-4">
      {children}
    </p>
  );
}

function ResultCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-2xl p-5 md:p-6 border border-black/[0.04] shadow-[0_8px_32px_-8px_rgba(0,0,0,0.05)] ${className}`}>
      {children}
    </div>
  );
}

function ConfidenceBadge({ confidence }: { confidence: number }) {
  const isHigh = confidence > 70;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold font-[family-name:var(--font-label)] tracking-wide ${
        isHigh ? "bg-green-50 text-green-700 border border-green-200" : "bg-amber-50 text-amber-700 border border-amber-200"
      }`}
    >
      <span className="material-symbols-outlined text-[13px]">{isHigh ? "verified" : "info"}</span>
      {confidence}% Confidence
    </span>
  );
}

// ─── main component ────────────────────────────────────────────────────────────

type Props = { data: AnalysisResultData; onRetry: () => void };

export default function AnalysisResultView({ data, onRetry }: Props) {
  const router = useRouter();
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setToastMessage(`Copied ${text}`);
    setTimeout(() => setToastMessage(null), 2000);
  };

  const fitzType = fitzFromSkinTone(data.skin_tone || "");
  const season = data.season || "Unknown";
  const undertone = data.undertone || "Unknown";
  const userFriendlySkinType = `${SKIN_DEPTH[fitzType] || "Medium"} ${undertone.charAt(0).toUpperCase() + undertone.slice(1)} Skin`;
  const hex = data.hex || "#9A796C";
  const seasonExplanation = data.season_explanation || "";

  const rawConf = Number(data.confidence);
  const confidence = rawConf > 0 && rawConf <= 1 ? Math.round(rawConf * 100) : Math.max(0, Math.min(100, Math.round(rawConf || 85)));

  const recommendedOutfits = useMemo(() => getRecommendedOutfits(data, 6), [data]);

  const bestColors = data.best_colors || [];
  const avoidColors = data.avoid_colors || [];
  const styleRules = data.style_rules || [];
  const materials = data.materials || [];
  const accessories = data.accessories || [];
  const signatureColors = data.signature_colors || bestColors.slice(0, 3).map(c => ({ name: c.name || "", hex: c.hex, reason: c.why || "Complements your complexion." }));
  const skinDescription = data.skin_description || "";
  const nextSteps = data.next_steps || [];
  const confidenceReason = data.confidence_reason;

  return (
    <div className="min-h-screen bg-surface antialiased">
      {/* Toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            variants={toastVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] bg-inverse-surface text-inverse-on-surface px-5 py-3 rounded-full text-sm font-bold shadow-xl flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[16px]">check_circle</span>
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Nav */}
      <Navbar activePath="analysis" />

      <motion.main
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        className="relative pt-24 md:pt-28 pb-20 md:pb-24"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Page header */}
          <div className="text-center mb-10 md:mb-12">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/[0.06] text-primary text-[11px] font-bold tracking-[0.15em] uppercase font-[family-name:var(--font-label)] mb-4">
              <span className="material-symbols-outlined text-[13px]">auto_awesome</span>
              Your Personal Style Profile
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tighter text-on-surface font-[family-name:var(--font-headline)]">
              Your Color Profile
            </h1>
            {seasonExplanation && (
              <p className="mt-3 text-base text-on-surface-variant max-w-xl mx-auto leading-relaxed">
                {seasonExplanation}
              </p>
            )}
          </div>

          {/* Main Layout: sidebar + content */}
          <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6">

            {/* LEFT — Identity Card (sticky on desktop) */}
            <div className="lg:sticky lg:top-24 lg:self-start">
              <ResultCard className="space-y-5">
                {/* Season + Swatch */}
                <div className="flex gap-4 items-start">
                  <div
                    className="w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-2xl shrink-0 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.1)]"
                    style={{ background: hex }}
                  />
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-outline font-[family-name:var(--font-label)]">
                      Your Color Season
                    </p>
                    <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-primary font-[family-name:var(--font-headline)] mt-1">
                      {season}
                    </h2>
                    <div className="mt-2">
                      <ConfidenceBadge confidence={confidence} />
                    </div>
                  </div>
                </div>

                {/* Skin profile */}
                <div className="bg-surface-container-low rounded-xl p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-outline font-[family-name:var(--font-label)]">
                    Skin Profile
                  </p>
                  <p className="text-xl font-extrabold text-primary tracking-tight mt-1 font-[family-name:var(--font-headline)]">
                    {userFriendlySkinType}
                  </p>
                </div>

                {/* Confidence breakdown */}
                {confidenceReason && (
                  <div className="bg-surface-container-low rounded-xl p-4 space-y-3">
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-outline font-[family-name:var(--font-label)]">
                      AI Confidence Breakdown
                    </p>
                    {[
                      { icon: "palette", label: "Undertone", level: confidenceReason.undertone },
                      { icon: "contrast", label: "Contrast", level: confidenceReason.contrast },
                      { icon: "light_mode", label: "Brightness", level: confidenceReason.brightness },
                      { icon: "face", label: "Harmony", level: confidenceReason.facial_harmony },
                    ].map((item, idx) => {
                      const bars = item.level === "high" ? 5 : item.level === "medium" ? 3 : 1;
                      return (
                        <div key={idx} className="flex justify-between items-center">
                          <span className="text-xs font-semibold text-on-surface-variant flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[14px]">{item.icon}</span>
                            {item.label}
                          </span>
                          <div className="flex gap-1">
                            {[1,2,3,4,5].map(i => (
                              <div key={i} className={`w-3 h-1 rounded-full ${i <= bars ? "bg-primary" : "bg-surface-container-highest"}`} />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Quick actions */}
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button
                    onClick={() => router.push("/wardrobe")}
                    className="h-10 rounded-xl bg-surface-container-low text-primary text-xs font-bold hover:bg-surface-container transition-colors"
                  >
                    Wardrobe
                  </button>
                  <button
                    onClick={() => router.push("/discover")}
                    className="h-10 rounded-xl bg-surface-container-low text-primary text-xs font-bold hover:bg-surface-container transition-colors"
                  >
                    Discover
                  </button>
                </div>

                {/* Season explanation toggle */}
                {seasonExplanation && (
                  <div className="border-t border-surface-container pt-4">
                    <button
                      onClick={() => setShowExplanation(!showExplanation)}
                      className="w-full flex justify-between items-center text-left"
                    >
                      <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-primary font-[family-name:var(--font-label)]">
                        Why this season?
                      </span>
                      <span className={`material-symbols-outlined text-[16px] text-primary transition-transform ${showExplanation ? "rotate-180" : ""}`}>
                        expand_more
                      </span>
                    </button>
                    <AnimatePresence>
                      {showExplanation && (
                        <motion.p
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="text-sm text-on-surface-variant leading-relaxed mt-3 overflow-hidden"
                        >
                          {seasonExplanation}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </ResultCard>
            </div>

            {/* RIGHT — Content sections */}
            <motion.div
              className="space-y-5"
              variants={revealContainer}
              initial="initial"
              animate="animate"
            >

              {/* Signature Colors */}
              {signatureColors.length > 0 && (
                <motion.div variants={revealItem}>
                <ResultCard>
                  <SectionLabel>Your 3 Signature Colors</SectionLabel>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {signatureColors.map((c, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-surface-container-low border border-black/[0.03]">
                        <div className="w-11 h-11 rounded-xl shrink-0 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.08)]" style={{ background: c.hex }} />
                        <div className="min-w-0">
                          <span className="block text-sm font-bold text-on-surface truncate">{c.name}</span>
                          <span className="block text-[10px] text-outline font-[family-name:var(--font-label)] mt-0.5">{c.hex.toUpperCase()}</span>
                          <span className="block text-[10px] text-on-surface-variant mt-1 leading-tight line-clamp-2">{c.reason}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </ResultCard>
                </motion.div>
              )}

              {/* Best Colors + Avoid Colors */}
              <motion.div variants={revealItem} className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr] gap-5">
                {/* Best colors */}
                <ResultCard>
                  <div className="flex justify-between items-baseline mb-4">
                    <SectionLabel>Your Best Colors</SectionLabel>
                    <span className="text-xs text-outline">{bestColors.length}</span>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {bestColors.map((c, i) => (
                      <button
                        key={i}
                        title={`Click to copy ${c.hex}`}
                        onClick={() => handleCopy(c.hex)}
                        className="flex flex-col items-center gap-2 group cursor-pointer"
                      >
                        <div
                          className="w-full aspect-square rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.08)] group-hover:scale-105 transition-transform"
                          style={{ background: c.hex }}
                        />
                        {c.name && <span className="text-[10px] font-bold text-on-surface text-center leading-tight truncate w-full">{c.name}</span>}
                        <span className="text-[9px] text-outline font-[family-name:var(--font-label)]">{c.hex.toUpperCase()}</span>
                      </button>
                    ))}
                    {bestColors.length === 0 && <p className="text-sm text-outline col-span-full">No color data available</p>}
                  </div>
                </ResultCard>

                {/* Avoid colors */}
                <ResultCard>
                  <div className="flex justify-between items-baseline mb-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-error font-[family-name:var(--font-label)]">
                      Colors to Avoid
                    </p>
                    <span className="text-xs text-outline">{avoidColors.length}</span>
                  </div>
                  <div className="space-y-3">
                    {avoidColors.map((c, i) => (
                      <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl bg-surface-container-low border border-black/[0.03]">
                        <div className="w-8 h-8 rounded-lg shrink-0 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.08)]" style={{ background: c.hex }} />
                        <div className="min-w-0 flex-1">
                          {c.name && <span className="block text-xs font-bold text-on-surface truncate">{c.name}</span>}
                          <span className="block text-[10px] text-outline">{c.reason || "Clashes with undertone"}</span>
                        </div>
                        <span className="material-symbols-outlined text-[16px] text-error/60">warning</span>
                      </div>
                    ))}
                    {avoidColors.length === 0 && <p className="text-sm text-outline">No data available</p>}
                  </div>
                </ResultCard>
              </motion.div>

              {/* Style Rules */}
              {styleRules.length > 0 && (
                <motion.div variants={revealItem}>
                <ResultCard>
                  <SectionLabel>High-Impact Guidance</SectionLabel>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {styleRules.map((rule, i) => {
                      const isAvoid = /avoid|do not|instead/i.test(rule);
                      return (
                        <div
                          key={i}
                          className={`flex gap-3 items-start p-4 rounded-xl border ${
                            isAvoid ? "bg-red-50/50 border-red-100" : "bg-blue-50/30 border-blue-100"
                          }`}
                        >
                          <span className={`material-symbols-outlined text-[18px] shrink-0 mt-0.5 ${isAvoid ? "text-error" : "text-primary"}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                            {isAvoid ? "cancel" : "check_circle"}
                          </span>
                          <span className="text-sm text-on-surface leading-relaxed">{rule}</span>
                        </div>
                      );
                    })}
                  </div>
                </ResultCard>
                </motion.div>
              )}

              {/* Materials + Accessories */}
              <motion.div variants={revealItem} className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {materials.length > 0 && (
                  <ResultCard>
                    <SectionLabel>Best Fabrics & Materials</SectionLabel>
                    <div className="flex flex-wrap gap-2">
                      {materials.map((m, i) => (
                        <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-low border border-black/[0.04] text-xs font-semibold text-on-surface">
                          {m.name}
                          {m.finish && m.finish !== "any" && (
                            <span className="text-[9px] text-outline uppercase tracking-wide bg-surface-container-highest px-1.5 py-0.5 rounded">
                              {m.finish}
                            </span>
                          )}
                        </span>
                      ))}
                    </div>
                  </ResultCard>
                )}

                {accessories.length > 0 && (
                  <ResultCard>
                    <SectionLabel>Finishing Palette</SectionLabel>
                    <div className="space-y-3">
                      {accessories.map((a, i) => (
                        <div key={i} className="flex justify-between items-center pb-3 border-b border-surface-container last:border-0 last:pb-0">
                          <span className="text-[10px] text-outline uppercase tracking-[0.1em] font-bold font-[family-name:var(--font-label)]">
                            {a.type || "Accessory"}
                          </span>
                          <span className="text-sm font-semibold text-on-surface">{a.value || "—"}</span>
                        </div>
                      ))}
                    </div>
                  </ResultCard>
                )}
              </motion.div>

              {/* Recommended Outfits from Discover */}
              <motion.div variants={revealItem}>
              <ResultCard>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <SectionLabel>Recommended Looks</SectionLabel>
                    <p className="text-sm text-on-surface-variant -mt-2">
                      {recommendedOutfits.length} outfits matched to your {season} profile
                    </p>
                  </div>
                  <button
                    onClick={() => router.push("/discover")}
                    className="text-[11px] font-bold uppercase tracking-[0.1em] text-primary font-[family-name:var(--font-label)] hover:underline"
                  >
                    View All →
                  </button>
                </div>

                {recommendedOutfits.length === 0 ? (
                  <div className="flex flex-col items-center py-12 text-center">
                    <span className="material-symbols-outlined text-surface-dim text-[32px]">checkroom</span>
                    <p className="text-sm text-outline mt-2">No outfit matches found</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {recommendedOutfits.map((rec, i) => (
                      <div
                        key={rec.outfit.outfit_id}
                        onClick={() => router.push(`/outfit/${rec.outfit.outfit_id}`)}
                        className="relative rounded-xl overflow-hidden cursor-pointer aspect-[3/4] bg-surface-container group"
                      >
                        <img
                          src={rec.outfit.imageUrl}
                          alt={`Look ${i + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading={i < 3 ? "eager" : "lazy"}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                        {/* Match badge */}
                        <span className="absolute top-2 left-2 bg-primary text-white text-[9px] font-bold px-2 py-1 rounded-md">
                          {rec.score}% Match
                        </span>
                        {/* Bottom info */}
                        <div className="absolute bottom-2 left-2 right-2">
                          <p className="text-[10px] text-white/70 uppercase tracking-wider font-bold">Look {i + 1}</p>
                          <p className="text-[10px] text-white/85 leading-tight mt-0.5 line-clamp-2">{rec.reason}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ResultCard>
              </motion.div>

              {/* Skin Description + Next Steps */}
              {(skinDescription || nextSteps.length > 0) && (
                <motion.div variants={revealItem} className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {skinDescription && (
                    <ResultCard>
                      <SectionLabel>About Your Skin</SectionLabel>
                      <p className="text-sm text-on-surface-variant leading-relaxed">{skinDescription}</p>
                    </ResultCard>
                  )}
                  {nextSteps.length > 0 && (
                    <ResultCard>
                      <SectionLabel>Next Steps</SectionLabel>
                      <div className="space-y-3">
                        {nextSteps.map((step, i) => (
                          <div key={i} className="flex gap-3 items-start">
                            <span className="w-5 h-5 rounded-full bg-primary-fixed text-primary text-[10px] font-extrabold flex items-center justify-center shrink-0 mt-0.5">
                              {i + 1}
                            </span>
                            <span className="text-sm text-on-surface leading-relaxed">{step}</span>
                          </div>
                        ))}
                      </div>
                    </ResultCard>
                  )}
                </motion.div>
              )}

              {/* Footer CTA */}
              <motion.div variants={revealItem} className="text-center pt-6 space-y-4">
                <p className="text-sm text-on-surface-variant">
                  Your color profile has been applied to {recommendedOutfits.length > 0 ? recommendedOutfits.length : "curated"} outfit combinations.
                </p>
                <button
                  onClick={() => router.push("/discover")}
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-full signature-gradient text-white font-bold text-base shadow-[0_10px_25px_rgba(0,43,146,0.25)] hover:scale-[1.02] active:scale-[0.98] transition-transform"
                >
                  Explore Outfits For My Colors
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </button>
                <div>
                  <button
                    onClick={onRetry}
                    className="text-sm text-outline hover:text-on-surface underline underline-offset-4 transition-colors"
                  >
                    Run a new analysis
                  </button>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </motion.main>
    </div>
  );
}
