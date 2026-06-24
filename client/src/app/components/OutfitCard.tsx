import { memo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Outfit } from "@/data/outfits";
import { getProductsForOutfit } from "@/data/outfitProducts";
import { Favorite, Image, Trash2 } from "lucide-react";

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

type OutfitCardProps = {
  outfit: Outfit;
  isSaved?: boolean;
  onToggleSave?: () => void;
  onRemove?: () => void;
  showHeartSave?: boolean;
  showRemove?: boolean;
  isWardrobeLayout?: boolean;
};

function OutfitCard({
  outfit,
  isSaved = false,
  onToggleSave,
  onRemove,
  showHeartSave = false,
  showRemove = false,
  isWardrobeLayout = false,
}: OutfitCardProps) {
  const [isPortrait, setIsPortrait] = useState(true);
  const [imgError, setImgError] = useState(false);
  const { top, bottom, shoes } = getProductsForOutfit(outfit.outfit_id);

  const lookNum = parseInt(outfit.outfit_id.replace("O", ""), 10);
  const lookTitle = `Look ${lookNum.toString().padStart(2, "0")}`;
  const subtitle = lookNum % 2 === 0 ? "Versatile combination." : "Minimal everyday outfit.";

  return (
    <article className={`w-full min-w-0 flex flex-col border-[#f0edec] dark:border-[#303030] ${!isWardrobeLayout ? "gap-5 border-b pb-10 last:border-0" : "gap-4 bg-white dark:bg-[#1b1c1b] p-4 rounded-[2rem] border shadow-sm"}`}>
      {/* Image / Gradient Placeholder */}
      <div className={`w-full aspect-[4/5] overflow-hidden bg-[#f0edec] dark:bg-[#202020] relative group border border-black/5 dark:border-white/5 ${isWardrobeLayout ? "rounded-[1.5rem]" : "rounded-3xl"}`}>
        {outfit.imageUrl && !imgError ? (
          <Image
            src={outfit.imageUrl}
            alt={`Outfit ${outfit.outfit_id}`}
            fill
            className={`object-center transition-transform duration-700 group-hover:scale-105 ${isPortrait ? "object-contain bg-[#f4f4f4] dark:bg-[#1a1a1a]" : "object-cover"}`}
            onLoadingComplete={(img) => {
              setIsPortrait(img.naturalHeight >= img.naturalWidth);
            }}
            onError={() => setImgError(true)}
            loading="lazy"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-stone-100 to-stone-200 dark:from-[#1a1a1a] dark:to-[#121212]">
            <Image className="text-stone-300 dark:text-stone-600 text-4xl mb-1" />
            <Trash2 className="text-[10px] font-bold tracking-widest uppercase text-stone-400 dark:text-stone-600">No image</span>
          </div>
        )}
      </div>

      {/* Header (Discover Layout) */}
      {!isWardrobeLayout ? (
        <div>
          <h2 className="text-2xl font-semibold mb-1" style={{ fontFamily: "Manrope, sans-serif" }}>
            {lookTitle}
          </h2>
          <p className="text-sm text-zinc-500">
            {subtitle}
          </p>
        </div>
      ) : (
        <div className="px-2">
          <h2 className="text-2xl font-bold mb-1" style={{ fontFamily: "Manrope, sans-serif" }}>
            Outfit {outfit.outfit_id}
          </h2>
          <p className="text-[#747686] dark:text-[#a0a0b8] text-sm leading-relaxed mb-6">
            Curated recommendation based on your profile.
          </p>

          <div className="flex gap-3">
            <Link
              href={`/outfit/${outfit.outfit_id}`}
              className="flex-1 py-3.5 rounded-xl bg-[#1b1c1b] dark:bg-white text-white dark:text-[#1b1c1b] font-bold text-sm text-center hover:opacity-90 transition-opacity"
            >
              View Look
            </Link>
            {showRemove && (
              <button
                aria-label="Remove from Wardrobe"
                onClick={onRemove}
                className="w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors"
                title="Remove from Wardrobe"
              >
                <span className="text-[20px]" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Essential Items (Discover Layout) */}
      {!isWardrobeLayout && (
        <div className="space-y-2 px-1">
          {top.length > 0 && (
            <div className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              👕 {shortProductName(top[0])}
            </div>
          )}
          {bottom.length > 0 && (
            <div className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              👖 {shortProductName(bottom[0])}
            </div>
          )}
          {shoes.length > 0 && (
            <div className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              👟 {shortProductName(shoes[0])}
            </div>
          )}
        </div>
      )}

      {/* Actions (Discover Layout) */}
      {!isWardrobeLayout && (
        <div className="mt-2 flex gap-3 items-center w-full">
          {showHeartSave && (
            <button
              aria-label={isSaved ? "Remove outfit from favorites" : "Save outfit to favorites"}
              onClick={onToggleSave}
              className={`flex-1 min-w-0 py-4 rounded-xl border flex items-center justify-center gap-2 font-bold text-[13px] transition-colors overflow-hidden ${isSaved
                  ? "bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-950/30 dark:border-rose-900/50 dark:text-rose-400"
                  : "bg-white border-zinc-200 text-zinc-700 hover:bg-stone-50 dark:bg-[#121212] dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-[#1a1a1a]"
                }`}
            >
              <Favorite className="text-[18px] flex-shrink-0" />
              <span className="truncate min-w-0">{isSaved ? "In your wardrobe" : "Saved"}</span>
            </button>
          )}
          <Link
            href={`/outfit/${outfit.outfit_id}`}
            className={`${showHeartSave ? 'flex-1 min-w-0' : 'w-full'} py-4 rounded-xl bg-[#1b1c1b] dark:bg-white text-white dark:text-[#1b1c1b] font-bold text-sm hover:opacity-90 transition-opacity flex justify-center items-center overflow-hidden`}
          >
            <span className="truncate min-w-0">View Look</span>
          </Link>
        </div>
      )}
    </article>
  );
}

export default memo(OutfitCard);
