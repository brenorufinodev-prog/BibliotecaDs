import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Modal } from "./ui/Modal";
import { Input } from "./ui/Input";
import { Button } from "./ui/Button";
import type { Book } from "../types";
import { addDaysISO, todayISO } from "../utils/format";

const loanSchema = z.object({
  book_id: z.string().min(1, "Selecione um livro"),
  data_emprestimo: z.string().min(1, "Data obrigatória"),
  data_devolucao_prevista: z.string().min(1, "Data obrigatória"),
});

type LoanFormValues = z.infer<typeof loanSchema>;

interface LoanFormModalProps {
  open: boolean;
  preselectedBook?: Book | null;
  availableBooks: Book[];
  onClose: () => void;
  onSubmit: (values: LoanFormValues) => Promise<void>;
  submitting?: boolean;
  errorMessage?: string | null;
}

export function LoanFormModal({
  open,
  preselectedBook,
  availableBooks,
  onClose,
  onSubmit,
  submitting,
  errorMessage,
}: LoanFormModalProps) {
  const { register, handleSubmit, reset, watch } = useForm<LoanFormValues>({
    resolver: zodResolver(loanSchema),
    defaultValues: {
      book_id: preselectedBook?.id ?? "",
      data_emprestimo: todayISO(),
      data_devolucao_prevista: addDaysISO(todayISO(), 14),
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        book_id: preselectedBook?.id ?? "",
        data_emprestimo: todayISO(),
        data_devolucao_prevista: addDaysISO(todayISO(), 14),
      });
    }
  }, [open, preselectedBook, reset]);

  const emprestimoDate = watch("data_emprestimo");

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Registrar empréstimo"
      description="Controle de saída do acervo"
      size="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Livro *</label>
          <select
            {...register("book_id")}
            className="w-full h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
          >
            <option value="">Selecione um livro disponível</option>
            {availableBooks.map((b) => (
              <option key={b.id} value={b.id}>
                {b.titulo} — {b.autor}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Data de empréstimo *"
            type="date"
            {...register("data_emprestimo")}
          />
          <Input
            label="Devolução prevista *"
            type="date"
            {...register("data_devolucao_prevista")}
            hint={
              emprestimoDate
                ? `Padrão: ${addDaysISO(emprestimoDate || todayISO(), 14)}`
                : "Padrão: hoje + 14 dias"
            }
          />
        </div>

        {errorMessage && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700">
            {errorMessage}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Registrando..." : "Registrar empréstimo"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}