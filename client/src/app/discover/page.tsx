"use client";

import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/app/components/Navbar";
import posthog from "posthog-js";
import { OUTFITS } from "@/data/outfits";
import { getProductsForOutfit } from "@/data/outfitProducts";
import { useSavedOutfits } from "@/app/context/SavedOutfitsContext";
import { ScrollStagger, ScrollStaggerItem } from "@/components/motion";

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

const LOOKS = OUTFITS.map((outfit, index) => {
  const { top, bottom, shoes } = getProductsForOutfit(outfit.outfit_id);
  const products = [...top, ...bottom, ...shoes];
  
  const price = products.reduce((sum, p) => sum + p.price, 0);
  const brands = products.map(p => p.brand).filter(Boolean);
  const productNames = products.map(p => p.name).filter(Boolean).join(" ");
  
  const categories = new Set<string>();
  products.forEach(p => {
    if (!p.category && !p.name) return;
    const pCat = (p.category || "").toLowerCase();
    const pName = (p.name || "").toLowerCase();
    if (pCat.includes("tshirt") || pName.includes("tee") || pName.includes("t-shirt")) categories.add("T-Shirts");
    if (pCat.includes("polo") || pName.includes("polo")) categories.add("Polo");
    if ((pCat.includes("shirt") && !pCat.includes("tshirt") && !pCat.includes("polo")) || (pName.includes("shirt") && !pName.includes("tshirt") && !pName.includes("polo") && !pName.includes("t-shirt"))) categories.add("Shirts");
    if (pCat.includes("jeans") || pName.includes("jeans")) categories.add("Jeans");
    if (pCat.includes("sneakers") || pCat.includes("shoes") || pName.includes("sneaker") || pName.includes("shoes")) categories.add("Sneakers");
  });

  return {
    id: outfit.outfit_id,
    image: outfit.imageUrl || "",
    title: `Look ${String(index + 1).padStart(2, "0")}`,
    subtitle: "Urban everyday outfit.",
    items: ITEM_COMBOS[index % ITEM_COMBOS.length],
    price,
    brands,
    categories: Array.from(categories),
    searchTerms: productNames.toLowerCase(),
  };
}).filter(look => look.image); // Only show looks with a valid image

// Shuffle array using Fisher-Yates (creates a new array, never mutates source)
function shuffle<T>(arr: readonly T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export default function DiscoverPage() {
  const { isSaved, saveOutfit, removeOutfit } = useSavedOutfits();
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeBudget, setActiveBudget] = useState("All");
  const [activeBrands, setActiveBrands] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Shuffle outfits once AFTER hydration to avoid server/client mismatch.
  // Initial render uses deterministic LOOKS order (identical on server + client).
  // After mount, we shuffle once and store the result in state.
  const [shuffledLooks, setShuffledLooks] = useState(LOOKS);
  const hasShuffled = useRef(false);

  useEffect(() => {
    if (!hasShuffled.current) {
      hasShuffled.current = true;
      setShuffledLooks(shuffle(LOOKS));
    }
  }, []);

  // Track filter changes (debounced for search)
  const handleCategoryChange = useCallback((cat: string) => {
    setActiveCategory(cat);
    if (cat !== "All") posthog.capture("discover_filter_changed", { filter: "category", value: cat });
  }, []);

  const handleBudgetChange = useCallback((budget: string) => {
    setActiveBudget(budget);
    if (budget !== "All") posthog.capture("discover_filter_changed", { filter: "budget", value: budget });
  }, []);

  const handleBrandToggle = useCallback((brand: string) => {
    if (brand === "All") {
      setActiveBrands([]);
    } else {
      setActiveBrands(prev => {
        const next = prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand];
        if (next.length > 0) posthog.capture("discover_filter_changed", { filter: "brand", value: next.join(",") });
        return next;
      });
    }
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    // Debounce search tracking — only fire after 800ms of inactivity
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (value.trim().length >= 2) {
      searchTimerRef.current = setTimeout(() => {
        posthog.capture("discover_search_used", { query: value.trim() });
      }, 800);
    }
  }, []);

  const filteredLooks = useMemo(() => {
    return shuffledLooks.filter(look => {
      // Search
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!look.title.toLowerCase().includes(query) && 
            !look.searchTerms.includes(query) && 
            !look.brands.some(b => b.toLowerCase().includes(query))) {
          return false;
        }
      }

      // Category
      if (activeCategory !== "All" && !look.categories.includes(activeCategory)) {
        return false;
      }

      // Budget
      if (activeBudget !== "All") {
        if (activeBudget === "₹0-999" && look.price > 999) return false;
        if (activeBudget === "₹1000-1999" && (look.price < 1000 || look.price > 1999)) return false;
        if (activeBudget === "₹2000+" && look.price < 2000) return false;
      }

      // Brands
      if (activeBrands.length > 0) {
        const hasMatch = activeBrands.some(ab => {
          const normAb = ab.toLowerCase().replace(/[^a-z0-9]/g, '');
          return look.brands.some(lb => lb.toLowerCase().replace(/[^a-z0-9]/g, '').includes(normAb));
        });
        if (!hasMatch) return false;
      }

      return true;
    });
  }, [searchQuery, activeCategory, activeBudget, activeBrands, shuffledLooks]);

  return (
    <div className="bg-white text-[#1b1c1b] antialiased min-h-screen font-sans">
      {/* Header Nav */}
      <Navbar activePath="discover" />

      {/* Main Content */}
      <main className="pt-28 pb-32 px-4 sm:px-6 md:px-12 max-w-[1440px] mx-auto">
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
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search products, colors, or brands..."
            className="w-full bg-gray-100/70 text-sm font-medium rounded-full py-3.5 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
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
                  onClick={() => handleCategoryChange(cat)}
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
                  onClick={() => handleBudgetChange(bg)}
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
              {BRANDS.map((br) => {
                const isActive = br === "All" ? activeBrands.length === 0 : activeBrands.includes(br);
                return (
                  <button
                    key={br}
                    onClick={() => handleBrandToggle(br)}
                    className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                      isActive
                        ? "bg-[#1a1a1a] text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {br}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Outfit Grid */}
        <ScrollStagger className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-12">
          {filteredLooks.length === 0 ? (
            <div className="col-span-full py-20 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-gray-400 text-2xl">search_off</span>
              </div>
              <p className="text-gray-500 font-medium mb-2">No outfits found</p>
              <p className="text-gray-400 text-sm">Try changing your filters or search term.</p>
              {(activeCategory !== "All" || activeBudget !== "All" || activeBrands.length > 0 || searchQuery) && (
                <button
                  onClick={() => { setActiveCategory("All"); setActiveBudget("All"); setActiveBrands([]); setSearchQuery(""); }}
                  className="mt-4 px-5 py-2 rounded-full text-sm font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                >
                  Clear all filters
                </button>
              )}
            </div>
          ) : (
            filteredLooks.map((look, lookIndex) => (
              <ScrollStaggerItem key={look.id}>
              <Link href={`/outfit/${look.id}`} className="flex flex-col group cursor-pointer"
                onClick={() => posthog.capture("discover_product_viewed", { outfit_id: look.id, title: look.title })}
              >
                <div className="relative aspect-[3/4] md:aspect-[3/4] w-full overflow-hidden rounded-[2rem] mb-5 bg-gray-100">
                  <Image
                    src={look.image}
                    alt={`Outfit ${look.id}`}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                    className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
                    priority={lookIndex < 4}
                    loading={lookIndex < 4 ? "eager" : "lazy"}
                  />
                </div>
                <div className="flex flex-col px-1">
                  <div className="flex flex-col gap-2.5 mb-6">
                    {look.items.map((item, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className={`w-2.5 h-2.5 rounded-sm ${item.dot}`}></div>
                        <span className="text-xs font-bold text-gray-700">{item.name}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex items-center gap-3 mt-auto">
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        if (isSaved(look.id)) removeOutfit(look.id);
                        else saveOutfit(look.id);
                      }}
                      className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-50 text-gray-600 hover:bg-gray-200 transition-colors shrink-0"
                    >
                      <span className={`material-symbols-outlined text-[18px] ${isSaved(look.id) ? "text-red-500" : ""}`}>
                        {isSaved(look.id) ? "favorite" : "favorite_border"}
                      </span>
                    </button>
                    <div className="flex-1 bg-[#1a1a1a] text-white h-10 rounded-lg flex items-center justify-center text-xs font-bold tracking-wide hover:bg-black transition-colors">
                      View Look
                    </div>
                  </div>
                </div>
              </Link>
              </ScrollStaggerItem>
            ))
          )}
        </ScrollStagger>
      </main>

      {/* Mobile nav */}
      
    </div>
  );
}
