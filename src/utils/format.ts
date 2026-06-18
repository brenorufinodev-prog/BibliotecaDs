import { differenceInCalendarDays, format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

/**
 * Validação de ISBN-10 ou ISBN-13.
 * Aceita strings com ou sem hífens.
 */
export function validateISBN(isbn: string): boolean {
  const cleaned = isbn.replace(/[\s-]/g, "");
  if (!/^\d{10}(\d{3})?$/.test(cleaned)) return false;

  if (cleaned.length === 10) {
    // Verificador ISBN-10: soma ponderada + resto
    let sum = 0;
    for (let i = 0; i < 9; i++) sum += parseInt(cleaned[i], 10) * (10 - i);
    const check = cleaned[9] === "X" ? 10 : parseInt(cleaned[9], 10);
    return (sum + check) % 11 === 0;
  }

  if (cleaned.length === 13) {
    let sum = 0;
    for (let i = 0; i < 13; i++) {
      const d = parseInt(cleaned[i], 10);
      sum += i % 2 === 0 ? d : d * 3;
    }
    return sum % 10 === 0;
  }
  return false;
}

export function formatISBN(isbn: string): string {
  const c = isbn.replace(/[\s-]/g, "");
  if (c.length === 10) return `${c.slice(0, 1)}-${c.slice(1, 5)}-${c.slice(5, 9)}-${c.slice(9)}`;
  if (c.length === 13) return `${c.slice(0, 3)}-${c.slice(3, 4)}-${c.slice(4, 8)}-${c.slice(8, 12)}-${c.slice(12)}`;
  return isbn;
}

export function isbnDigits(isbn: string): string {
  return isbn.replace(/[\s-]/g, "").toUpperCase();
}

export function openLibraryCoverUrl(isbn: string, size: "S" | "M" | "L" = "L"): string {
  return `https://covers.openlibrary.org/b/isbn/${isbnDigits(isbn)}-${size}.jpg`;
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return format(parseISO(iso), "dd/MM/yyyy", { locale: ptBR });
  } catch {
    return iso;
  }
}

/**
 * Retorna dias restantes para devolução (negativo = atrasado).
 */
export function daysUntilDue(dueIso: string): number {
  const due = parseISO(dueIso);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return differenceInCalendarDays(due, today);
}

export function addDaysISO(baseIso: string, days: number): string {
  const d = parseISO(baseIso);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function classNames(...arr: (string | false | null | undefined)[]): string {
  return arr.filter(Boolean).join(" ");
}