"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, Suspense } from "react";

/**
 * PostHog initialization — deferred until after hydration.
 * 
 * Previously ran at module-evaluation time (blocking main thread during parse).
 * Now deferred via requestIdleCallback so the browser can render first.
 */
let posthogInitialized = false;

function initPostHog() {
  if (posthogInitialized || typeof window === "undefined" || !process.env.NEXT_PUBLIC_POSTHOG_KEY) return;
  posthogInitialized = true;

  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
    person_profiles: "identified_only",
    capture_pageview: false,
    capture_pageleave: true,
    session_recording: {
      maskAllInputs: true,
      maskTextSelector: "[data-ph-mask]",
      blockSelector: "[data-ph-block]",
    },
    bootstrap: {},
    advanced_disable_feature_flags: false,
    mask_all_element_attributes: false,
    sanitize_properties: (properties) => {
      delete properties["$set"]?.["password"];
      delete properties["$set"]?.["token"];
      delete properties["$set"]?.["access_token"];
      delete properties["authorization"];
      delete properties["cookie"];
      return properties;
    },
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
    if (!pathname) return;
    // Ensure PostHog is ready before capturing
    if (!posthogInitialized) initPostHog();
    let url = window.origin + pathname;
    if (searchParams && searchParams.toString()) {
      url = url + "?" + searchParams.toString();
    }
    posthog.capture("$pageview", { $current_url: url });
  }, [pathname, searchParams]);

  return null;
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const deferredRef = useRef(false);

  useEffect(() => {
    if (deferredRef.current) return;
    deferredRef.current = true;

    // Defer PostHog initialization until browser is idle
    if ("requestIdleCallback" in window) {
      requestIdleCallback(() => initPostHog(), { timeout: 3000 });
    } else {
      setTimeout(initPostHog, 1500);
    }
  }, []);

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
