import { useEffect, useState, useMemo } from "react";
import { CheckCircle2, XCircle, Clock, AlertCircle } from "lucide-react";
import { Layout } from "../components/Layout";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { Badge } from "../components/ui/Badge";
import { useAuth } from "../context/AuthContext";
import { useBooks } from "../hooks/useBooks";
import { loanRequestsApi } from "../lib/api";
import { supabase } from "../lib/supabase";
import { formatDate } from "../utils/format";
import { toast } from "sonner";

interface Request {
  id: string;
  user_id: string;
  user_email?: string;
  user_name?: string;
  book_id: string;
  book_title?: string;
  data_emprestimo_solicitada: string;
  data_devolucao_prevista: string;
  status: "Pendente" | "Aprovado" | "Rejeitado";
  observacoes?: string;
  created_at: string;
}

export function SolicitacoesPage() {
  const { user } = useAuth();
  const { books } = useBooks();
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Apenas admin pode acessar
  if (user?.role !== "bibliotecario") {
    return (
      <Layout>
        <div className="p-6 text-center">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
          <p className="text-lg font-semibold">Acesso Negado</p>
          <p className="text-sm text-gray-600">Apenas administradores podem acessar esta página.</p>
        </div>
      </Layout>
    );
  }

  // Carrega solicitações do Supabase
  useEffect(() => {
    const loadRequests = async () => {
      try {
        setLoading(true);
        const data = await loanRequestsApi.listAll();
        console.log("Solicitações carregadas:", data);
        
        // Busca informações de usuário e livro
        const enriched = await Promise.all(
          data.map(async (req: any) => {
            // Busca email do usuário
            const { data: userData } = await supabase
              .from("users")
              .select("email")
              .eq("id", req.user_id)
              .single();

            const book = books.find((b) => b.id === req.book_id);

            return {
              ...req,
              user_email: userData?.email || "Usuário desconhecido",
              book_title: book?.titulo || "Livro desconhecido",
            };
          })
        );

        setRequests(enriched);
      } catch (error) {
        console.error("Erro ao carregar solicitações:", error);
        console.log("Erro detalhado:", error);
        toast.error("Erro ao carregar solicitações");
      } finally {
        setLoading(false);
      }
    };

    loadRequests();

    // Realtime subscription para atualizações em tempo real
    const subscription = supabase
      .channel("loan_requests_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "loan_requests" },
        async (payload: any) => {
          console.log("Realtime event:", payload);
          // Recarrega as solicitações quando há mudanças
          loadRequests();
        }
      )
      .subscribe();

    // Cleanup: desinscreve quando o componente é desmontado
    return () => {
      subscription.unsubscribe();
    };
  }, [books]);

  const handleApprove = async (requestId: string) => {
    if (!user) return;
    setActionLoading(true);
    try {
      await loanRequestsApi.approve(requestId, user.id);
      setRequests((prev) =>
        prev.map((r) =>
          r.id === requestId ? { ...r, status: "Aprovado" } : r
        )
      );
      setSelectedRequest(null);
      toast.success("Solicitação aprovada e empréstimo criado!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao aprovar");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (requestId: string, motivo: string) => {
    if (!user) return;
    setActionLoading(true);
    try {
      await loanRequestsApi.reject(requestId, user.id, motivo);
      setRequests((prev) =>
        prev.map((r) =>
          r.id === requestId ? { ...r, status: "Rejeitado" } : r
        )
      );
      setSelectedRequest(null);
      toast.success("Solicitação rejeitada");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao rejeitar");
    } finally {
      setActionLoading(false);
    }
  };

  const pendentes = useMemo(
    () => requests.filter((r) => r.status === "Pendente"),
    [requests]
  );

  const outras = useMemo(
    () => requests.filter((r) => r.status !== "Pendente"),
    [requests]
  );

  const statusColor = (status: string) => {
    if (status === "Pendente") return "yellow";
    if (status === "Aprovado") return "green";
    if (status === "Rejeitado") return "red";
    return "gray";
  };

  const statusIcon = (status: string) => {
    if (status === "Pendente") return <Clock className="h-4 w-4" />;
    if (status === "Aprovado") return <CheckCircle2 className="h-4 w-4" />;
    if (status === "Rejeitado") return <XCircle className="h-4 w-4" />;
  };

  if (loading) {
    return (
      <Layout>
        <div className="p-6 text-center">
          <p>Carregando solicitações...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 p-6">
        <div>
          <h1 className="mb-2 text-3xl font-bold">Solicitações de Empréstimo</h1>
          <p className="text-gray-600">Gerencie as solicitações de empréstimo dos usuários</p>
        </div>

        {/* Solicitações Pendentes */}
        {pendentes.length > 0 && (
          <div>
            <h2 className="mb-4 text-xl font-semibold text-yellow-700">
              Pendentes ({pendentes.length})
            </h2>
            <div className="grid gap-4">
              {pendentes.map((request) => (
                <div
                  key={request.id}
                  onClick={() => setSelectedRequest(request)}
                  className="cursor-pointer rounded-lg border border-yellow-200 bg-yellow-50 p-4 hover:bg-yellow-100 transition"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-semibold">{request.book_title}</p>
                      <p className="text-sm text-gray-600">
                        Usuário: <strong>{request.user_email}</strong>
                      </p>
                      <p className="text-sm text-gray-600">
                        Solicitado: {formatDate(request.created_at)}
                      </p>
                      <p className="text-sm text-gray-600">
                        Devolução prevista: {formatDate(request.data_devolucao_prevista)}
                      </p>
                      {request.observacoes && (
                        <p className="mt-2 text-sm italic text-gray-700">
                          Observação: {request.observacoes}
                        </p>
                      )}
                    </div>
                    <Badge variant={statusColor(request.status)}>
                      {statusIcon(request.status)}
                      {request.status}
                    </Badge>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button
                      size="sm"
                      variant="green"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleApprove(request.id);
                      }}
                      disabled={actionLoading}
                    >
                      <CheckCircle2 className="mr-1 h-4 w-4" />
                      Aprovar
                    </Button>
                    <Button
                      size="sm"
                      variant="red"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedRequest(request);
                      }}
                      disabled={actionLoading}
                    >
                      <XCircle className="mr-1 h-4 w-4" />
                      Rejeitar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Outras Solicitações */}
        {outras.length > 0 && (
          <div>
            <h2 className="mb-4 text-xl font-semibold">Histórico</h2>
            <div className="space-y-2">
              {outras.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between rounded-lg border border-gray-200 p-3 opacity-75"
                >
                  <div className="flex-1">
                    <p className="font-medium">{request.book_title}</p>
                    <p className="text-sm text-gray-500">
                      {request.user_email} — {formatDate(request.created_at)}
                    </p>
                  </div>
                  <Badge variant={statusColor(request.status)}>
                    {statusIcon(request.status)}
                    {request.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {requests.length === 0 && (
          <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center">
            <Clock className="mx-auto mb-3 h-12 w-12 text-gray-400" />
            <p className="text-gray-600">Nenhuma solicitação de empréstimo</p>
          </div>
        )}
      </div>

      {/* Modal de Rejeição */}
      {selectedRequest?.status === "Pendente" && (
        <RejectModal
          request={selectedRequest}
          onReject={handleReject}
          onClose={() => setSelectedRequest(null)}
          loading={actionLoading}
        />
      )}
    </Layout>
  );
}

function RejectModal({
  request,
  onReject,
  onClose,
  loading,
}: {
  request: Request;
  onReject: (id: string, motivo: string) => Promise<void>;
  onClose: () => void;
  loading: boolean;
}) {
  const [motivo, setMotivo] = useState("");

  return (
    <Modal onClose={onClose}>
      <div className="space-y-4">
        <h2 className="text-xl font-bold">Rejeitar Solicitação</h2>
        <p className="text-sm text-gray-600">
          Tem certeza que deseja rejeitar a solicitação de empréstimo do livro{" "}
          <strong>{request.book_title}</strong> solicitado por <strong>{request.user_email}</strong>?
        </p>
        <div>
          <label className="block text-sm font-medium mb-2">Motivo da Rejeição (opcional)</label>
          <textarea
            className="w-full rounded border border-gray-300 p-2 text-sm"
            rows={3}
            placeholder="Explique o motivo..."
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
          />
        </div>
        <div className="flex gap-3">
          <Button variant="gray" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            variant="red"
            onClick={() => onReject(request.id, motivo)}
            disabled={loading}
          >
            {loading ? "Rejeitando..." : "Rejeitar"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
