import { Outfit } from "@/data/outfits";
import { Product } from "@/data/products";
import { OutfitProduct } from "@/data/outfitProducts";

// Deterministic style assignments
const STYLES = ["Minimal", "Street", "Smart Casual", "Everyday", "Relaxed", "Office", "Weekend"];

export function getOutfitStyle(outfitId: string): string {
  // Simple hash to deterministically pick a style
  let hash = 0;
  for (let i = 0; i < outfitId.length; i++) {
    hash = outfitId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % STYLES.length;
  return STYLES[index];
}

export function generateOutfitTitle(outfitId: string, topColor?: string): string {
  const style = getOutfitStyle(outfitId);
  if (!topColor) return `Look ${parseInt(outfitId.replace(/\D/g, "") || "0", 10).toString().padStart(2, "0")}`;
  
  // Clean color (e.g. "Nevy blue" -> "Navy", "Mustard" -> "Yellow" or keep first word)
  let baseColor = topColor.split("-")[0].split("/")[0].split("+")[0].trim().split(" ")[0];
  // capitalization
  baseColor = baseColor.charAt(0).toUpperCase() + baseColor.slice(1).toLowerCase();
  
  return `${baseColor} ${style}`;
}

export function generateOutfitDescription(style: string): string {
  switch (style) {
    case "Minimal": return "Minimal everyday outfit.";
    case "Street": return "Relaxed streetwear outfit.";
    case "Smart Casual": return "Smart casual outfit.";
    case "Office": return "Office-ready outfit.";
    case "Weekend": return "Weekend casual outfit.";
    case "Everyday": return "Minimal everyday outfit.";
    case "Relaxed": return "Relaxed streetwear outfit.";
    default: return "Minimal everyday outfit.";
  }
}

export function getSimilarOutfits(
  currentOutfitId: string,
  allOutfits: Outfit[],
  allMappings: OutfitProduct[],
  allProducts: Product[]
): Outfit[] {
  // Helper to get products for an outfit
  const getProds = (oId: string, pos: string) => 
    allMappings.filter(op => op.outfit_id === oId && op.position === pos)
               .map(op => allProducts.find(p => p.id === op.product_id))
               .filter((p): p is Product => !!p);

  const currentTop = getProds(currentOutfitId, "top")[0];
  const currentBottom = getProds(currentOutfitId, "bottom")[0];
  const currentShoes = getProds(currentOutfitId, "shoes")[0];
  const currentStyle = getOutfitStyle(currentOutfitId);

  const scoredOutfits = allOutfits
    .filter(o => o.outfit_id !== currentOutfitId)
    .map(outfit => {
      let score = 0;
      const top = getProds(outfit.outfit_id, "top")[0];
      const bottom = getProds(outfit.outfit_id, "bottom")[0];
      const shoes = getProds(outfit.outfit_id, "shoes")[0];
      const style = getOutfitStyle(outfit.outfit_id);

      // Priority 1: Same top category
      if (currentTop && top && currentTop.category === top.category) score += 4;
      // Priority 2: Same jeans/bottom color
      if (currentBottom && bottom && currentBottom.color === bottom.color) score += 3;
      // Priority 3: Same shoe type (category)
      if (currentShoes && shoes && currentShoes.category === shoes.category) score += 2;
      // Priority 4: Same style keyword
      if (currentStyle === style) score += 1;

      return { outfit, score };
    });

  scoredOutfits.sort((a, b) => b.score - a.score);
  return scoredOutfits.slice(0, 4).map(s => s.outfit);
}

export function getAlternativeProducts(
  currentProductId: string | undefined,
  category: string,
  color: string,
  allProducts: Product[]
): Product[] {
  if (!currentProductId) return [];

  const alternatives = allProducts.filter(p => p.id !== currentProductId && p.category === category);
  
  // Sort by matching color
  const baseColor = color.split("-")[0].trim().toLowerCase();
  
  alternatives.sort((a, b) => {
    const aMatch = a.color.toLowerCase().includes(baseColor) ? 1 : 0;
    const bMatch = b.color.toLowerCase().includes(baseColor) ? 1 : 0;
    return bMatch - aMatch;
  });

  return alternatives.slice(0, 4);
}

export function generateOutfitTags(top?: Product, bottom?: Product, shoes?: Product, style?: string): string[] {
  const tags: string[] = [];
  
  if (style) tags.push(style);
  
  const categories = [top?.category, bottom?.category, shoes?.category].filter(Boolean).map(c => c?.toLowerCase() || "");
  const colors = [top?.color, bottom?.color, shoes?.color].filter(Boolean).map(c => c?.toLowerCase() || "");
  
  if (categories.some(c => c.includes("tshirt") || c.includes("polo") || c.includes("shorts"))) {
    tags.push("Summer");
  }
  
  if (colors.some(c => c.includes("black") || c.includes("white") || c.includes("beige") || c.includes("grey"))) {
    tags.push("Minimal");
  }
  
  if (categories.some(c => c.includes("sneaker") || c.includes("jeans"))) {
    tags.push("Casual");
  }
  
  if (categories.some(c => c.includes("shirt") || c.includes("trouser") || c.includes("loafer"))) {
    tags.push("Smart Casual");
  }

  // Ensure unique tags
  return Array.from(new Set(tags)).slice(0, 5);
}
