import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  icon?: ReactNode;
  children: ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-gradient-to-br from-primary to-primary-container text-on-primary shadow-[0_4px_16px_rgba(0,43,146,0.25)] hover:shadow-[0_8px_24px_rgba(0,43,146,0.3)] hover:scale-[1.02] active:scale-[0.98]",
  secondary:
    "bg-surface-container-low text-on-surface border border-outline-variant hover:bg-surface-container hover:border-outline active:scale-[0.98]",
  outline:
    "bg-transparent text-primary border-2 border-primary hover:bg-primary/5 active:scale-[0.98]",
  ghost:
    "bg-transparent text-on-surface-variant hover:bg-surface-container hover:text-on-surface active:scale-[0.98]",
  danger:
    "bg-transparent text-error border-2 border-error hover:bg-error hover:text-on-error active:scale-[0.98]",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-9 px-4 text-xs gap-1.5 rounded-lg",
  md: "h-11 px-6 text-sm gap-2 rounded-xl",
  lg: "h-13 px-8 text-base gap-2.5 rounded-full",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", isLoading = false, icon, children, className = "", disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`
          inline-flex items-center justify-center font-bold transition-all duration-200 
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2
          disabled:opacity-50 disabled:pointer-events-none disabled:shadow-none
          ${variantClasses[variant]} ${sizeClasses[size]} ${className}
        `.trim()}
        {...props}
      >
        {isLoading && (
          <span className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin shrink-0" />
        )}
        {!isLoading && icon && <span className="shrink-0">{icon}</span>}
        <span>{children}</span>
      </button>
    );
  }
);

Button.displayName = "Button";
export { Button, type ButtonProps, type ButtonVariant, type ButtonSize };
