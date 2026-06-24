"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import html2canvas from "html2canvas";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import posthog from "posthog-js";
import { OUTFITS, Outfit } from "@/data/outfits";
import { PRODUCTS } from "@/data/products";
import { useSavedOutfits } from "../../context/SavedOutfitsContext";
import { OUTFIT_PRODUCTS, getProductsForOutfit } from "@/data/outfitProducts";
import { generateOutfitTitle, getOutfitStyle, generateOutfitDescription, getSimilarOutfits, getAlternativeProducts, generateOutfitTags } from "@/utils/outfitLogic";
import ProductCard from "../../components/ProductCard";
import RelatedLookCard from "../../components/RelatedLookCard";
import { ArrowLeft, ArrowRight, CreditCard, Download, Favorite, Image as LucideImage, SearchX, Share2, Shirt, Wand2 } from "lucide-react";

function shortProductName(p: { name: string; color: string; category: string }): string {
  const color = p.color ? p.color.split("-")[0].split("/")[0].split("+")[0].trim() : "";
  let type = "Piece";
  const nameLower = p.name.toLowerCase();
  const categoryLower = p.category.toLowerCase();

  if (categoryLower === "tshirt" || categoryLower === "polo" || categoryLower === "shirt" || categoryLower === "top") {
    if (categoryLower === "tshirt") {
      type = "Tee";
    } else if (categoryLower === "polo") {
      type = "Polo";
    } else if (categoryLower === "shirt") {
      type = "Shirt";
    } else {
      if (nameLower.includes("t-shirt") || nameLower.includes("tshirt") || nameLower.includes("tee")) {
        type = "Tee";
      } else if (nameLower.includes("polo")) {
        type = "Polo";
      } else if (nameLower.includes("shirt")) {
        type = "Shirt";
      } else {
        type = "Tee";
      }
    }
  } else if (categoryLower === "jeans" || categoryLower === "bottom") {
    type = "Jeans";
  } else if (categoryLower === "sneakers" || categoryLower === "shoes") {
    type = "Sneakers";
  }
  const result = color ? `${color} ${type}` : type;
  const capitalized = result.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
  return capitalized.length > 20 ? capitalized.substring(0, 17) + "..." : capitalized;
}

export default function OutfitDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { isSaved, saveOutfit, removeOutfit } = useSavedOutfits();
  const [toastMessage, setToastMessage] = useState("");
  const heroRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [recentOutfits, setRecentOutfits] = useState<Outfit[]>([]);
  const [isHeroPortrait, setIsHeroPortrait] = useState(true);
  const [heroImgError, setHeroImgError] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const outfitId = typeof params?.id === "string" ? params.id : "";

  const outfit = useMemo(() => {
    return OUTFITS.find((o) => o.outfit_id === outfitId) ?? null;
  }, [outfitId]);

  // Fallback values used when outfit is null — prevents hook ordering issues
  const safeOutfit = outfit ?? OUTFITS[0];

  const { top, bottom, shoes } = useMemo(() => {
    return getProductsForOutfit(safeOutfit.outfit_id);
  }, [safeOutfit.outfit_id]);

  const styleKeyword = useMemo(() => getOutfitStyle(safeOutfit.outfit_id), [safeOutfit.outfit_id]);
  const outfitTitle = useMemo(() => generateOutfitTitle(safeOutfit.outfit_id, top?.[0]?.color), [safeOutfit.outfit_id, top]);
  const outfitDesc = useMemo(() => generateOutfitDescription(styleKeyword), [styleKeyword]);

  const relatedLooks = useMemo(() => {
    return getSimilarOutfits(safeOutfit.outfit_id, OUTFITS, OUTFIT_PRODUCTS, PRODUCTS);
  }, [safeOutfit.outfit_id]);

  const alternativeTops = useMemo(() => {
    return top?.[0] ? getAlternativeProducts(top[0].id, top[0].category, top[0].color, PRODUCTS) : [];
  }, [top]);

  const alternativeBottoms = useMemo(() => {
    return bottom?.[0] ? getAlternativeProducts(bottom[0].id, bottom[0].category, bottom[0].color, PRODUCTS) : [];
  }, [bottom]);

  const alternativeShoes = useMemo(() => {
    return shoes?.[0] ? getAlternativeProducts(shoes[0].id, shoes[0].category, shoes[0].color, PRODUCTS) : [];
  }, [shoes]);

  const totalPrice = useMemo(() => {
    let sum = 0;
    if (top?.[0]) sum += top[0].price;
    if (bottom?.[0]) sum += bottom[0].price;
    if (shoes?.[0]) sum += shoes[0].price;
    return sum;
  }, [top, bottom, shoes]);

  const pieceCount = (top?.[0] ? 1 : 0) + (bottom?.[0] ? 1 : 0) + (shoes?.[0] ? 1 : 0);

  const outfitTags = useMemo(() => {
    return generateOutfitTags(top?.[0], bottom?.[0], shoes?.[0], styleKeyword);
  }, [top, bottom, shoes, styleKeyword]);

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: outfitTitle, url });
      } catch (err) {
        console.warn("Share failed", err);
      }
    } else {
      navigator.clipboard.writeText(url);
      setToastMessage("Link copied");
      setTimeout(() => setToastMessage(""), 3000);
    }
  };

  const handleDownload = async () => {
    if (!heroRef.current) return;
    setDownloading(true);
    try {
      const isDark = document.documentElement.classList.contains("dark");
      const canvas = await html2canvas(heroRef.current, {
        useCORS: true,
        backgroundColor: isDark ? "#0f0f14" : "#fcf9f8",
        onclone: (clonedDoc) => {
          const elements = clonedDoc.getElementsByTagName('*');
          for (let i = 0; i < elements.length; i++) {
            const el = elements[i] as HTMLElement;
            if (!el.style) continue;
            try {
              const style = clonedDoc.defaultView?.getComputedStyle(el);
              if (!style) continue;
              if (style.color && style.color.includes('oklch')) {
                el.style.color = isDark ? '#fcf9f8' : '#1b1c1b';
              }
              if (style.backgroundColor && style.backgroundColor.includes('oklch')) {
                el.style.backgroundColor = isDark ? '#0f0f14' : '#fcf9f8';
              }
              if (style.borderColor && style.borderColor.includes('oklch')) {
                el.style.borderColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
              }
            } catch {
              // Ignore
            }
          }
        }
      });
      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `stylesense-look-${safeOutfit.outfit_id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.warn("[download] Failed:", err);
    } finally {
      setDownloading(false);
    }
  };

  useEffect(() => {
    if (!safeOutfit.outfit_id) return;
    posthog.capture("outfit_viewed", { outfit_id: safeOutfit.outfit_id });
    try {
      const stored = localStorage.getItem("stylesense-recent-looks");
      let recent: string[] = [];
      try {
        recent = stored ? JSON.parse(stored) : [];
        if (!Array.isArray(recent)) recent = [];
      } catch (e) {
        console.warn("Failed to parse stylesense-recent-looks", e);
      }
      const recentIds = recent.filter(id => id !== safeOutfit.outfit_id);
      const loadedOutfits = recentIds.map(id => OUTFITS.find(o => o.outfit_id === id)).filter(Boolean) as Outfit[];
      setRecentOutfits(loadedOutfits);

      recent = [safeOutfit.outfit_id, ...recentIds].slice(0, 10);
      localStorage.setItem("stylesense-recent-looks", JSON.stringify(recent));
    } catch (err) {
      console.warn("[recent-looks] localStorage error:", err);
    }
  }, [safeOutfit.outfit_id]);

  if (!isMounted) {
    return (
      <div className="bg-[#fcf9f8] dark:bg-[#0f0f14] min-h-screen pb-24 transition-colors duration-300">
        <nav className="fixed top-0 w-full z-50 bg-[#fcf9f8]/80 dark:bg-[#0f0f14]/80 backdrop-blur-xl border-b border-black/5 dark:border-white/5">
          <div className="flex justify-between items-center w-full px-4 h-16 max-w-[600px] mx-auto">
            <div className="w-10 h-10 rounded-full bg-stone-200 dark:bg-stone-800 animate-pulse"></div>
            <div className="w-32 h-4 rounded bg-stone-200 dark:bg-stone-800 animate-pulse"></div>
            <div className="w-10 h-10"></div>
          </div>
        </nav>
        <main className="pt-24 max-w-3xl mx-auto px-4 md:px-6 w-full">
          <div className="mb-6 flex flex-col">
            <div className="h-10 bg-stone-200 dark:bg-stone-800 rounded w-3/4 mb-4 animate-pulse"></div>
            <div className="h-4 bg-stone-200 dark:bg-stone-800 rounded w-1/2 mb-6 animate-pulse"></div>
            <div className="flex gap-3 mb-6">
              <div className="h-10 w-24 bg-stone-200 dark:bg-stone-800 rounded-full animate-pulse"></div>
              <div className="h-10 w-32 bg-stone-200 dark:bg-stone-800 rounded-full animate-pulse"></div>
            </div>
          </div>
          <div className="w-full max-w-[700px] mx-auto h-[450px] md:h-[550px] rounded-[2rem] bg-stone-200 dark:bg-stone-800 animate-pulse mb-6"></div>
          <div className="flex justify-center gap-3 mb-10">
             <div className="h-8 w-20 bg-stone-200 dark:bg-stone-800 rounded-full animate-pulse"></div>
             <div className="h-8 w-20 bg-stone-200 dark:bg-stone-800 rounded-full animate-pulse"></div>
             <div className="h-8 w-20 bg-stone-200 dark:bg-stone-800 rounded-full animate-pulse"></div>
          </div>
        </main>
      </div>
    );
  }

  // Route safety: show not-found for invalid outfit IDs
  if (!outfit) {
    return (
      <div className="bg-[#fcf9f8] dark:bg-[#0f0f14] min-h-screen flex flex-col items-center justify-center px-6 text-[#1b1c1b] dark:text-[#fcf9f8]">
        <SearchX className="text-5xl text-stone-300 dark:text-stone-600 mb-4" />
        <h1 className="text-2xl font-extrabold mb-2" style={{ fontFamily: "Manrope, sans-serif" }}>Look not found.</h1>
        <p className="text-sm text-[#747686] dark:text-[#a0a0b8] mb-8">This outfit doesn&apos;t exist or may have been removed.</p>
        <button
          onClick={() => router.back()}
          className="px-6 py-3 rounded-full bg-[#1b1c1b] dark:bg-white text-white dark:text-[#1b1c1b] font-bold text-sm hover:opacity-90 transition-opacity flex items-center gap-2"
        >
          <ArrowLeft className="text-[18px]" />
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div
      className="bg-[#fcf9f8] dark:bg-[#0f0f14] text-[#1b1c1b] dark:text-[#fcf9f8] antialiased min-h-screen transition-colors duration-300 pb-24"
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[200] px-4 py-3 rounded-full bg-[#1b1c1b] text-white text-sm font-bold shadow-xl animate-fade-in">
          {toastMessage}
        </div>
      )}

      {/* Top Nav (Minimal) */}
      <nav className="fixed top-0 w-full z-50 bg-[#fcf9f8]/80 dark:bg-[#0f0f14]/80 backdrop-blur-xl border-b border-black/5 dark:border-white/5 transition-colors duration-300">
        <div className="flex justify-between items-center w-full px-4 h-16 max-w-[600px] mx-auto">
          <button aria-label="Go back" onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-full bg-[#f0edec] dark:bg-[#202020] hover:opacity-80 transition-opacity">
            <ArrowLeft className="text-[20px]" />
          </button>
          <span className="text-sm font-bold uppercase tracking-widest text-[#1b1c1b] dark:text-[#fcf9f8]"
            style={{ fontFamily: "Manrope, sans-serif" }}
          >
            Outfit Details
          </span>
          <div className="w-10 h-10" /> {/* Spacer */}
        </div>
      </nav>

      <main className="pt-20 max-w-3xl mx-auto px-4 md:px-6 w-full overflow-x-hidden">

        <div ref={heroRef} className="bg-[#fcf9f8] dark:bg-[#0f0f14] pb-4 rounded-3xl">
          {/* Header Content */}
          <div className="mb-6 flex flex-col text-center md:text-left">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tighter text-[#1b1c1b] dark:text-[#fcf9f8] mb-2" style={{ fontFamily: "Manrope, sans-serif" }}>
              {outfitTitle}
            </h1>
            <p className="text-[#747686] dark:text-[#a0a0b8] font-medium text-sm mb-6">
              {outfitDesc}
            </p>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
              <button
                onClick={() => isSaved(outfit.outfit_id) ? removeOutfit(outfit.outfit_id) : saveOutfit(outfit.outfit_id)}
                className="px-5 py-2.5 rounded-full bg-[#1b1c1b] dark:bg-white text-white dark:text-[#1b1c1b] text-sm font-bold tracking-wide flex items-center gap-2 hover:opacity-90 transition-opacity"
              >
                <span className="text-[18px]" />
                {isSaved(outfit.outfit_id) ? "Saved" : "Save"}
              </button>

              <button
                onClick={handleShare}
                className="px-5 py-2.5 rounded-full bg-[#f0edec] dark:bg-[#202020] text-[#1b1c1b] dark:text-[#fcf9f8] text-sm font-bold tracking-wide flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                <Share2 className="text-[18px]" />
                Share Look
              </button>

              <button
                onClick={handleDownload}
                disabled={downloading}
                className="px-5 py-2.5 rounded-full bg-[#f0edec] dark:bg-[#202020] text-[#1b1c1b] dark:text-[#fcf9f8] text-sm font-bold tracking-wide flex items-center gap-2 hover:opacity-80 transition-opacity disabled:opacity-50"
              >
                <Download className="text-[18px]" />
                {downloading ? "Downloading..." : "Download Look"}
              </button>
            </div>

            {outfit.pinterestUrl && (
              <div className="mt-6 flex flex-col justify-center md:justify-start text-center md:text-left">
                <span className="text-[11px] font-bold tracking-widest uppercase text-[#747686] dark:text-[#a0a0b8] mb-1">
                  Inspired by Pinterest
                </span>
                <a
                  href={outfit.pinterestUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-zinc-500 hover:text-[#002b92] dark:hover:text-[#b7c4ff] transition-colors inline-flex items-center justify-center md:justify-start gap-1"
                >
                  View original inspiration <span className="text-[14px]" />
                </a>
              </div>
            )}
          </div>

          {/* Hero Section */}
          <div className="w-full max-w-[700px] mx-auto h-[450px] md:h-[550px] rounded-[2rem] overflow-hidden bg-[#f0edec] dark:bg-[#202020] relative mb-6 shadow-sm border border-black/5 dark:border-white/5">
            {outfit.imageUrl?.startsWith("http") && !heroImgError ? (
              <Image
                src={outfit.imageUrl}
                alt={outfitTitle}
                fill
                className={`object-center ${isHeroPortrait ? "object-contain bg-[#f4f4f4] dark:bg-[#1a1a1a]" : "object-cover"}`}
                onLoadingComplete={(img) => {
                  setIsHeroPortrait(img.naturalHeight >= img.naturalWidth);
                }}
                onError={() => setHeroImgError(true)}
                loading="lazy"
                unoptimized
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-stone-100 to-stone-200 dark:from-[#1a1a1a] dark:to-[#121212]">
                <LucideImage className="text-stone-300 dark:text-stone-600 text-5xl mb-2" />
                <span className="text-sm font-bold tracking-widest uppercase text-stone-400 dark:text-stone-600">No image</span>
              </div>
            )}

            {/* Hidden Heart Button (Moved to Header) */}
          </div>

          <div className="flex gap-3 overflow-x-auto md:overflow-visible md:justify-center px-2 mb-4 no-scrollbar">
            {top && top.length > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-[#1b1c1b] border border-black/5 dark:border-white/5 rounded-full shadow-sm hover:border-blue-600/30 transition-colors flex-shrink-0">
                <span className="text-[10px] font-semibold tracking-wider uppercase text-blue-600 dark:text-blue-400">Top</span>
                <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300 truncate max-w-[140px]" title={top[0].name}>{shortProductName(top[0])}</span>
              </div>
            )}
            {bottom && bottom.length > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-[#1b1c1b] border border-black/5 dark:border-white/5 rounded-full shadow-sm hover:border-blue-600/30 transition-colors flex-shrink-0">
                <span className="text-[10px] font-semibold tracking-wider uppercase text-blue-600 dark:text-blue-400">Bottom</span>
                <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300 truncate max-w-[140px]" title={bottom[0].name}>{shortProductName(bottom[0])}</span>
              </div>
            )}
            {shoes && shoes.length > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-[#1b1c1b] border border-black/5 dark:border-white/5 rounded-full shadow-sm hover:border-blue-600/30 transition-colors flex-shrink-0">
                <span className="text-[10px] font-semibold tracking-wider uppercase text-blue-600 dark:text-blue-400">Shoes</span>
                <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300 truncate max-w-[140px]" title={shoes[0].name}>{shortProductName(shoes[0])}</span>
              </div>
            )}
          </div>

          {/* Outfit Stats */}
          <div className="flex flex-wrap gap-4 items-center justify-center md:justify-center px-2 mb-10 opacity-80">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-600 dark:text-zinc-400">
              <span className="text-[16px]" />
              ₹{totalPrice} Total Budget
            </div>
            <div className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700"></div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-600 dark:text-zinc-400">
              <Shirt className="text-[16px]" />
              {pieceCount} Pieces
            </div>
            <div className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700"></div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-600 dark:text-zinc-400">
              <Wand2 className="text-[16px]" />
              {styleKeyword} Style
            </div>
          </div>

          {/* Outfit Tags */}
          <div className="flex flex-wrap gap-2 overflow-x-auto md:overflow-visible justify-center px-2 mb-10 no-scrollbar">
            {outfitTags.map((tag) => (
              <div key={tag} className="flex items-center px-4 py-2 bg-white dark:bg-[#1b1c1b] border border-black/5 dark:border-white/5 rounded-full shadow-sm hover:border-black/20 dark:hover:border-white/20 transition-colors flex-shrink-0 cursor-default">
                <span className="text-[11px] font-bold tracking-wider uppercase text-zinc-600 dark:text-zinc-400">{tag}</span>
              </div>
            ))}
          </div>

          {/* Budget Breakdown */}
          <div className="max-w-xs mx-auto mb-10 p-5 rounded-2xl bg-[#f0edec]/50 dark:bg-[#202020]/50 border border-black/5 dark:border-white/5">
            <h4 className="text-[10px] uppercase tracking-widest font-bold text-[#747686] dark:text-[#a0a0b8] mb-3 text-center">Budget Breakdown</h4>
            <div className="space-y-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              {top?.[0] && <div className="flex justify-between"><span>Top</span><span>₹{top[0].price}</span></div>}
              {bottom?.[0] && <div className="flex justify-between"><span>Bottom</span><span>₹{bottom[0].price}</span></div>}
              {shoes?.[0] && <div className="flex justify-between"><span>Shoes</span><span>₹{shoes[0].price}</span></div>}
              <div className="pt-2 mt-2 border-t border-black/5 dark:border-white/10 flex justify-between font-bold text-[#1b1c1b] dark:text-[#fcf9f8]">
                <span>Total</span>
                <span>₹{totalPrice}</span>
              </div>
            </div>
          </div>

          {/* Pieces Used In This Look */}
          <section className="mb-10 mt-8 w-full overflow-hidden">
            <h3 className="text-sm uppercase tracking-widest font-extrabold text-[#1b1c1b] dark:text-[#fcf9f8] mb-8 text-center">
              Pieces Used In This Look
            </h3>

            {(!top || top.length === 0) && (!bottom || bottom.length === 0) && (!shoes || shoes.length === 0) ? (
              <div className="w-full py-16 flex flex-col items-center justify-center bg-white dark:bg-[#1b1c1b] rounded-[24px] border border-black/5 dark:border-white/5 shadow-sm">
                <span className="text-5xl text-stone-300 dark:text-stone-700 mb-4 opacity-50" />
                <h4 className="text-lg font-bold text-[#1b1c1b] dark:text-white mb-2" style={{ fontFamily: "Manrope, sans-serif" }}>
                  Products coming soon
                </h4>
                <p className="text-sm text-stone-500 dark:text-stone-400 max-w-[220px] text-center leading-relaxed">
                  We&apos;re sourcing the absolute best pieces for this look.
                </p>
              </div>
            ) : (
              <div className="flex gap-4 overflow-x-auto md:grid md:grid-cols-3 md:gap-6 no-scrollbar snap-x snap-mandatory px-1 pb-4">
                {top && top.length > 0 && (
                  <div className="w-[280px] min-w-[280px] md:w-auto md:min-w-0 flex-shrink-0 snap-start">
                    <ProductCard product={top[0]} />
                  </div>
                )}
                {bottom && bottom.length > 0 && (
                  <div className="w-[280px] min-w-[280px] md:w-auto md:min-w-0 flex-shrink-0 snap-start">
                    <ProductCard product={bottom[0]} />
                  </div>
                )}
                {shoes && shoes.length > 0 && (
                  <div className="w-[280px] min-w-[280px] md:w-auto md:min-w-0 flex-shrink-0 snap-start">
                    <ProductCard product={shoes[0]} />
                  </div>
                )}
              </div>
            )}
          </section>
        </div>

        {/* Alternative Tops */}
        {alternativeTops.length > 0 && (
          <section className="mb-10 mt-8 w-full overflow-hidden">
            <h4 className="text-xs uppercase tracking-widest font-bold text-[#434654] dark:text-[#a0a0b8] mb-4 pl-1 text-center md:text-left">
              Alternative Tops
            </h4>
            <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar snap-x snap-mandatory md:grid md:grid-cols-3 md:gap-6">
              {alternativeTops.map((alt) => (
                <div key={alt.id} className="w-[280px] min-w-[280px] md:w-auto md:min-w-0 flex-shrink-0 snap-start">
                  <ProductCard product={alt} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Alternative Bottoms */}
        {alternativeBottoms.length > 0 && (
          <section className="mb-10 mt-8 w-full overflow-hidden">
            <h4 className="text-xs uppercase tracking-widest font-bold text-[#434654] dark:text-[#a0a0b8] mb-4 pl-1 text-center md:text-left">
              Alternative Bottoms
            </h4>
            <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar snap-x snap-mandatory md:grid md:grid-cols-3 md:gap-6">
              {alternativeBottoms.map((alt) => (
                <div key={alt.id} className="w-[280px] min-w-[280px] md:w-auto md:min-w-0 flex-shrink-0 snap-start">
                  <ProductCard product={alt} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Alternative Shoes */}
        {alternativeShoes.length > 0 && (
          <section className="mb-10 mt-8 w-full overflow-hidden">
            <h4 className="text-xs uppercase tracking-widest font-bold text-[#434654] dark:text-[#a0a0b8] mb-4 pl-1 text-center md:text-left">
              Alternative Shoes
            </h4>
            <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar snap-x snap-mandatory md:grid md:grid-cols-3 md:gap-6">
              {alternativeShoes.map((alt) => (
                <div key={alt.id} className="w-[280px] min-w-[280px] md:w-auto md:min-w-0 flex-shrink-0 snap-start">
                  <ProductCard product={alt} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Related Looks */}
        {relatedLooks.length > 0 && (
          <section className="mt-12 w-full overflow-hidden">
            <h3 className="text-xs uppercase tracking-widest font-bold text-[#434654] dark:text-[#a0a0b8] mb-4 pl-1">
              Related Looks
            </h3>
            <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar snap-x snap-mandatory">
              {relatedLooks.map((related) => (
                <RelatedLookCard key={related.outfit_id} related={related} />
              ))}
            </div>
          </section>
        )}

        {/* Recently Viewed */}
        {recentOutfits.length > 0 && (
          <section className="mt-12 w-full overflow-hidden">
            <h3 className="text-xs uppercase tracking-widest font-bold text-[#434654] dark:text-[#a0a0b8] mb-4 pl-1">
              Recently Viewed
            </h3>
            <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar snap-x snap-mandatory">
              {recentOutfits.map((recent) => (
                <RelatedLookCard key={recent.outfit_id} related={recent} />
              ))}
            </div>
          </section>
        )}

      </main>
    </div>
  );
}
