import { forwardRef, type SelectHTMLAttributes } from "react";
import { cn } from "../../utils/cn";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, label, id, children, ...props }, ref) => {
    const selectId = id || props.name;
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={selectId} className="mb-1.5 block text-sm font-medium text-slate-700">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          aria-invalid={error || undefined}
          className={cn(
            "w-full h-11 rounded-xl border bg-white px-3 text-sm text-slate-900",
            "transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/30",
            error
              ? "border-rose-400 focus:border-rose-500"
              : "border-slate-300 focus:border-indigo-500",
            className,
          )}
          {...props}
        >
          {children}
        </select>
      </div>
    );
  },
);
Select.displayName = "Select";