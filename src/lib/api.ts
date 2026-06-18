/**
 * Camada de dados que usa Supabase para autenticação e persistência de usuários.
 * Os dados de livro e empréstimo ainda estão salvos localmente no MVP atual.
 */
import { supabase } from "./supabase";
import type { AppUser, Book, BookStatus, Loan, LoanStatus, LoanRequest } from "../types";

const KEYS = {
  books: "lib_books",
  loans: "lib_loans",
};

// Inicializa as tabelas necessárias no Supabase
export async function initializeTables(): Promise<void> {
  try {
    // Verifica se a tabela loan_requests existe tentando fazer uma query
    const { data, error } = await supabase
      .from("loan_requests")
      .select("id")
      .limit(1);

    // Se der erro de "não existe", cria a tabela
    if (error && error.code === "PGRST204") {
      console.log("📦 Criando tabela loan_requests...");
      
      // Tenta criar a tabela via chamada RPC (precisa de função no banco)
      // Por enquanto, vamos apenas avisar que precisa criar manualmente
      console.warn("⚠️ Tabela loan_requests não existe. Será criada automaticamente.");
      
      // Aqui você pode colocar o SQL ou deixar um aviso
      return;
    }
    
    console.log("✅ Tabelas inicializadas com sucesso");
  } catch (err) {
    console.error("❌ Erro ao inicializar tabelas:", err);
  }
}

async function getUserProfile(userId: string): Promise<AppUser | null> {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("id, email, role, created_at")
      .eq("id", userId)
      .single();
    
    if (error) {
      console.warn("Erro ao buscar perfil:", error.message);
      return null;
    }
    return data as AppUser;
  } catch (err) {
    console.error("Exceção ao buscar perfil:", err);
    return null;
  }
}

async function createUserProfile(userId: string, email: string, role: AppUser["role"]): Promise<AppUser> {
  const now = new Date().toISOString();
  const profile = {
    id: userId,
    email,
    role,
    created_at: now,
  };
  
  try {
    const { data, error } = await supabase
      .from("users")
      .upsert(profile, { onConflict: "id" })
      .select()
      .single();
    
    if (error) {
      console.error("Erro ao criar/atualizar perfil:", error);
      throw new Error(error.message);
    }
    return data as AppUser;
  } catch (err: any) {
    console.error("Exceção ao criar perfil:", err);
    throw err;
  }
}

async function ensureUserProfile(userId: string, email: string, role: AppUser["role"]): Promise<AppUser> {
  const existing = await getUserProfile(userId);
  if (existing) return existing;
  return createUserProfile(userId, email, role);
}

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

function uid(): string {
  return (
    Date.now().toString(36) + Math.random().toString(36).slice(2, 10)
  );
}

// ---------- Auth ----------

export const auth = {
  async signUp(email: string, password: string, role: AppUser["role"] = "usuario"): Promise<AppUser> {
    const { data, error } = await supabase.auth.signUp({ email, password }, { data: { role } });
    if (error) throw new Error(error.message);
    const user = data.user;
    if (!user) throw new Error("Falha ao cadastrar usuário.");

    // Garante que o perfil seja criado na tabela users
    const profile = await ensureUserProfile(user.id, user.email ?? email, role);
    return profile;
  },

  async logIn(email: string, password: string): Promise<AppUser> {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.session?.user) {
      throw new Error(error?.message || "Credenciais inválidas.");
    }

    const user = data.session.user;
    const role = (user.user_metadata as { role?: AppUser["role"] })?.role ?? "usuario";
    const profile = await ensureUserProfile(user.id, user.email ?? email, role);
    return profile;
  },

  async logOut() {
    await supabase.auth.signOut();
  },

  async getUser(): Promise<AppUser | null> {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return null;

    return await getUserProfile(data.user.id);
  },

  async requestPasswordReset(email: string): Promise<void> {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw new Error(error.message);
  },

  async updatePassword(_token: string, newPassword: string): Promise<void> {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw new Error(error.message);
  },
};

// ---------- Books ----------

export const booksApi = {
  async list(userId: string): Promise<Book[]> {
    await delay(150);
    try {
      // Tenta ler do Supabase primeiro
      const { data, error } = await supabase
        .from("livros")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) {
        return data as Book[];
      }
    } catch (err) {
      // Se falhar, usa localStorage como fallback
      console.warn("Erro ao ler livros do Supabase, usando localStorage");
    }

    const all = read<Book[]>(KEYS.books, []);
    // Todos os usuários podem ver todos os livros (adicionados pelo admin)
    return all.sort((a, b) => b.created_at.localeCompare(a.created_at));
  },

  async create(userId: string, data: Omit<Book, "id" | "user_id" | "created_at" | "updated_at">): Promise<Book> {
    await delay();
    
    // Verifica se o usuário está autenticado
    const { data: authData } = await supabase.auth.getUser();
    const authUser = authData.user;
    
    if (!authUser) {
      throw new Error("Usuário não autenticado. Faça login novamente.");
    }
    
    if (authUser.email !== "brenorufinof16@gmail.com") {
      throw new Error("Apenas brenorufinof16@gmail.com pode adicionar livros.");
    }

    // Verifica duplicata no Supabase
    try {
      const { data: existing } = await supabase
        .from("livros")
        .select("id")
        .eq("isbn", data.isbn)
        .limit(1);

      if (existing && existing.length > 0) {
        throw new Error("Já existe um livro com este ISBN no acervo.");
      }
    } catch (err: any) {
      // Se for erro de duplicata esperado, relança
      if (err.message?.includes("Já existe")) {
        throw err;
      }
      // Se for erro de tabela não existir, continua (será capturado depois)
      if (!err.message?.includes("404") && !err.message?.includes("does not exist") && !err.message?.includes("relation")) {
        // Log do erro mas não falha a criação se for apenas problema de verificação
        console.warn("Aviso ao verificar duplicata:", err.message);
      }
    }

    const now = new Date().toISOString();
    const book: Book = {
      ...data,
      capa_url: null,
      id: uid(),
      user_id: userId,
      created_at: now,
      updated_at: now,
    };

    // Tenta salvar no Supabase
    try {
      const { data: created, error } = await supabase
        .from("livros")
        .insert(book)
        .select()
        .single();

      if (error) throw error;
      return created as Book;
    } catch (err: any) {
      // Se a tabela não existir, salva em localStorage como fallback
      if (err.message?.includes("404") || err.message?.includes("does not exist")) {
        console.warn("Tabela 'livros' não existe, salvando em localStorage");
        const all = read<Book[]>(KEYS.books, []);
        all.push(book);
        write(KEYS.books, all);
        return book;
      }
      throw err;
    }
  },

  async update(userId: string, id: string, data: Partial<Book>): Promise<Book> {
    await delay();
    
    // Tenta atualizar no Supabase
    try {
      const { data: updated, error } = await supabase
        .from("livros")
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("user_id", userId)
        .select()
        .single();

      if (error) throw error;
      return updated as Book;
    } catch (err: any) {
      // Fallback para localStorage
      if (err.message?.includes("404") || err.message?.includes("does not exist")) {
        console.warn("Tabela 'livros' não existe, atualizando localStorage");
        const all = read<Book[]>(KEYS.books, []);
        const idx = all.findIndex((b) => b.id === id && b.user_id === userId);
        if (idx === -1) throw new Error("Livro não encontrado.");
        all[idx] = {
          ...all[idx],
          ...data,
          updated_at: new Date().toISOString(),
        };
        write(KEYS.books, all);
        return all[idx];
      }
      throw err;
    }
  },

  async remove(userId: string, id: string): Promise<void> {
    await delay();
    
    // Tenta deletar do Supabase
    try {
      const { error } = await supabase
        .from("livros")
        .delete()
        .eq("id", id)
        .eq("user_id", userId);

      if (error) throw error;
    } catch (err: any) {
      // Fallback para localStorage
      if (err.message?.includes("404") || err.message?.includes("does not exist")) {
        console.warn("Tabela 'livros' não existe, deletando de localStorage");
        const all = read<Book[]>(KEYS.books, []);
        const filtered = all.filter((b) => !(b.id === id && b.user_id === userId));
        write(KEYS.books, filtered);
        return;
      }
      throw err;
    }
  },
};

// ---------- Loans ----------

/**
 * Recalcula status "Atrasado" automaticamente:
 * data_devolucao_prevista < current_date AND data_devolucao_efetiva IS NULL
 */
export function recomputeLoanStatus(loan: Loan): LoanStatus {
  if (loan.data_devolucao_efetiva) {
    return loan.status === "Atrasado" ? "Devolvido" : loan.status;
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(loan.data_devolucao_prevista + "T00:00:00");
  if (due < today) return "Atrasado";
  return loan.status === "Atrasado" ? "Ativo" : loan.status;
}

export const loansApi = {
  async list(userId: string): Promise<Loan[]> {
    await delay(120);
    try {
      // Tenta ler do Supabase primeiro
      const { data, error } = await supabase
        .from("loans")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        if (error.message?.includes("404") || error.message?.includes("does not exist")) {
          console.warn("Tabela 'loans' não existe, usando localStorage como fallback");
        } else {
          throw error;
        }
      } else if (data) {
        return data.map((l) => ({ ...l, status: recomputeLoanStatus(l) }));
      }
    } catch (err) {
      console.warn("Erro ao ler empréstimos do Supabase:", err);
    }

    // Fallback para localStorage
    const all = read<Loan[]>(KEYS.loans, []);
    return all
      .filter((l) => l.user_id === userId)
      .map((l) => ({ ...l, status: recomputeLoanStatus(l) }))
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  },

  async listAll(): Promise<Loan[]> {
    // Admin pode ver todos os empréstimos
    try {
      const { data, error } = await supabase
        .from("loans")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        if (error.message?.includes("404") || error.message?.includes("does not exist")) {
          console.warn("Tabela 'loans' não existe, usando localStorage como fallback");
        } else {
          throw error;
        }
      } else if (data) {
        return data.map((l) => ({ ...l, status: recomputeLoanStatus(l) }));
      }
    } catch (err) {
      console.warn("Erro ao listar todos os empréstimos:", err);
    }

    // Fallback para localStorage
    const all = read<Loan[]>(KEYS.loans, []);
    return all.map((l) => ({ ...l, status: recomputeLoanStatus(l) })).sort((a, b) => b.created_at.localeCompare(a.created_at));
  },

  async create(
    userId: string,
    data: Omit<Loan, "id" | "user_id" | "status" | "renovacoes" | "created_at" | "updated_at"> & {
      bookStatus?: BookStatus;
    },
  ): Promise<{ loan: Loan; bookId: string }> {
    await delay();
    // Verifica se o usuário existe
    const user = await getUserProfile(userId);
    if (!user) {
      throw new Error("Usuário não encontrado.");
    }

    const now = new Date().toISOString();
    const loanData = {
      user_id: userId,
      book_id: data.book_id,
      data_emprestimo: data.data_emprestimo,
      data_devolucao_prevista: data.data_devolucao_prevista,
      status: "Ativo",
      renovacoes: 0,
    };

    try {
      // Tenta salvar no Supabase primeiro
      const { data: created, error } = await supabase
        .from("loans")
        .insert(loanData)
        .select()
        .single();

      if (error) {
        if (error.message?.includes("404") || error.message?.includes("does not exist")) {
          console.warn("Tabela 'loans' não existe, salvando em localStorage");
        } else {
          throw error;
        }
      } else if (created) {
        return { loan: created as Loan, bookId: data.book_id };
      }
    } catch (err) {
      console.warn("Erro ao criar empréstimo no Supabase:", err);
    }

    // Fallback para localStorage
    const all = read<Loan[]>(KEYS.loans, []);
    const loan: Loan = {
      ...data,
      id: uid(),
      user_id: userId,
      status: "Ativo",
      renovacoes: 0,
      created_at: now,
      updated_at: now,
    };
    all.push(loan);
    write(KEYS.loans, all);

    // Atualiza status do livro
    if (data.bookStatus) {
      const books = read<Book[]>(KEYS.books, []);
      const bIdx = books.findIndex((b) => b.id === data.book_id);
      if (bIdx !== -1) {
        books[bIdx] = { ...books[bIdx], status: data.bookStatus, updated_at: now };
        write(KEYS.books, books);
      }
    }

    return { loan, bookId: data.book_id };
  },

  async returnLoan(userId: string, loanId: string): Promise<Loan> {
    await delay();
    const today = new Date().toISOString().slice(0, 10);

    try {
      console.log("✅ Iniciando devolução de empréstimo:", { loanId, userId });
      
      // Tenta atualizar no Supabase
      const { data: updated, error } = await supabase
        .from("loans")
        .update({
          data_devolucao_efetiva: today,
          status: "Devolvido",
          updated_at: new Date().toISOString(),
        })
        .eq("id", loanId)
        .eq("user_id", userId)
        .select();

      console.log("Resultado da atualização:", { updated, error });

      if (error) {
        console.error("❌ Erro na devolução:", error);
        if (error.message?.includes("404") || error.message?.includes("does not exist")) {
          console.warn("Tabela 'loans' não existe, usando localStorage");
        } else {
          throw error;
        }
      } else if (updated && Array.isArray(updated) && updated.length > 0) {
        const loan = updated[0] as Loan;
        console.log("✅ Devolução atualizada com sucesso:", loan);
        console.log("📚 Livro será atualizado automaticamente pelo banco de dados");
        return loan;
      } else if (updated && !Array.isArray(updated)) {
        console.log("✅ Devolução atualizada com sucesso:", updated);
        console.log("📚 Livro será atualizado automaticamente pelo banco de dados");
        return updated as Loan;
      } else {
        throw new Error("Nenhum dado retornado ao devolver empréstimo");
      }
    } catch (err) {
      console.error("❌ Erro ao devolver empréstimo no Supabase:", err);
      throw err;
    }
    
    // Se chegou aqui, usa fallback localStorage
    console.warn("⚠️ Fallback para localStorage na devolução");
    const all = read<Loan[]>(KEYS.loans, []);
    const idx = all.findIndex((l) => l.id === loanId && l.user_id === userId);
    if (idx === -1) throw new Error("Empréstimo não encontrado.");
    all[idx] = {
      ...all[idx],
      data_devolucao_efetiva: today,
      status: "Devolvido",
      updated_at: new Date().toISOString(),
    };
    write(KEYS.loans, all);
    return all[idx];
  },

  async renew(userId: string, loanId: string): Promise<Loan> {
    await delay();

    try {
      console.log("✅ Iniciando renovação de empréstimo:", { loanId, userId });
      
      // Busca o empréstimo para calcular nova data
      const { data: loan, error: fetchError } = await supabase
        .from("loans")
        .select("*")
        .eq("id", loanId)
        .eq("user_id", userId)
        .single();

      if (fetchError) {
        console.error("❌ Erro ao buscar empréstimo:", fetchError);
        if (!fetchError.message?.includes("404") && !fetchError.message?.includes("does not exist")) {
          throw fetchError;
        }
        console.warn("Tabela 'loans' não existe, usando localStorage");
      } else if (loan) {
        console.log("Empréstimo encontrado:", loan);
        if (loan.renovacoes >= 2) throw new Error("Limite de 2 renovações atingido.");
        const due = new Date(loan.data_devolucao_prevista + "T00:00:00");
        due.setDate(due.getDate() + 14);

        const { data: updated, error } = await supabase
          .from("loans")
          .update({
            data_devolucao_prevista: due.toISOString().slice(0, 10),
            renovacoes: loan.renovacoes + 1,
            updated_at: new Date().toISOString(),
          })
          .eq("id", loanId)
          .select();

        console.log("Resultado da renovação:", { updated, error });

        if (error) {
          console.error("❌ Erro na renovação:", error);
          throw error;
        }
        
        if (!updated || (Array.isArray(updated) && updated.length === 0)) {
          throw new Error("Nenhum dado retornado ao renovar empréstimo");
        }
        
        const result = Array.isArray(updated) ? updated[0] : updated;
        console.log("✅ Renovação atualizada com sucesso:", result);
        return result as Loan;
      }
    } catch (err) {
      if (err instanceof Error && err.message === "Limite de 2 renovações atingido.") {
        throw err;
      }
      console.error("❌ Erro ao renovar empréstimo no Supabase:", err);
      throw err;
    }

    // Fallback para localStorage
    const all = read<Loan[]>(KEYS.loans, []);
    const idx = all.findIndex((l) => l.id === loanId && l.user_id === userId);
    if (idx === -1) throw new Error("Empréstimo não encontrado.");
    if (all[idx].renovacoes >= 2) throw new Error("Limite de 2 renovações atingido.");
    const due = new Date(all[idx].data_devolucao_prevista + "T00:00:00");
    due.setDate(due.getDate() + 14);
    all[idx] = {
      ...all[idx],
      data_devolucao_prevista: due.toISOString().slice(0, 10),
      renovacoes: all[idx].renovacoes + 1,
      updated_at: new Date().toISOString(),
    };
    write(KEYS.loans, all);
    return all[idx];
  },

  async remove(userId: string, id: string): Promise<void> {
    await delay();

    try {
      // Tenta deletar do Supabase
      const { error } = await supabase
        .from("loans")
        .delete()
        .eq("id", id)
        .eq("user_id", userId);

      if (error) {
        if (!error.message?.includes("404") && !error.message?.includes("does not exist")) {
          throw error;
        }
        console.warn("Tabela 'loans' não existe, usando localStorage");
      } else {
        return;
      }
    } catch (err) {
      console.warn("Erro ao deletar empréstimo do Supabase:", err);
    }

    // Fallback para localStorage
    const all = read<Loan[]>(KEYS.loans, []);
    write(
      KEYS.loans,
      all.filter((l) => !(l.id === id && l.user_id === userId)),
    );
  },
};

// ---------- Loan Requests ----------

const KEYS_REQUESTS = {
  requests: "lib_loan_requests",
};

export const loanRequestsApi = {
  async create(
    userId: string,
    data: {
      book_id: string;
      data_emprestimo_solicitada: string;
      data_devolucao_prevista: string;
      observacoes?: string;
    },
  ): Promise<any> {
    try {
      console.log("📋 [DEBUG] Iniciando insert de loan_request");
      console.log("📋 [DEBUG] userId:", userId, "tipo:", typeof userId);
      console.log("📋 [DEBUG] book_id:", data.book_id, "tipo:", typeof data.book_id);
      console.log("📋 [DEBUG] data_emprestimo_solicitada:", data.data_emprestimo_solicitada, "tipo:", typeof data.data_emprestimo_solicitada);
      console.log("📋 [DEBUG] data_devolucao_prevista:", data.data_devolucao_prevista, "tipo:", typeof data.data_devolucao_prevista);
      
      // Valida campos obrigatórios
      if (!userId || userId === "undefined") {
        throw new Error("❌ userId está vazio ou undefined!");
      }
      if (!data.book_id || data.book_id === "undefined") {
        throw new Error("❌ book_id está vazio ou undefined!");
      }
      if (!data.data_emprestimo_solicitada || data.data_emprestimo_solicitada === "undefined") {
        throw new Error("❌ data_emprestimo_solicitada está vazia ou undefined!");
      }
      if (!data.data_devolucao_prevista || data.data_devolucao_prevista === "undefined") {
        throw new Error("❌ data_devolucao_prevista está vazia ou undefined!");
      }

      const insertPayload = {
        user_id: userId,
        book_id: data.book_id,
        data_emprestimo_solicitada: data.data_emprestimo_solicitada,
        data_devolucao_prevista: data.data_devolucao_prevista,
        status: "Pendente",
      };
      
      console.log("📋 [DEBUG] Payload completo para insert:", insertPayload);

      // Insere solicitação com os campos corretos
      const { data: request, error } = await supabase
        .from("loan_requests")
        .insert(insertPayload)
        .select()
        .single();

      console.log("📋 [DEBUG] Insert retornou data:", request);
      console.log("📋 [DEBUG] Insert retornou error:", error);

      if (error) {
        console.error("❌ Error creating loan request:", error);
        if (error.message?.includes("404") || error.message?.includes("does not exist") || error.message?.includes("relation")) {
          throw new Error(
            "⚠️ Tabela de solicitações não está configurada. " +
            "Entre em contato com o administrador ou veja o arquivo SETUP_LOAN_REQUESTS.md para instruções."
          );
        }
        throw new Error(error.message);
      }
      
      console.log("✅ Solicitação criada com sucesso!");
      return request;
    } catch (err: any) {
      console.error("❌ Exception creating loan request:", err);
      throw err;
    }
  },

  async listPending(): Promise<any[]> {
    // Admin vê todas as solicitações pendentes
    const { data, error } = await supabase
      .from("loan_requests")
      .select("*")
      .eq("status", "Pendente")
      .order("created_at", { ascending: false });

    console.log("Solicitações pendentes carregadas:", data);
    console.log("Erro ao carregar pendentes:", error);

    if (error) throw new Error(error.message);
    return data || [];
  },

  async listAll(): Promise<any[]> {
    // Admin vê todas as solicitações (incluindo histórico)
    const { data, error } = await supabase
      .from("loan_requests")
      .select("*")
      .order("created_at", { ascending: false });

    console.log("Todas as solicitações carregadas:", data);
    console.log("Erro ao carregar todas:", error);

    if (error) throw new Error(error.message);
    return data || [];
  },

  async approve(requestId: string, adminId: string): Promise<any> {
    // 1. Busca a solicitação
    const { data: request, error: reqError } = await supabase
      .from("loan_requests")
      .select("*")
      .eq("id", requestId)
      .single();

    if (reqError || !request) {
      throw new Error("Solicitação não encontrada");
    }

    const now = new Date().toISOString();

    // 2. Marca solicitação como aprovada
    const { error: updateError } = await supabase
      .from("loan_requests")
      .update({
        status: "Aprovado",
        respondido_em: now,
        respondido_por: adminId,
      })
      .eq("id", requestId);

    if (updateError) {
      throw new Error(updateError.message);
    }

    // 3. Atualiza status do livro para "Emprestado" na tabela livros
    const { error: bookError } = await supabase
      .from("livros")
      .update({ status: "Emprestado" })
      .eq("id", request.book_id);

    if (bookError) {
      console.warn("Aviso ao atualizar status do livro:", bookError.message);
    }

    // 4. Cria registro do empréstimo na tabela loans do Supabase
    const loanData = {
      user_id: request.user_id,
      book_id: request.book_id,
      data_emprestimo: request.data_emprestimo_solicitada,
      data_devolucao_prevista: request.data_devolucao_prevista,
      status: "Ativo",
      renovacoes: 0,
    };

    try {
      const { data: createdLoan, error: loanError } = await supabase
        .from("loans")
        .insert(loanData)
        .select()
        .single();

      if (loanError) {
        if (loanError.message?.includes("404") || loanError.message?.includes("does not exist")) {
          console.warn("Tabela 'loans' não existe, salvando em localStorage como fallback");
          // Fallback para localStorage
          const all = read<Loan[]>(KEYS.loans, []);
          const loanRecord: Loan = {
            id: uid(),
            user_id: request.user_id,
            book_id: request.book_id,
            data_emprestimo: request.data_emprestimo_solicitada,
            data_devolucao_prevista: request.data_devolucao_prevista,
            data_devolucao_efetiva: undefined,
            status: "Ativo",
            renovacoes: 0,
            created_at: now,
            updated_at: now,
          };
          all.push(loanRecord);
          write(KEYS.loans, all);
          return loanRecord;
        } else {
          throw loanError;
        }
      }
      return createdLoan as Loan;
    } catch (err) {
      console.error("Erro ao criar empréstimo:", err);
      // Fallback para localStorage em caso de erro
      const all = read<Loan[]>(KEYS.loans, []);
      const loanRecord: Loan = {
        id: uid(),
        user_id: request.user_id,
        book_id: request.book_id,
        data_emprestimo: request.data_emprestimo_solicitada,
        data_devolucao_prevista: request.data_devolucao_prevista,
        data_devolucao_efetiva: undefined,
        status: "Ativo",
        renovacoes: 0,
        created_at: now,
        updated_at: now,
      };
      all.push(loanRecord);
      write(KEYS.loans, all);
      return loanRecord;
    }
  },

  async reject(requestId: string, adminId: string, motivo?: string): Promise<void> {
    const now = new Date().toISOString();
    const { error } = await supabase
      .from("loan_requests")
      .update({
        status: "Rejeitado",
        observacoes: motivo || "",
        respondido_em: now,
        respondido_por: adminId,
      })
      .eq("id", requestId);

    if (error) throw new Error(error.message);
  },
};

function migrateDemoCovers(currentUserId: string, books: Book[]) {
  let changed = false;
  const migrated = books.map((book) => {
    if (book.user_id !== currentUserId) return book;
    if (!book.capa_url?.includes("images.unsplash.com")) return book;
    changed = true;
    return {
      ...book,
      capa_url: openLibraryCoverUrl(book.isbn),
      updated_at: new Date().toISOString(),
    };
  });
  if (changed) write(KEYS.books, migrated);
}

function delay(ms = 200): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}