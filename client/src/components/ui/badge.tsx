import { type ReactNode } from "react";

type BadgeVariant = "primary" | "secondary" | "success" | "warning" | "error" | "neutral";

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
  icon?: ReactNode;
}

const variantClasses: Record<BadgeVariant, string> = {
  primary: "bg-primary-fixed text-on-primary-fixed",
  secondary: "bg-surface-container text-on-surface-variant",
  success: "bg-green-50 text-green-700 border border-green-200",
  warning: "bg-amber-50 text-amber-700 border border-amber-200",
  error: "bg-red-50 text-red-700 border border-red-200",
  neutral: "bg-surface-container-low text-on-surface-variant border border-outline-variant",
};

function Badge({ variant = "primary", children, className = "", icon }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.12em] ${variantClasses[variant]} ${className}`}
    >
      {icon}
      {children}
    </span>
  );
}

export { Badge, type BadgeProps, type BadgeVariant };
