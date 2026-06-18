# ⚙️ Setup: Configurar RLS para Todos os Fluxos

As políticas Row Level Security (RLS) garantem que cada usuário só acesse dados que lhe pertencem.

## ✅ Setup Completo com RLS

### 1️⃣ Abra o Supabase SQL Editor
- Acesse: https://app.supabase.com/project/cqfeldbnqgavbwuantrw/sql/new

### 2️⃣ Cole o SQL abaixo:

```sql
BEGIN;

-- ============================================================
-- RLS para tabela 'users'
-- ============================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users can view their own data"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY IF NOT EXISTS "Users can update their own data"
  ON public.users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ============================================================
-- RLS para tabela 'livros'
-- ============================================================
ALTER TABLE public.livros ENABLE ROW LEVEL SECURITY;

-- Todos podem VER todos os livros
CREATE POLICY IF NOT EXISTS "Anyone can view books"
  ON public.livros FOR SELECT
  USING (true);

-- Apenas admin pode CREATE livros
CREATE POLICY IF NOT EXISTS "Admin can create books"
  ON public.livros FOR INSERT
  WITH CHECK (
    (auth.jwt() ->> 'email')::text = 'brenorufinof16@gmail.com'
  );

-- Apenas admin (proprietário) pode UPDATE livros
CREATE POLICY IF NOT EXISTS "Admin can update books"
  ON public.livros FOR UPDATE
  USING (
    (auth.jwt() ->> 'email')::text = 'brenorufinof16@gmail.com'
  )
  WITH CHECK (
    (auth.jwt() ->> 'email')::text = 'brenorufinof16@gmail.com'
  );

-- Apenas admin pode DELETE livros
CREATE POLICY IF NOT EXISTS "Admin can delete books"
  ON public.livros FOR DELETE
  USING (
    (auth.jwt() ->> 'email')::text = 'brenorufinof16@gmail.com'
  );

-- ============================================================
-- RLS para tabela 'loan_requests'
-- ============================================================
ALTER TABLE public.loan_requests ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver suas próprias solicitações
CREATE POLICY IF NOT EXISTS "Users can view their own requests"
  ON public.loan_requests FOR SELECT
  USING (auth.uid() = user_id);

-- Admin pode ver TODAS as solicitações
CREATE POLICY IF NOT EXISTS "Admin can view all requests"
  ON public.loan_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'bibliotecario'
    )
  );

-- Usuários podem criar solicitações
CREATE POLICY IF NOT EXISTS "Users can create requests"
  ON public.loan_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admin pode atualizar solicitações
CREATE POLICY IF NOT EXISTS "Admin can update requests"
  ON public.loan_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'bibliotecario'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'bibliotecario'
    )
  );

-- ============================================================
-- RLS para tabela 'loans'
-- ============================================================
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver seus próprios empréstimos
CREATE POLICY IF NOT EXISTS "Users can view their own loans"
  ON public.loans FOR SELECT
  USING (auth.uid() = user_id);

-- Admin pode ver TODOS os empréstimos
CREATE POLICY IF NOT EXISTS "Admin can view all loans"
  ON public.loans FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'bibliotecario'
    )
  );

-- Apenas admin pode criar empréstimos
CREATE POLICY IF NOT EXISTS "Admin can create loans"
  ON public.loans FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'bibliotecario'
    )
  );

-- Apenas admin pode atualizar empréstimos
CREATE POLICY IF NOT EXISTS "Admin can update loans"
  ON public.loans FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'bibliotecario'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'bibliotecario'
    )
  );

-- Apenas admin pode deletar empréstimos
CREATE POLICY IF NOT EXISTS "Admin can delete loans"
  ON public.loans FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'bibliotecario'
    )
  );

COMMIT;
```

### 3️⃣ Clique em **"Executar"** (ou `Ctrl+Enter`)

### 4️⃣ Pronto! ✨

Agora:
- ✅ Usuários veem apenas seus dados
- ✅ Todos veem todos os livros (públicos)
- ✅ Admin controla tudo
- ✅ Solicitações e empréstimos protegidos
- ✅ Realtime funciona com segurança

## 🔐 Resumo das Políticas

| Tabela | Operação | Quem Pode |
|--------|----------|----------|
| **livros** | SELECT | Todos |
| **livros** | INSERT | Admin (email específico) |
| **livros** | UPDATE | Admin (email específico) |
| **livros** | DELETE | Admin (email específico) |
| **loan_requests** | SELECT | Usuário (próprias) / Admin (todas) |
| **loan_requests** | INSERT | Usuários |
| **loan_requests** | UPDATE | Admin |
| **loans** | SELECT | Usuário (próprios) / Admin (todos) |
| **loans** | INSERT | Admin |
| **loans** | UPDATE | Admin |
| **loans** | DELETE | Admin |
| **users** | SELECT | Próprio usuário |
| **users** | UPDATE | Próprio usuário |

