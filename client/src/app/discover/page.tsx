"use client";

import { useState } from "react";
import Link from "next/link";

const CATEGORIES = ["All Aesthetics", "Avant-Garde", "Minimalism", "Hyper-Tactile", "Archive Workwear", "Neo-Luxe"];

const CARDS = [
  { label: "Winter Core", title: "Sculptural Wool", tag: null, colors: ["#3e3e3e", "#6b7280"], icon: "checkroom" },
  { label: "Color Theory", title: "Solar Flare", tag: null, colors: ["#f4a261", "#e9c46a"], icon: "palette" },
  { label: "Neo-Business", title: "Liquid Tailoring", tag: null, colors: ["#f5f0eb", "#c9b99a"], icon: "style" },
  { label: null, title: "Hyper-Luxe Bag", tag: "Trending", colors: ["#843b23", "#c27c3e"], icon: "shopping_bag" },
  { label: "Street Core", title: "Urban Tech-Wear", tag: null, colors: ["#1a1a2e", "#2d2d44"], icon: "directions_walk" },
  { label: "AI Texture Report", title: "Liquid Metallics", tag: null, colors: ["#d4d4d4", "#a8a8b3"], icon: "diamond" },
  { label: "Spring Edit", title: "Botanical Layers", tag: "New", colors: ["#4d5d30", "#6b8e23"], icon: "local_florist" },
  { label: "Archive Fetch", title: "Denim Revival", tag: null, colors: ["#1a2a3a", "#2c3e50"], icon: "layers" },
];

export default function DiscoverPage() {
  const [active, setActive] = useState("All Aesthetics");
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <div
      className="bg-[#fcf9f8] text-[#1b1c1b] antialiased min-h-screen"
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 glass-nav">
        <div className="flex justify-between items-center w-full px-6 md:px-12 h-20 max-w-[1920px] mx-auto">
          <Link
            href="/"
            className="text-2xl font-bold text-[#002b92] tracking-tighter"
            style={{ fontFamily: "Manrope, sans-serif" }}
          >
            Couture AI
          </Link>
          <div className="hidden md:flex items-center gap-10">
            <span
              className="text-sm uppercase tracking-tight font-bold border-b-2 border-[#002b92] pb-1 text-[#002b92]"
              style={{ fontFamily: "Manrope, sans-serif" }}
            >
              Discover
            </span>
            {[
              { href: "/analysis", label: "Analysis" },
              { href: "/wardrobe", label: "Wardrobe" },
              { href: "/history", label: "History" },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="text-stone-500 font-medium hover:text-[#002b92] transition-colors text-sm uppercase tracking-tight"
                style={{ fontFamily: "Manrope, sans-serif" }}
              >
                {label}
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-6">
            <button className="text-[#434654] hover:opacity-80 transition-opacity">
              <span className="material-symbols-outlined">shopping_bag</span>
            </button>
            <button className="text-[#434654] hover:opacity-80 transition-opacity">
              <span className="material-symbols-outlined">account_circle</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="pt-32 pb-32 px-6 md:px-12 max-w-[1920px] mx-auto">
        {/* Editorial header */}
        <header className="mb-16 max-w-3xl">
          <span
            className="text-xs tracking-[0.2em] uppercase text-[#002b92] mb-4 block font-bold"
            style={{ fontFamily: "Manrope, sans-serif" }}
          >
            Seasonal Edit
          </span>
          <h1
            className="text-5xl md:text-7xl font-extrabold tracking-tighter text-[#1b1c1b] leading-[0.95] mb-8"
            style={{ fontFamily: "Manrope, sans-serif" }}
          >
            Inspiration <br />
            <span style={{ WebkitTextStroke: "1px #1b1c1b", color: "transparent" }}>Sanctuary</span>
          </h1>
          <p className="text-lg text-[#434654] max-w-lg leading-relaxed">
            Curated by AI, refined by global trends. Explore the intersection of high-fashion craftsmanship and digital precision.
          </p>
        </header>

        {/* Category chips */}
        <div className="flex flex-wrap gap-3 mb-12">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActive(cat)}
              className="px-6 py-2 rounded-full text-sm font-semibold tracking-wide transition-all"
              style={
                active === cat
                  ? { background: "#002b92", color: "#fff" }
                  : { background: "#b3c1ff", color: "#404e83" }
              }
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Masonry grid */}
        <div style={{ columns: "1", columnGap: "1.5rem" }} className="md:[column-count:2] lg:[column-count:3] xl:[column-count:4]">
          <style>{`
            @media (min-width: 768px)  { .masonry { column-count: 2; } }
            @media (min-width: 1024px) { .masonry { column-count: 3; } }
            @media (min-width: 1280px) { .masonry { column-count: 4; } }
          `}</style>
          <div className="masonry" style={{ columnGap: "1.5rem" }}>
            {CARDS.map((card, i) => {
              const isHovered = hovered === i;
              const heights = [320, 260, 380, 200, 300, 360, 240, 280];
              const h = heights[i % heights.length];

              return (
                <div
                  key={i}
                  className="mb-6 cursor-pointer"
                  style={{ breakInside: "avoid" }}
                  onMouseEnter={() => setHovered(i)}
                  onMouseLeave={() => setHovered(null)}
                >
                  <div
                    className="relative overflow-hidden rounded-xl transition-all duration-500"
                    style={{
                      height: h,
                      background: `linear-gradient(135deg, ${card.colors[0]}, ${card.colors[1]})`,
                      transform: isHovered ? "scale(1.01)" : "scale(1)",
                    }}
                  >
                    {/* Icon */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-20">
                      <span className="material-symbols-outlined text-white" style={{ fontSize: 80 }}>
                        {card.icon}
                      </span>
                    </div>

                    {/* Hover overlay with "Try This Look" */}
                    <div
                      className="absolute inset-0 transition-opacity duration-500 flex flex-col justify-end p-8"
                      style={{
                        opacity: isHovered ? 1 : 0,
                        background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)",
                      }}
                    >
                      {card.label && (
                        <span className="text-white/70 text-xs tracking-widest uppercase mb-2">
                          {card.label}
                        </span>
                      )}
                      <h3
                        className="text-white text-xl font-bold mb-3"
                        style={{ fontFamily: "Manrope, sans-serif" }}
                      >
                        {card.title}
                      </h3>
                      <button
                        className="self-start px-4 py-2 bg-white text-[#002b92] rounded-full text-xs font-bold uppercase tracking-widest hover:bg-[#dde1ff] transition-colors"
                        onClick={() => console.log(`Try This Look: ${card.title}`)}
                      >
                        Try This Look
                      </button>
                    </div>

                    {/* Tag badge */}
                    {card.tag && (
                      <div className="absolute top-4 right-4">
                        <span className="bg-white/90 backdrop-blur px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase text-[#002b92]">
                          {card.tag}
                        </span>
                      </div>
                    )}

                    {/* Bottom label (always visible when not hovered) */}
                    {card.label && !isHovered && i === 5 && (
                      <div className="absolute bottom-0 left-0 p-6 w-full bg-white/70 backdrop-blur-md">
                        <p className="text-xs font-bold text-[#002b92] tracking-widest uppercase mb-1">{card.label}</p>
                        <h4 className="text-[#1b1c1b] font-bold" style={{ fontFamily: "Manrope, sans-serif" }}>
                          {card.title}
                        </h4>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Load more */}
        <div className="flex justify-center mt-16">
          <button
            className="px-12 py-4 border-2 border-[#002b92] text-[#002b92] rounded-full font-bold text-sm uppercase tracking-widest hover:bg-[#002b92] hover:text-white transition-all"
            style={{ fontFamily: "Manrope, sans-serif" }}
          >
            Load More
          </button>
        </div>
      </main>

      {/* Mobile nav */}
      <nav className="fixed bottom-0 left-0 w-full flex justify-around items-center px-6 pb-8 pt-4 bg-[#f6f3f2]/80 backdrop-blur-2xl rounded-t-3xl md:hidden z-50">
        {[
          { href: "/discover", icon: "explore", label: "Discover", active: true },
          { href: "/analysis", icon: "analytics", label: "Analysis" },
          { href: "/wardrobe", icon: "checkroom", label: "Wardrobe" },
          { href: "/history", icon: "history", label: "History" },
        ].map(({ href, icon, label, active: isActive }) => (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center justify-center p-2 ${isActive ? "text-[#002b92]" : "text-stone-400"}`}
          >
            <span className="material-symbols-outlined">{icon}</span>
            <span className="text-[10px] font-semibold uppercase tracking-widest mt-1">{label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
