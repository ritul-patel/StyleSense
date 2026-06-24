"use client";

import { useState } from "react";
import Link from "next/link";
import { OUTFITS } from "@/data/outfits";

const CATEGORIES = ["All", "T-Shirts", "Polo", "Shirts", "Jeans", "Sneakers"];
const BUDGETS = ["All", "₹0-999", "₹1000-1999", "₹2000+"];
const BRANDS = ["All", "Myntra", "Snitch", "H&M", "US Polo Assn", "Roadster", "Flying Machine"];

const ITEM_COMBOS = [
  [
    { name: "Beige Tee", dot: "bg-[#8b9a71]" },
    { name: "Blue Jeans", dot: "bg-[#4a729e]" },
    { name: "White Sneakers", dot: "bg-white border border-gray-300" },
  ],
  [
    { name: "Black Polo", dot: "bg-[#1a1a1a]" },
    { name: "Blue Jeans", dot: "bg-[#4a729e]" },
    { name: "White Sneakers", dot: "bg-white border border-gray-300" },
  ],
  [
    { name: "Brown Shirt", dot: "bg-[#5c4033]" },
    { name: "White Jeans", dot: "bg-[#f5f5f5] border border-gray-200" },
    { name: "White Sneakers", dot: "bg-white border border-gray-300" },
  ],
  [
    { name: "White Tee", dot: "bg-white border border-gray-300" },
    { name: "Black Jeans", dot: "bg-[#1a1a1a]" },
    { name: "White Sneakers", dot: "bg-white border border-gray-300" },
  ],
  [
    { name: "Navy Blue Polo", dot: "bg-[#1e2a4f]" },
    { name: "Grey Jeans", dot: "bg-[#6b7280]" },
    { name: "Black Sneakers", dot: "bg-[#1a1a1a]" },
  ],
  [
    { name: "Brown Shirt", dot: "bg-[#8b6b5d]" },
    { name: "Black Jeans", dot: "bg-[#1a1a1a]" },
    { name: "White Sneakers", dot: "bg-white border border-gray-300" },
  ],
  [
    { name: "Maroon Tee", dot: "bg-[#6e2b34]" },
    { name: "Dark Blue Jeans", dot: "bg-[#2b4162]" },
    { name: "White Sneakers", dot: "bg-white border border-gray-300" },
  ],
  [
    { name: "Brown Polo", dot: "bg-[#6b5035]" },
    { name: "Blue Jeans", dot: "bg-[#4a729e]" },
    { name: "White Sneakers", dot: "bg-white border border-gray-300" },
  ]
];

const LOOKS = OUTFITS.map((outfit, index) => ({
  id: outfit.outfit_id,
  image: outfit.imageUrl,
  title: `Look ${String(index + 1).padStart(2, "0")}`,
  subtitle: "Urban everyday outfit.",
  items: ITEM_COMBOS[index % ITEM_COMBOS.length],
}));

export default function DiscoverPage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeBudget, setActiveBudget] = useState("All");
  const [activeBrand, setActiveBrand] = useState("All");

  return (
    <div className="bg-white text-[#1b1c1b] antialiased min-h-screen font-sans">
      {/* Header Nav */}
      <nav className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="flex justify-between items-center w-full px-6 md:px-12 h-20 max-w-[1920px] mx-auto">
          <Link href="/" className="flex items-center gap-3">
            <img src="/logo.png" alt="StyleSense" className="w-8 h-8 object-contain" />
            <span className="text-xl font-bold tracking-tight text-black">StyleSense</span>
          </Link>
          <div className="hidden md:flex items-center gap-8 mt-1">
            <Link
              href="/discover"
              className="text-sm font-bold text-blue-700 border-b-2 border-blue-700 pb-1 uppercase tracking-tight"
            >
              Discover
            </Link>
            {[
              { href: "/analysis", label: "Analysis" },
              { href: "/wardrobe", label: "Wardrobe" },
              { href: "/history", label: "History" },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="text-sm font-semibold text-gray-500 hover:text-black transition-colors uppercase tracking-tight pb-1"
              >
                {label}
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-5">
            <button className="text-gray-600 hover:text-black transition-colors">
              <span className="material-symbols-outlined">shopping_bag</span>
            </button>
            <div className="w-8 h-8 rounded-full bg-[#8c5230] text-white flex items-center justify-center text-sm font-bold">
              R
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-28 pb-32 px-6 md:px-12 max-w-[1920px] mx-auto">
        <header className="mb-6">
          <h1 className="text-3xl md:text-4xl font-extrabold text-black mb-2 tracking-tight">Discover</h1>
          <p className="text-gray-500 text-sm md:text-base font-medium">Find outfit ideas that suit your style.</p>
        </header>

        {/* Search */}
        <div className="relative w-full max-w-2xl mb-8">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">
            search
          </span>
          <input
            type="text"
            placeholder="Search products, colors, or brands..."
            className="w-full bg-gray-100/70 text-sm font-medium rounded-full py-3.5 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-gray-200"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-6 mb-10">
          {/* Categories */}
          <div>
            <h3 className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-3">Categories</h3>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                    activeCategory === cat
                      ? "bg-[#1a1a1a] text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Budget */}
          <div>
            <h3 className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-3">Budget</h3>
            <div className="flex flex-wrap gap-2">
              {BUDGETS.map((bg) => (
                <button
                  key={bg}
                  onClick={() => setActiveBudget(bg)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                    activeBudget === bg
                      ? "bg-[#1a1a1a] text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {bg}
                </button>
              ))}
            </div>
          </div>

          {/* Brands */}
          <div>
            <h3 className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-3">Brands</h3>
            <div className="flex flex-wrap gap-2">
              {BRANDS.map((br) => (
                <button
                  key={br}
                  onClick={() => setActiveBrand(br)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                    activeBrand === br
                      ? "bg-[#1a1a1a] text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {br}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Outfit Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-12">
          {LOOKS.map((look) => (
            <div key={look.id} className="flex flex-col group">
              <div className="relative aspect-[3/4] w-full overflow-hidden rounded-[2rem] mb-5 bg-gray-100">
                <img
                  src={look.image}
                  alt={look.title}
                  loading="lazy"
                  className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <div className="flex flex-col px-1">
                <h3 className="text-lg font-bold text-[#1a1a1a] mb-1">{look.title}</h3>
                <p className="text-xs font-medium text-gray-500 mb-5">{look.subtitle}</p>
                
                <div className="flex flex-col gap-2.5 mb-6">
                  {look.items.map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className={`w-2.5 h-2.5 rounded-sm ${item.dot}`}></div>
                      <span className="text-xs font-bold text-gray-700">{item.name}</span>
                    </div>
                  ))}
                </div>
                
                <div className="flex items-center gap-3 mt-auto">
                  <button className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-50 text-gray-600 hover:bg-gray-200 transition-colors shrink-0">
                    <span className="material-symbols-outlined text-[18px]">favorite_border</span>
                  </button>
                  <button className="flex-1 bg-[#1a1a1a] text-white h-10 rounded-lg text-xs font-bold tracking-wide hover:bg-black transition-colors">
                    View Look
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Mobile nav */}
      <nav className="fixed bottom-0 left-0 w-full flex justify-around items-center px-6 pb-8 pt-4 bg-white/90 backdrop-blur-2xl border-t border-gray-100 md:hidden z-50">
        {[
          { href: "/discover", icon: "explore", label: "Discover", active: true },
          { href: "/analysis", icon: "analytics", label: "Analysis" },
          { href: "/wardrobe", icon: "checkroom", label: "Wardrobe" },
          { href: "/history", icon: "history", label: "History" },
        ].map(({ href, icon, label, active: isActive }) => (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center justify-center p-2 ${isActive ? "text-blue-700" : "text-gray-400"}`}
          >
            <span className="material-symbols-outlined">{icon}</span>
            <span className="text-[10px] font-bold uppercase tracking-widest mt-1">{label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
