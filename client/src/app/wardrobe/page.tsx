"use client";

import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/app/components/Navbar";
import RequireAuth from "../components/RequireAuth";
import { useWardrobe } from "../context/WardrobeContext";
import { fetchProductsLegacy, type LegacyProduct } from "@/lib/products-api";
import { PRODUCTS as STATIC_PRODUCTS } from "@/data/products";
import type { ColorEntry } from "@/types/analysis";
import type { ClosetItem, OutfitBuild } from "@/lib/wardrobe-repository";

// Use LegacyProduct as the local Product type for backward compat
type Product = LegacyProduct;

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_MAP: Record<string, string> = { tshirt: "T-Shirts", polo: "Polo", shirt: "Shirts", jeans: "Jeans", sneakers: "Sneakers" };
const CLOSET_CATEGORIES = ["T-Shirt", "Shirt", "Polo", "Jeans", "Pants", "Jacket", "Sneakers", "Other"];
const TABS = ["Recommended", "Wishlist", "My Closet", "Collections", "Outfit Builder", "All Products"] as const;
type Tab = (typeof TABS)[number];

// ─── AI Recommendation Logic ──────────────────────────────────────────────────

function getLatestAnalysis(): { best_colors: ColorEntry[] } | null {
  // Read from sessionStorage first (fresh), then localStorage (persistent)
  for (const key of ["analysis_result", "last_analysis"]) {
    try {
      const storage = key === "analysis_result" ? sessionStorage : localStorage;
      const raw = storage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      const data = parsed?.data || parsed;
      if (data?.best_colors?.length > 0) return data;
    } catch { /* ignore */ }
  }
  return null;
}

function computeMatchScore(product: Product, bestColors: ColorEntry[]): number {
  const pc = product.color.toLowerCase();
  if (!pc) return 0;
  let best = 0;
  for (const c of bestColors) {
    const cn = c.name.toLowerCase();
    // Exact match
    if (pc === cn || pc.includes(cn) || cn.includes(pc)) {
      best = Math.max(best, 95);
      continue;
    }
    // Word-level match
    for (const word of cn.split(/[\s-]+/)) {
      if (word.length > 2 && pc.includes(word)) best = Math.max(best, 80);
    }
    for (const word of pc.split(/[\s-]+/)) {
      if (word.length > 2 && cn.includes(word)) best = Math.max(best, 75);
    }
  }
  return best;
}

// ─── Sub-Components ───────────────────────────────────────────────────────────

function ProductGrid({ product, score, wishlisted, onToggle }: { product: Product; score?: number; wishlisted: boolean; onToggle: () => void }) {
  const [imgErr, setImgErr] = useState(false);
  if (!product.name) return null;
  return (
    <div className="group bg-white dark:bg-[#1b1c1b] rounded-2xl overflow-hidden border border-black/5 dark:border-white/5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
      <div className="relative aspect-[3/4] bg-[#f6f3f2] dark:bg-[#0f0f14] overflow-hidden">
        {product.image && !imgErr ? (
          <Image src={product.image} alt={product.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(max-width:768px) 50vw,(max-width:1200px) 33vw,25vw" onError={() => setImgErr(true)} unoptimized />
        ) : (
          <div className="w-full h-full flex items-center justify-center"><span className="material-symbols-outlined text-stone-300" style={{ fontSize: 48 }}>checkroom</span></div>
        )}
        {score !== undefined && score > 0 && (
          <div className="absolute top-3 left-3"><span className="bg-[#002b92] text-white text-[9px] font-bold px-2.5 py-1 rounded-full">{score}% Match</span></div>
        )}
        <button onClick={(e) => { e.preventDefault(); onToggle(); }} aria-label={wishlisted ? "Remove from wishlist" : "Save to wishlist"}
          className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center shadow-sm hover:scale-110 active:scale-95 transition-transform">
          <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: wishlisted ? "'FILL' 1" : "'FILL' 0", color: wishlisted ? "#e11d48" : "#6b7280" }}>favorite</span>
        </button>
      </div>
      <div className="p-4 space-y-1.5">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#002b92] dark:text-[#b7c4ff]">{product.brand || "Brand"}</p>
        <h4 className="text-sm font-semibold line-clamp-2 leading-tight">{product.name}</h4>
        <div className="flex items-center justify-between pt-1">
          <span className="text-base font-bold">₹{product.price.toLocaleString("en-IN")}</span>
          {product.storeUrl && <a href={product.storeUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold uppercase text-[#002b92] hover:underline">Buy →</a>}
        </div>
      </div>
    </div>
  );
}

function ClosetCard({ item, onRemove }: { item: ClosetItem; onRemove: () => void }) {
  return (
    <div className="group bg-white dark:bg-[#1b1c1b] rounded-2xl overflow-hidden border border-black/5 dark:border-white/5 hover:shadow-xl transition-all duration-300">
      <div className="relative aspect-square bg-[#f6f3f2] dark:bg-[#0f0f14] overflow-hidden">
        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
        <button onClick={onRemove} aria-label="Remove" className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 dark:bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="material-symbols-outlined text-[16px] text-red-500">delete</span>
        </button>
        {item.category && <div className="absolute bottom-3 left-3"><span className="bg-black/60 text-white text-[9px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider backdrop-blur-sm">{item.category}</span></div>}
      </div>
      <div className="p-3">
        <h4 className="text-sm font-semibold line-clamp-1">{item.name}</h4>
        {item.color && <p className="text-[10px] text-[#747686] uppercase tracking-wider mt-1">{item.color}</p>}
      </div>
    </div>
  );
}

function UploadModal({ onAdd, onClose }: { onAdd: (item: Omit<ClosetItem, "id" | "createdAt">) => void; onClose: () => void }) {
  const [preview, setPreview] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("T-Shirt");
  const [color, setColor] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4" onClick={onClose}>
      <div className="bg-white dark:bg-[#1b1c1b] rounded-3xl p-6 w-full max-w-md space-y-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-xl font-bold" style={{ fontFamily: "Manrope, sans-serif" }}>Add to My Closet</h3>
        <div className="relative aspect-square w-full max-w-[200px] mx-auto rounded-2xl overflow-hidden bg-[#f6f3f2] dark:bg-[#0f0f14] border-2 border-dashed border-[#c4c5d7] cursor-pointer" onClick={() => fileRef.current?.click()}>
          {preview ? <img src={preview} alt="Preview" className="w-full h-full object-cover" /> : (
            <div className="flex flex-col items-center justify-center h-full gap-2">
              <span className="material-symbols-outlined text-[#747686]" style={{ fontSize: 40 }}>add_a_photo</span>
              <span className="text-xs text-[#747686] font-semibold">Tap to upload</span>
            </div>
          )}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
        </div>
        <input type="text" placeholder="Item name" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-[#c4c5d7] dark:border-[#333] bg-transparent text-sm focus:outline-none focus:border-[#002b92]" />
        <div className="flex gap-3">
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="flex-1 px-4 py-3 rounded-xl border border-[#c4c5d7] dark:border-[#333] bg-transparent text-sm">
            {CLOSET_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <input type="text" placeholder="Color" value={color} onChange={(e) => setColor(e.target.value)} className="flex-1 px-4 py-3 rounded-xl border border-[#c4c5d7] dark:border-[#333] bg-transparent text-sm" />
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-[#c4c5d7] text-sm font-bold">Cancel</button>
          <button onClick={() => { if (preview && name.trim()) { onAdd({ imageUrl: preview, name: name.trim(), category, color: color.trim() }); onClose(); } }} disabled={!preview || !name.trim()} className="flex-1 py-3 rounded-xl text-white text-sm font-bold disabled:opacity-40" style={{ background: "linear-gradient(135deg, #003ec7, #002b92)" }}>Add Item</button>
        </div>
      </div>
    </div>
  );
}

// ─── Outfit Builder Panel ─────────────────────────────────────────────────────

function OutfitBuilderPanel({ onSave }: { onSave: (outfit: Omit<OutfitBuild, "id" | "createdAt">) => void }) {
  const { items, closetItems } = useWardrobe();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [selectedCloset, setSelectedCloset] = useState<Set<string>>(new Set());
  const [outfitName, setOutfitName] = useState("");

  const wishlistProducts = useMemo(() => {
    const ids = items.map((i) => i.productId);
    return STATIC_PRODUCTS.filter((p) => ids.includes(p.id) && p.name);
  }, [items]);

  const toggleProduct = (id: string) => {
    setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };
  const toggleCloset = (id: string) => {
    setSelectedCloset((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const canSave = (selected.size + selectedCloset.size) >= 2 && outfitName.trim();

  return (
    <div className="space-y-8">
      <div className="bg-white dark:bg-[#1b1c1b] rounded-2xl p-6 border border-black/5 dark:border-white/5">
        <h3 className="text-lg font-bold mb-4" style={{ fontFamily: "Manrope, sans-serif" }}>Build an Outfit</h3>
        <p className="text-sm text-[#747686] mb-4">Select 2+ items from your wardrobe or closet to create a look.</p>
        <input type="text" placeholder="Outfit name (e.g. Weekend Casual)" value={outfitName} onChange={(e) => setOutfitName(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-[#c4c5d7] dark:border-[#333] bg-transparent text-sm mb-4 focus:outline-none focus:border-[#002b92]" />
        <button onClick={() => { if (canSave) { onSave({ name: outfitName.trim(), productIds: [...selected], closetItemIds: [...selectedCloset] }); setSelected(new Set()); setSelectedCloset(new Set()); setOutfitName(""); } }} disabled={!canSave}
          className="px-6 py-3 rounded-xl text-white text-sm font-bold disabled:opacity-40 transition-transform hover:scale-[1.02]" style={{ background: "linear-gradient(135deg, #003ec7, #002b92)" }}>
          Save Outfit ({selected.size + selectedCloset.size} items)
        </button>
      </div>

      {/* Product selection */}
      {wishlistProducts.length > 0 && (
        <div>
          <h4 className="text-sm font-bold uppercase tracking-wider text-[#747686] mb-3">From Wardrobe</h4>
          <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-3">
            {wishlistProducts.slice(0, 18).map((p) => (
              <button key={p.id} onClick={() => toggleProduct(p.id)} className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${selected.has(p.id) ? "border-[#002b92] ring-2 ring-[#002b92]/30" : "border-transparent hover:border-[#c4c5d7]"}`}>
                {p.image ? <Image src={p.image} alt={p.name} fill className="object-cover" unoptimized /> : <div className="w-full h-full bg-[#f0edec] flex items-center justify-center"><span className="material-symbols-outlined text-stone-400">checkroom</span></div>}
                {selected.has(p.id) && <div className="absolute inset-0 bg-[#002b92]/20 flex items-center justify-center"><span className="material-symbols-outlined text-white text-2xl">check_circle</span></div>}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Closet selection */}
      {closetItems.length > 0 && (
        <div>
          <h4 className="text-sm font-bold uppercase tracking-wider text-[#747686] mb-3">From Closet</h4>
          <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-3">
            {closetItems.map((item) => (
              <button key={item.id} onClick={() => toggleCloset(item.id)} className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${selectedCloset.has(item.id) ? "border-[#002b92] ring-2 ring-[#002b92]/30" : "border-transparent hover:border-[#c4c5d7]"}`}>
                <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                {selectedCloset.has(item.id) && <div className="absolute inset-0 bg-[#002b92]/20 flex items-center justify-center"><span className="material-symbols-outlined text-white text-2xl">check_circle</span></div>}
              </button>
            ))}
          </div>
        </div>
      )}

      {wishlistProducts.length === 0 && closetItems.length === 0 && (
        <div className="text-center py-12">
          <p className="text-[#747686]">Save products or upload closet items first to build outfits.</p>
        </div>
      )}
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ icon, title, desc, cta, href, onClick }: { icon: string; title: string; desc: string; cta?: string; href?: string; onClick?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-20 h-20 rounded-full bg-[#dde1ff] flex items-center justify-center mb-6">
        <span className="material-symbols-outlined text-[#002b92]" style={{ fontSize: 40 }}>{icon}</span>
      </div>
      <h2 className="text-2xl font-bold mb-3" style={{ fontFamily: "Manrope, sans-serif" }}>{title}</h2>
      <p className="text-[#434654] dark:text-[#a0a0b8] mb-8 max-w-sm">{desc}</p>
      {cta && href && <Link href={href} className="px-8 py-4 rounded-full text-white font-bold hover:scale-[1.02] transition-transform" style={{ background: "linear-gradient(135deg, #003ec7, #002b92)" }}>{cta}</Link>}
      {cta && onClick && <button onClick={onClick} className="px-8 py-4 rounded-full text-white font-bold hover:scale-[1.02] transition-transform" style={{ background: "linear-gradient(135deg, #003ec7, #002b92)" }}>{cta}</button>}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

function WardrobePageContent() {
  const [activeTab, setActiveTab] = useState<Tab>("Recommended");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedCollection, setSelectedCollection] = useState("Casual");
  const [showUpload, setShowUpload] = useState(false);
  const [newColName, setNewColName] = useState("");
  const [showNewCol, setShowNewCol] = useState(false);

  const {
    items, addToWardrobe, removeFromWardrobe, isInWardrobe, getCollection, moveToCollection,
    collections, createCollection, renameCollection, deleteCollection,
    closetItems, addClosetItem, removeClosetItem,
    outfits, saveOutfit, removeOutfit, ready,
  } = useWardrobe();

  const [allProducts, setAllProducts] = useState<Product[]>([]);

  useEffect(() => {
    fetchProductsLegacy().then((apiProducts) => {
      // Use API products if available, otherwise fall back to static catalog
      if (apiProducts.length > 0) {
        setAllProducts(apiProducts);
      } else {
        setAllProducts(STATIC_PRODUCTS as Product[]);
      }
    });
  }, []);

  const validProducts = useMemo(() => allProducts.filter((p) => p.name && p.id), [allProducts]);
  const categories = useMemo(() => {
    const m = new Map<string, Product[]>();
    for (const p of validProducts) { const c = p.category || "other"; if (!m.has(c)) m.set(c, []); m.get(c)!.push(p); }
    return m;
  }, [validProducts]);

  // AI Recommendations
  const { recommended, hasAnalysis } = useMemo(() => {
    const analysis = getLatestAnalysis();
    if (!analysis?.best_colors?.length) return { recommended: [] as { product: Product; score: number }[], hasAnalysis: false };
    const scored = validProducts.map((p) => ({ product: p, score: computeMatchScore(p, analysis.best_colors) })).filter((x) => x.score > 0).sort((a, b) => b.score - a.score).slice(0, 16);
    return { recommended: scored, hasAnalysis: true };
  }, [validProducts]);

  const wishlistProducts = useMemo(() => {
    const ids = getCollection("Wishlist").map((i) => i.productId);
    return validProducts.filter((p) => ids.includes(p.id));
  }, [items, validProducts, getCollection]);

  const collectionProducts = useMemo(() => {
    const ids = getCollection(selectedCollection).map((i) => i.productId);
    return validProducts.filter((p) => ids.includes(p.id));
  }, [items, selectedCollection, validProducts, getCollection]);

  const allDisplayed = useMemo(() => {
    if (selectedCategory) return categories.get(selectedCategory) || [];
    return validProducts;
  }, [selectedCategory, categories, validProducts]);

  const toggle = useCallback((id: string) => {
    if (isInWardrobe(id)) removeFromWardrobe(id);
    else addToWardrobe(id, "Wishlist");
  }, [isInWardrobe, removeFromWardrobe, addToWardrobe]);

  if (!ready) {
    return (
      <div className="bg-[#fcf9f8] dark:bg-[#0f0f14] text-[#1b1c1b] dark:text-[#fcf9f8] antialiased min-h-screen" style={{ fontFamily: "Inter, sans-serif" }}>
        <Navbar activePath="wardrobe" />
        <main className="pt-28 pb-32 px-4 md:px-8 max-w-[1440px] mx-auto">
          <div className="mb-10 space-y-2">
            <div className="h-6 w-32 bg-[#e4e2e1] dark:bg-[#2a2a2a] rounded-full animate-pulse" />
            <div className="h-10 w-64 bg-[#e4e2e1] dark:bg-[#2a2a2a] rounded-xl animate-pulse" />
            <div className="h-4 w-48 bg-[#e4e2e1] dark:bg-[#2a2a2a] rounded animate-pulse" />
          </div>
          <div className="flex gap-2 mb-8">
            {[1, 2, 3, 4].map((i) => <div key={i} className="h-10 w-24 bg-[#e4e2e1] dark:bg-[#2a2a2a] rounded-full animate-pulse" />)}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="bg-white dark:bg-[#1b1c1b] rounded-2xl overflow-hidden border border-black/5 dark:border-white/5 animate-pulse">
                <div className="aspect-[3/4] bg-[#e4e2e1] dark:bg-[#2a2a2a]" />
                <div className="p-4 space-y-2">
                  <div className="h-3 w-16 bg-[#e4e2e1] dark:bg-[#2a2a2a] rounded" />
                  <div className="h-4 w-32 bg-[#e4e2e1] dark:bg-[#2a2a2a] rounded" />
                  <div className="h-5 w-20 bg-[#e4e2e1] dark:bg-[#2a2a2a] rounded" />
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="bg-[#fcf9f8] dark:bg-[#0f0f14] text-[#1b1c1b] dark:text-[#fcf9f8] antialiased min-h-screen" style={{ fontFamily: "Inter, sans-serif" }}>
      <Navbar activePath="wardrobe" />
      {showUpload && <UploadModal onAdd={addClosetItem} onClose={() => setShowUpload(false)} />}

      <main className="pt-28 pb-32 px-4 md:px-8 max-w-[1440px] mx-auto">
        <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-[#dde1ff] text-[#001452] text-[10px] uppercase tracking-widest font-bold">Personal Collection</div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight" style={{ fontFamily: "Manrope, sans-serif" }}>My Wardrobe</h1>
            <p className="text-[#434654] dark:text-[#a0a0b8] text-sm max-w-md">Save products, build outfits, and get AI-matched recommendations.</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-[#747686]">{items.length + closetItems.length} items</span>
            <Link href="/discover" className="px-5 py-2.5 rounded-full text-white text-xs font-bold uppercase tracking-wider hover:scale-[1.02] transition-transform" style={{ background: "linear-gradient(135deg, #003ec7, #002b92)" }}>+ Discover</Link>
          </div>
        </header>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 overflow-x-auto pb-2 no-scrollbar">
          {TABS.map((tab) => (
            <button key={tab} onClick={() => { setActiveTab(tab); setSelectedCategory(null); }}
              className={`px-4 py-2.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${activeTab === tab ? "bg-[#1b1c1b] dark:bg-white text-white dark:text-[#1b1c1b] shadow-md" : "bg-[#f0edec] dark:bg-[#202020] text-[#434654] dark:text-[#a0a0b8] hover:bg-[#e4e2e1]"}`}>
              {tab}
              {tab === "Wishlist" && wishlistProducts.length > 0 && <span className="ml-1 bg-[#e11d48] text-white text-[9px] px-1.5 py-0.5 rounded-full">{wishlistProducts.length}</span>}
              {tab === "My Closet" && closetItems.length > 0 && <span className="ml-1 bg-[#002b92] text-white text-[9px] px-1.5 py-0.5 rounded-full">{closetItems.length}</span>}
              {tab === "Outfit Builder" && outfits.length > 0 && <span className="ml-1 bg-[#002b92] text-white text-[9px] px-1.5 py-0.5 rounded-full">{outfits.length}</span>}
            </button>
          ))}
        </div>

        {/* ═══ RECOMMENDED ═══ */}
        {activeTab === "Recommended" && (hasAnalysis ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {recommended.map(({ product, score }) => <ProductGrid key={product.id} product={product} score={score} wishlisted={isInWardrobe(product.id)} onToggle={() => toggle(product.id)} />)}
          </div>
        ) : <EmptyState icon="auto_awesome" title="Get Personalized Picks" desc="Complete a color analysis to unlock AI-matched product recommendations." cta="Start Analysis" href="/analysis" />)}

        {/* ═══ WISHLIST ═══ */}
        {activeTab === "Wishlist" && (wishlistProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {wishlistProducts.map((p) => <ProductGrid key={p.id} product={p} wishlisted onToggle={() => toggle(p.id)} />)}
          </div>
        ) : <EmptyState icon="favorite" title="Your Wishlist is Empty" desc="Tap the heart icon on any product to save it here." cta="Explore Products" href="/discover" />)}

        {/* ═══ MY CLOSET ═══ */}
        {activeTab === "My Closet" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <p className="text-sm text-[#747686]">{closetItems.length} items</p>
              <button onClick={() => setShowUpload(true)} className="px-5 py-2.5 rounded-full text-white text-xs font-bold uppercase tracking-wider hover:scale-[1.02] transition-transform" style={{ background: "linear-gradient(135deg, #003ec7, #002b92)" }}>
                <span className="material-symbols-outlined text-sm mr-1 align-middle">add_a_photo</span>Upload
              </button>
            </div>
            {closetItems.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {closetItems.map((item) => <ClosetCard key={item.id} item={item} onRemove={() => removeClosetItem(item.id)} />)}
              </div>
            ) : <EmptyState icon="checkroom" title="Your Closet is Empty" desc="Upload photos of your own clothes to build your virtual wardrobe." cta="Upload First Item" onClick={() => setShowUpload(true)} />}
          </div>
        )}

        {/* ═══ COLLECTIONS ═══ */}
        {activeTab === "Collections" && (
          <>
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2 no-scrollbar items-center">
              {collections.filter((c) => c.name !== "Wishlist").map((col) => (
                <button key={col.id} onClick={() => setSelectedCollection(col.name)}
                  className={`px-4 py-2 rounded-full text-[11px] font-bold uppercase tracking-wider whitespace-nowrap border transition-all ${selectedCollection === col.name ? "border-[#002b92] bg-[#002b92]/5 text-[#002b92]" : "border-[#c4c5d7] dark:border-[#333] text-[#747686] hover:border-[#002b92]/50"}`}>
                  {col.name} ({getCollection(col.name).length})
                </button>
              ))}
              {!showNewCol ? (
                <button onClick={() => setShowNewCol(true)} className="px-3 py-2 rounded-full border border-dashed border-[#c4c5d7] text-[#747686] text-[11px] font-bold hover:border-[#002b92]">+ New</button>
              ) : (
                <div className="flex items-center gap-1">
                  <input type="text" value={newColName} onChange={(e) => setNewColName(e.target.value)} placeholder="Name" className="px-3 py-1.5 rounded-full border border-[#002b92] text-xs w-24 focus:outline-none" autoFocus onKeyDown={(e) => { if (e.key === "Enter" && newColName.trim()) { createCollection(newColName.trim()); setNewColName(""); setShowNewCol(false); } }} />
                  <button onClick={() => { if (newColName.trim()) { createCollection(newColName.trim()); setNewColName(""); setShowNewCol(false); } }} className="text-[#002b92] text-xs font-bold">Add</button>
                  <button onClick={() => setShowNewCol(false)} className="text-[#747686] text-xs">✕</button>
                </div>
              )}
            </div>
            {collectionProducts.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {collectionProducts.map((p) => <ProductGrid key={p.id} product={p} wishlisted={isInWardrobe(p.id)} onToggle={() => toggle(p.id)} />)}
              </div>
            ) : <EmptyState icon="folder" title={`No items in "${selectedCollection}"`} desc="Save products to this collection from the Discover page." />}
          </>
        )}

        {/* ═══ OUTFIT BUILDER ═══ */}
        {activeTab === "Outfit Builder" && (
          <div className="space-y-8">
            <OutfitBuilderPanel onSave={saveOutfit} />
            {outfits.length > 0 && (
              <div>
                <h3 className="text-lg font-bold mb-4" style={{ fontFamily: "Manrope, sans-serif" }}>Saved Outfits</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {outfits.map((o) => (
                    <div key={o.id} className="bg-white dark:bg-[#1b1c1b] rounded-2xl p-4 border border-black/5 dark:border-white/5">
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="font-bold text-sm">{o.name}</h4>
                        <button onClick={() => removeOutfit(o.id)} className="text-[#747686] hover:text-red-500 transition-colors"><span className="material-symbols-outlined text-[18px]">delete</span></button>
                      </div>
                      <p className="text-[10px] text-[#747686] uppercase tracking-wider">{o.productIds.length + o.closetItemIds.length} items</p>
                      <div className="flex gap-1 mt-2 overflow-hidden">
                        {o.productIds.slice(0, 4).map((pid) => {
                          const p = allProducts.find((x) => x.id === pid);
                          return p?.image ? <div key={pid} className="w-10 h-10 rounded-lg overflow-hidden relative flex-shrink-0"><Image src={p.image} alt="" fill className="object-cover" unoptimized /></div> : null;
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══ ALL PRODUCTS ═══ */}
        {activeTab === "All Products" && (
          <>
            <div className="flex gap-2 mb-8 overflow-x-auto pb-2 no-scrollbar">
              <button onClick={() => setSelectedCategory(null)} className={`px-4 py-2 rounded-full text-[11px] font-bold uppercase tracking-wider whitespace-nowrap border transition-all ${!selectedCategory ? "border-[#002b92] bg-[#002b92]/5 text-[#002b92]" : "border-[#c4c5d7] text-[#747686]"}`}>All ({validProducts.length})</button>
              {Array.from(categories.entries()).map(([cat, prods]) => (
                <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-4 py-2 rounded-full text-[11px] font-bold uppercase tracking-wider whitespace-nowrap border transition-all ${selectedCategory === cat ? "border-[#002b92] bg-[#002b92]/5 text-[#002b92]" : "border-[#c4c5d7] text-[#747686]"}`}>{CATEGORY_MAP[cat] || cat} ({prods.length})</button>
              ))}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {allDisplayed.map((p) => <ProductGrid key={p.id} product={p} wishlisted={isInWardrobe(p.id)} onToggle={() => toggle(p.id)} />)}
            </div>
          </>
        )}
      </main>
      <style>{`.no-scrollbar::-webkit-scrollbar{display:none}.no-scrollbar{-ms-overflow-style:none;scrollbar-width:none}`}</style>
    </div>
  );
}

export default function WardrobePage() {
  return (<RequireAuth><WardrobePageContent /></RequireAuth>);
}
