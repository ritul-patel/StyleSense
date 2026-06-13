import { ButtonHTMLAttributes, ReactNode } from "react";
import styles from "./analysis-ui.module.css";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary";
  isLoading?: boolean;
}

export default function Button({
  children,
  variant = "primary",
  isLoading = false,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  const baseClass = variant === "primary" ? styles.primaryButton : styles.secondaryButton;
  
  return (
    <button
      className={`${baseClass} ${className}`.trim()}
      disabled={disabled || isLoading}
      {...props}
    >
      <span className={styles.buttonRow}>
        {isLoading && <span className={styles.spinner} aria-hidden="true" />}
        <span>{children}</span>
      </span>
    </button>
  );
}
