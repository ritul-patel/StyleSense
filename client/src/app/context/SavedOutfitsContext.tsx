"use client";

/**
 * SavedOutfitsContext — API-backed persistence with localStorage fallback.
 *
 * When user is authenticated: syncs with backend via /api/v1/saved-outfits
 * When user is anonymous: falls back to localStorage (migrated to backend on next login)
 *
 * Uses the existing `saved_outfits` table in Supabase.
 */

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import posthog from "posthog-js";
import { useAuth } from "@/lib/auth-context";
import { apiFetch } from "@/lib/api";

export type SavedOutfitRecord = {
  id: string;
  folderId: string;
  createdAt: number;
};

type SavedOutfitsContextType = {
  savedOutfits: SavedOutfitRecord[];
  saveOutfit: (id: string, folderId?: string) => void;
  removeOutfit: (id: string) => void;
  isSaved: (id: string) => boolean;
};

const SavedOutfitsContext = createContext<SavedOutfitsContextType | undefined>(undefined);

const LS_KEY = "savedOutfits";

function readLocalStorage(): SavedOutfitRecord[] {
  try {
    const stored = localStorage.getItem(LS_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];
    if (parsed.length > 0 && typeof parsed[0] === "string") {
      return parsed.map((id: string) => ({ id, folderId: "favorites", createdAt: Date.now() }));
    }
    if (parsed.length > 0 && parsed[0].id) {
      return parsed.map((o: any) => ({
        id: o.id,
        folderId: o.folderId || "favorites",
        createdAt: o.createdAt || Date.now(),
      }));
    }
    return [];
  } catch {
    return [];
  }
}

export function SavedOutfitsProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [savedOutfits, setSavedOutfits] = useState<SavedOutfitRecord[]>([]);
  const [isClient, setIsClient] = useState(false);
  const hydratedRef = useRef(false);

  // Hydrate from API or localStorage
  useEffect(() => {
    setIsClient(true);
    if (authLoading) return;

    if (user && !hydratedRef.current) {
      hydratedRef.current = true;
      // Fetch from API
      apiFetch("/api/v1/saved-outfits")
        .then((r) => (r.ok ? r.json() : []))
        .then((data: any[]) => {
          const fromApi = data.map((d) => ({
            id: d.outfitId,
            folderId: d.folderId || "favorites",
            createdAt: d.createdAt || Date.now(),
          }));

          // Migrate any localStorage items to the API
          const localItems = readLocalStorage();
          const toMigrate = localItems.filter(
            (local) => !fromApi.find((api) => api.id === local.id)
          );

          if (toMigrate.length > 0) {
            // Fire and forget migration
            for (const item of toMigrate) {
              apiFetch("/api/v1/saved-outfits", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ outfitId: item.id, folderId: item.folderId }),
              }).catch(() => {});
            }
          }

          // Merge: API is source of truth, add any local-only items
          const merged = [...fromApi, ...toMigrate];
          setSavedOutfits(merged);

          // Clear localStorage since we're now API-backed
          localStorage.removeItem(LS_KEY);
        })
        .catch(() => {
          // API failed — fall back to localStorage
          setSavedOutfits(readLocalStorage());
        });
    } else if (!user && !authLoading) {
      // Anonymous user — use localStorage
      hydratedRef.current = false;
      setSavedOutfits(readLocalStorage());
    }
  }, [user, authLoading]);

  // Persist to localStorage for anonymous users only
  useEffect(() => {
    if (!isClient || user) return;
    localStorage.setItem(LS_KEY, JSON.stringify(savedOutfits));
  }, [savedOutfits, isClient, user]);

  const saveOutfit = useCallback((id: string, folderId = "favorites") => {
    setSavedOutfits((prev) => {
      if (prev.find((o) => o.id === id)) return prev;
      posthog.capture("outfit_saved", { outfit_id: id, folder_id: folderId });
      return [...prev, { id, folderId, createdAt: Date.now() }];
    });

    // Persist to API if authenticated
    if (user) {
      apiFetch("/api/v1/saved-outfits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ outfitId: id, folderId }),
      }).catch(() => {});
    }
  }, [user]);

  const removeOutfit = useCallback((id: string) => {
    setSavedOutfits((prev) => prev.filter((o) => o.id !== id));

    // Remove from API if authenticated
    if (user) {
      apiFetch(`/api/v1/saved-outfits/${encodeURIComponent(id)}`, {
        method: "DELETE",
      }).catch(() => {});
    }
  }, [user]);

  const isSaved = useCallback((id: string) => {
    return savedOutfits.some((o) => o.id === id);
  }, [savedOutfits]);

  return (
    <SavedOutfitsContext.Provider value={{ savedOutfits, saveOutfit, removeOutfit, isSaved }}>
      {children}
    </SavedOutfitsContext.Provider>
  );
}

export function useSavedOutfits() {
  const ctx = useContext(SavedOutfitsContext);
  if (!ctx) throw new Error("useSavedOutfits must be used within SavedOutfitsProvider");
  return ctx;
}
