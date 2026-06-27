"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";

// Initialize PostHog once (module-level, client-side only)
if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
    person_profiles: "identified_only",

    // Page views handled manually below
    capture_pageview: false,
    capture_pageleave: true,

    // Session Replay for beta
    session_recording: {
      maskAllInputs: true,
      maskTextSelector: "[data-ph-mask]",
      blockSelector: "[data-ph-block]",
    },

    // Feature Flags
    bootstrap: {},
    advanced_disable_feature_flags: false,

    // Privacy
    mask_all_element_attributes: false,
    sanitize_properties: (properties) => {
      // Strip sensitive fields
      delete properties["$set"]?.["password"];
      delete properties["$set"]?.["token"];
      delete properties["$set"]?.["access_token"];
      delete properties["authorization"];
      delete properties["cookie"];
      return properties;
    },

    // Performance: don't block page load
    loaded: (posthogInstance) => {
      if (process.env.NODE_ENV === "development") {
        posthogInstance.debug(false);
      }
    },
  });
}

function PostHogPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (pathname) {
      let url = window.origin + pathname;
      if (searchParams && searchParams.toString()) {
        url = url + "?" + searchParams.toString();
      }
      posthog.capture("$pageview", { $current_url: url });
    }
  }, [pathname, searchParams]);

  return null;
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  return (
    <PHProvider client={posthog}>
      <Suspense fallback={null}>
        <PostHogPageView />
      </Suspense>
      {children}
    </PHProvider>
  );
}

export { posthog };
