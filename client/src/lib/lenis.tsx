"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";

/**
 * LenisProvider - Global smooth scrolling for the entire application.
 *
 * Configuration:
 * - duration: 1.0s - subtle momentum, not floaty (Apple/Linear feel)
 * - easing: exponential decay - fast response, soft deceleration
 * - wheelMultiplier: 1 - no amplification, preserves user intent
 * - smoothWheel only - touch devices use native scroll (no conflicts
 *   with mobile keyboards, pull-to-refresh, rubber-banding)
 * - autoResize: true - handles viewport changes (keyboard, rotation)
 *
 * Respects prefers-reduced-motion (disables entirely).
 * Scrolls to top on Next.js route changes (immediate, no animation).
 */
export function LenisProvider({ children }: { children: React.ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);
  const rafRef = useRef<number>(0);
  const pathname = usePathname();

  useEffect(() => {
    // Respect prefers-reduced-motion - skip Lenis entirely
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    const lenis = new Lenis({
      duration: 1.0,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      wheelMultiplier: 1,
      infinite: false,
      autoResize: true,
    });

    lenisRef.current = lenis;

    // RAF loop for Lenis
    function raf(time: number) {
      lenis.raf(time);
      rafRef.current = requestAnimationFrame(raf);
    }
    rafRef.current = requestAnimationFrame(raf);

    // Cleanup on unmount
    return () => {
      cancelAnimationFrame(rafRef.current);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  // Scroll to top on route change (preserves Next.js scroll restoration behavior)
  useEffect(() => {
    if (lenisRef.current) {
      lenisRef.current.scrollTo(0, { immediate: true });
    }
  }, [pathname]);

  return <>{children}</>;
}
