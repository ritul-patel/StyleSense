/**
 * StyleSense Motion System
 *
 * Shared variants, transitions, and utilities for consistent motion.
 * Inspired by Linear, Vercel, Stripe, Apple.
 *
 * Principles:
 * - Fast (150–220ms max)
 * - Perceptible but not distracting (10–16px movement)
 * - GPU-friendly (opacity + transform only)
 * - Accessible (instant when prefers-reduced-motion)
 */

import type { Variants, Transition } from "framer-motion";

// ─── Easing ─────────────────────────────────────────────────────────────────
// Custom easing curve: fast attack, smooth deceleration (similar to Apple)
const EASE_OUT = [0.16, 1, 0.3, 1] as const;
const EASE_IN_OUT = [0.4, 0, 0.2, 1] as const;

// ─── Base Transitions ────────────────────────────────────────────────────────

export const spring = {
  type: "spring",
  stiffness: 400,
  damping: 28,
  mass: 0.8,
} as const satisfies Transition;

export const ease = {
  type: "tween",
  duration: 0.2,
  ease: EASE_OUT,
} as const satisfies Transition;

export const easeOut = {
  type: "tween",
  duration: 0.22,
  ease: EASE_OUT,
} as const satisfies Transition;

// ─── Scroll Reveal Variants ─────────────────────────────────────────────────
// Used with whileInView for scroll-triggered animations.
// Animate once, 0.5s duration, 24px movement, premium ease-out.

export const scrollReveal: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: EASE_OUT },
  },
};

export const scrollRevealScale: Variants = {
  hidden: { opacity: 0, scale: 0.98 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: EASE_OUT },
  },
};

export const scrollStaggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.02,
    },
  },
};

export const scrollStaggerItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: EASE_OUT },
  },
};

// ─── Page Transition Variants ────────────────────────────────────────────────

export const pageVariants: Variants = {
  initial: {
    opacity: 0,
    y: 12,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.22,
      ease: EASE_OUT,
    },
  },
  exit: {
    opacity: 0,
    y: -6,
    transition: {
      duration: 0.15,
      ease: EASE_IN_OUT,
    },
  },
};

// ─── Fade In Variants ────────────────────────────────────────────────────────

export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: 0.2, ease: EASE_OUT },
  },
};

export const fadeInUp: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.22, ease: EASE_OUT },
  },
};

export const fadeInDown: Variants = {
  initial: { opacity: 0, y: -8 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.2, ease: EASE_OUT },
  },
};

// ─── Stagger Container ──────────────────────────────────────────────────────

export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.04,
    },
  },
};

export const staggerItem: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.22, ease: EASE_OUT },
  },
};

// ─── Card Hover ─────────────────────────────────────────────────────────────

export const cardHover = {
  rest: {
    y: 0,
    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
    transition: { duration: 0.2, ease: EASE_OUT },
  },
  hover: {
    y: -3,
    boxShadow: "0 12px 32px rgba(0,0,0,0.1)",
    transition: { duration: 0.2, ease: EASE_OUT },
  },
} satisfies Variants;

// ─── Button Press ───────────────────────────────────────────────────────────

export const buttonTap = {
  scale: 0.97,
  transition: { duration: 0.08 },
};

export const buttonHover = {
  scale: 1.02,
  transition: { duration: 0.15, ease: EASE_OUT },
};

// ─── Toast ──────────────────────────────────────────────────────────────────

export const toastVariants: Variants = {
  initial: { opacity: 0, y: 20, scale: 0.96 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.22, ease: EASE_OUT },
  },
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.96,
    transition: { duration: 0.15, ease: EASE_IN_OUT },
  },
};

// ─── Modal / Dialog ─────────────────────────────────────────────────────────

export const overlayVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.18 } },
  exit: { opacity: 0, transition: { duration: 0.12 } },
};

export const dialogVariants: Variants = {
  initial: { opacity: 0, scale: 0.96, y: 8 },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.22, ease: EASE_OUT },
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    y: 8,
    transition: { duration: 0.15, ease: EASE_IN_OUT },
  },
};

// ─── Dropdown ───────────────────────────────────────────────────────────────

export const dropdownVariants: Variants = {
  initial: { opacity: 0, y: -6, scale: 0.97 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.18, ease: EASE_OUT },
  },
  exit: {
    opacity: 0,
    y: -6,
    scale: 0.97,
    transition: { duration: 0.12, ease: EASE_IN_OUT },
  },
};

// ─── Skeleton Shimmer ───────────────────────────────────────────────────────

export const shimmer: Variants = {
  initial: { x: "-100%" },
  animate: {
    x: "100%",
    transition: {
      repeat: Infinity,
      duration: 1.5,
      ease: "linear",
    },
  },
};

// ─── Form Validation ────────────────────────────────────────────────────────

export const validationMessage: Variants = {
  initial: { opacity: 0, height: 0, y: -4 },
  animate: {
    opacity: 1,
    height: "auto",
    y: 0,
    transition: { duration: 0.18, ease: EASE_OUT },
  },
  exit: {
    opacity: 0,
    height: 0,
    y: -4,
    transition: { duration: 0.12 },
  },
};

// ─── Progressive Reveal (for Analysis Results) ──────────────────────────────

export const revealContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.08,
    },
  },
};

export const revealItem: Variants = {
  initial: { opacity: 0, y: 14 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.28, ease: EASE_OUT },
  },
};
