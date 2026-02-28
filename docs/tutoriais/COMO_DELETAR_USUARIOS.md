# 🗑️ Como Deletar Usuários

## ❌ Erro Comum

Se você tentar deletar um usuário e receber este erro:

```
Unable to delete row as it is currently referenced by a foreign key constraint
```

Isso significa que o usuário tem vendas registradas no sistema.

## ✅ Solução

### Opção 1: Executar Script SQL (RECOMENDADO)

1. Abra o Supabase: https://supabase.com
2. Vá em **SQL Editor**
3. Abra o arquivo: `docs/sql-scripts/FIX_DELETE_USER_FINAL.sql`
4. Copie todo o conteúdo
5. Cole no SQL Editor
6. Clique em **RUN** (ou pressione F5)
7. Aguarde mensagem de sucesso
8. Volte ao sistema e tente deletar novamente

**O que o script faz:**
- Altera as foreign keys para `ON DELETE SET NULL`
- Quando você deletar um usuário, as vendas dele continuam existindo
- O campo `seller_id` fica NULL (sem vendedor)
- Não há mais erro

### Opção 2: Desativar Usuário (Alternativa)

Se não quiser executar o script, você pode:

1. Ir no Supabase → Table Editor → users
2. Encontrar o usuário
3. Editar o campo `is_online` para `false`
4. Editar o campo `role` para `membro` (rebaixar)
5. O usuário não consegue mais fazer login

## 🔍 Verificar se Funcionou

Após executar o script, execute esta query no SQL Editor:

```sql
SELECT 
    tc.table_name, 
    tc.constraint_name, 
    rc.delete_rule
FROM information_schema.table_constraints tc
JOIN information_schema.referential_constraints rc 
    ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_schema = 'public'
    AND rc.delete_rule = 'SET NULL';
```

Deve mostrar:
- `sales | sales_seller_id_fkey | SET NULL`
- `audit_logs | audit_logs_user_id_fkey | SET NULL`
- `system_settings | system_settings_updated_by_fkey | SET NULL`
- `backups | backups_created_by_fkey | SET NULL`

## ⚠️ Importante

- Execute o script **UMA VEZ APENAS**
- Após executar, você pode deletar usuários normalmente
- As vendas antigas continuam no sistema
- Apenas o nome do vendedor fica como NULL

## 🆘 Ainda com Problemas?

Se ainda houver erro:

1. Verifique se executou o script completo
2. Verifique se há outras tabelas com foreign keys
3. Consulte `docs/tutoriais/DEBUG.md`
4. Veja os logs do console (F12)

---

**Arquivo do Script:** `docs/sql-scripts/FIX_DELETE_USER_FINAL.sql`
