import { forwardRef, type InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helper?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helper, id, className = "", ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-on-surface"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : helper ? `${inputId}-helper` : undefined}
          className={`
            h-12 w-full rounded-xl border bg-surface-container-lowest px-4 text-sm text-on-surface
            placeholder:text-outline transition-all duration-200
            border-outline-variant
            hover:border-outline
            focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10
            disabled:opacity-50 disabled:cursor-not-allowed
            ${error ? "border-error focus:border-error focus:ring-error/10" : ""}
            ${className}
          `.trim()}
          {...props}
        />
        {error && (
          <p id={`${inputId}-error`} className="text-xs text-error font-medium" role="alert">
            {error}
          </p>
        )}
        {!error && helper && (
          <p id={`${inputId}-helper`} className="text-xs text-outline">
            {helper}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
export { Input, type InputProps };
