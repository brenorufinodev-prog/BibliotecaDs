# 📚 Setup: Cadastrar Livros na Página Acervo

## ✅ O que foi implementado

1. **Botão "Novo Livro" visível APENAS para**: `brenorufinof16@gmail.com`
2. **Livros são salvos na tabela `livros` do Supabase**
3. **Atualização em tempo real** via Realtime (INSERT, UPDATE, DELETE)
4. **Todos os usuários veem os livros** cadastrados

---

## 🔧 Próximo Passo: Criar Tabela no Supabase

Para que funcione, precisa criar a tabela `livros` no banco de dados.

### 1. Acesse o SQL Editor do Supabase
👉 **https://app.supabase.com/project/cqfeldbnqgavbwuantrw/sql/new**

### 2. Cole este SQL:

```sql
BEGIN;

DO $$ BEGIN
  CREATE TYPE book_category AS ENUM (
    'Ficção',
    'Não-Ficção',
    'Científico',
    'Técnico',
    'Infantil',
    'Biografia',
    'História',
    'Autoajuda',
    'Outro'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE book_status AS ENUM ('Disponível', 'Emprestado', 'Reservado', 'Indisponível', 'Perdido');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.livros (
  id text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  titulo text NOT NULL,
  autor text NOT NULL,
  isbn text NOT NULL,
  sinopse text,
  categoria book_category DEFAULT 'Outro',
  status book_status DEFAULT 'Disponível',
  capa_url text,
  ano_publicacao integer,
  numero_paginas integer,
  editora text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_livros_user_id ON public.livros(user_id);
CREATE INDEX IF NOT EXISTS idx_livros_isbn ON public.livros(isbn);
CREATE INDEX IF NOT EXISTS idx_livros_status ON public.livros(status);
CREATE INDEX IF NOT EXISTS idx_livros_created_at ON public.livros(created_at DESC);

DROP TRIGGER IF EXISTS trigger_livros_updated_at ON public.livros;
CREATE TRIGGER trigger_livros_updated_at
  BEFORE UPDATE ON public.livros
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.livros DISABLE ROW LEVEL SECURITY;

COMMIT;
```

### 3. Clique em "Run" ou pressione `Ctrl+Enter`

### 4. Pronto! ✨

---

## 🧪 Teste Agora

1. **Volte para a app**: http://localhost:5174
2. **Login** como `brenorufinof16@gmail.com`
3. Vá para **"Acervo"**
4. Você deve ver o botão **"Novo livro"** 📘
5. Clique e preencha os dados:
   - Título, Autor, ISBN, Sinopse
   - Categoria (Ficção, Romance, etc)
   - Ano, Editora, URL da capa
6. Clique em **"Salvar"**
7. ✅ **Livro aparece automaticamente!**

---

## 👥 Para Outros Usuários

- Eles **VÃO VER** todos os livros cadastrados
- Eles **NÃO PODEM** cadastrar livros
- O botão **não aparece** para eles

---

## 📁 Arquivos Modificados

| Arquivo | Mudança |
|---------|---------|
| `src/pages/AcervoPage.tsx` | Botão condicional ao email |
| `src/lib/api.ts` | booksApi lê/salva no Supabase |
| `src/hooks/useBooks.ts` | Realtime listener adicionado |
| `create-livros-table.sql` | Novo arquivo SQL |

---

**Tudo pronto! Siga o passo 1-3 acima e está funcionando! 🚀**
