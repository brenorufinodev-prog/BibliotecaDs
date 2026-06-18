# 🗂️ Como Executar o Setup no Supabase

## ⚠️ IMPORTANTE

O arquivo `setup-complete.sql` agora **commita automaticamente** cada operação. Siga os passos abaixo:

---

## 📋 Passos para Executar

### 1. Abra o Supabase Dashboard
- Vá para https://supabase.com/dashboard
- Escolha seu projeto
- Clique em **SQL Editor** (à esquerda)

### 2. Copie TODO o conteúdo de `setup-complete.sql`
- Abra o arquivo `setup-complete.sql`
- Selecione TUDO (Ctrl+A)
- Copie (Ctrl+C)

### 3. Cole no SQL Editor do Supabase
- Clique em **SQL Editor**
- Clique em **"New Query"**
- Cole o código (Ctrl+V)

### 4. Execute o Script
- Clique no botão **"Run"** (ou Ctrl+Enter)
- **ESPERE** até terminar completamente

### 5. Verifique os Resultados
Ao final, você verá mensagens como:
```
✅ users
✅ livros
✅ loans
✅ loan_requests
✅ RLS habilitado em users
✅ RLS habilitado em livros
✅ RLS habilitado em loans
✅ RLS habilitado em loan_requests
```

Se aparecer `NULL` em algumas linhas, é normal (significa que a table já existe).

---

## ⚡ Troubleshooting

### Erro: "relation does not exist"
- **Causa**: Tabelas já foram criadas
- **Solução**: Não é erro, pode ignorar. Execute novamente para atualizar as policies e triggers

### Erro: "function already exists"
- **Causa**: Funções já foram criadas
- **Solução**: Normal, o script usa `DROP IF EXISTS` para limpar

### Erro: "permission denied"
- **Causa**: Você não tem permissão no projeto Supabase
- **Solução**: Verifique se está logado com a conta certa

---

## ✅ Após a Execução

A aplicação será atualizada automaticamente quando:
1. ✅ Tabelas criadas
2. ✅ RLS policies ativadas
3. ✅ Triggers criadas (para auto-update de status)
4. ✅ Índices criados (para performance)

**A aplicação React não precisa ser reiniciada!** Ela se reconecta automaticamente.

---

## 🔄 Se Precisar Fazer Tudo de Novo

Execute novamente o mesmo script - ele foi feito para ser **idempotente** (seguro executar múltiplas vezes).

