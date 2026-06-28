import { type HTMLAttributes, type ReactNode, type ElementType } from "react";

type TypographyVariant =
  | "display"
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "body"
  | "body-sm"
  | "caption"
  | "label"
  | "overline";

interface TypographyProps extends HTMLAttributes<HTMLElement> {
  variant?: TypographyVariant;
  as?: ElementType;
  muted?: boolean;
  children: ReactNode;
}

const variantStyles: Record<TypographyVariant, { tag: string; classes: string }> = {
  display: {
    tag: "h1",
    classes: "text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tighter leading-[1.05] font-[family-name:var(--font-headline)]",
  },
  h1: {
    tag: "h1",
    classes: "text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-tight font-[family-name:var(--font-headline)]",
  },
  h2: {
    tag: "h2",
    classes: "text-2xl sm:text-3xl font-bold tracking-tight font-[family-name:var(--font-headline)]",
  },
  h3: {
    tag: "h3",
    classes: "text-xl sm:text-2xl font-bold tracking-tight font-[family-name:var(--font-headline)]",
  },
  h4: {
    tag: "h4",
    classes: "text-lg font-bold font-[family-name:var(--font-headline)]",
  },
  body: {
    tag: "p",
    classes: "text-base leading-relaxed",
  },
  "body-sm": {
    tag: "p",
    classes: "text-sm leading-relaxed",
  },
  caption: {
    tag: "p",
    classes: "text-xs leading-relaxed",
  },
  label: {
    tag: "span",
    classes: "text-[10px] font-bold uppercase tracking-[0.15em] font-[family-name:var(--font-label)]",
  },
  overline: {
    tag: "span",
    classes: "text-[10px] font-bold uppercase tracking-[0.2em]",
  },
};

function Typography({ variant = "body", as, muted, children, className = "", ...props }: TypographyProps) {
  const { tag, classes } = variantStyles[variant];
  const Tag = (as || tag) as any;
  const mutedClass = muted ? "text-on-surface-variant" : "";

  return (
    <Tag className={`${classes} ${mutedClass} ${className}`} {...props}>
      {children}
    </Tag>
  );
}

export { Typography, type TypographyProps, type TypographyVariant };
