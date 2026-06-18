import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cn } from "../../utils/cn";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  label?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, label, hint, id, ...props }, ref) => {
    const inputId = id || props.name;
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-slate-700">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={error || undefined}
          aria-describedby={hint ? `${inputId}-hint` : undefined}
          className={cn(
            "w-full h-11 rounded-xl border bg-white px-3.5 text-sm text-slate-900 placeholder:text-slate-400",
            "transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/30",
            error
              ? "border-rose-400 focus:border-rose-500"
              : "border-slate-300 focus:border-indigo-500",
            className,
          )}
          {...props}
        />
        {hint && (
          <p id={`${inputId}-hint`} className={cn("mt-1 text-xs", error ? "text-rose-600" : "text-slate-500")}>
            {hint}
          </p>
        )}
      </div>
    );
  },
);
Input.displayName = "Input";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
  label?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, label, id, ...props }, ref) => {
    const inputId = id || props.name;
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-slate-700">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          aria-invalid={error || undefined}
          className={cn(
            "w-full min-h-[88px] rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400",
            "transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/30",
            error
              ? "border-rose-400 focus:border-rose-500"
              : "border-slate-300 focus:border-indigo-500",
            className,
          )}
          {...props}
        />
      </div>
    );
  },
);
Textarea.displayName = "Textarea";