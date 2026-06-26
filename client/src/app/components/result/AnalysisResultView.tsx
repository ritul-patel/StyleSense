"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useMemo } from "react";
import type { AnalysisResultData, MaterialItem, AccessoryItem, OutfitItem, PaletteItem, AvoidColorItem } from "./types";
import { getRecommendedOutfits, type RecommendedOutfit } from "@/lib/outfit-recommendation";
import RequireAuth from "../RequireAuth";

// ─── constants ────────────────────────────────────────────────────────────────

const SKIN_DEPTH: Record<string, string> = {
  I: "Very Fair",
  II: "Fair",
  III: "Medium",
  IV: "Olive",
  V: "Brown",
  VI: "Deep",
};

// ─── helpers ──────────────────────────────────────────────────────────────────

function fitzFromSkinTone(skinTone: string): string {
  return skinTone.replace(/^type\s+/i, "").trim() || "?";
}

function materialLabel(m: MaterialItem): { label: string; finish?: string; note?: string } {
  const label = m.name || "—";
  const finish = m.finish && m.finish !== "any" ? m.finish : undefined;
  return { label, finish, note: m.note };
}

function accessoryLabel(a: AccessoryItem): { label: string; kind?: string; note?: string } {
  const label = a.value || a.type || "—";
  const kind = a.type && a.value ? a.type : undefined;
  return { label, kind, note: a.note };
}

function outfitCard(o: OutfitItem, i: number): OutfitItem {
  return { ...o, title: o.title || `Look ${i + 1}` };
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
  const userFriendlySkinType = `${SKIN_DEPTH[fitzType] || "Medium"} ${undertone.charAt(0).toUpperCase() + undertone.slice(1) || "Neutral"} Skin`;
  const hex = data.hex || "#9A796C";
  const seasonExplanation = data.season_explanation || "";
  
  const rawConf = Number(data.confidence);
  const confidence = rawConf > 0 && rawConf <= 1 ? Math.round(rawConf * 100) : Math.max(0, Math.min(100, Math.round(rawConf || 85)));
  const analysisDate = useMemo(() => new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date()), []);

  // Recommended outfits from Discover catalog
  const recommendedOutfits = useMemo(() => getRecommendedOutfits(data, 6), [data]);

  const bestColors = data.best_colors || [];
  const avoidColors = data.avoid_colors || [];
  const outfits = (data.outfits || []).map((o, i) => outfitCard(o, i));
  const styleRules = data.style_rules || [];
  const materials = data.materials || [];
  const accessories = data.accessories || [];
  const signatureColors = data.signature_colors || bestColors.slice(0, 3).map(c => ({ name: c.name || "", hex: c.hex, reason: c.why || "Complements your complexion." }));
  const skinDescription = data.skin_description || "";
  const nextSteps = data.next_steps || [];
  const confidenceReason = data.confidence_reason;

  const miniDots = bestColors.slice(0, 6);
  const mainOutfit = outfits[0] ?? null;

  return (
    <div style={{ background: "#fcf9f8", minHeight: "100vh", fontFamily: "'Inter', sans-serif", color: "#1b1c1b" }}>
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{
              position: "fixed", bottom: 40, left: "50%", transform: "translateX(-50%)", zIndex: 100,
              background: "#1b1c1b", color: "#fff", padding: "12px 24px", borderRadius: 9999,
              fontFamily: "'Space Grotesk', sans-serif", fontSize: "0.8rem", fontWeight: 700, letterSpacing: "0.05em",
              boxShadow: "0 10px 30px rgba(0,0,0,0.15)", display: "flex", alignItems: "center", gap: 8
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>check_circle</span>
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ambient blobs */}
      <div style={{ position: "fixed", top: "-10%", right: "-5%", width: "40vw", height: "40vw", borderRadius: "50%", background: "rgba(221,225,255,0.2)", filter: "blur(100px)", pointerEvents: "none", zIndex: 0 }} />
      <div style={{ position: "fixed", bottom: "-10%", left: "-5%", width: "30vw", height: "30vw", borderRadius: "50%", background: "rgba(254,219,202,0.15)", filter: "blur(90px)", pointerEvents: "none", zIndex: 0 }} />

      {/* Nav */}
      <header className="bg-[#fcf9f8]/70 backdrop-blur-xl fixed top-0 left-0 right-0 z-50 border-b border-black/5">
        <div className="flex justify-between items-center px-8 h-20 w-full max-w-screen-2xl mx-auto">
          <Link href="/" className="text-2xl font-black tracking-tighter text-[#002b92]" style={{ fontFamily: "Manrope, sans-serif" }}>
            StyleSense
          </Link>
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/discover" className="text-stone-400 font-medium hover:text-[#002b92] transition-colors">Discover</Link>
            <span className="text-[#002b92] font-bold border-b-2 border-[#002b92]">Analysis</span>
            <Link href="/wardrobe" className="text-stone-400 font-medium hover:text-[#002b92] transition-colors">Wardrobe</Link>
            <Link href="/history" className="text-stone-400 font-medium hover:text-[#002b92] transition-colors">History</Link>
          </nav>
          <div className="flex items-center gap-4">
            <span className="material-symbols-outlined text-[#1b1c1b] hover:text-[#002b92] transition-colors cursor-pointer">account_circle</span>
          </div>
        </div>
      </header>

      <motion.main
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        style={{ position: "relative", zIndex: 1, paddingTop: 112, paddingBottom: 80 }}
      >
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "0 6%" }}>

          {/* Page header */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            style={{ textAlign: "center", marginBottom: 48 }}
          >
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "4px 12px", borderRadius: 9999,
              background: "rgba(0,62,199,0.08)", color: "#003ec7",
              fontFamily: "'Space Grotesk', sans-serif", fontSize: "0.6875rem",
              fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase",
              marginBottom: 16,
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: 13 }}>auto_awesome</span>
              Your Personal Style Profile
            </span>
            <h1 style={{
              fontFamily: "'Manrope', sans-serif",
              fontSize: "clamp(2rem,4vw,3.4rem)",
              fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1.05,
              margin: "12px 0 14px",
            }}>
              Your Color Profile
            </h1>
            {seasonExplanation && (
              <p style={{ fontSize: "1.05rem", color: "#434654", lineHeight: 1.65, maxWidth: 620, margin: "0 auto" }}>
                {seasonExplanation}
              </p>
            )}
          </motion.div>

          {/* Two-column layout */}
          <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: 24, alignItems: "start" }}>

            {/* LEFT — Identity */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              style={{ background: "#fff", borderRadius: 20, padding: 28, boxShadow: "0 16px 40px rgba(16,24,40,0.05), 0 2px 10px rgba(16,24,40,0.03)", border: "1px solid rgba(16,24,40,0.06)", position: "sticky", top: 104 }}
            >
              {/* Swatch + season name + mini dots */}
              <div style={{ display: "flex", gap: 18, alignItems: "flex-start" }}>
                <div style={{
                  width: 76, height: 76, borderRadius: 14, background: hex, flexShrink: 0,
                  boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.12)",
                }} />
                <div style={{ minWidth: 0, width: "100%" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "0.6rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#747686", marginBottom: 6 }}>
                      Your Best Color Season
                    </p>
                    <span style={{ fontSize: "0.65rem", color: "#a0a0b8", fontWeight: 500 }} title="Analysis Date">{analysisDate}</span>
                  </div>
                  <h2 style={{ fontFamily: "'Manrope', sans-serif", fontSize: "1.9rem", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.05, color: "#002b92" }}>
                    {season}
                  </h2>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, background: confidence > 70 ? "rgba(19,115,51,0.06)" : "rgba(176,96,0,0.06)", border: `1px solid ${confidence > 70 ? "rgba(19,115,51,0.15)" : "rgba(176,96,0,0.15)"}`, padding: "6px 12px", borderRadius: 999, color: confidence > 70 ? "#137333" : "#b06000", fontSize: "0.7rem", fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif", letterSpacing: "0.05em", cursor: "help" }} title="Confidence is calculated from skin undertone, facial contrast, brightness, and color harmony analysis.">
                      <span className="material-symbols-outlined" style={{ fontSize: 13 }}>{confidence > 70 ? 'verified' : 'info'}</span>
                      {confidence > 70 ? `High Confidence • ${confidence}%` : `Confidence • ${confidence}%`}
                    </div>
                    <div style={{ display: "flex", gap: 4 }}>
                      {miniDots.slice(0, 4).map((c, i) => (
                        <span key={i} title={c.name} style={{ width: 10, height: 10, borderRadius: "50%", background: c.hex, display: "inline-block", boxShadow: "0 1px 4px rgba(0,0,0,0.18)" }} />
                      ))}
                    </div>
                  </div>
                  <p style={{ fontSize: "0.65rem", color: "#747686", marginTop: 8, lineHeight: 1.3 }}>
                    Based on skin undertone, facial contrast, brightness, and color harmony.
                  </p>
                </div>
              </div>

              {/* Skin type + Undertone grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12, marginTop: 24 }}>
                <div style={{ background: "#f6f3f2", borderRadius: 12, padding: 16 }}>
                  <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "0.6rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#747686" }}>
                    Skin Profile
                  </p>
                  <p style={{ fontFamily: "'Manrope', sans-serif", fontSize: "1.4rem", fontWeight: 800, color: "#002b92", marginTop: 4, letterSpacing: "-0.02em" }}>
                    {userFriendlySkinType}
                  </p>
                </div>
              </div>

              {/* Quick Wardrobe Access */}
              <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                <button
                  onClick={() => router.push("/wardrobe")}
                  style={{ flex: 1, padding: "10px", background: "#fcf9f8", border: "1px solid rgba(0,43,146,0.1)", borderRadius: 10, color: "#002b92", fontFamily: "'Manrope', sans-serif", fontSize: "0.8rem", fontWeight: 700, cursor: "pointer", transition: "all 0.2s" }}
                >
                  View Wardrobe
                </button>
                <button
                  onClick={() => router.push("/discover")}
                  style={{ flex: 1, padding: "10px", background: "#fcf9f8", border: "1px solid rgba(0,43,146,0.1)", borderRadius: 10, color: "#002b92", fontFamily: "'Manrope', sans-serif", fontSize: "0.8rem", fontWeight: 700, cursor: "pointer", transition: "all 0.2s" }}
                >
                  Discover Outfits
                </button>
              </div>

              {/* Style Characteristics */}
              <div style={{ background: "#f6f3f2", borderRadius: 12, padding: 16, marginTop: 12 }}>
                <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "0.6rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#747686", marginBottom: 12 }}>AI Confidence Breakdown</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {(confidenceReason ? [
                    { icon: "palette", label: "Undertone", level: confidenceReason.undertone },
                    { icon: "contrast", label: "Contrast", level: confidenceReason.contrast },
                    { icon: "light_mode", label: "Brightness", level: confidenceReason.brightness },
                    { icon: "face", label: "Facial Harmony", level: confidenceReason.facial_harmony },
                  ] : [
                    { icon: "contrast", label: "Contrast", level: "medium" },
                    { icon: "light_mode", label: "Brightness", level: "medium" },
                    { icon: "palette", label: "Saturation", level: "medium" },
                  ]).map((item, idx) => {
                    const bars = item.level === "high" ? 5 : item.level === "medium" ? 3 : 1;
                    return (
                      <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#434654", display: "flex", alignItems: "center", gap: 4 }}><span className="material-symbols-outlined" style={{ fontSize: 14 }}>{item.icon}</span> {item.label}</span>
                        <div style={{ display: "flex", gap: 2 }} title={`${item.level}`}>{[1,2,3,4,5].map(i => <div key={i} style={{ width: 12, height: 4, borderRadius: 2, background: i <= bars ? "#002b92" : "#d0ccc9" }} />)}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {seasonExplanation && (
                <div style={{ marginTop: 24, borderTop: "1px solid rgba(16,24,40,0.06)", paddingTop: 16 }}>
                  <button onClick={() => setShowExplanation(!showExplanation)} style={{ background: "none", border: "none", width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", padding: 0 }}>
                    <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#002b92" }}>Why this season?</span>
                    <span className="material-symbols-outlined" style={{ fontSize: 16, color: "#002b92", transform: showExplanation ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>expand_more</span>
                  </button>
                  <AnimatePresence>
                    {showExplanation && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} style={{ overflow: "hidden" }}>
                        <p style={{ fontSize: "0.8rem", color: "#434654", lineHeight: 1.5, marginTop: 12 }}>
                          {seasonExplanation}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>

            {/* RIGHT */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              {/* Signature Colors */}
              {signatureColors.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.12 }}
                  style={{ background: "#fff", borderRadius: 20, padding: 24, boxShadow: "0 16px 40px rgba(16,24,40,0.05)", border: "1px solid rgba(16,24,40,0.06)" }}
                >
                  <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "#002b92", marginBottom: 16 }}>
                    Your 3 Signature Colors
                  </p>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
                    {signatureColors.map((c, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: 12, borderRadius: 16, background: "#fcf9f8", border: "1px solid rgba(16,24,40,0.04)" }}>
                        <div style={{ width: 48, height: 48, borderRadius: 12, background: c.hex, boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.1)", flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          {c.name && <span style={{ display: "block", fontSize: 13, color: "#1b1c1b", fontWeight: 800, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.name}</span>}
                          <span style={{ display: "block", fontSize: 10, color: "#747686", fontFamily: "'Space Grotesk', sans-serif", marginTop: 2 }}>{c.hex.toUpperCase()}</span>
                          <span style={{ display: "block", fontSize: 10, color: "#434654", marginTop: 4, lineHeight: 1.2 }}>{c.reason}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Colors row */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16 }}
              >
                {/* Best colors */}
                <div style={{ background: "#fff", borderRadius: 20, padding: 24, boxShadow: "0 16px 40px rgba(16,24,40,0.05)", border: "1px solid rgba(16,24,40,0.06)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 16 }}>
                    <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "#002b92" }} title="Best near your face">
                      Your Best Colors
                    </p>
                    <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "0.7rem", color: "#747686" }}>{bestColors.length}</span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(70px, 1fr))", gap: 12 }}>
                    {bestColors.map((c, i) => (
                      <motion.div whileHover={{ scale: 1.05 }} key={i} title="Click to copy HEX" onClick={() => handleCopy(c.hex)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, cursor: "pointer" }}>
                        <div style={{ width: "100%", aspectRatio: "1", borderRadius: 12, background: c.hex, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }} />
                        <div style={{ width: "100%", textAlign: "center" }}>
                          {c.name && <span style={{ display: "block", fontSize: 10, color: "#1b1c1b", lineHeight: 1.2, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.name}</span>}
                          <span style={{ display: "block", fontSize: 9, color: "#747686", fontFamily: "'Space Grotesk', sans-serif", marginTop: 2 }}>{c.hex.toUpperCase()}</span>
                        </div>
                      </motion.div>
                    ))}
                    {bestColors.length === 0 && <p style={{ fontSize: "0.78rem", color: "#aaa", gridColumn: "1/-1" }}>No color data available</p>}
                  </div>
                </div>

                {/* Avoid colors */}
                <div style={{ background: "#fff", borderRadius: 20, padding: 24, boxShadow: "0 16px 40px rgba(16,24,40,0.05)", border: "1px solid rgba(16,24,40,0.06)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 16 }}>
                    <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "#b00020" }} title="Colors that might wash you out">
                      Colors to Avoid
                    </p>
                    <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "0.7rem", color: "#747686" }}>{avoidColors.length}</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {avoidColors.map((c, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, background: "#fcf9f8", padding: "8px 12px", borderRadius: 12, border: "1px solid rgba(16,24,40,0.04)" }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: c.hex, boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.1)", flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          {c.name && <span style={{ display: "block", fontSize: 12, color: "#1b1c1b", fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.name}</span>}
                          <span style={{ display: "block", fontSize: 10, color: "#747686" }}>{c.reason || "Clashes with undertone"}</span>
                        </div>
                        <span className="material-symbols-outlined" style={{ fontSize: 16, color: "#b00020", opacity: 0.7 }}>warning</span>
                      </div>
                    ))}
                    {avoidColors.length === 0 && <p style={{ fontSize: "0.78rem", color: "#aaa" }}>No data available</p>}
                  </div>
                </div>
              </motion.div>

              {/* Style rules / Materials / Accessories */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr", gap: 16 }}
              >
                {/* Style rules */}
                <div style={{ background: "#fff", borderRadius: 20, padding: 24, boxShadow: "0 16px 40px rgba(16,24,40,0.05)", border: "1px solid rgba(16,24,40,0.06)", gridColumn: "1 / -1" }}>
                  <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "#002b92", marginBottom: 16 }}>
                    High-Impact Guidance
                  </p>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
                    {styleRules.map((rule, i) => {
                      const isAvoid = rule.toLowerCase().includes("avoid") || rule.toLowerCase().includes("do not") || rule.toLowerCase().includes("instead");
                      return (
                        <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", background: isAvoid ? "#fff4f4" : "#f4f8ff", padding: 16, borderRadius: 12, border: `1px solid ${isAvoid ? "rgba(176,0,32,0.1)" : "rgba(0,43,146,0.1)"}` }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 18, color: isAvoid ? "#b00020" : "#002b92", flexShrink: 0, marginTop: 1, fontVariationSettings: "'FILL' 1" }}>
                            {isAvoid ? 'cancel' : 'check_circle'}
                          </span>
                          <span style={{ fontSize: 13, color: "#1b1c1b", lineHeight: 1.5, fontWeight: 500 }}>{rule}</span>
                        </div>
                      );
                    })}
                    {styleRules.length === 0 && <span style={{ fontSize: 13, color: "#747686" }}>No style rules available.</span>}
                  </div>
                </div>

                {/* Materials & Accessories Row */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, gridColumn: "1 / -1" }}>
                  {/* Materials */}
                  <div style={{ background: "#fff", borderRadius: 20, padding: 24, boxShadow: "0 16px 40px rgba(16,24,40,0.05)", border: "1px solid rgba(16,24,40,0.06)" }}>
                    <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "#002b92", marginBottom: 14 }}>
                      Best Fabrics & Materials
                    </p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {materials.map((m, i) => {
                        const { label, finish } = materialLabel(m);
                        return (
                          <span key={i} style={{ padding: "6px 12px", borderRadius: 8, background: "#fcf9f8", border: "1px solid rgba(16,24,40,0.06)", fontSize: 12, fontWeight: 600, color: "#1b1c1b", display: "inline-flex", alignItems: "center", gap: 6 }}>
                            {label}
                            {finish && <span style={{ fontSize: 9, color: "#747686", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "'Space Grotesk', sans-serif", background: "#e8e5e4", padding: "2px 6px", borderRadius: 4 }}>{finish}</span>}
                          </span>
                        );
                      })}
                      {materials.length === 0 && <span style={{ fontSize: 13, color: "#747686" }}>No data</span>}
                    </div>
                  </div>

                  {/* Accessories */}
                  <div style={{ background: "#fff", borderRadius: 20, padding: 24, boxShadow: "0 16px 40px rgba(16,24,40,0.05)", border: "1px solid rgba(16,24,40,0.06)" }}>
                    <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "#002b92", marginBottom: 14 }}>
                      Finishing Palette
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {accessories.map((a, i) => {
                        const { label, kind } = accessoryLabel(a);
                        return (
                          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: i < accessories.length - 1 ? "1px solid rgba(16,24,40,0.04)" : "none", paddingBottom: i < accessories.length - 1 ? 10 : 0 }}>
                            <span style={{ fontSize: 10, color: "#747686", textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700 }}>{kind || "Accessory"}</span>
                            <span style={{ fontSize: 13, fontWeight: 600, color: "#1b1c1b" }}>{label}</span>
                          </div>
                        );
                      })}
                      {accessories.length === 0 && <span style={{ fontSize: 13, color: "#747686" }}>No data</span>}
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Curated Wardrobe — Real Discover Outfits */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                style={{ background: "#fff", borderRadius: 20, padding: 28, boxShadow: "0 16px 40px rgba(16,24,40,0.05)", border: "1px solid rgba(16,24,40,0.06)" }}
              >
                <div style={{ background: "linear-gradient(90deg, rgba(0,43,146,0.03) 0%, rgba(0,43,146,0) 100%)", padding: "10px 16px", borderRadius: 10, marginBottom: 20, borderLeft: "3px solid #002b92" }}>
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.85rem", fontWeight: 600, color: "#002b92" }}>
                    {recommendedOutfits.length} outfits matched to your {season} profile
                  </p>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                  <h3 style={{ fontFamily: "'Manrope', sans-serif", fontSize: "1.4rem", fontWeight: 800, letterSpacing: "-0.02em" }}>Recommended Looks</h3>
                  <button type="button" onClick={() => router.push("/discover")} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'Space Grotesk', sans-serif", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#002b92" }}>
                    View All →
                  </button>
                </div>

                {recommendedOutfits.length === 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 0", gap: 10 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 32, color: "#d0ccc9" }}>checkroom</span>
                    <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.85rem", color: "#bbb" }}>No outfit matches found</p>
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
                    {recommendedOutfits.map((rec, i) => (
                      <motion.div
                        key={rec.outfit.outfit_id}
                        whileHover={{ scale: 1.02, boxShadow: "0 20px 50px rgba(0,30,100,0.15)" }}
                        transition={{ duration: 0.25 }}
                        onClick={() => router.push(`/outfit/${rec.outfit.outfit_id}`)}
                        style={{ borderRadius: 14, overflow: "hidden", position: "relative", cursor: "pointer", aspectRatio: "3/4", background: "#f0edec" }}
                      >
                        <img
                          src={rec.outfit.imageUrl}
                          alt={`Look ${i + 1}`}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          loading={i < 3 ? "eager" : "lazy"}
                        />
                        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 50%)" }} />
                        {/* Match badge */}
                        <div style={{ position: "absolute", top: 10, left: 10 }}>
                          <span style={{ background: "#002b92", color: "#fff", fontSize: "0.6rem", fontWeight: 700, padding: "4px 8px", borderRadius: 6, letterSpacing: "0.05em" }}>
                            {rec.score}% Match
                          </span>
                        </div>
                        {/* Bottom info */}
                        <div style={{ position: "absolute", bottom: 12, left: 12, right: 12 }}>
                          <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "0.55rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.7)", marginBottom: 4 }}>
                            Look {i + 1}
                          </p>
                          <p style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.85)", lineHeight: 1.3 }}>
                            {rec.reason}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            </div>
          </div>

          {/* Skin Description + Next Steps */}
          {(skinDescription || nextSteps.length > 0) && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              style={{ display: "grid", gridTemplateColumns: skinDescription && nextSteps.length > 0 ? "1fr 1fr" : "1fr", gap: 16, marginTop: 16 }}
            >
              {skinDescription && (
                <div style={{ background: "#fff", borderRadius: 20, padding: 24, boxShadow: "0 16px 40px rgba(16,24,40,0.05)", border: "1px solid rgba(16,24,40,0.06)" }}>
                  <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "#002b92", marginBottom: 12 }}>
                    About Your Skin
                  </p>
                  <p style={{ fontSize: "0.9rem", color: "#434654", lineHeight: 1.7 }}>{skinDescription}</p>
                </div>
              )}
              {nextSteps.length > 0 && (
                <div style={{ background: "#fff", borderRadius: 20, padding: 24, boxShadow: "0 16px 40px rgba(16,24,40,0.05)", border: "1px solid rgba(16,24,40,0.06)" }}>
                  <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "#002b92", marginBottom: 12 }}>
                    Next Steps
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {nextSteps.map((step, i) => (
                      <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                        <span style={{ width: 22, height: 22, borderRadius: "50%", background: "#dde1ff", color: "#002b92", fontSize: 11, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{i + 1}</span>
                        <span style={{ fontSize: 13, color: "#1b1c1b", lineHeight: 1.5 }}>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Footer CTAs */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            style={{ marginTop: 40, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}
          >
            <p style={{ fontSize: "0.95rem", color: "#434654", fontWeight: 500, marginBottom: 4 }}>
              Your color profile has been applied to 30 curated outfit combinations.
            </p>
            <button
              type="button"
              onClick={() => router.push("/discover")}
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "16px 40px", borderRadius: 9999, border: "none",
                background: "linear-gradient(135deg, #002b92 0%, #003ec7 100%)",
                color: "#fff", fontFamily: "'Manrope', sans-serif",
                fontSize: "1.05rem", fontWeight: 800, letterSpacing: "-0.01em",
                cursor: "pointer", boxShadow: "0 10px 25px rgba(0,43,146,0.25)",
              }}
            >
              Explore Outfits For My Colors <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span>
            </button>
            <button
              type="button"
              onClick={onRetry}
              style={{
                background: "transparent", border: "none", color: "#747686",
                fontFamily: "'Inter', sans-serif", fontSize: "0.85rem",
                fontWeight: 500, cursor: "pointer", textDecoration: "underline",
                textUnderlineOffset: 4
              }}
            >
              Run a new analysis
            </button>
          </motion.div>
        </div>
      </motion.main>
    </div>
  );
}
