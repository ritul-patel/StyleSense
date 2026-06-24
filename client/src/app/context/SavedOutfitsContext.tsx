"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import posthog from "posthog-js";

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

export function SavedOutfitsProvider({ children }: { children: React.ReactNode }) {
  const [savedOutfits, setSavedOutfits] = useState<SavedOutfitRecord[]>([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    try {
      const stored = localStorage.getItem("savedOutfits");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          if (parsed.length > 0 && typeof parsed[0] === "string") {
              setSavedOutfits(parsed.map((id: string) => ({ id, folderId: "favorites", createdAt: Date.now() })));
          } else if (parsed.length > 0 && parsed[0].id) {
             const cleaned = parsed.map((o: any) => ({
               id: o.id,
               folderId: o.folderId || "favorites",
               createdAt: o.createdAt || Date.now()
             }));
             setSavedOutfits(cleaned);
          }
        }
      }
    } catch (e) {
      console.warn("Failed to parse savedOutfits", e);
    }
  }, []);

  useEffect(() => {
    if (!isClient) return;
    localStorage.setItem("savedOutfits", JSON.stringify(savedOutfits));
  }, [savedOutfits, isClient]);

  const saveOutfit = (id: string, folderId = "favorites") => {
    setSavedOutfits((prev) => {
      if (prev.find((o) => o.id === id)) return prev;
      posthog.capture("outfit_saved", { outfit_id: id, folder_id: folderId });
      return [...prev, { id, folderId, createdAt: Date.now() }];
    });
  };

  const removeOutfit = (id: string) => {
    setSavedOutfits((prev) => prev.filter((o) => o.id !== id));
  };

  const isSaved = (id: string) => {
    return savedOutfits.some((o) => o.id === id);
  };

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
