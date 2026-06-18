# 🎯 Como Corrigir o Erro 404 - Solicitações de Empréstimo

## 📋 O Problema
Quando um usuário (não admin) tenta registrar uma solicitação de empréstimo, recebe:
```
POST https://cqfeldbnqgavbwuantrw.supabase.co/rest/v1/loan_requests 404 (Not Found)
```

**Causa**: A tabela `loan_requests` não foi criada no banco de dados Supabase.

---

## ✅ Solução em 3 Passos

### Passo 1️⃣: Acesse o Painel SQL do Supabase

**URL**: https://app.supabase.com/project/cqfeldbnqgavbwuantrw/sql/new

Ou pela interface:
1. Acesse https://app.supabase.com/
2. Selecione o projeto `cqfeldbnqgavbwuantrw`
3. Vá para: `SQL Editor` → `New Query`

### Passo 2️⃣: Cole o SQL Completo

Copie e cole TODO este código no editor SQL:

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

### Passo 3️⃣: Execute o SQL

**Opção A** (Recomendado): 
- Clique no botão azul **"Run"** / **"Executar"**

**Opção B**: 
- Pressione `Ctrl + Enter` (ou `Cmd + Enter` no Mac)

### ✨ Pronto!

Você verá uma mensagem de sucesso:
```
Committed 1 transaction
```

---

## 🔧 (Opcional) Criar Conta Admin

Se você é o administrador e quer dar a si mesmo permissões, execute também:

```sql
UPDATE public.users 
SET role = 'bibliotecario' 
WHERE email = 'brenorufinof@gmail.com';
```

---

## ✔️ Confirme que Funciona

1. **Volte para a app**: http://localhost:5174
2. **Faça login** como usuário comum (ex: wlisses@gmail.com)
3. **Vá para "Empréstimos"**
4. **Clique "Novo Empréstimo"** e tente registrar
5. ✅ **Agora funciona!** A solicitação foi salva

---

## ❌ Se der Erro...

| Erro | Solução |
|------|---------|
| `Type already exists` | Normal! Significa que o tipo já está criado. Continue. |
| `Table already exists` | Perfeito! Tabela já está lá. Continue. |
| `Permission denied` | Certifique-se que você está logado com a conta certa no Supabase. |
| Ainda não funciona? | Recarregue o navegador (`Ctrl+F5`) e tente novamente. |

---

## 📱 Fluxo Esperado Após Setup

### Para Usuários Comuns:
1. Login → Acervo → "Novo Empréstimo"
2. Seleciona livro e datas
3. Clica em "Enviar Solicitação"
4. ✅ **Solicitação aparece em "Solicitações"** (para admin)

### Para Admin:
1. Login com conta admin
2. Vai para "Solicitações" no menu
3. Vê solicitações pendentes
4. **Aprova** ✅ ou **Rejeita** ❌
5. Usuário vê empréstimo aprovado em "Empréstimos"

---

**Tudo certo? 🎉 Você está pronto para usar o sistema!**
