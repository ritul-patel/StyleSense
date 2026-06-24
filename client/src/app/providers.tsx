"use client";

import { AuthProvider } from "@/lib/auth-context";
import { SavedOutfitsProvider } from "./context/SavedOutfitsContext";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <SavedOutfitsProvider>
        {children}
      </SavedOutfitsProvider>
    </AuthProvider>
  );
}
