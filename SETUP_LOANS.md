# 🚀 Setup: Criar Tabela loans

O fluxo de empréstimos precisa da tabela `loans` no banco de dados para persistir dados em tempo real.

## ✅ Solução Rápida (2 minutos)

### 1️⃣ Abra o Supabase SQL Editor
- Acesse: https://app.supabase.com/project/cqfeldbnqgavbwuantrw/sql/new

### 2️⃣ Copie e cole o SQL abaixo:

```sql
BEGIN;

DO $$ BEGIN
  CREATE TYPE loan_status AS ENUM ('Ativo', 'Renovado', 'Devolvido', 'Atrasado');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.loans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  book_id text NOT NULL,
  data_emprestimo date NOT NULL,
  data_devolucao_prevista date NOT NULL,
  data_devolucao_efetiva date,
  status loan_status NOT NULL DEFAULT 'Ativo',
  renovacoes integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_loans_user_id ON public.loans(user_id);
CREATE INDEX IF NOT EXISTS idx_loans_book_id ON public.loans(book_id);
CREATE INDEX IF NOT EXISTS idx_loans_status ON public.loans(status);

CREATE TRIGGER IF NOT EXISTS trigger_loans_updated_at
  BEFORE UPDATE ON public.loans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- RLS Policies
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver seus próprios empréstimos
CREATE POLICY "Users can view their own loans" 
  ON public.loans FOR SELECT 
  USING (auth.uid() = user_id);

-- Admin (bibliotecario) pode ver todos os empréstimos
CREATE POLICY "Admin can view all loans" 
  ON public.loans FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role = 'bibliotecario'
    )
  );

-- Apenas admin pode criar empréstimos
CREATE POLICY "Admin can create loans" 
  ON public.loans FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role = 'bibliotecario'
    )
  );

-- Apenas admin pode atualizar empréstimos
CREATE POLICY "Admin can update loans" 
  ON public.loans FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role = 'bibliotecario'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role = 'bibliotecario'
    )
  );

-- Apenas admin pode deletar empréstimos
CREATE POLICY "Admin can delete loans" 
  ON public.loans FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role = 'bibliotecario'
    )
  );

COMMIT;
```

### 3️⃣ Clique em **"Executar"** (ou `Ctrl+Enter`)

### 4️⃣ Pronto! ✨
A tabela foi criada com RLS configurada. Agora você pode:
- ✅ Criar empréstimos (apenas admin)
- ✅ Usuários veem seus próprios empréstimos
- ✅ Admin vê todos os empréstimos
- ✅ Realtime funciona automaticamente

## 🐛 Se tiver erro:

**Erro: "Type already exists"?**  
→ Ignora, é normal! O tipo pode já estar criado.

**Erro: "Policy already exists"?**  
→ As políticas já estão configuradas.

**Erro: "Permission denied"?**  
→ Certifique-se que está logado no Supabase com a conta correta

---

## 📊 Estrutura da Tabela

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid | ID único do empréstimo (gerado automaticamente) |
| user_id | uuid | ID do usuário que pegou o livro |
| book_id | text | ID do livro emprestado |
| data_emprestimo | date | Data do empréstimo |
| data_devolucao_prevista | date | Data prevista para devolução |
| data_devolucao_efetiva | date | Data real da devolução (null se não devolvido) |
| status | enum | Status do empréstimo (Ativo, Renovado, Devolvido, Atrasado) |
| renovacoes | integer | Número de renovações feitas |
| created_at | timestamptz | Data/hora de criação |
| updated_at | timestamptz | Data/hora da última atualização |
