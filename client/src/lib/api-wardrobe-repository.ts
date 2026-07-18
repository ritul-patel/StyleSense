import { apiFetch } from "./api";
import type {
  WardrobeRepository,
  WardrobeItem,
  ClosetItem,
  Collection,
  OutfitBuild,
} from "./wardrobe-repository";

// Default collections to merge when backend has none yet
const DEFAULT_COLLECTIONS: Collection[] = [
  { id: "wishlist", name: "Wishlist", createdAt: 0 },
  { id: "casual", name: "Casual", createdAt: 0 },
  { id: "formal", name: "Formal", createdAt: 0 },
  { id: "summer", name: "Summer", createdAt: 0 },
  { id: "winter", name: "Winter", createdAt: 0 },
  { id: "office", name: "Office", createdAt: 0 },
  { id: "vacation", name: "Vacation", createdAt: 0 },
];

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as any)?.message || `Request failed: ${res.status}`);
  }
  return res.json();
}

/**
 * API-backed wardrobe repository.
 * This replaces LocalStorageWardrobeRepository.
 * All data flows through the Express backend.
 */
export class ApiWardrobeRepository implements WardrobeRepository {
  private items: WardrobeItem[] = [];
  private closet: ClosetItem[] = [];
  private collections: Collection[] = DEFAULT_COLLECTIONS;
  private outfits: OutfitBuild[] = [];
  private loaded = false;

  // ─── Hydration (call once after login) ──────────────────────────────────

  async hydrate(): Promise<void> {
    if (this.loaded) return;
    const [items, closet, outfits, collections] = await Promise.all([
      apiFetch("/api/v1/wardrobe").then((r) => json<WardrobeItem[]>(r)).catch(() => []),
      apiFetch("/api/v1/wardrobe/closet").then((r) => json<ClosetItem[]>(r)).catch(() => []),
      apiFetch("/api/v1/wardrobe/outfits").then((r) => json<OutfitBuild[]>(r)).catch(() => []),
      apiFetch("/api/v1/wardrobe/collections").then((r) => json<Collection[]>(r)).catch(() => []),
    ]);
    this.items = items;
    this.closet = closet;
    this.outfits = outfits;
    // Merge defaults with user collections
    const merged = [...DEFAULT_COLLECTIONS];
    for (const c of collections) {
      if (!merged.find((m) => m.name === c.name)) merged.push(c);
    }
    this.collections = merged;
    this.loaded = true;
  }

  // ─── Items ──────────────────────────────────────────────────────────────

  getItems(): WardrobeItem[] { return this.items; }

  addItem(productId: string, collection: string): WardrobeItem {
    const existing = this.items.find((i) => i.productId === productId);
    if (existing) return existing;
    // Optimistic update
    const temp: WardrobeItem = { id: `temp-${Date.now()}`, productId, collection, createdAt: Date.now() };
    this.items.push(temp);
    // Fire API (async, updates id on success)
    apiFetch("/api/v1/wardrobe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, collection }),
    }).then((r) => json<WardrobeItem>(r)).then((real) => {
      const idx = this.items.findIndex((i) => i.id === temp.id);
      if (idx >= 0) this.items[idx] = real;
    }).catch(() => {
      // Rollback on failure
      this.items = this.items.filter((i) => i.id !== temp.id);
    });
    return temp;
  }

  removeItem(productId: string): void {
    const item = this.items.find((i) => i.productId === productId);
    this.items = this.items.filter((i) => i.productId !== productId);
    if (item) {
      apiFetch(`/api/v1/wardrobe/${encodeURIComponent(productId)}`, { method: "DELETE" }).catch(() => {
        // Rollback
        this.items.push(item);
      });
    }
  }

  moveItem(productId: string, collection: string): void {
    const item = this.items.find((i) => i.productId === productId);
    if (!item) return;
    const oldCol = item.collection;
    item.collection = collection;
    apiFetch(`/api/v1/wardrobe/${encodeURIComponent(item.id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ collection }),
    }).catch(() => { item.collection = oldCol; });
  }

  // ─── Closet ─────────────────────────────────────────────────────────────

  getClosetItems(): ClosetItem[] { return this.closet; }

  addClosetItem(item: Omit<ClosetItem, "id" | "createdAt">): ClosetItem {
    const temp: ClosetItem = { ...item, id: `temp-${Date.now()}`, createdAt: Date.now() };
    this.closet.unshift(temp);
    apiFetch("/api/v1/wardrobe/closet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item),
    }).then((r) => json<ClosetItem>(r)).then((real) => {
      const idx = this.closet.findIndex((i) => i.id === temp.id);
      if (idx >= 0) this.closet[idx] = real;
    }).catch(() => {
      this.closet = this.closet.filter((i) => i.id !== temp.id);
    });
    return temp;
  }

  removeClosetItem(id: string): void {
    const item = this.closet.find((i) => i.id === id);
    this.closet = this.closet.filter((i) => i.id !== id);
    if (item && !id.startsWith("temp-")) {
      apiFetch(`/api/v1/wardrobe/closet/${encodeURIComponent(id)}`, { method: "DELETE" }).catch(() => {
        if (item) this.closet.unshift(item);
      });
    }
  }

  // ─── Collections ────────────────────────────────────────────────────────

  getCollections(): Collection[] { return this.collections; }

  createCollection(name: string): Collection {
    const temp: Collection = { id: `temp-${Date.now()}`, name, createdAt: Date.now() };
    this.collections.push(temp);
    apiFetch("/api/v1/wardrobe/collections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    }).then((r) => json<Collection>(r)).then((real) => {
      const idx = this.collections.findIndex((c) => c.id === temp.id);
      if (idx >= 0) this.collections[idx] = real;
    }).catch(() => {
      this.collections = this.collections.filter((c) => c.id !== temp.id);
    });
    return temp;
  }

  renameCollection(id: string, name: string): void {
    const col = this.collections.find((c) => c.id === id);
    if (!col || id.startsWith("temp-")) return;
    const oldName = col.name;
    col.name = name;
    apiFetch(`/api/v1/wardrobe/collections/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    }).catch(() => { col.name = oldName; });
  }

  deleteCollection(id: string): void {
    const col = this.collections.find((c) => c.id === id);
    if (!col) return;
    // Move items to Wishlist locally
    this.items = this.items.map((i) => i.collection === col.name ? { ...i, collection: "Wishlist" } : i);
    this.collections = this.collections.filter((c) => c.id !== id);
    if (!id.startsWith("temp-")) {
      apiFetch(`/api/v1/wardrobe/collections/${encodeURIComponent(id)}`, { method: "DELETE" }).catch(() => {
        this.collections.push(col);
      });
    }
  }

  // ─── Outfits ────────────────────────────────────────────────────────────

  getOutfits(): OutfitBuild[] { return this.outfits; }

  saveOutfit(outfit: Omit<OutfitBuild, "id" | "createdAt">): OutfitBuild {
    const temp: OutfitBuild = { ...outfit, id: `temp-${Date.now()}`, createdAt: Date.now() };
    this.outfits.unshift(temp);
    apiFetch("/api/v1/wardrobe/outfits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(outfit),
    }).then((r) => json<OutfitBuild>(r)).then((real) => {
      const idx = this.outfits.findIndex((o) => o.id === temp.id);
      if (idx >= 0) this.outfits[idx] = real;
    }).catch(() => {
      this.outfits = this.outfits.filter((o) => o.id !== temp.id);
    });
    return temp;
  }

  removeOutfit(id: string): void {
    const outfit = this.outfits.find((o) => o.id === id);
    this.outfits = this.outfits.filter((o) => o.id !== id);
    if (outfit && !id.startsWith("temp-")) {
      apiFetch(`/api/v1/wardrobe/outfits/${encodeURIComponent(id)}`, { method: "DELETE" }).catch(() => {
        if (outfit) this.outfits.unshift(outfit);
      });
    }
  }

  // ─── Persist (no-op for API repo - server is source of truth) ───────────

  persist(): void { /* No-op: all mutations are sent to the API immediately */ }
}
