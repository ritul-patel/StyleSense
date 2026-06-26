"use client";

import Link from "next/link";
import Navbar from "@/app/components/Navbar";
import RequireAuth from "../components/RequireAuth";

// ─── Static mock data ─────────────────────────────────────────────────────────

const HERO = {
  title: "Architectural Minimalism.",
  label: "The Daily Curated",
  badge: "Recommended Look",
  insight:
    'This combination leverages your "Deep Autumn" color profile. The high contrast between the charcoal base and the warm terracotta accent mirrors the structural precision of your seasonal palette.',
  colors: ["#843b23", "#c27c3e", "#4d5d30"],
};

const BREAKDOWN = [
  { name: "Wool Structure Coat", price: "$420", badge: "Best Fit", colors: ["#3e3e3e", "#555"] },
  { name: "Silk-Cotton Shirt", price: "$180", colors: ["#f5f0eb", "#e8e0d8"] },
  { name: "Selvedge Denim", price: "$210", colors: ["#1a2a3a", "#2c3e50"] },
  { name: "Leather Tassel Loafers", price: "$285", colors: ["#5d3a1a", "#7a4f2d"] },
];

const SIMILAR_LOOKS = [
  { score: "94%", label: "Navy Power Suit", colors: ["#1a2b4a", "#2c3e66"] },
  { score: "88%", label: "Monochrome Grey", colors: ["#6b7280", "#9ca3af"] },
  { score: "82%", label: "Cream Knitwear", colors: ["#f5f0e8", "#e8ddd0"] },
  { score: "79%", label: "Tech Minimal", colors: ["#2d3748", "#4a5568"] },
];

const SAVED = [
  {
    name: "Parisian Morning",
    ago: "2 Days Ago",
    swatches: [["#c27c3e", "#843b23"], ["#4d5d30", "#e9c46a"]],
  },
  {
    name: "Tech Minimalist",
    ago: "5 Days Ago",
    swatches: [["#1a2a3a", "#3e3e3e"], ["#9ca3af", "#6b7280"]],
  },
];

// ─── Gradient placeholder ─────────────────────────────────────────────────────

function GradientBlock({
  colors,
  className,
  style,
}: {
  colors: string[];
  className?: string;
  style?: React.CSSProperties;
}) {
  const from = colors[0] ?? "#ccc";
  const to = colors[1] ?? from;
  return (
    <div
      className={className}
      style={{ background: `linear-gradient(135deg, ${from}, ${to})`, ...style }}
    />
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function WardrobePageContent() {
  return (
    <div
      className="bg-[#fcf9f8] text-[#1b1c1b] antialiased"
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      {/* Nav */}
      <Navbar activePath="wardrobe" />

      <main className="pt-28 pb-32 px-6 md:px-12 max-w-[1440px] mx-auto space-y-24">
        {/* 1. Hero Outfit */}
        <section className="relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Hero image placeholder */}
            <div className="lg:col-span-7">
              <div className="rounded-xl overflow-hidden aspect-[4/5] md:aspect-[16/9] lg:aspect-[4/5] bg-[#f0edec] relative">
                <GradientBlock
                  colors={["#843b23", "#4d5d30"]}
                  className="w-full h-full opacity-70"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="material-symbols-outlined text-white/60" style={{ fontSize: 80 }}>
                    checkroom
                  </span>
                </div>
                <div className="absolute top-6 left-6">
                  <span className="bg-[#002b92] text-white text-[10px] font-bold px-4 py-2 rounded-full uppercase tracking-widest">
                    {HERO.badge}
                  </span>
                </div>
              </div>
            </div>

            {/* Hero text */}
            <div className="lg:col-span-5 space-y-8">
              <div className="space-y-4">
                <span
                  className="text-[#002b92] font-bold text-sm tracking-widest uppercase"
                  style={{ fontFamily: "Manrope, sans-serif" }}
                >
                  {HERO.label}
                </span>
                <h1
                  className="text-5xl md:text-7xl font-extrabold tracking-tighter text-[#1b1c1b]"
                  style={{ fontFamily: "Manrope, sans-serif" }}
                >
                  {HERO.title}
                </h1>

                {/* Palette chips */}
                <div className="flex gap-2">
                  {HERO.colors.map((c) => (
                    <div
                      key={c}
                      className="w-8 h-8 rounded-full border-2 border-white shadow"
                      style={{ background: c }}
                    />
                  ))}
                </div>

                <div className="p-6 bg-[#f6f3f2] rounded-xl border-l-4 border-[#002b92]">
                  <h3 className="font-bold text-lg mb-2" style={{ fontFamily: "Manrope, sans-serif" }}>
                    Why this works
                  </h3>
                  <p className="text-[#434654] leading-relaxed">
                    <span className="font-bold text-[#002b92] italic">AI Insights: </span>
                    {HERO.insight}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                <button
                  className="px-10 py-4 text-white rounded-full font-bold text-sm tracking-tight transition-transform active:scale-95 shadow-lg"
                  style={{
                    background: "linear-gradient(135deg, #002b92, #003ec7)",
                    boxShadow: "0 10px 25px rgba(0,43,146,0.2)",
                    fontFamily: "Manrope, sans-serif",
                  }}
                  onClick={() => console.log("Mix & Match clicked")}
                >
                  Mix &amp; Match
                </button>
                <button
                  className="px-10 py-4 border-2 border-[#002b92] text-[#002b92] rounded-full font-bold text-sm tracking-tight hover:bg-[#002b92]/5 transition-colors"
                  style={{ fontFamily: "Manrope, sans-serif" }}
                  onClick={() => {
                    console.log("Add to Wardrobe clicked");
                  }}
                >
                  Add to Wardrobe
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* 2. Outfit Breakdown */}
        <section className="space-y-12">
          <div className="flex justify-between items-end">
            <div className="space-y-2">
              <span className="text-stone-500 font-bold text-xs tracking-widest uppercase" style={{ fontFamily: "Manrope, sans-serif" }}>
                The Selection
              </span>
              <h2 className="text-4xl font-bold tracking-tight" style={{ fontFamily: "Manrope, sans-serif" }}>
                Outfit Breakdown
              </h2>
            </div>
            <button
              className="px-8 py-3 bg-[#1b1c1b] text-[#fcf9f8] rounded-full font-bold text-sm tracking-tight transition-colors hover:bg-[#002b92] flex items-center gap-2"
              style={{ fontFamily: "Manrope, sans-serif" }}
            >
              <span className="material-symbols-outlined text-sm">shopping_cart</span>
              Buy All ($1,095)
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {BREAKDOWN.map((item) => (
              <div key={item.name} className="space-y-4">
                <div className="relative rounded-xl overflow-hidden aspect-[3/4] bg-white" style={{ boxShadow: "0px 12px 32px rgba(27,28,27,0.06)" }}>
                  <GradientBlock colors={item.colors} className="w-full h-full" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="material-symbols-outlined text-white/50" style={{ fontSize: 48 }}>
                      checkroom
                    </span>
                  </div>
                  {item.badge && (
                    <div className="absolute top-4 left-4">
                      <span className="bg-[#002b92] text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-tighter shadow-md">
                        {item.badge}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold">{item.name}</h4>
                    <p className="text-sm text-[#434654]">{item.price}</p>
                  </div>
                  <button
                    className="p-2 rounded-full border border-[#c4c5d7] hover:bg-[#f0edec] transition-colors"
                    onClick={() => console.log(`Add to cart: ${item.name}`)}
                  >
                    <span className="material-symbols-outlined text-lg">add_shopping_cart</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 3. Similar Looks */}
        <section className="space-y-8">
          <div className="space-y-2">
            <span className="text-stone-500 font-bold text-xs tracking-widest uppercase" style={{ fontFamily: "Manrope, sans-serif" }}>
              Couture Logic
            </span>
            <h2 className="text-4xl font-bold tracking-tight" style={{ fontFamily: "Manrope, sans-serif" }}>
              Similar Inspirations
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {SIMILAR_LOOKS.map((look) => (
              <div key={look.label} className="group cursor-pointer relative">
                <div
                  className="rounded-xl overflow-hidden aspect-[3/4] bg-[#f0edec] transition-all duration-500 group-hover:shadow-2xl relative"
                >
                  <GradientBlock colors={look.colors} className="w-full h-full opacity-80" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="material-symbols-outlined text-white/40" style={{ fontSize: 40 }}>
                      style
                    </span>
                  </div>
                  {/* Hover CTA */}
                  <div className="absolute inset-0 bg-[#002b92]/0 group-hover:bg-[#002b92]/20 transition-all duration-300 flex items-center justify-center">
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity text-white font-bold text-sm bg-[#002b92] px-4 py-2 rounded-full" style={{ fontFamily: "Manrope, sans-serif" }}>
                      Try This Look
                    </span>
                  </div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="bg-white/90 backdrop-blur-md rounded-lg p-3 flex justify-between items-center">
                      <span className="text-[10px] font-bold uppercase tracking-wider">{look.label}</span>
                      <span className="text-[#002b92] font-bold text-sm">{look.score}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 4. Saved Collections */}
        <section className="space-y-8 pb-12">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "Manrope, sans-serif" }}>
              Saved Collections
            </h3>
            <button className="text-sm font-bold text-[#002b92] hover:underline underline-offset-4 transition-all uppercase tracking-widest">
              View Archives
            </button>
          </div>

          <div className="flex gap-6 overflow-x-auto pb-6" style={{ scrollbarWidth: "none" }}>
            {SAVED.map((saved) => (
              <div key={saved.name} className="min-w-[300px] group opacity-70 hover:opacity-100 transition-opacity">
                <div className="bg-[#e4e2e1] rounded-xl p-4">
                  <div className="grid grid-cols-2 gap-2 h-40">
                    <GradientBlock colors={saved.swatches[0]!} className="rounded-lg" />
                    <div className="grid grid-rows-2 gap-2">
                      <GradientBlock colors={saved.swatches[1] ?? saved.swatches[0]!} className="rounded-lg opacity-80" />
                      <GradientBlock colors={[saved.swatches[0]![1] ?? "#ccc", saved.swatches[0]![0] ?? "#ccc"]} className="rounded-lg opacity-60" />
                    </div>
                  </div>
                  <div className="mt-4 flex justify-between items-center">
                    <div>
                      <h5 className="font-bold text-sm">{saved.name}</h5>
                      <p className="text-[10px] text-[#434654] uppercase tracking-widest">{saved.ago}</p>
                    </div>
                    <span
                      className="material-symbols-outlined text-[#003ec7] text-lg"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      bookmark
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {/* Add collection prompt */}
            <div className="min-w-[300px] opacity-50 hover:opacity-70 transition-opacity cursor-pointer">
              <div
                className="bg-[#e4e2e1] rounded-xl p-4 h-full flex items-center justify-center border-2 border-dashed border-[#c4c5d7]"
                onClick={() => console.log("Add to Wardrobe clicked")}
              >
                <div className="text-center">
                  <span className="material-symbols-outlined text-[#747686] text-4xl mb-2 block">add_circle</span>
                  <p className="text-sm font-semibold text-[#434654]">Add to Wardrobe</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Mobile nav */}
      
    </div>
  );
}

export default function WardrobePage() {
  return (
    <RequireAuth>
      <WardrobePageContent />
    </RequireAuth>
  );
}

