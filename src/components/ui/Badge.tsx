import type { ReactNode } from "react";
import { cn } from "../../utils/cn";

type Tone = "green" | "yellow" | "red" | "blue" | "gray" | "indigo" | "amber";

const tones: Record<Tone, string> = {
  green: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  yellow: "bg-amber-100 text-amber-800 ring-amber-200",
  red: "bg-rose-100 text-rose-800 ring-rose-200",
  blue: "bg-sky-100 text-sky-800 ring-sky-200",
  gray: "bg-slate-100 text-slate-700 ring-slate-200",
  indigo: "bg-indigo-100 text-indigo-800 ring-indigo-200",
  amber: "bg-orange-100 text-orange-800 ring-orange-200",
};

interface BadgeProps {
  tone?: Tone;
  children: ReactNode;
  className?: string;
  dot?: boolean;
}

export function Badge({ tone = "gray", children, className, dot }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset",
        tones[tone],
        className,
      )}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />}
      {children}
    </span>
  );
}

export function statusTone(status: string): Tone {
  const s = status.toLowerCase();
  if (s.includes("dispon")) return "green";
  if (s.includes("reserv")) return "amber";
  if (s.includes("atras")) return "red";
  if (s.includes("devolv")) return "blue";
  if (s.includes("renov")) return "indigo";
  if (s.includes("emprest")) return "yellow";
  if (s.includes("indispon") || s.includes("perd")) return "red";
  return "gray";
}

export function dueTone(daysLeft: number): Tone {
  if (daysLeft < 0) return "red";
  if (daysLeft <= 3) return "yellow";
  return "green";
}