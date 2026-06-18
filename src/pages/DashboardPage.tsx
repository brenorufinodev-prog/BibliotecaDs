import { useMemo } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Library, AlertTriangle, CheckCircle2, Clock, ArrowRight } from "lucide-react";
import { useBooks, useLoans } from "../hooks/useBooks";
import { Layout } from "../components/Layout";
import { Badge, statusTone } from "../components/ui/Badge";
import { daysUntilDue, formatDate } from "../utils/format";
import { cn } from "../utils/cn";

export function DashboardPage() {
  const { books, loading: booksLoading } = useBooks();
  const { loans, loading: loansLoading } = useLoans();

  const stats = useMemo(() => {
    const total = books.length;
    const disponiveis = books.filter((b) => b.status === "Disponível").length;
    const emprestados = books.filter((b) => b.status === "Emprestado").length;
    const atrasados = loans.filter((l) => l.status === "Atrasado").length;
    return { total, disponiveis, emprestados, atrasados };
  }, [books, loans]);

  const recentBooks = books.slice(0, 4);
  const activeLoans = loans.filter((l) => l.status === "Ativo" || l.status === "Atrasado" || l.status === "Renovado").slice(0, 4);

  return (
    <Layout>
      <div className="space-y-8">
        <header>
          <p className="text-sm font-medium text-indigo-600">Dashboard</p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-bold text-slate-900">
            Visão geral da sua biblioteca
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Acompanhe acervo, empréstimos e prazos em tempo real.
          </p>
        </header>

        {/* Stats */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard
            label="Total de livros"
            value={stats.total}
            icon={<Library className="h-5 w-5" />}
            tone="indigo"
            loading={booksLoading}
          />
          <StatCard
            label="Disponíveis"
            value={stats.disponiveis}
            icon={<CheckCircle2 className="h-5 w-5" />}
            tone="emerald"
            loading={booksLoading}
          />
          <StatCard
            label="Emprestados"
            value={stats.emprestados}
            icon={<BookOpen className="h-5 w-5" />}
            tone="amber"
            loading={booksLoading}
          />
          <StatCard
            label="Atrasados"
            value={stats.atrasados}
            icon={<AlertTriangle className="h-5 w-5" />}
            tone="rose"
            loading={loansLoading}
          />
        </section>

        {/* Quick actions */}
        <section className="grid gap-3 sm:grid-cols-2">
          <Link
            to="/acervo"
            className="group rounded-2xl border border-slate-200 bg-white p-5 hover:border-indigo-300 hover:shadow-md transition-all"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold text-slate-900">Gerenciar acervo</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Adicione, edite e organize seus livros com metadados ricos.
                </p>
              </div>
              <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition" />
            </div>
          </Link>
          <Link
            to="/emprestimos"
            className="group rounded-2xl border border-slate-200 bg-white p-5 hover:border-indigo-300 hover:shadow-md transition-all"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold text-slate-900">Controle de empréstimos</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Registre saídas, devoluções e renovações com prazos automáticos.
                </p>
              </div>
              <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition" />
            </div>
          </Link>
        </section>

        {/* Recent activity */}
        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900">Adicionados recentemente</h3>
              <Link to="/acervo" className="text-sm font-medium text-indigo-600 hover:underline">
                Ver todos
              </Link>
            </div>
            {booksLoading ? (
              <p className="text-sm text-slate-400">Carregando...</p>
            ) : recentBooks.length === 0 ? (
              <EmptyState message="Nenhum livro no acervo ainda" cta={{ to: "/acervo", label: "Adicionar primeiro livro" }} />
            ) : (
              <ul className="divide-y divide-slate-100">
                {recentBooks.map((b) => (
                  <li key={b.id} className="py-2.5 flex items-center gap-3">
                    <div className="h-10 w-8 rounded bg-slate-100 overflow-hidden flex-shrink-0">
                      {b.capa_url ? (
                        <img src={b.capa_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">
                          <BookOpen className="h-4 w-4 text-slate-400" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-900 truncate">{b.titulo}</p>
                      <p className="text-xs text-slate-500 truncate">{b.autor}</p>
                    </div>
                    <Badge tone={statusTone(b.status)}>{b.status}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900">Empréstimos ativos</h3>
              <Link to="/emprestimos" className="text-sm font-medium text-indigo-600 hover:underline">
                Ver todos
              </Link>
            </div>
            {loansLoading ? (
              <p className="text-sm text-slate-400">Carregando...</p>
            ) : activeLoans.length === 0 ? (
              <EmptyState message="Nenhum empréstimo ativo" cta={{ to: "/emprestimos", label: "Registrar empréstimo" }} />
            ) : (
              <ul className="divide-y divide-slate-100">
                {activeLoans.map((l) => {
                  const book = books.find((b) => b.id === l.book_id);
                  const days = daysUntilDue(l.data_devolucao_prevista);
                  return (
                    <li key={l.id} className="py-2.5 flex items-center gap-3">
                      <div className="h-10 w-8 rounded bg-slate-100 overflow-hidden flex-shrink-0">
                        {book?.capa_url ? (
                          <img src={book.capa_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            <BookOpen className="h-4 w-4 text-slate-400" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-900 truncate">{book?.titulo ?? "—"}</p>
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Devolução: {formatDate(l.data_devolucao_prevista)}
                        </p>
                      </div>
                      <Badge tone={days < 0 ? "red" : days <= 3 ? "yellow" : "green"}>
                        {days < 0 ? `${Math.abs(days)}d atraso` : `${days}d`}
                      </Badge>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>
      </div>
    </Layout>
  );
}

function StatCard({
  label,
  value,
  icon,
  tone,
  loading,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  tone: "indigo" | "emerald" | "amber" | "rose";
  loading?: boolean;
}) {
  const tones = {
    indigo: "bg-indigo-50 text-indigo-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    rose: "bg-rose-50 text-rose-600",
  };
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
      <div className={cn("inline-flex h-10 w-10 items-center justify-center rounded-xl", tones[tone])}>
        {icon}
      </div>
      <p className="mt-3 text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      {loading ? (
        <div className="mt-1 h-8 w-12 rounded bg-slate-200 shimmer" />
      ) : (
        <p className="mt-1 text-2xl sm:text-3xl font-bold text-slate-900">{value}</p>
      )}
    </div>
  );
}

function EmptyState({ message, cta }: { message: string; cta: { to: string; label: string } }) {
  return (
    <div className="text-center py-6">
      <p className="text-sm text-slate-500">{message}</p>
      <Link to={cta.to} className="mt-3 inline-block text-sm font-medium text-indigo-600 hover:underline">
        {cta.label} →
      </Link>
    </div>
  );
}