// Tipos alinhados ao schema do banco (Supabase-ready)

export const BOOK_CATEGORIES = [
  "Ficção",
  "Não-Ficção",
  "Científico",
  "Técnico",
  "Infantil",
  "Biografia",
  "História",
  "Autoajuda",
  "Outro",
] as const;

export const BOOK_STATUSES = [
  "Disponível",
  "Emprestado",
  "Reservado",
  "Indisponível",
  "Perdido",
] as const;

export const LOAN_STATUSES = [
  "Ativo",
  "Devolvido",
  "Atrasado",
  "Renovado",
] as const;

export type BookCategory = (typeof BOOK_CATEGORIES)[number];
export type BookStatus = (typeof BOOK_STATUSES)[number];
export type LoanStatus = (typeof LOAN_STATUSES)[number];

export interface Book {
  id: string;
  user_id: string;
  titulo: string;
  autor: string;
  isbn: string;
  editora?: string;
  ano_publicacao?: number;
  categoria: BookCategory;
  sinopse?: string;
  numero_paginas?: number;
  status: BookStatus;
  capa_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Loan {
  id: string;
  book_id: string;
  user_id: string;
  data_emprestimo: string; // ISO date
  data_devolucao_prevista: string; // ISO date
  data_devolucao_efetiva?: string | null;
  status: LoanStatus;
  renovacoes: number;
  created_at: string;
  updated_at: string;
}

export type LoanRequestStatus = "Pendente" | "Aprovado" | "Rejeitado";

export interface LoanRequest {
  id: string;
  user_id: string;
  book_id: string;
  data_emprestimo_solicitada: string; // ISO date
  data_devolucao_prevista: string; // ISO date
  status: LoanRequestStatus;
  observacoes?: string;
  created_at: string;
  updated_at: string;
  respondido_em?: string | null;
  respondido_por?: string | null;
}

export interface AppUser {
  id: string;
  email: string;
  role: "bibliotecario" | "usuario";
  password?: string;
  created_at: string;
}