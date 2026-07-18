"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { ApiWardrobeRepository } from "@/lib/api-wardrobe-repository";
import type {
  WardrobeItem,
  ClosetItem,
  Collection,
  OutfitBuild,
} from "@/lib/wardrobe-repository";

// ─── Context Type ─────────────────────────────────────────────────────────────

type WardrobeContextType = {
  items: WardrobeItem[];
  addToWardrobe: (productId: string, collection?: string) => void;
  removeFromWardrobe: (productId: string) => void;
  isInWardrobe: (productId: string) => boolean;
  getCollection: (name: string) => WardrobeItem[];
  moveToCollection: (productId: string, collection: string) => void;

  collections: Collection[];
  createCollection: (name: string) => void;
  renameCollection: (id: string, name: string) => void;
  deleteCollection: (id: string) => void;

  closetItems: ClosetItem[];
  addClosetItem: (item: Omit<ClosetItem, "id" | "createdAt">) => void;
  removeClosetItem: (id: string) => void;

  outfits: OutfitBuild[];
  saveOutfit: (outfit: Omit<OutfitBuild, "id" | "createdAt">) => void;
  removeOutfit: (id: string) => void;

  ready: boolean;
};

const WardrobeContext = createContext<WardrobeContextType | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function WardrobeProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const repoRef = useRef<ApiWardrobeRepository | null>(null);
  const hydratedForUser = useRef<string | null>(null);
  const [items, setItems] = useState<WardrobeItem[]>([]);
  const [closetItems, setClosetItems] = useState<ClosetItem[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [outfits, setOutfits] = useState<OutfitBuild[]>([]);
  const [ready, setReady] = useState(false);

  // Hydrate once per user session - stable dependency on user.id string
  const userId = user?.id ?? null;

  useEffect(() => {
    if (authLoading) return;

    // Already hydrated for this user - skip
    if (hydratedForUser.current === userId) return;

    if (!userId) {
      // Not logged in - reset state
      repoRef.current = null;
      hydratedForUser.current = null;
      setItems([]);
      setClosetItems([]);
      setCollections([]);
      setOutfits([]);
      setReady(true);
      return;
    }

    // New user - hydrate from API
    hydratedForUser.current = userId;
    const repo = new ApiWardrobeRepository();
    repoRef.current = repo;

    repo.hydrate().then(() => {
      setItems([...repo.getItems()]);
      setClosetItems([...repo.getClosetItems()]);
      setCollections([...repo.getCollections()]);
      setOutfits([...repo.getOutfits()]);
      setReady(true);
    }).catch((err) => {
      console.warn("[wardrobe] Hydration failed:", err);
      setReady(true);
    });
  }, [userId, authLoading]);

  const repo = () => repoRef.current;
  const sync = () => {
    const r = repo();
    if (!r) return;
    setItems([...r.getItems()]);
    setClosetItems([...r.getClosetItems()]);
    setCollections([...r.getCollections()]);
    setOutfits([...r.getOutfits()]);
  };

  // ─── Wardrobe Items ───────────────────────────────────────────────────

  const addToWardrobe = useCallback((productId: string, collection = "Wishlist") => {
    const r = repo();
    if (!r) return;
    r.addItem(productId, collection);
    sync();
  }, []);

  const removeFromWardrobe = useCallback((productId: string) => {
    const r = repo();
    if (!r) return;
    r.removeItem(productId);
    sync();
  }, []);

  const isInWardrobe = useCallback(
    (productId: string) => items.some((i) => i.productId === productId),
    [items]
  );

  const getCollection = useCallback(
    (name: string) => items.filter((i) => i.collection === name),
    [items]
  );

  const moveToCollection = useCallback((productId: string, collection: string) => {
    const r = repo();
    if (!r) return;
    r.moveItem(productId, collection);
    sync();
  }, []);

  // ─── Collections ──────────────────────────────────────────────────────

  const createCollection = useCallback((name: string) => {
    const r = repo();
    if (!r) return;
    r.createCollection(name);
    sync();
  }, []);

  const renameCollection = useCallback((id: string, name: string) => {
    const r = repo();
    if (!r) return;
    r.renameCollection(id, name);
    sync();
  }, []);

  const deleteCollection = useCallback((id: string) => {
    const r = repo();
    if (!r) return;
    r.deleteCollection(id);
    sync();
  }, []);

  // ─── Closet ───────────────────────────────────────────────────────────

  const addClosetItem = useCallback((item: Omit<ClosetItem, "id" | "createdAt">) => {
    const r = repo();
    if (!r) return;
    r.addClosetItem(item);
    sync();
  }, []);

  const removeClosetItem = useCallback((id: string) => {
    const r = repo();
    if (!r) return;
    r.removeClosetItem(id);
    sync();
  }, []);

  // ─── Outfits ──────────────────────────────────────────────────────────

  const saveOutfit = useCallback((outfit: Omit<OutfitBuild, "id" | "createdAt">) => {
    const r = repo();
    if (!r) return;
    r.saveOutfit(outfit);
    sync();
  }, []);

  const removeOutfit = useCallback((id: string) => {
    const r = repo();
    if (!r) return;
    r.removeOutfit(id);
    sync();
  }, []);

  return (
    <WardrobeContext.Provider
      value={{
        items, addToWardrobe, removeFromWardrobe, isInWardrobe,
        getCollection, moveToCollection,
        collections, createCollection, renameCollection, deleteCollection,
        closetItems, addClosetItem, removeClosetItem,
        outfits, saveOutfit, removeOutfit,
        ready,
      }}
    >
      {children}
    </WardrobeContext.Provider>
  );
}

export function useWardrobe() {
  const ctx = useContext(WardrobeContext);
  if (!ctx) throw new Error("useWardrobe must be used within WardrobeProvider");
  return ctx;
}

export type { WardrobeItem, ClosetItem, Collection, OutfitBuild } from "@/lib/wardrobe-repository";
