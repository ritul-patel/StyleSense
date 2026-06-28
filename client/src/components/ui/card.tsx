import { type HTMLAttributes, type ReactNode } from "react";

type CardVariant = "default" | "elevated" | "outlined" | "interactive" | "glass";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: "none" | "sm" | "md" | "lg";
  children: ReactNode;
}

const variantClasses: Record<CardVariant, string> = {
  default: "bg-surface-container-lowest border border-black/5 shadow-sm",
  elevated: "bg-surface-container-lowest shadow-[0_16px_40px_-10px_rgba(28,27,27,0.06)]",
  outlined: "bg-transparent border border-outline-variant",
  interactive:
    "bg-surface-container-lowest border border-black/5 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 cursor-pointer",
  glass: "bg-white/70 backdrop-blur-xl border border-white/20 shadow-lg",
};

const paddingClasses: Record<string, string> = {
  none: "",
  sm: "p-4 md:p-5",
  md: "p-5 md:p-6",
  lg: "p-6 md:p-8",
};

function Card({ variant = "default", padding = "md", children, className = "", ...props }: CardProps) {
  return (
    <div
      className={`rounded-2xl ${variantClasses[variant]} ${paddingClasses[padding]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export { Card, type CardProps, type CardVariant };
