import { useEffect, useMemo, useState } from "react";
import { Plus, Search, SlidersHorizontal, Library } from "lucide-react";
import { Layout } from "../components/Layout";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { Tabs } from "../components/ui/Tabs";
import { BookCard, BookCardSkeleton } from "../components/BookCard";
import { BookDetailsModal } from "../components/BookDetailsModal";
import { BookFormModal } from "../components/BookFormModal";
import { ConfirmDialog } from "../components/ui/Modal";
import { useBooks, useBookSearch } from "../hooks/useBooks";
import { booksApi } from "../lib/api";
import { BOOK_CATEGORIES, BOOK_STATUSES, type Book, type BookCategory, type BookStatus } from "../types";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";

type FilterTab = "todos" | "disponiveis" | "emprestados" | "categoria";

export function AcervoPage() {
  const { user } = useAuth();
  const { books, loading, setBooks } = useBooks();
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<FilterTab>("todos");
  const [categoryFilter, setCategoryFilter] = useState<BookCategory | "">("");
  const [statusFilter, setStatusFilter] = useState<BookStatus | "">("");

  const [detailsBook, setDetailsBook] = useState<Book | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<Book | null>(null);

  const searched = useBookSearch(books, query, 300);

  const filtered = useMemo(() => {
    return searched.filter((b) => {
      if (tab === "disponiveis" && b.status !== "Disponível") return false;
      if (tab === "emprestados" && b.status !== "Emprestado" && b.status !== "Reservado") return false;
      if (tab === "categoria" && categoryFilter && b.categoria !== categoryFilter) return false;
      if (statusFilter && b.status !== statusFilter) return false;
      return true;
    });
  }, [searched, tab, categoryFilter, statusFilter]);

  const counts = useMemo(
    () => ({
      todos: books.length,
      disponiveis: books.filter((b) => b.status === "Disponível").length,
      emprestados: books.filter((b) => b.status === "Emprestado" || b.status === "Reservado").length,
      categoria: books.length,
    }),
    [books],
  );

  const openCreate = () => {
    setEditingBook(null);
    setFormError(null);
    setFormOpen(true);
  };
  const openEdit = (b: Book) => {
    setEditingBook(b);
    setFormError(null);
    setFormOpen(true);
  };

  const handleSubmit = async (values: any) => {
    if (!user) return;
    setSubmitting(true);
    setFormError(null);
    try {
      // Remove campos undefined para evitar problemas com Supabase
      const cleanValues = Object.fromEntries(
        Object.entries(values).filter(([_, v]) => v !== undefined && v !== null)
      );

      if (editingBook) {
        const updated = await booksApi.update(user.id, editingBook.id, cleanValues);
        setBooks((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
        toast.success("Livro atualizado com sucesso");
      } else {
        const created = await booksApi.create(user.id, cleanValues);
        setBooks((prev) => [created, ...prev]);
        toast.success("Livro adicionado ao acervo");
      }
      setFormOpen(false);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!user || !deleting) return;
    try {
      await booksApi.remove(user.id, deleting.id);
      setBooks((prev) => prev.filter((b) => b.id !== deleting.id));
      toast.success("Livro excluído");
      setDeleting(null);
      setDetailsBook(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao excluir");
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-indigo-600">Acervo</p>
            <h1 className="mt-1 text-2xl sm:text-3xl font-bold text-slate-900">Sua biblioteca</h1>
            <p className="mt-1 text-sm text-slate-500">
              Gerencie livros, capas, sinopses e status de disponibilidade.
            </p>
          </div>
          {user?.email === "brenorufinof16@gmail.com" && (
            <Button onClick={openCreate} size="lg">
              <Plus className="h-4 w-4" /> Novo livro
            </Button>
          )}
        </header>

        {/* Toolbar */}
        <div className="rounded-2xl border border-slate-200 bg-white p-3 sm:p-4 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por título, autor ou ISBN..."
                aria-label="Buscar livros"
                className="w-full h-11 rounded-xl border border-slate-300 bg-white pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
              />
            </div>
            <div className="flex gap-2">
              <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value as BookCategory | "")}>
                <option value="">Todas categorias</option>
                {BOOK_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </Select>
              <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as BookStatus | "")} className="hidden sm:block">
                <option value="">Todos status</option>
                {BOOK_STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </Select>
            </div>
          </div>

          <Tabs<FilterTab>
            value={tab}
            onChange={setTab}
            options={[
              { value: "todos", label: "Todos", count: counts.todos },
              { value: "disponiveis", label: "Disponíveis", count: counts.disponiveis },
              { value: "emprestados", label: "Emprestados", count: counts.emprestados },
              { value: "categoria", label: "Por categoria", count: counts.categoria },
            ]}
          />
          {tab === "categoria" && (
            <div className="pt-1">
              <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value as BookCategory | "")}>
                <option value="">Selecione uma categoria</option>
                {BOOK_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </Select>
            </div>
          )}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <BookCardSkeleton key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-10 text-center">
            <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <Library className="h-7 w-7" />
            </div>
            <h3 className="mt-4 font-semibold text-slate-900">Nenhum livro encontrado</h3>
            <p className="mt-1 text-sm text-slate-500">
              {query || categoryFilter || statusFilter
                ? "Tente ajustar os filtros ou a busca."
                : user?.email === "brenorufinof16@gmail.com"
                ? "Comece adicionando seu primeiro livro ao acervo."
                : "Aguarde o administrador adicionar livros ao acervo."}
            </p>
            {user?.email === "brenorufinof16@gmail.com" && (
              <Button onClick={openCreate} className="mt-4">
                <Plus className="h-4 w-4" /> Adicionar livro
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
            {filtered.map((b) => (
              <BookCard key={b.id} book={b} onClick={() => setDetailsBook(b)} />
            ))}
          </div>
        )}
      </div>

      <BookDetailsModal
        book={detailsBook}
        canEdit={user?.role === "bibliotecario"}
        canBorrow={user?.role !== "bibliotecario"}
        onClose={() => setDetailsBook(null)}
        onEdit={(b) => {
          setDetailsBook(null);
          openEdit(b);
        }}
        onDelete={(b) => setDeleting(b)}
        onBorrow={(b) => {
          setDetailsBook(null);
          // navega para empréstimos com livro pré-selecionado
          window.location.hash = `#loan=${b.id}`;
          window.location.href = "/emprestimos";
        }}
      />

      <BookFormModal
        open={formOpen}
        initial={editingBook}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
        submitting={submitting}
        errorMessage={formError}
      />

      <ConfirmDialog
        open={!!deleting}
        title="Excluir livro"
        message={`Tem certeza que deseja excluir "${deleting?.titulo}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </Layout>
  );
}

// silence unused import warning
void SlidersHorizontal;
void Input;