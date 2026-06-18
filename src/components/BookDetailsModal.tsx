import { useState } from "react";
import { BookOpen, Calendar, Hash, Library, Pencil, Trash2, User as UserIcon } from "lucide-react";
import type { Book } from "../types";
import { Modal } from "./ui/Modal";
import { Badge, statusTone } from "./ui/Badge";
import { Button } from "./ui/Button";
import { formatISBN, formatDate } from "../utils/format";

interface BookDetailsModalProps {
  book: Book | null;
  onClose: () => void;
  onEdit: (book: Book) => void;
  onDelete: (book: Book) => void;
  onBorrow: (book: Book) => void;
  canBorrow?: boolean;
  canEdit?: boolean;
}

export function BookDetailsModal({ book, onClose, onEdit, onDelete, onBorrow, canBorrow = false, canEdit = false }: BookDetailsModalProps) {
  const [imgError, setImgError] = useState(false);
  if (!book) return null;

  return (
    <Modal open={!!book} onClose={onClose} title={book.titulo} size="lg" description={`por ${book.autor}`}>
      <div className="grid gap-5 sm:grid-cols-[180px_1fr]">
        <div className="aspect-[2/3] rounded-xl overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 relative">
          {book.capa_url && !imgError ? (
            <img
              src={book.capa_url}
              alt={`Capa de ${book.titulo}`}
              onError={() => setImgError(true)}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <BookOpen className="h-12 w-12 text-slate-400" />
            </div>
          )}
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={statusTone(book.status)}>{book.status}</Badge>
            <Badge tone="indigo">{book.categoria}</Badge>
          </div>

          {book.sinopse && (
            <div className="mt-4">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Sinopse</h4>
              <p className="mt-1.5 text-sm text-slate-700 leading-relaxed">{book.sinopse}</p>
            </div>
          )}

          <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
            <Meta icon={<Hash className="h-4 w-4" />} label="ISBN" value={formatISBN(book.isbn)} />
            {book.editora && <Meta icon={<Library className="h-4 w-4" />} label="Editora" value={book.editora} />}
            {book.ano_publicacao && (
              <Meta icon={<Calendar className="h-4 w-4" />} label="Ano" value={String(book.ano_publicacao)} />
            )}
            {book.numero_paginas && (
              <Meta icon={<BookOpen className="h-4 w-4" />} label="Páginas" value={String(book.numero_paginas)} />
            )}
            <Meta icon={<UserIcon className="h-4 w-4" />} label="Adicionado em" value={formatDate(book.created_at)} />
          </dl>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2 justify-end border-t border-slate-100 pt-4">
        {canEdit && (
          <>
            <Button variant="ghost" size="md" onClick={() => onDelete(book)}>
              <Trash2 className="h-4 w-4" /> Excluir
            </Button>
            <Button variant="outline" size="md" onClick={() => onEdit(book)}>
              <Pencil className="h-4 w-4" /> Editar
            </Button>
          </>
        )}
        {canBorrow && book.status === "Disponível" && (
          <Button size="md" onClick={() => onBorrow(book)}>
            <BookOpen className="h-4 w-4" /> Emprestar
          </Button>
        )}
      </div>
    </Modal>
  );
}

function Meta({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <dt className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-slate-500">
        {icon} {label}
      </dt>
      <dd className="mt-0.5 text-sm font-medium text-slate-900 break-words">{value}</dd>
    </div>
  );
}