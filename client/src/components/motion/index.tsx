"use client";

/**
 * StyleSense Motion Components
 *
 * Lightweight wrappers for common motion patterns.
 * All respect prefers-reduced-motion automatically via useReducedMotion().
 *
 * SSR Safety:
 * - Never conditionally render <motion.div> vs <div> based on useReducedMotion()
 *   because the hook returns null on server and a boolean on client → hydration mismatch.
 * - Instead, always render <motion.div> and pass `initial={false}` when reduced motion
 *   is preferred. This tells framer-motion to skip the initial state and render the
 *   element in its final "visible" state immediately — same DOM structure, no mismatch.
 */

import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  pageVariants,
  staggerContainer,
  staggerItem,
  fadeInUp,
  toastVariants,
  overlayVariants,
  dialogVariants,
  dropdownVariants,
  revealContainer,
  revealItem,
} from "@/lib/motion";
import type { ReactNode } from "react";

// ─── Page Wrapper ───────────────────────────────────────────────────────────

export function PageTransition({ children, className }: { children: ReactNode; className?: string }) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      initial={reduced ? false : "initial"}
      animate="animate"
      variants={pageVariants}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── Stagger List ───────────────────────────────────────────────────────────

export function StaggerList({ children, className }: { children: ReactNode; className?: string }) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      initial={reduced ? false : "initial"}
      animate="animate"
      variants={staggerContainer}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  const reduced = useReducedMotion();
  return (
    <motion.div variants={reduced ? undefined : staggerItem} className={className}>
      {children}
    </motion.div>
  );
}

// ─── Fade In Up ─────────────────────────────────────────────────────────────

export function FadeInUp({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      initial={reduced ? false : "initial"}
      animate="animate"
      variants={{
        initial: fadeInUp.initial,
        animate: {
          ...fadeInUp.animate,
          transition: {
            ...(fadeInUp.animate as any).transition,
            delay,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── Progressive Reveal (for Analysis Results) ──────────────────────────────

export function RevealSection({ children, className }: { children: ReactNode; className?: string }) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      initial={reduced ? false : "initial"}
      animate="animate"
      variants={revealContainer}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function RevealItem({ children, className }: { children: ReactNode; className?: string }) {
  const reduced = useReducedMotion();
  return (
    <motion.div variants={reduced ? undefined : revealItem} className={className}>
      {children}
    </motion.div>
  );
}

// ─── Toast ──────────────────────────────────────────────────────────────────

export function Toast({ children, visible }: { children: ReactNode; visible: boolean }) {
  const reduced = useReducedMotion();
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          variants={reduced ? undefined : toastVariants}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Modal ──────────────────────────────────────────────────────────────────

export function ModalOverlay({ children, onClose }: { children: ReactNode; onClose: () => void }) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      variants={reduced ? undefined : overlayVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      onClick={onClose}
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200]"
    >
      {children}
    </motion.div>
  );
}

export function ModalDialog({ children, className }: { children: ReactNode; className?: string }) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      variants={reduced ? undefined : dialogVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      onClick={(e) => e.stopPropagation()}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── Dropdown ───────────────────────────────────────────────────────────────

export function Dropdown({ children, open, className }: { children: ReactNode; open: boolean; className?: string }) {
  const reduced = useReducedMotion();
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          variants={reduced ? undefined : dropdownVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className={className}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Skeleton ───────────────────────────────────────────────────────────────

export function Skeleton({ className = "", width, height }: { className?: string; width?: string; height?: string }) {
  return (
    <div
      className={`relative overflow-hidden rounded-xl bg-surface-container-high ${className}`}
      style={{ width, height }}
    >
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
        initial={{ x: "-100%" }}
        animate={{ x: "100%" }}
        transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
      />
    </div>
  );
}

// ─── Scroll Reveal ──────────────────────────────────────────────────────────
// Elements animate every time they enter the viewport and reset when they leave.
// Framer-motion automatically reverts to `initial` when `whileInView` is no
// longer satisfied — no manual state management needed.

const VIEWPORT_OPTS = { once: true, margin: "-60px 0px" } as const;

export function ScrollReveal({ children, className }: { children: ReactNode; className?: string }) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      viewport={VIEWPORT_OPTS}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function ScrollRevealScale({ children, className }: { children: ReactNode; className?: string }) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, scale: 0.98 }}
      whileInView={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      viewport={VIEWPORT_OPTS}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ScrollStagger: a simple wrapper that passes className.
export function ScrollStagger({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={className}>
      {children}
    </div>
  );
}

// Each item independently triggers its own viewport animation and resets on exit.
export function ScrollStaggerItem({ children, className, index = 0 }: { children: ReactNode; className?: string; index?: number }) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1], delay: index * 0.05 }}
      viewport={VIEWPORT_OPTS}
      className={className || "h-full"}
    >
      {children}
    </motion.div>
  );
}

// ─── Re-exports for convenience ─────────────────────────────────────────────

export { AnimatePresence, motion, useReducedMotion } from "framer-motion";
export { buttonTap, buttonHover, cardHover } from "@/lib/motion";
