# 🚀 Setup: Criar Tabela loan_requests

O erro `404 (Not Found)` ao registrar um empréstimo significa que a tabela `loan_requests` não foi criada no banco de dados.

## ✅ Solução Rápida (2 minutos)

### 1️⃣ Abra o Supabase SQL Editor
- Acesse: https://app.supabase.com/project/cqfeldbnqgavbwuantrw/sql/new

### 2️⃣ Copie e cole o SQL abaixo:

```sql
BEGIN;

DO $$ BEGIN
  CREATE TYPE loan_request_status AS ENUM ('Pendente', 'Aprovado', 'Rejeitado');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.loan_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  book_id uuid NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  data_emprestimo_solicitada date NOT NULL,
  data_devolucao_prevista date NOT NULL,
  status loan_request_status NOT NULL DEFAULT 'Pendente',
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  respondido_em timestamptz,
  respondido_por uuid REFERENCES public.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_loan_requests_user_id ON public.loan_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_loan_requests_book_id ON public.loan_requests(book_id);
CREATE INDEX IF NOT EXISTS idx_loan_requests_status ON public.loan_requests(status);

CREATE TRIGGER IF NOT EXISTS trigger_loan_requests_updated_at
  BEFORE UPDATE ON public.loan_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.loan_requests DISABLE ROW LEVEL SECURITY;

COMMIT;
```

### 3️⃣ Clique em **"Executar"** (ou `Ctrl+Enter`)

### 4️⃣ Pronto! ✨
A tabela foi criada. Agora você pode:
- ✅ Registrar solicitações de empréstimo como usuário comum
- ✅ Admin aprova/rejeita no painel "Solicitações"

## 🐛 Se tiver erro:

**Erro: "Type already exists"?**  
→ Ignora, é normal! A tabela já pode estar criada.

**Erro: "Permission denied"?**  
→ Certifique-se que está logado no Supabase com a conta correta

**Ainda tiver problemas?**  
→ Execute um comando por vez (quebra em blocos)

---

**Precisa também criar conta admin?**  
Execute este SQL também:

```sql
UPDATE public.users 
SET role = 'bibliotecario' 
WHERE email = 'brenorufinof@gmail.com';
```

Feito! 🎉
