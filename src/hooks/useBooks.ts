import { useCallback, useEffect, useState } from "react";
import type { Book, Loan } from "../types";
import { booksApi, loansApi } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";

export function useBooks() {
  const { user } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const data = await booksApi.list(user.id);
      setBooks(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar livros");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refresh();

    if (!user) return;

    // Subscribe ao Realtime para atualizações de livros
    const channel = supabase
      .channel("livros_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "livros" },
        (payload: any) => {
          if (payload.eventType === "UPDATE") {
            const updated = payload.new as Book;
            setBooks((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
          } else if (payload.eventType === "INSERT") {
            const newBook = payload.new as Book;
            setBooks((prev) => [newBook, ...prev]);
          } else if (payload.eventType === "DELETE") {
            const deleted = payload.old as Book;
            setBooks((prev) => prev.filter((b) => b.id !== deleted.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refresh, user]);

  return { books, loading, error, refresh, setBooks };
}

export function useLoans() {
  const { user } = useAuth();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await loansApi.list(user.id);
      setLoans(data);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refresh();

    if (!user) return;

    // Subscribe ao Realtime para atualizações em tempo real
    const channel = supabase
      .channel(`loans_user_${user.id}`)
      .on(
        "postgres_changes",
        { 
          event: "*", 
          schema: "public", 
          table: "loans", 
          filter: `user_id=eq.${user.id}` 
        },
        (payload: any) => {
          if (payload.eventType === "UPDATE") {
            const updated = payload.new as Loan;
            setLoans((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
          } else if (payload.eventType === "INSERT") {
            const newLoan = payload.new as Loan;
            setLoans((prev) => [newLoan, ...prev]);
          } else if (payload.eventType === "DELETE") {
            const deleted = payload.old as Loan;
            setLoans((prev) => prev.filter((l) => l.id !== deleted.id));
          }
        }
      )
      .subscribe((status, err) => {
        if (status === "SUBSCRIBED") {
          console.log("✅ Realtime para loans ativado");
        }
        if (err) {
          console.warn("⚠️ Erro ao subscribir realtime de loans:", err);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refresh, user]);

  return { loans, loading, refresh, setLoans };
}

export function useBookSearch<T extends { titulo: string; autor: string; isbn: string }>(
  items: T[],
  query: string,
  debounceMs = 300,
) {
  const [debounced, setDebounced] = useState(query);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), debounceMs);
    return () => clearTimeout(t);
  }, [query, debounceMs]);

  if (!debounced.trim()) return items;
  const q = debounced.toLowerCase();
  return items.filter(
    (i) =>
      i.titulo.toLowerCase().includes(q) ||
      i.autor.toLowerCase().includes(q) ||
      i.isbn.toLowerCase().includes(q),
  );
}