"use client";

import { AuthProvider } from "@/lib/auth-context";
import { LenisProvider } from "@/lib/lenis";
import { PostHogProvider } from "./providers/PostHogProvider";
import { SavedOutfitsProvider } from "./context/SavedOutfitsContext";
import { WardrobeProvider } from "./context/WardrobeContext";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <PostHogProvider>
        <LenisProvider>
          <SavedOutfitsProvider>
            <WardrobeProvider>
              {children}
            </WardrobeProvider>
          </SavedOutfitsProvider>
        </LenisProvider>
      </PostHogProvider>
    </AuthProvider>
  );
}
