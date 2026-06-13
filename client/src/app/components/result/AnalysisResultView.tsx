"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { AnalysisResultData, MaterialItem, AccessoryItem, OutfitInput } from "./types";

// ─── constants ────────────────────────────────────────────────────────────────

const FITZ_DESC: Record<string, string> = {
  I:   "Very fair, always burns",
  II:  "Fair, usually burns",
  III: "Medium, sometimes burns",
  IV:  "Olive to medium, rarely burns",
  V:   "Brown, very rarely burns",
  VI:  "Deep brown to black, never burns",
};

// ─── helpers ──────────────────────────────────────────────────────────────────

function fitzFromSkinTone(skinTone: string): string {
  return skinTone.replace(/^type\s+/i, "").trim() || "?";
}

function materialLabel(m: MaterialItem): { label: string; finish?: string } {
  if (typeof m === "string") return { label: m };
  const label = m.name || "—";
  const finish = m.finish && m.finish !== "any" ? m.finish : undefined;
  return { label, finish };
}

function accessoryLabel(a: AccessoryItem): { label: string; kind?: string } {
  if (typeof a === "string") return { label: a };
  const label = a.value || a.type || "—";
  const kind = a.type && a.value ? a.type : undefined;
  return { label, kind };
}

function outfitCard(o: OutfitInput, i: number): { title: string; description: string } {
  if (typeof o === "string") return { title: o, description: "" };
  return { title: o.title || `Look ${i + 1}`, description: o.description || "" };
}

// ─── main component ────────────────────────────────────────────────────────────

type Props = { data: AnalysisResultData; onRetry: () => void };

export default function AnalysisResultView({ data, onRetry }: Props) {
  const router = useRouter();

  const fitzType = fitzFromSkinTone(data.skin_tone || "");
  const season = data.season || "Unknown";
  const undertone = data.undertone || "Unknown";
  const hex = data.hex || "#9A796C";
  const seasonExplanation = data.season_explanation || "";

  const bestColors = data.best_colors || [];
  const avoidColors = data.avoid_colors || [];
  const outfits = (data.outfits || []).map((o, i) => outfitCard(o, i));
  const styleRules = data.style_rules || [];
  const materials = data.materials || [];
  const accessories = data.accessories || [];

  const miniDots = bestColors.slice(0, 6);
  const mainOutfit = outfits[0] ?? null;

  return (
    <div style={{ background: "#fcf9f8", minHeight: "100vh", fontFamily: "'Inter', sans-serif", color: "#1b1c1b" }}>
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
              Analysis Complete
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
              style={{ background: "#fff", borderRadius: 20, padding: 28, boxShadow: "0 16px 40px rgba(16,24,40,0.05), 0 2px 10px rgba(16,24,40,0.03)", border: "1px solid rgba(16,24,40,0.06)" }}
            >
              {/* Swatch + season name + mini dots */}
              <div style={{ display: "flex", gap: 18, alignItems: "flex-start" }}>
                <div style={{
                  width: 76, height: 76, borderRadius: 14, background: hex, flexShrink: 0,
                  boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.12)",
                }} />
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "0.6rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#747686", marginBottom: 6 }}>
                    Detected Season
                  </p>
                  <h2 style={{ fontFamily: "'Manrope', sans-serif", fontSize: "1.9rem", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.05, color: "#002b92" }}>
                    {season}
                  </h2>
                  <div style={{ display: "flex", gap: 7, marginTop: 12, flexWrap: "wrap" }}>
                    {miniDots.map((c, i) => (
                      <span key={i} title={c.name} style={{ width: 14, height: 14, borderRadius: "50%", background: c.hex, display: "inline-block", boxShadow: "0 1px 4px rgba(0,0,0,0.18)" }} />
                    ))}
                  </div>
                </div>
              </div>

              {/* Skin type + Undertone grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 24 }}>
                <div style={{ background: "#f6f3f2", borderRadius: 12, padding: 16 }}>
                  <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "0.6rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#747686" }}>
                    Skin Type
                  </p>
                  <p style={{ fontFamily: "'Manrope', sans-serif", fontSize: "1.6rem", fontWeight: 800, color: "#002b92", marginTop: 4, letterSpacing: "-0.02em" }}>
                    Type {fitzType}
                  </p>
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.72rem", color: "#434654", marginTop: 4, lineHeight: 1.35 }}>
                    {FITZ_DESC[fitzType] || ""}
                  </p>
                </div>
                <div style={{ background: "#f6f3f2", borderRadius: 12, padding: 16 }}>
                  <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "0.6rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#747686" }}>
                    Undertone
                  </p>
                  <p style={{ fontFamily: "'Manrope', sans-serif", fontSize: "1.6rem", fontWeight: 800, marginTop: 4, letterSpacing: "-0.02em", textTransform: "capitalize" }}>
                    {undertone}
                  </p>
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.72rem", color: "#434654", marginTop: 4, lineHeight: 1.35 }}>
                    Base hue temperature
                  </p>
                </div>
              </div>
            </motion.div>

            {/* RIGHT */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

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
                    <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "#002b92" }}>
                      Your Best Colors
                    </p>
                    <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "0.7rem", color: "#747686" }}>{bestColors.length}</span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 10 }}>
                    {bestColors.map((c, i) => (
                      <div key={i} title={`${c.name || ""} — ${c.hex}`} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                        <div style={{ width: "100%", aspectRatio: "1", borderRadius: 10, background: c.hex, boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }} />
                        {c.name && (
                          <span style={{ fontSize: 9.5, color: "#434654", textAlign: "center", lineHeight: 1.2, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", width: "100%" }}>
                            {c.name}
                          </span>
                        )}
                      </div>
                    ))}
                    {bestColors.length === 0 && (
                      <p style={{ fontSize: "0.78rem", color: "#aaa", gridColumn: "1/-1" }}>No color data available</p>
                    )}
                  </div>
                </div>

                {/* Avoid colors */}
                <div style={{ background: "#fff", borderRadius: 20, padding: 24, boxShadow: "0 16px 40px rgba(16,24,40,0.05)", border: "1px solid rgba(16,24,40,0.06)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 16 }}>
                    <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "#747686" }}>
                      Colors to Avoid
                    </p>
                    <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "0.7rem", color: "#747686" }}>{avoidColors.length}</span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                    {avoidColors.map((c, i) => (
                      <div key={i} title={`${c.name || ""} — ${c.hex}`} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                        <div style={{ width: "100%", aspectRatio: "1", borderRadius: 10, background: c.hex, boxShadow: "0 2px 8px rgba(0,0,0,0.08)", opacity: 0.75, border: "1px solid rgba(0,0,0,0.06)" }} />
                        {c.name && (
                          <span style={{ fontSize: 9.5, color: "#747686", textAlign: "center", lineHeight: 1.2, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", width: "100%" }}>
                            {c.name}
                          </span>
                        )}
                      </div>
                    ))}
                    {avoidColors.length === 0 && (
                      <p style={{ fontSize: "0.78rem", color: "#aaa", gridColumn: "1/-1" }}>No data available</p>
                    )}
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
                <div style={{ background: "#fff", borderRadius: 20, padding: 24, boxShadow: "0 16px 40px rgba(16,24,40,0.05)", border: "1px solid rgba(16,24,40,0.06)" }}>
                  <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "#002b92", marginBottom: 14 }}>
                    Style Rules
                  </p>
                  <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                    {styleRules.map((rule, i) => (
                      <li key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 16, color: "#002b92", marginTop: 2, flexShrink: 0, fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                        <span style={{ fontSize: 13, color: "#1b1c1b", lineHeight: 1.5 }}>{rule}</span>
                      </li>
                    ))}
                    {styleRules.length === 0 && (
                      <li style={{ fontSize: 13, color: "#747686" }}>No style rules available.</li>
                    )}
                  </ul>
                </div>

                {/* Materials */}
                <div style={{ background: "#fff", borderRadius: 20, padding: 24, boxShadow: "0 16px 40px rgba(16,24,40,0.05)", border: "1px solid rgba(16,24,40,0.06)" }}>
                  <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "#002b92", marginBottom: 14 }}>
                    Materials
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {materials.map((m, i) => {
                      const { label, finish } = materialLabel(m);
                      return (
                        <span key={i} style={{ padding: "6px 12px", borderRadius: 9999, background: "#f6f3f2", border: "1px solid rgba(16,24,40,0.06)", fontSize: 12, fontWeight: 500, color: "#1b1c1b", display: "inline-flex", alignItems: "center", gap: 5 }}>
                          {label}
                          {finish && <span style={{ fontSize: 9.5, color: "#747686", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "'Space Grotesk', sans-serif" }}>{finish}</span>}
                        </span>
                      );
                    })}
                    {materials.length === 0 && <span style={{ fontSize: 13, color: "#747686" }}>No data</span>}
                  </div>
                </div>

                {/* Accessories */}
                <div style={{ background: "#fff", borderRadius: 20, padding: 24, boxShadow: "0 16px 40px rgba(16,24,40,0.05)", border: "1px solid rgba(16,24,40,0.06)" }}>
                  <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "#002b92", marginBottom: 14 }}>
                    Accessory Finishes
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {accessories.map((a, i) => {
                      const { label, kind } = accessoryLabel(a);
                      return (
                        <span key={i} style={{ padding: "6px 12px", borderRadius: 9999, background: "#f6f3f2", border: "1px solid rgba(16,24,40,0.06)", fontSize: 12, fontWeight: 500, color: "#1b1c1b", display: "inline-flex", alignItems: "center", gap: 5 }}>
                          {label}
                          {kind && <span style={{ fontSize: 9.5, color: "#747686", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "'Space Grotesk', sans-serif" }}>{kind}</span>}
                        </span>
                      );
                    })}
                    {accessories.length === 0 && <span style={{ fontSize: 13, color: "#747686" }}>No data</span>}
                  </div>
                </div>
              </motion.div>

              {/* Curated wardrobe */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                style={{ background: "#fff", borderRadius: 20, padding: 28, boxShadow: "0 16px 40px rgba(16,24,40,0.05)", border: "1px solid rgba(16,24,40,0.06)" }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                  <h3 style={{ fontFamily: "'Manrope', sans-serif", fontSize: "1.4rem", fontWeight: 800, letterSpacing: "-0.02em" }}>Curated Wardrobe</h3>
                  <button
                    type="button"
                    onClick={() => router.push("/wardrobe")}
                    style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'Space Grotesk', sans-serif", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#002b92" }}
                  >
                    View All →
                  </button>
                </div>

                {!mainOutfit && (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 0", gap: 10 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 32, color: "#d0ccc9" }}>checkroom</span>
                    <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.85rem", color: "#bbb" }}>No outfits available</p>
                  </div>
                )}

                {mainOutfit && (
                  <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 14 }}>
                    {/* Main outfit card */}
                    <motion.div
                      whileHover={{ scale: 1.01, boxShadow: "0 24px 64px rgba(0,30,100,0.18)" }}
                      transition={{ duration: 0.3 }}
                      style={{
                        borderRadius: 14, overflow: "hidden", height: 360, position: "relative", cursor: "pointer",
                        background: `linear-gradient(135deg, ${bestColors[0]?.hex || hex} 0%, ${hex} 100%)`,
                        boxShadow: "0 8px 40px rgba(0,30,100,0.12)",
                      }}
                    >
                      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.65), transparent 50%)" }} />
                      <div style={{ position: "absolute", bottom: 20, left: 20, right: 20 }}>
                        <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "0.6rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(255,255,255,0.7)", marginBottom: 8 }}>
                          Recommended Look
                        </p>
                        <h4 style={{ fontFamily: "'Manrope', sans-serif", fontSize: "1.25rem", fontWeight: 700, color: "#fff", lineHeight: 1.2, marginBottom: 8 }}>
                          {mainOutfit.title}
                        </h4>
                        {mainOutfit.description && (
                          <p style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.78)", lineHeight: 1.5 }}>
                            {mainOutfit.description}
                          </p>
                        )}
                      </div>
                    </motion.div>

                    {/* Stacked side cards */}
                    <div style={{ display: "grid", gridTemplateRows: "1fr 1fr", gap: 14 }}>
                      {outfits.slice(1, 3).map((o, i) => (
                        <motion.div
                          key={i}
                          whileHover={{ scale: 1.02 }}
                          transition={{ duration: 0.25 }}
                          style={{
                            borderRadius: 12, overflow: "hidden", position: "relative", cursor: "pointer",
                            background: `linear-gradient(135deg, ${bestColors[i + 1]?.hex || hex} 0%, ${hex} 100%)`,
                            boxShadow: "0 6px 28px rgba(0,30,100,0.1)",
                          }}
                        >
                          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.5), transparent 55%)" }} />
                          <div style={{ position: "absolute", bottom: 12, left: 14, right: 14 }}>
                            <p style={{ fontFamily: "'Manrope', sans-serif", fontSize: "0.85rem", fontWeight: 700, color: "#fff", lineHeight: 1.3 }}>
                              {o.title}
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
          </div>

          {/* Footer CTAs */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            style={{ marginTop: 40, display: "flex", alignItems: "center", justifyContent: "center", gap: 12, flexWrap: "wrap" }}
          >
            <button
              type="button"
              onClick={() => router.push("/wardrobe")}
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "14px 32px", borderRadius: 9999, border: "none",
                background: "linear-gradient(135deg, #002b92 0%, #003ec7 100%)",
                color: "#fff", fontFamily: "'Manrope', sans-serif",
                fontSize: "0.9375rem", fontWeight: 700, letterSpacing: "-0.025em",
                cursor: "pointer", boxShadow: "0 10px 25px rgba(0,43,146,0.25)",
              }}
            >
              View My Wardrobe <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_forward</span>
            </button>
            <button
              type="button"
              onClick={onRetry}
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "14px 32px", borderRadius: 9999,
                border: "2px solid #003ec7", background: "transparent",
                color: "#003ec7", fontFamily: "'Manrope', sans-serif",
                fontSize: "0.9375rem", fontWeight: 700, letterSpacing: "-0.025em",
                cursor: "pointer",
              }}
            >
              New Analysis
            </button>
          </motion.div>
        </div>
      </motion.main>
    </div>
  );
}
