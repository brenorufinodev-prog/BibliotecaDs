import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Modal } from "./ui/Modal";
import { Input, Textarea } from "./ui/Input";
import { Select } from "./ui/Select";
import { Button } from "./ui/Button";
import { BOOK_CATEGORIES, BOOK_STATUSES, type Book, type BookCategory, type BookStatus } from "../types";
import { validateISBN } from "../utils/format";

const bookSchema = z.object({
  titulo: z.string().min(2, "Título muito curto").max(200),
  autor: z.string().min(2, "Nome do autor muito curto").max(150),
  isbn: z
    .string()
    .min(10, "ISBN inválido")
    .max(17, "ISBN inválido")
    .refine((v) => validateISBN(v), { message: "ISBN-10 ou ISBN-13 inválido" }),
  editora: z.string().max(120).optional(),
  ano_publicacao: z
    .number({ error: "Ano inválido" })
    .int()
    .min(1400, "Ano muito antigo")
    .max(new Date().getFullYear() + 5),
  categoria: z.enum(BOOK_CATEGORIES),
  sinopse: z.string().max(2000).optional(),
  numero_paginas: z.number({ error: "Páginas inválidas" }).int().positive().max(20000).optional(),
  status: z.enum(BOOK_STATUSES),
});

type BookFormValues = z.infer<typeof bookSchema>;

interface BookFormModalProps {
  open: boolean;
  initial?: Book | null;
  onClose: () => void;
  onSubmit: (values: BookFormValues) => Promise<void>;
  submitting?: boolean;
  errorMessage?: string | null;
}

export function BookFormModal({ open, initial, onClose, onSubmit, submitting, errorMessage }: BookFormModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BookFormValues>({ resolver: zodResolver(bookSchema), mode: "onSubmit" });

  useEffect(() => {
    if (open) {
      if (initial) {
        reset({
          titulo: initial.titulo,
          autor: initial.autor,
          isbn: initial.isbn,
          editora: initial.editora ?? "",
          ano_publicacao: initial.ano_publicacao ?? undefined,
          categoria: initial.categoria,
          sinopse: initial.sinopse ?? "",
          numero_paginas: initial.numero_paginas ?? undefined,
          status: initial.status,
        });
      } else {
        reset({
          titulo: "",
          autor: "",
          isbn: "",
          editora: "",
          ano_publicacao: undefined,
          categoria: "Ficção",
          sinopse: "",
          numero_paginas: undefined,
          status: "Disponível",
        });
      }
    }
  }, [open, initial, reset]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? "Editar livro" : "Adicionar livro"}
      description="Preencha os metadados bibliográficos"
      size="lg"
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4"
        noValidate
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Título *"
            error={!!errors.titulo}
            {...register("titulo")}
            placeholder="Ex.: Dom Casmurro"
          />
          <Input
            label="Autor *"
            error={!!errors.autor}
            {...register("autor")}
            placeholder="Ex.: Machado de Assis"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="ISBN *"
            error={!!errors.isbn}
            {...register("isbn")}
            placeholder="978-85-359-0277-9"
            hint="Aceita ISBN-10 ou ISBN-13"
          />
          <Input
            label="Editora"
            error={!!errors.editora}
            {...register("editora")}
            placeholder="Ex.: Companhia das Letras"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Input
            label="Ano"
            type="number"
            error={!!errors.ano_publicacao}
            {...register("ano_publicacao", { valueAsNumber: true })}
            placeholder="2024"
          />
          <Input
            label="Páginas"
            type="number"
            error={!!errors.numero_paginas}
            {...register("numero_paginas", { valueAsNumber: true })}
            placeholder="320"
          />
          <Select label="Categoria *" {...register("categoria")}>
            {BOOK_CATEGORIES.map((c) => (
              <option key={c} value={c as BookCategory}>
                {c}
              </option>
            ))}
          </Select>
        </div>

        <Select label="Status *" {...register("status")}>
          {BOOK_STATUSES.map((s) => (
            <option key={s} value={s as BookStatus}>
              {s}
            </option>
          ))}
        </Select>

        <Textarea
          label="Sinopse"
          error={!!errors.sinopse}
          {...register("sinopse")}
          placeholder="Resumo da obra..."
        />

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
            {submitting ? "Salvando..." : initial ? "Salvar alterações" : "Adicionar ao acervo"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}