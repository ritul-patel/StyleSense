"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import posthog from "posthog-js";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextValue>({ user: null, loading: true });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // INITIAL_SESSION fires immediately with current session - no separate getSession() needed
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      setLoading(false);

      // PostHog identity management
      if (currentUser && (event === "SIGNED_IN" || event === "INITIAL_SESSION")) {
        posthog.identify(currentUser.id, {
          email: currentUser.email,
          signup_method: currentUser.app_metadata?.provider || "email",
          created_at: currentUser.created_at,
        });

        // Differentiate signup vs login: if account was created within the last 30 seconds, it's a signup
        if (event === "SIGNED_IN") {
          const createdAt = new Date(currentUser.created_at).getTime();
          const isNewUser = Date.now() - createdAt < 30_000;
          if (isNewUser) {
            posthog.capture("signup_completed", {
              method: currentUser.app_metadata?.provider || "email",
            });
          } else {
            posthog.capture("login_completed", {
              method: currentUser.app_metadata?.provider || "email",
            });
          }
        }
      } else if (event === "SIGNED_OUT") {
        posthog.reset();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
