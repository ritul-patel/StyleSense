"use client";

import { AuthProvider } from "@/lib/auth-context";
import { PostHogProvider } from "./providers/PostHogProvider";
import { SavedOutfitsProvider } from "./context/SavedOutfitsContext";
import { WardrobeProvider } from "./context/WardrobeContext";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <PostHogProvider>
        <SavedOutfitsProvider>
          <WardrobeProvider>
            {children}
          </WardrobeProvider>
        </SavedOutfitsProvider>
      </PostHogProvider>
    </AuthProvider>
  );
}
