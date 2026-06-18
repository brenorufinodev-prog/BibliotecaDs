import type { ReactNode } from "react";
import { cn } from "../../utils/cn";

interface TabsProps<T extends string> {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; count?: number }[];
  className?: string;
}

export function Tabs<T extends string>({ value, onChange, options, className }: TabsProps<T>) {
  return (
    <div
      role="tablist"
      className={cn(
        "inline-flex w-full sm:w-auto overflow-x-auto rounded-xl bg-slate-100 p-1 gap-1",
        className,
      )}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg px-3.5 h-10 text-sm font-medium transition-colors min-w-[44px]",
              active
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900",
            )}
          >
            {opt.label}
            {typeof opt.count === "number" && (
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                  active ? "bg-indigo-100 text-indigo-700" : "bg-slate-200 text-slate-600",
                )}
              >
                {opt.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function TabPanel({ children }: { children: ReactNode }) {
  return <div role="tabpanel" className="mt-4">{children}</div>;
}