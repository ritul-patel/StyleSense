// ─── Wardrobe Repository Interface ────────────────────────────────────────────
// This abstraction allows swapping localStorage for Supabase without changing UI code.
// Future: implement SupabaseWardrobeRepository that talks to wardrobe_items / closet_items tables.

export type WardrobeItem = {
  id: string;
  productId: string;
  collection: string;
  createdAt: number;
};

export type ClosetItem = {
  id: string;
  imageUrl: string;
  name: string;
  category: string;
  color: string;
  createdAt: number;
};

export type Collection = {
  id: string;
  name: string;
  createdAt: number;
};

export type OutfitBuild = {
  id: string;
  name: string;
  productIds: string[];
  closetItemIds: string[];
  createdAt: number;
};

export interface WardrobeRepository {
  // Wardrobe items
  getItems(): WardrobeItem[];
  addItem(productId: string, collection: string): WardrobeItem;
  removeItem(productId: string): void;
  moveItem(productId: string, collection: string): void;

  // Closet
  getClosetItems(): ClosetItem[];
  addClosetItem(item: Omit<ClosetItem, "id" | "createdAt">): ClosetItem;
  removeClosetItem(id: string): void;

  // Collections
  getCollections(): Collection[];
  createCollection(name: string): Collection;
  renameCollection(id: string, name: string): void;
  deleteCollection(id: string): void;

  // Outfit builder
  getOutfits(): OutfitBuild[];
  saveOutfit(outfit: Omit<OutfitBuild, "id" | "createdAt">): OutfitBuild;
  removeOutfit(id: string): void;

  // Persistence
  persist(): void;
}

// ─── LocalStorage Implementation ──────────────────────────────────────────────

const KEYS = {
  items: "stylesense-wardrobe-items",
  closet: "stylesense-closet-items",
  collections: "stylesense-collections",
  outfits: "stylesense-outfit-builds",
};

const DEFAULT_COLLECTIONS: Collection[] = [
  { id: "wishlist", name: "Wishlist", createdAt: 0 },
  { id: "casual", name: "Casual", createdAt: 0 },
  { id: "formal", name: "Formal", createdAt: 0 },
  { id: "summer", name: "Summer", createdAt: 0 },
  { id: "winter", name: "Winter", createdAt: 0 },
  { id: "office", name: "Office", createdAt: 0 },
  { id: "vacation", name: "Vacation", createdAt: 0 },
];

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

export class LocalStorageWardrobeRepository implements WardrobeRepository {
  private items: WardrobeItem[];
  private closet: ClosetItem[];
  private collections: Collection[];
  private outfits: OutfitBuild[];

  constructor() {
    this.items = load<WardrobeItem[]>(KEYS.items, []);
    this.closet = load<ClosetItem[]>(KEYS.closet, []);
    this.collections = load<Collection[]>(KEYS.collections, DEFAULT_COLLECTIONS);
    this.outfits = load<OutfitBuild[]>(KEYS.outfits, []);

    // Ensure defaults exist
    for (const dc of DEFAULT_COLLECTIONS) {
      if (!this.collections.find((c) => c.id === dc.id)) {
        this.collections.push(dc);
      }
    }
  }

  // ─── Items ──────────────────────────────────────────────────────────────

  getItems(): WardrobeItem[] { return this.items; }

  addItem(productId: string, collection: string): WardrobeItem {
    const existing = this.items.find((i) => i.productId === productId);
    if (existing) return existing;
    const item: WardrobeItem = { id: uid(), productId, collection, createdAt: Date.now() };
    this.items.push(item);
    this.persist();
    return item;
  }

  removeItem(productId: string): void {
    this.items = this.items.filter((i) => i.productId !== productId);
    this.persist();
  }

  moveItem(productId: string, collection: string): void {
    this.items = this.items.map((i) =>
      i.productId === productId ? { ...i, collection } : i
    );
    this.persist();
  }

  // ─── Closet ─────────────────────────────────────────────────────────────

  getClosetItems(): ClosetItem[] { return this.closet; }

  addClosetItem(item: Omit<ClosetItem, "id" | "createdAt">): ClosetItem {
    const newItem: ClosetItem = { ...item, id: uid(), createdAt: Date.now() };
    this.closet.unshift(newItem);
    this.persist();
    return newItem;
  }

  removeClosetItem(id: string): void {
    this.closet = this.closet.filter((i) => i.id !== id);
    this.persist();
  }

  // ─── Collections ────────────────────────────────────────────────────────

  getCollections(): Collection[] { return this.collections; }

  createCollection(name: string): Collection {
    const col: Collection = { id: uid(), name, createdAt: Date.now() };
    this.collections.push(col);
    this.persist();
    return col;
  }

  renameCollection(id: string, name: string): void {
    this.collections = this.collections.map((c) =>
      c.id === id ? { ...c, name } : c
    );
    this.persist();
  }

  deleteCollection(id: string): void {
    // Move items in this collection to Wishlist
    const colName = this.collections.find((c) => c.id === id)?.name;
    if (colName) {
      this.items = this.items.map((i) =>
        i.collection === colName ? { ...i, collection: "Wishlist" } : i
      );
    }
    this.collections = this.collections.filter((c) => c.id !== id);
    this.persist();
  }

  // ─── Outfits ────────────────────────────────────────────────────────────

  getOutfits(): OutfitBuild[] { return this.outfits; }

  saveOutfit(outfit: Omit<OutfitBuild, "id" | "createdAt">): OutfitBuild {
    const newOutfit: OutfitBuild = { ...outfit, id: uid(), createdAt: Date.now() };
    this.outfits.unshift(newOutfit);
    this.persist();
    return newOutfit;
  }

  removeOutfit(id: string): void {
    this.outfits = this.outfits.filter((o) => o.id !== id);
    this.persist();
  }

  // ─── Persistence ────────────────────────────────────────────────────────

  persist(): void {
    try {
      localStorage.setItem(KEYS.items, JSON.stringify(this.items));
      localStorage.setItem(KEYS.closet, JSON.stringify(this.closet));
      localStorage.setItem(KEYS.collections, JSON.stringify(this.collections));
      localStorage.setItem(KEYS.outfits, JSON.stringify(this.outfits));
    } catch (err) {
      console.warn("[wardrobe] Persist failed:", err);
    }
  }
}
