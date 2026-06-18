import { useState } from "react";
import { BookOpen } from "lucide-react";
import type { Book } from "../types";
import { Badge, statusTone } from "./ui/Badge";
import { daysUntilDue, formatDate } from "../utils/format";
import { cn } from "../utils/cn";

interface BookCardProps {
  book: Book;
  onClick?: () => void;
  /** Quando true, mostra indicador de prazo (usado na aba "Meus Empréstimos") */
  showDue?: boolean;
  dueDate?: string;
}

export function BookCard({ book, onClick, showDue, dueDate }: BookCardProps) {
  const [imgError, setImgError] = useState(false);
  const days = dueDate ? daysUntilDue(dueDate) : null;

  return (
    <button
      onClick={onClick}
      className={cn(
        "group text-left bg-white rounded-2xl border border-slate-200 overflow-hidden",
        "transition-all hover:shadow-lg hover:-translate-y-0.5 hover:border-indigo-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
      )}
    >
      <div className="relative aspect-[2/3] bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden">
        {book.capa_url && !imgError ? (
          <img
            src={book.capa_url}
            alt={`Capa de ${book.titulo}`}
            loading="lazy"
            onError={() => setImgError(true)}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-4 text-center">
            <BookOpen className="h-10 w-10 text-slate-400" />
            <p className="text-xs font-medium text-slate-500 line-clamp-3">{book.titulo}</p>
          </div>
        )}
        <div className="absolute top-2 left-2">
          <Badge tone={statusTone(book.status)}>{book.status}</Badge>
        </div>
      </div>
      <div className="p-3.5">
        <h3 className="font-semibold text-slate-900 line-clamp-2 leading-snug text-sm">
          {book.titulo}
        </h3>
        <p className="mt-1 text-xs text-slate-500 line-clamp-1">{book.autor}</p>
        <div className="mt-2.5 flex items-center justify-between gap-2">
          <Badge tone="indigo" className="text-[10px]">{book.categoria}</Badge>
          {showDue && dueDate && days !== null && (
            <span
              className={cn(
                "text-[11px] font-medium",
                days < 0
                  ? "text-rose-600"
                  : days <= 3
                    ? "text-amber-600"
                    : "text-emerald-600",
              )}
            >
              {days < 0 ? `${Math.abs(days)}d em atraso` : `${days}d restantes`}
            </span>
          )}
        </div>
        {showDue && dueDate && (
          <p className="mt-1 text-[10px] text-slate-400">Devolução: {formatDate(dueDate)}</p>
        )}
      </div>
    </button>
  );
}

export function BookCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="aspect-[2/3] bg-slate-200 shimmer" />
      <div className="p-3.5 space-y-2">
        <div className="h-4 w-3/4 rounded bg-slate-200 shimmer" />
        <div className="h-3 w-1/2 rounded bg-slate-200 shimmer" />
        <div className="h-5 w-16 rounded-full bg-slate-200 shimmer mt-2" />
      </div>
    </div>
  );
}