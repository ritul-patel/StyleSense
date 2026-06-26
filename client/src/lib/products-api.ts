/**
 * Products API client.
 * Single source of truth for product data — reads from /api/v1/products (database).
 * Replaces the static @/data/products.ts import for customer-facing pages.
 */

import { apiFetch } from "./api";

export type Product = {
  id: string;
  name: string;
  slug: string;
  brand: string;
  category: string;
  price: number;
  currency: string;
  image_url: string;
  affiliate_url: string;
  store_url: string;
  primary_color: string;
  secondary_colors: string[];
  seasons: string[];
  occasions: string[];
  styles: string[];
  materials: string[];
  fit: string;
  formality: string;
};

// Backward-compat: map API response fields to match the old static Product shape
// so existing components (ProductCard, wardrobe) work without changes
export type LegacyProduct = {
  id: string;
  name: string;
  brand: string;
  category: string;
  image: string;
  color: string;
  price: number;
  storeUrl: string;
  affiliateLink: string;
};

export function toLegacyProduct(p: Product): LegacyProduct {
  return {
    id: p.id,
    name: p.name,
    brand: p.brand,
    category: p.category,
    image: p.image_url,
    color: p.primary_color,
    price: p.price,
    storeUrl: p.store_url || p.affiliate_url,
    affiliateLink: p.affiliate_url,
  };
}

// ─── API Functions ────────────────────────────────────────────────────────────

let _cache: { products: Product[]; timestamp: number } | null = null;
const CACHE_TTL = 60_000; // 1 minute

export async function fetchProducts(category?: string): Promise<Product[]> {
  // Return cached if fresh
  if (_cache && !category && Date.now() - _cache.timestamp < CACHE_TTL) {
    return _cache.products;
  }

  const params = new URLSearchParams();
  if (category) params.set("category", category);
  params.set("limit", "200");

  try {
    const res = await apiFetch(`/api/v1/products?${params}`);
    if (!res.ok) return _cache?.products || [];
    const data = await res.json();
    const products = Array.isArray(data) ? data : [];

    if (!category) {
      _cache = { products, timestamp: Date.now() };
    }

    return products;
  } catch {
    return _cache?.products || [];
  }
}

export async function fetchProductsLegacy(category?: string): Promise<LegacyProduct[]> {
  const products = await fetchProducts(category);
  return products.map(toLegacyProduct);
}

export function invalidateProductsCache(): void {
  _cache = null;
}
