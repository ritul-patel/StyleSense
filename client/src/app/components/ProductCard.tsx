"use client";

import { useState, memo } from "react";
import Image from "next/image";
import posthog from "posthog-js";
import { type LegacyProduct as Product } from "@/lib/products-api";
import { ArrowRight, Check, Copy, Heart } from "lucide-react";
import { useWardrobe } from "@/app/context/WardrobeContext";

interface ProductCardProps {
  product: Product;
}

function ProductCard({ product }: ProductCardProps) {
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [copyToast, setCopyToast] = useState(false);
  const { isInWardrobe, addToWardrobe, removeFromWardrobe } = useWardrobe();

  const wishlisted = isInWardrobe(product.id);

  // Link logic: prefer affiliate link, fallback to store URL
  const destinationUrl = product.affiliateLink || product.storeUrl;

  // Format price (₹999 format without decimals if whole number)
  const formattedPrice = product.price > 0
    ? new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: product.price % 1 === 0 ? 0 : 2
    }).format(product.price)
    : null;

  // Extract Store Name from URL for the badge
  const getStoreName = (url?: string) => {
    if (!url) return "Store";
    try {
      const hostname = new URL(url).hostname;
      const parts = hostname.replace('www.', '').split('.');
      if (parts.length > 0) {
        return parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
      }
      return "Store";
    } catch {
      return "Store";
    }
  };

  const storeBadge = getStoreName(product.storeUrl || product.affiliateLink);

  const handleCopyLink = (e: React.MouseEvent) => {
    e.preventDefault();
    if (destinationUrl) {
      navigator.clipboard.writeText(destinationUrl);
      setCopyToast(true);
      setTimeout(() => setCopyToast(false), 2000);
    }
  };

  return (
    <article className="group flex flex-col h-full rounded-[28px] overflow-hidden bg-white dark:bg-[#0d0d0d] border border-black/5 dark:border-white/10 hover:border-black/10 dark:hover:border-white/20 transition-all relative">

      {/* Image Area */}
      <div className="relative aspect-[4/5] w-full bg-stone-100 dark:bg-[#1a1a1a] overflow-hidden rounded-t-[24px]">

        {/* Store Badge */}
        <div className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-md bg-white/90 dark:bg-black/90 backdrop-blur-md shadow-sm border border-black/5 dark:border-white/10 text-[10px] font-bold text-[#1b1c1b] dark:text-[#fcf9f8] uppercase tracking-wider">
          {storeBadge}
        </div>

        {/* Wishlist Heart */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (wishlisted) removeFromWardrobe(product.id);
            else addToWardrobe(product.id, "Wishlist");
          }}
          aria-label={wishlisted ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
          className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-white/90 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center shadow-sm transition-transform hover:scale-110 active:scale-95"
        >
          <Heart
            size={20}
            className="transition-colors"
            fill={wishlisted ? "#e11d48" : "none"}
            color={wishlisted ? "#e11d48" : "#6b7280"}
            strokeWidth={wishlisted ? 0 : 2}
          />
        </button>

        {/* Loading Skeleton */}
        {!imgLoaded && !imgError && product.image && (
          <div className="absolute inset-0 animate-pulse bg-stone-200 dark:bg-stone-800" />
        )}

        {/* Image / Fallback */}
        {product.image && !imgError ? (
          <Image
            src={product.image}
            alt={product.name}
            onLoad={() => setImgLoaded(true)}
            onError={() => setImgError(true)}
            className={`object-cover transition-all duration-700 ${imgLoaded ? "opacity-100 group-hover:scale-105" : "opacity-0 scale-95"
              }`}
            loading="lazy"
            fill
            sizes="(max-width:768px) 180px, 240px"
            quality={60}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-stone-100 to-stone-200 dark:from-[#1a1a1a] dark:to-[#121212] text-stone-400 dark:text-stone-600">
            <span className="text-xs uppercase tracking-widest font-bold">No Image</span>
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="flex flex-col flex-1 p-4 gap-2">

        {/* Brand & Name */}
        <div>
          <p className="text-[11px] uppercase tracking-wide opacity-60 text-stone-600 dark:text-stone-400 truncate">
            {product.brand}
          </p>
          <h3 className="text-[15px] font-semibold leading-snug line-clamp-2 text-[#1b1c1b] dark:text-[#fcf9f8]">
            {product.name}
          </h3>
        </div>

        {/* Price */}
        {formattedPrice && (
          <div className="text-[20px] font-bold tracking-tight text-[#1b1c1b] dark:text-white">
            {formattedPrice}
          </div>
        )}

        {/* Action */}
        <div className="mt-auto flex items-center gap-3">
          {destinationUrl ? (
            <a
              href={destinationUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => posthog.capture("product_clicked", { product_id: product.id, store_url: destinationUrl, product_name: product.name })}
              aria-label={`Open ${product.name} in store`}
              className="flex-1 h-11 rounded-xl bg-[#1b1c1b] dark:bg-white text-white dark:text-black font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition"
            >
              View Store
              <ArrowRight className="text-[18px]" />
            </a>
          ) : (
            <button
              disabled
              className="flex-1 h-11 rounded-xl bg-stone-100 dark:bg-[#1a1a1a] text-stone-400 dark:text-stone-600 font-semibold text-sm cursor-not-allowed flex items-center justify-center gap-2 transition"
            >
              Unavailable
            </button>
          )}

          {destinationUrl && (
            <button
              onClick={handleCopyLink}
              aria-label="Copy Link"
              title="Copy Link"
              className="w-10 h-10 rounded-xl bg-stone-100 dark:bg-[#141414] border border-black/5 dark:border-white/10 text-[#1b1c1b] dark:text-white flex items-center justify-center shrink-0 hover:bg-stone-200 dark:hover:bg-[#252525] transition"
            >
              {copyToast ? (
                <Check className="text-[18px] text-green-600 dark:text-green-400" />
              ) : (
                <Copy className="text-[18px]" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Copy Toast */}
      {copyToast && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#1b1c1b]/90 dark:bg-white/90 backdrop-blur text-white dark:text-[#1b1c1b] px-4 py-2 rounded-xl text-sm font-bold shadow-xl z-50 pointer-events-none animate-fade-in whitespace-nowrap">
          Link copied
        </div>
      )}
    </article>
  );
}

export default memo(ProductCard);
