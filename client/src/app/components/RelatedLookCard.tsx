import { memo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Outfit } from "@/data/outfits";
import { getProductsForOutfit } from "@/data/outfitProducts";
import { generateOutfitTitle, getOutfitStyle } from "@/utils/outfitLogic";
import { Image as ImageIcon } from "lucide-react";

interface RelatedLookCardProps {
  related: Outfit;
}

function RelatedLookCard({ related }: RelatedLookCardProps) {
  const [isPortrait, setIsPortrait] = useState(true);
  const [imgError, setImgError] = useState(false);
  const { top } = getProductsForOutfit(related.outfit_id);
  const title = generateOutfitTitle(related.outfit_id, top?.[0]?.color);
  const styleKeyword = getOutfitStyle(related.outfit_id);

  return (
    <Link
      href={`/outfit/${related.outfit_id}`}
      className="group flex flex-col w-[160px] min-w-[160px] md:w-[200px] md:min-w-[200px] flex-shrink-0 snap-start"
    >
      <div className="w-full aspect-[4/5] rounded-2xl overflow-hidden mb-2 bg-[#f0edec] dark:bg-[#202020] relative shadow-sm border border-black/5 dark:border-white/5">
        {related.imageUrl && !imgError ? (
          <Image
            src={related.imageUrl}
            alt={title}
            fill
            className={`object-center transition-transform duration-700 group-hover:scale-105 ${isPortrait ? "object-contain bg-[#f4f4f4] dark:bg-[#1a1a1a]" : "object-cover"}`}
            onLoadingComplete={(img) => {
              setIsPortrait(img.naturalHeight >= img.naturalWidth);
            }}
            onError={() => setImgError(true)}
            sizes="(max-width: 768px) 160px, 200px"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-stone-100 to-stone-200 dark:from-[#1a1a1a] dark:to-[#121212]">
            <ImageIcon className="text-stone-300 dark:text-stone-600 text-3xl mb-1" />
            <span className="text-[9px] font-bold tracking-widest uppercase text-stone-400 dark:text-stone-600">No image</span>
          </div>
        )}
      </div>
      <h4
        className="font-bold text-xs text-[#1b1c1b] dark:text-[#fcf9f8] truncate"
        style={{ fontFamily: "Manrope, sans-serif" }}
      >
        {title}
      </h4>
      <p className="text-[9px] font-semibold tracking-widest uppercase text-[#747686] dark:text-[#a0a0b8] mt-0.5">
        {styleKeyword} Look
      </p>
    </Link>
  );
}

export default memo(RelatedLookCard);
