"use client";

import { AuthProvider } from "@/lib/auth-context";
import { SavedOutfitsProvider } from "./context/SavedOutfitsContext";
import { WardrobeProvider } from "./context/WardrobeContext";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <SavedOutfitsProvider>
        <WardrobeProvider>
          {children}
        </WardrobeProvider>
      </SavedOutfitsProvider>
    </AuthProvider>
  );
}
